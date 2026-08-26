"""
NeuroSense AI - Pydantic Schemas for API validation
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


# ── Patient Schemas ──────────────────────────────────────────────────────────

class PatientCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    age: int = Field(..., ge=18, le=120)
    gender: Optional[str] = None
    education_years: Optional[int] = Field(None, ge=0, le=30)
    family_history: bool = False
    medical_history: Optional[str] = None
    lifestyle_notes: Optional[str] = None


class PatientResponse(PatientCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── Screening Schemas ─────────────────────────────────────────────────────────

class ScreenRequest(BaseModel):
    patient_id: Optional[int] = None
    session_id: Optional[int] = None
    # Core ML features
    age: int = Field(..., ge=18, le=120)
    mmse_score: float = Field(..., ge=0, le=30)
    reaction_time_ms: float = Field(..., ge=100, le=5000)
    family_history: int = Field(..., ge=0, le=1)  # 0 or 1
    # Voice biomarkers (optional, from voice test)
    avg_pause_duration: float = Field(default=0.5, ge=0.0, le=10.0)
    vocab_richness: float = Field(default=0.7, ge=0.0, le=1.0)
    # Derived cognitive scores
    memory_score: Optional[float] = Field(default=None, ge=0, le=100)
    attention_score: Optional[float] = Field(default=None, ge=0, le=100)
    language_score: Optional[float] = Field(default=None, ge=0, le=100)


class FeatureContribution(BaseModel):
    feature: str
    value: float
    impact: str  # "positive" or "negative"


class ScreenResponse(BaseModel):
    risk_level: str
    probabilities: Dict[str, float]
    feature_contributions: Dict[str, float]
    explanation: List[str]
    recommendations: List[str]
    confidence: float
    session_id: Optional[int] = None


# ── Voice Schemas ─────────────────────────────────────────────────────────────

class VoiceAnalysisResponse(BaseModel):
    transcript: str
    speech_pauses: int
    average_pause_duration: float
    vocab_richness: float
    wpm: float
    silence_percentage: float
    filler_words: int
    total_words: int
    unique_words: int
    ttr: float
    avg_sentence_length: float
    repeated_words: int
    summary_insight: str
    demo_mode: bool = False


# ── Session Schemas ───────────────────────────────────────────────────────────

class SessionCreate(BaseModel):
    patient_id: int


class SessionResponse(BaseModel):
    id: int
    patient_id: int
    session_date: datetime
    status: str

    class Config:
        from_attributes = True
