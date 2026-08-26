"""
NeuroSense AI - SQLAlchemy ORM Models
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=True)
    education_years = Column(Integer, nullable=True)
    family_history = Column(Boolean, default=False)
    medical_history = Column(Text, nullable=True)
    lifestyle_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sessions = relationship("ScreeningSession", back_populates="patient")


class ScreeningSession(Base):
    __tablename__ = "screening_sessions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    session_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), default="in_progress")  # in_progress, completed
    notes = Column(Text, nullable=True)

    patient = relationship("Patient", back_populates="sessions")
    cognitive_results = relationship("CognitiveResult", back_populates="session")
    voice_results = relationship("VoiceResult", back_populates="session")
    predictions = relationship("Prediction", back_populates="session")


class CognitiveResult(Base):
    __tablename__ = "cognitive_results"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("screening_sessions.id"), nullable=False)
    mmse_score = Column(Float, nullable=True)
    memory_score = Column(Float, nullable=True)
    attention_score = Column(Float, nullable=True)
    language_score = Column(Float, nullable=True)
    orientation_score = Column(Float, nullable=True)
    reaction_time_ms = Column(Float, nullable=True)
    total_cognitive_score = Column(Float, nullable=True)
    raw_answers = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("ScreeningSession", back_populates="cognitive_results")


class VoiceResult(Base):
    __tablename__ = "voice_results"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("screening_sessions.id"), nullable=False)
    transcript = Column(Text, nullable=True)
    wpm = Column(Float, nullable=True)
    speech_pauses = Column(Integer, nullable=True)
    average_pause_duration = Column(Float, nullable=True)
    silence_percentage = Column(Float, nullable=True)
    vocab_richness = Column(Float, nullable=True)
    filler_words = Column(Integer, nullable=True)
    total_words = Column(Integer, nullable=True)
    unique_words = Column(Integer, nullable=True)
    ttr = Column(Float, nullable=True)
    avg_sentence_length = Column(Float, nullable=True)
    repeated_words = Column(Integer, nullable=True)
    summary_insight = Column(Text, nullable=True)
    demo_mode = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("ScreeningSession", back_populates="voice_results")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("screening_sessions.id"), nullable=False)
    risk_level = Column(String(20), nullable=False)  # Low, Moderate, High
    prob_low = Column(Float, nullable=True)
    prob_moderate = Column(Float, nullable=True)
    prob_high = Column(Float, nullable=True)
    feature_contributions = Column(JSON, nullable=True)
    explanation = Column(JSON, nullable=True)
    recommendations = Column(JSON, nullable=True)
    input_features = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("ScreeningSession", back_populates="predictions")
