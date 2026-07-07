from datetime import datetime
import asyncio
import os
import logging
from contextlib import asynccontextmanager
import uuid
import aiohttp
from fastapi.responses import FileResponse
from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from typing import Dict
import json
import redis.asyncio

from lib import GameStateManager
import lib.Tier as Tier

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http_session = aiohttp.ClientSession()
    app.state.redis_listener_task = asyncio.create_task(redis_broadcast_listener())
    try:
        yield
    finally:
        app.state.redis_listener_task.cancel()
        try:
            await app.state.redis_listener_task
        except asyncio.CancelledError:
            pass
        await app.state.http_session.close()
        await redis_client.aclose()

redis_client = redis.asyncio.Redis()
REDIS_WS_CHANNEL = "games:websocket:broadcast"
PROCESS_ID = str(uuid.uuid4())

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CLIENT_ID = os.getenv("VITE_DISCORD_CLIENT_ID")
CLIENT_SECRET = os.getenv("DISCORD_CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")

class TokenRequest(BaseModel):
    code: str = Field(..., min_length=1)

@app.post("/token")
async def exchange_token(request_data: TokenRequest, request: Request):
    session: aiohttp.ClientSession = request.app.state.http_session

    try:
        async with session.post(
            "https://discord.com/api/oauth2/token",
            data={
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "grant_type": "authorization_code",
                "code": request_data.code,
                "redirect_uri": REDIRECT_URI
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=aiohttp.ClientTimeout(total=10)
        ) as response:

            data = await response.json()

            if response.status != 200:
                logging.error(f"Discord API Error: {data}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=data
                )

            return data

    except aiohttp.ClientError as e:
        logging.error(f"Connection Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="External service unavailable"
        )

@app.post("/getargs/{userid}")
async def get_args(userid: str):
    try:
        key = f"games:args:{userid}"

        raw_args = await redis_client.get(key)

        if raw_args is None:
            raise HTTPException(status_code=404, detail="Arguments for this user not found")
        
        await redis_client.delete(key)

        try:
            args_data = json.loads(raw_args)
        except json.JSONDecodeError:
            args_data = raw_args

        return {
            "status": "success",
            "userid": userid,
            "args": args_data
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal Server Error")

async def get_user_info(oauth_token: str, session: aiohttp.ClientSession):
    if oauth_token in Tier.user_cache:
        return Tier.user_cache[oauth_token]

    headers = {"Authorization": f"Bearer {oauth_token}"}
    
    try:
        async with session.get("https://discord.com/api/v10/users/@me", headers=headers) as resp:
            if resp.status != 200:
                return None
            
            data = await resp.json()
            user_id = data["id"]
            avatar = data.get("avatar")
            
            if avatar:
                icon_url = f"https://cdn.discordapp.com/avatars/{user_id}/{avatar}.png?size=64"
            else:
                icon_url = "https://via.placeholder.com/24"

            user_info = {
                "userId": user_id,
                "username": data["username"],
                "iconURL": icon_url
            }

            Tier.user_cache[oauth_token] = user_info
            return user_info

    except Exception as e:
        return None

manager = GameStateManager.GameStateManager()

def normalize_session_data(data):
    default_data = manager.default_session_data()
    if isinstance(data, dict):
        default_data.update(data)

    if not isinstance(default_data.get("tier_entries"), list):
        default_data["tier_entries"] = []

    ox_entries = default_data.get("ox_entries")
    if not isinstance(ox_entries, list) or len(ox_entries) < 2:
        ox_entries = [([None] * 9), False]

    board = ox_entries[0]
    next_turn = ox_entries[1]
    if not isinstance(board, list) or len(board) != 9:
        board = [None] * 9

    default_data["ox_entries"] = [
        [square if square in ("O", "X") else None for square in board],
        bool(next_turn)
    ]
    return default_data

def session_state_key(session_id: str):
    return f"games:session:{session_id}"

async def load_session_data(session_id: str):
    try:
        raw_data = await redis_client.get(session_state_key(session_id))
        if raw_data:
            data = json.loads(raw_data)
            manager.sessions_data[session_id] = normalize_session_data(data)
            return manager.sessions_data[session_id]
    except Exception:
        logging.exception("Failed to load session data from Redis")

    manager.sessions_data[session_id] = normalize_session_data(manager.sessions_data.get(session_id))
    return manager.sessions_data[session_id]

async def save_session_data(session_id: str):
    data = normalize_session_data(manager.sessions_data.get(session_id))
    manager.sessions_data[session_id] = data
    await redis_client.set(session_state_key(session_id), json.dumps(data))

async def publish_ws_message(session_id: str, message: str):
    await redis_client.publish(
        REDIS_WS_CHANNEL,
        json.dumps({
            "origin": PROCESS_ID,
            "session_id": session_id,
            "message": message
        })
    )

async def redis_broadcast_listener():
    pubsub = redis_client.pubsub()
    await pubsub.subscribe(REDIS_WS_CHANNEL)
    try:
        async for event in pubsub.listen():
            if event.get("type") != "message":
                continue

            try:
                data = json.loads(event["data"])
            except (TypeError, json.JSONDecodeError):
                continue

            if data.get("origin") == PROCESS_ID:
                continue

            session_id = data.get("session_id")
            message = data.get("message")
            if isinstance(session_id, str) and isinstance(message, str):
                await manager.broadcast(session_id, message)
    finally:
        await pubsub.unsubscribe(REDIS_WS_CHANNEL)
        await pubsub.close()

@app.websocket("/ws/{session_id}")
async def global_ws_endpoint(ws: WebSocket, session_id: str):
    session_data = await load_session_data(session_id)
    await manager.connect(ws, session_id, session_data)
    http_session = ws.app.state.http_session 
    manager.sessions_data[session_id].setdefault("tier_entries", [])
    manager.sessions_data[session_id].setdefault("ox_entries", [([None] * 9), False])

    try:
        while True:
            raw = await ws.receive_text()
            msg = json.loads(raw)
            
            msg_type = msg.get("type") 
            client_id = msg.get("clientId")
            payload = msg.get("payload", {})

            logging.error(msg)

            if msg_type == "tier_update":
                raw_entries = payload.get("entries", [])
                if not isinstance(raw_entries, list):
                    raw_entries = []
                processed_entries = []

                for entry in raw_entries:
                    if not isinstance(entry, dict):
                        continue

                    if "userId" in entry and "username" in entry:
                        processed_entries.append(entry)
                        continue
                    
                    token = entry.get("token")
                    if token:
                        try:
                            user_info = await get_user_info(token, http_session)
                            entry.update({
                                "userId": user_info["userId"],
                                "username": user_info["username"],
                                "iconURL": user_info["iconURL"]
                            })
                            processed_entries.append(entry)
                        except Exception:
                            continue

                manager.sessions_data[session_id]["tier_entries"] = processed_entries
                await save_session_data(session_id)

                broadcast_message = json.dumps({
                    "type": msg_type,
                    "clientId": client_id,
                    "payload": {
                        "entries": processed_entries
                    }
                })

                await manager.broadcast(
                    session_id, 
                    broadcast_message,
                    exclude_ws=ws 
                )
                await publish_ws_message(session_id, broadcast_message)

            elif msg_type == "tier_sync":
                current_entries = (await load_session_data(session_id))["tier_entries"]

                await ws.send_text(json.dumps({
                    "type": "tier_sync_all",
                    "clientId": client_id,
                    "payload": {
                        "entries": current_entries
                    }
                }))

            elif msg_type == "ox_update":
                raw_entries = payload.get("entries", [([None] * 9), False])
                if not isinstance(raw_entries, list):
                    raw_entries = [([None] * 9), False]
                board = raw_entries[0] if len(raw_entries) > 0 else [None] * 9
                next_turn = raw_entries[1] if len(raw_entries) > 1 else False

                if not isinstance(board, list) or len(board) != 9:
                    board = [None] * 9

                normalized_board = [
                    square if square in ("O", "X") else None
                    for square in board
                ]
                normalized_entries = [normalized_board, bool(next_turn)]

                manager.sessions_data[session_id]["ox_entries"] = normalized_entries
                await save_session_data(session_id)

                broadcast_message = json.dumps({
                    "type": msg_type,
                    "clientId": client_id,
                    "payload": {
                        "entries": normalized_entries
                    }
                })

                await manager.broadcast(
                    session_id, 
                    broadcast_message,
                    exclude_ws=ws 
                )
                await publish_ws_message(session_id, broadcast_message)

            elif msg_type == "ox_sync":
                current_entries = (await load_session_data(session_id))["ox_entries"]

                await ws.send_text(json.dumps({
                    "type": "ox_sync_all",
                    "clientId": client_id,
                    "payload": {
                        "entries": current_entries
                    }
                }))

            elif msg_type == "polling":
                current_data = await load_session_data(session_id)
                
                await ws.send_text(json.dumps({
                    "type": "polling_response",
                    "clientId": "server",
                    "payload": {
                        "status": "active",
                        "serverTime": datetime.now().isoformat(),
                        "dataHash": hash(str(current_data)) 
                    }
                }))

            else:
                broadcast_message = json.dumps({
                    "type": msg_type,
                    "clientId": client_id,
                    "payload": payload
                })

                await manager.broadcast(
                    session_id, 
                    broadcast_message,
                    exclude_ws=ws 
                )
                await publish_ws_message(session_id, broadcast_message)

    except WebSocketDisconnect:
        manager.disconnect(ws, session_id)
    except Exception as e:
        manager.disconnect(ws, session_id)
        print("Error: ", e)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", port=8011, host="0.0.0.0", reload=True)
