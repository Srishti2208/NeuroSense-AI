"""
NeuroSense AI - FastAPI Application Entry Point
"""
import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from app.database import init_db
from app.api.screen_endpoint import router as screen_router
from app.api.voice_endpoint import router as voice_router

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(levelname)s:  %(name)s - %(message)s")
logger = logging.getLogger(__name__)

# ── FastAPI App ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="NeuroSense AI API",
    description=(
        "AI-assisted cognitive screening API for research and demonstration purposes. "
        "NOT a medical diagnostic tool."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    logger.info("🚀 NeuroSense AI backend starting up...")
    init_db()
    logger.info("✅ NeuroSense AI backend ready")


# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(screen_router, prefix="/api", tags=["Screening"])
app.include_router(voice_router, prefix="/api", tags=["Voice Analysis"])


@app.get("/health")
@app.get("/api/health")
async def health():
    return {"status": "healthy", "service": "NeuroSense AI"}


# ── Frontend Static Files (if built) ──────────────────────────────────────────
DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))

if os.path.exists(DIST_DIR):
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse

    assets_dir = os.path.join(DIST_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/")
    async def serve_index():
        index_file = os.path.join(DIST_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"name": "NeuroSense AI API", "docs": "/docs"}

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith(("api", "docs", "openapi.json", "redoc", "health")):
            return JSONResponse(status_code=404, content={"detail": "Endpoint not found"})
        file_path = os.path.join(DIST_DIR, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(DIST_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return JSONResponse(status_code=404, content={"detail": "File not found"})
else:
    @app.get("/")
    async def root():
        return {
            "name": "NeuroSense AI API",
            "version": "1.0.0",
            "status": "running",
            "disclaimer": (
                "NeuroSense AI is an AI-assisted cognitive screening tool for research/demo purposes "
                "and is NOT a medical diagnosis system."
            ),
            "docs": "/docs",
        }

