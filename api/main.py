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
    yield
    await app.state.http_session.close()

redis_client = redis.asyncio.Redis()

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

@app.websocket("/ws/{session_id}")
async def global_ws_endpoint(ws: WebSocket, session_id: str):
    await manager.connect(ws, session_id)
    http_session = ws.app.state.http_session 

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
                processed_entries = []

                for entry in raw_entries:
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

                await manager.broadcast(
                    session_id, 
                    json.dumps({
                        "type": msg_type,
                        "clientId": client_id,
                        "payload": payload
                    }),
                    exclude_ws=ws 
                )

            elif msg_type == "tier_sync":
                current_entries = manager.sessions_data[session_id]["tier_entries"]

                await manager.broadcast(
                    session_id,
                    json.dumps({
                        "type": "sync_all",
                        "clientId": client_id,
                        "payload": {
                            "entries": current_entries
                        }
                    })
                )
            elif msg_type == "browser_update":
                manager.sessions_data[session_id]["browser_state"] = payload
                
                await manager.broadcast(
                    session_id, 
                    json.dumps({
                        "type": "browser_update",
                        "clientId": client_id,
                        "payload": payload
                    }),
                    exclude_ws=ws 
                )

            elif msg_type == "browser_sync":
                current_browser_state = manager.sessions_data[session_id].get("browser_state")
                
                if current_browser_state:
                    await ws.send_text(json.dumps({
                        "type": "browser_sync_all",
                        "clientId": "server",
                        "payload": current_browser_state
                    }))
            else:
                await manager.broadcast(
                    session_id, 
                    json.dumps({
                        "type": msg_type,
                        "clientId": client_id,
                        "payload": payload
                    }),
                    exclude_ws=ws 
                )

    except WebSocketDisconnect:
        manager.disconnect(ws, session_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", port=8011, host="0.0.0.0", reload=True)