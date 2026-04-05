import os
import logging
from contextlib import asynccontextmanager
import aiohttp
from fastapi.responses import FileResponse
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(BASE_DIR, "..", "dist")

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http_session = aiohttp.ClientSession()
    yield
    await app.state.http_session.close()

app = FastAPI(lifespan=lifespan)

app.mount(
    "/assets",
    StaticFiles(directory=os.path.join(DIST_DIR, "assets")),
    name="assets"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return FileResponse(os.path.join(DIST_DIR, "index.html"))

@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404)

    file_path = os.path.join(DIST_DIR, full_path)

    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)

    return FileResponse(os.path.join(DIST_DIR, "index.html"))