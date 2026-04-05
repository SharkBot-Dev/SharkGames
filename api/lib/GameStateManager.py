from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect, status
from typing import Dict, List
import json

class GameStateManager:
    def __init__(self):
        # { session_id: [WebSocket, ...] }
        self.clients: Dict[str, List[WebSocket]] = {}
        # { session_id: { "tier": [...], "quake": {...}, "metadata": {} } }
        self.sessions_data: Dict[str, Dict] = {}

    async def connect(self, ws: WebSocket, session_id: str):
        await ws.accept()
        self.clients.setdefault(session_id, []).append(ws)
        # セッションの初期データ構造を作成
        if session_id not in self.sessions_data:
            self.sessions_data[session_id] = {
                "tier_entries": [],
                "quake_state": {},
                "last_update_by": None
            }
        
        # 接続時に現在の全データを送信
        await ws.send_text(json.dumps({
            "type": "sync_all",
            "payload": self.sessions_data[session_id]
        }))

    def disconnect(self, ws: WebSocket, session_id: str):
        if session_id in self.clients:
            if ws in self.clients[session_id]:
                self.clients[session_id].remove(ws)

    async def broadcast(self, session_id: str, message: str, exclude_ws: WebSocket = None):
        if session_id not in self.clients:
            return
        
        # 送信中にリストが変更されないようコピーを使用
        for client in self.clients[session_id][:]:
            if client == exclude_ws:
                continue
            try:
                await client.send_text(message)
            except Exception:
                self.clients[session_id].remove(client)