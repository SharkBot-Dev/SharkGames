from fastapi import WebSocket


sessions: dict[str, list[dict]] = {}
clients: dict[str, list[WebSocket]] = {}
user_cache: dict[str, dict] = {}