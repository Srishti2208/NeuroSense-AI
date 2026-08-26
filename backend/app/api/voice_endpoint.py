"""
NeuroSense AI - /api/analyze-voice endpoint
Accepts audio upload, runs speech analysis, returns biomarkers.
"""
import os
import uuid
import logging
import tempfile
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app import models
from app.schemas import VoiceAnalysisResponse
from app.services.speech_service import analyze_speech, generate_demo_analysis, WHISPER_AVAILABLE

logger = logging.getLogger(__name__)
router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".wav", ".webm", ".mp3", ".ogg", ".m4a", ".mp4"}
MAX_FILE_SIZE_MB = 50


def _save_voice_to_db(db: Session, session_id: Optional[int], result: dict):
    if not session_id or not db:
        return
    try:
        voice_rec = models.VoiceResult(
            session_id=session_id,
            transcript=result.get("transcript"),
            wpm=result.get("wpm"),
            speech_pauses=result.get("speech_pauses"),
            average_pause_duration=result.get("average_pause_duration"),
            silence_percentage=result.get("silence_percentage"),
            vocab_richness=result.get("vocab_richness"),
            filler_words=result.get("filler_words"),
            total_words=result.get("total_words"),
            unique_words=result.get("unique_words"),
            ttr=result.get("ttr"),
            avg_sentence_length=result.get("avg_sentence_length"),
            repeated_words=result.get("repeated_words"),
            summary_insight=result.get("summary_insight"),
            demo_mode=result.get("demo_mode", False),
        )
        db.add(voice_rec)
        db.commit()
    except Exception as e:
        logger.warning(f"Voice result DB save failed (non-critical): {e}")


@router.post("/analyze-voice", response_model=VoiceAnalysisResponse)
async def analyze_voice(
    audio: UploadFile = File(...),
    duration: float = Form(default=0.0),
    demo_mode: bool = Form(default=False),
    session_id: Optional[int] = Form(default=None),
    db: Session = Depends(get_db),
):
    """
    Analyze uploaded audio for speech biomarkers.

    - Transcribes audio with Whisper (if available) or uses demo mode
    - Extracts acoustic + linguistic biomarkers
    - Returns structured biomarker JSON

    DISCLAIMER: Speech biomarkers are indicators for research screening only.
    """
    # Check file extension
    filename = audio.filename or "audio.webm"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        ext = ".webm"  # default for browser recordings

    # Read file content
    content = await audio.read()

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty audio file received.")

    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"Audio file too large ({size_mb:.1f} MB). Maximum {MAX_FILE_SIZE_MB} MB."
        )

    # Force demo mode if whisper unavailable or explicitly requested
    if demo_mode or not WHISPER_AVAILABLE:
        logger.info("Using demo mode for speech analysis")
        result = generate_demo_analysis(duration_s=max(duration, 30.0))
        _save_voice_to_db(db, session_id, result)
        return VoiceAnalysisResponse(**result)

    # Save to temp file
    file_id = uuid.uuid4().hex
    audio_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")

    try:
        with open(audio_path, "wb") as f:
            f.write(content)

        logger.info(f"Processing audio: {audio_path} ({size_mb:.2f} MB)")
        result = analyze_speech(audio_path, duration_s=duration)
        _save_voice_to_db(db, session_id, result)
        return VoiceAnalysisResponse(**result)

    except Exception as e:
        logger.exception("Voice analysis failed")
        # Fallback to demo mode rather than crashing
        logger.warning("Falling back to demo mode due to analysis error")
        result = generate_demo_analysis(duration_s=max(duration, 30.0))
        result["summary_insight"] = f"[DEMO FALLBACK] {result['summary_insight']}"
        _save_voice_to_db(db, session_id, result)
        return VoiceAnalysisResponse(**result)

    finally:
        # Clean up uploaded file
        if os.path.exists(audio_path):
            try:
                os.remove(audio_path)
            except Exception:
                pass


@router.get("/voice-status")
async def voice_status():
    """Check speech analysis capability."""
    return {
        "whisper_available": WHISPER_AVAILABLE,
        "mode": "full" if WHISPER_AVAILABLE else "demo",
        "message": (
            "Full speech analysis with Whisper transcription enabled."
            if WHISPER_AVAILABLE
            else "Demo mode: realistic mock biomarkers will be generated. Install openai-whisper for real transcription."
        )
    }
