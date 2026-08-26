"""
NeuroSense AI - /api/screen endpoint
Runs ML risk prediction + SHAP explanation.
"""
import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import ScreenRequest, ScreenResponse
from app.services.ml_service import predict_risk, CLASS_NAMES
from app.services.explainability import explain_prediction
from app import models

logger = logging.getLogger(__name__)
router = APIRouter()

RECOMMENDATIONS = {
    "Low": [
        "Continue regular cognitive health monitoring.",
        "Maintain an active lifestyle with physical exercise and social engagement.",
        "Consider repeating this screening in 12 months or if symptoms change.",
        "A balanced diet and quality sleep support brain health.",
        "No immediate clinical concern based on current screening — continue healthy habits.",
    ],
    "Moderate": [
        "Discuss these screening results with an appropriate healthcare professional.",
        "Consider scheduling a comprehensive neuropsychological evaluation.",
        "Document any noticed changes in memory, language, or daily functioning.",
        "Explore cognitive stimulation activities such as puzzles, reading, and learning.",
        "Repeat this screening in 3–6 months to monitor any changes.",
        "Engage family members or caregivers to help track daily cognitive patterns.",
    ],
    "High": [
        "Prompt professional clinical evaluation is recommended.",
        "Please consult a neurologist, geriatrician, or memory specialist.",
        "A comprehensive clinical cognitive assessment (e.g., neuropsychological testing, imaging) is advisable.",
        "Engage a caregiver or family member for ongoing monitoring and support.",
        "Bring these results to your physician along with any observed changes in daily functioning.",
        "Repeat this screening after professional evaluation for longitudinal tracking.",
    ],
}


@router.post("/screen", response_model=ScreenResponse)
async def screen_patient(payload: ScreenRequest, db: Session = Depends(get_db)):
    """
    Run cognitive risk screening.

    Accepts patient biomarkers (age, MMSE, speech features, etc.)
    Returns risk level, probabilities, SHAP explanation, and recommendations.

    DISCLAIMER: This is a RESEARCH/DEMO tool. Not for medical diagnosis.
    """
    try:
        features = {
            "age": payload.age,
            "mmse_score": payload.mmse_score,
            "avg_pause_duration": payload.avg_pause_duration,
            "vocab_richness": payload.vocab_richness,
            "reaction_time_ms": payload.reaction_time_ms,
            "family_history": payload.family_history,
        }

        # ML prediction
        prediction = predict_risk(features)
        risk_level = prediction["risk_level"]
        class_idx = CLASS_NAMES.index(risk_level)

        # SHAP explanation
        explanation_data = explain_prediction(features, class_idx)

        # Build response
        recs = RECOMMENDATIONS.get(risk_level, [])

        # Save to DB if session_id provided
        if payload.session_id and db:
            try:
                db_pred = models.Prediction(
                    session_id=payload.session_id,
                    risk_level=risk_level,
                    prob_low=prediction["probabilities"]["low"],
                    prob_moderate=prediction["probabilities"]["moderate"],
                    prob_high=prediction["probabilities"]["high"],
                    feature_contributions=explanation_data["feature_contributions"],
                    explanation=explanation_data["explanation"],
                    recommendations=recs,
                    input_features=features,
                )
                db.add(db_pred)

                # Save cognitive scores breakdown
                db_cog = models.CognitiveResult(
                    session_id=payload.session_id,
                    mmse_score=payload.mmse_score,
                    memory_score=payload.memory_score,
                    attention_score=payload.attention_score,
                    language_score=payload.language_score,
                    reaction_time_ms=payload.reaction_time_ms,
                    total_cognitive_score=round((
                        (payload.memory_score or 70) +
                        (payload.attention_score or 70) +
                        (payload.language_score or 70)
                    ) / 3, 1) if payload.memory_score is not None else None,
                )
                db.add(db_cog)

                # Mark session as completed
                sess = db.query(models.ScreeningSession).filter(
                    models.ScreeningSession.id == payload.session_id
                ).first()
                if sess:
                    sess.status = "completed"

                db.commit()
                db.refresh(db_pred)
            except Exception as db_err:
                logger.warning(f"DB save failed (non-critical): {db_err}")

        return ScreenResponse(
            risk_level=risk_level,
            probabilities=prediction["probabilities"],
            feature_contributions=explanation_data["feature_contributions"],
            explanation=explanation_data["explanation"],
            recommendations=recs,
            confidence=prediction["confidence"],
            session_id=payload.session_id,
        )

    except FileNotFoundError as e:
        raise HTTPException(
            status_code=503,
            detail=f"ML model not loaded: {str(e)}. Please run train_model.py first."
        )
    except Exception as e:
        logger.exception("Screening endpoint error")
        raise HTTPException(status_code=500, detail=f"Screening failed: {str(e)}")


@router.post("/patients", response_model=dict)
async def create_patient(
    payload: Optional[dict] = None,
    name: Optional[str] = None,
    age: Optional[int] = None,
    gender: Optional[str] = "",
    education_years: Optional[int] = 12,
    family_history: Optional[bool] = False,
    medical_history: Optional[str] = "",
    lifestyle_notes: Optional[str] = "",
    db: Session = Depends(get_db)
):
    """Create a patient record (supports JSON body or query parameters)."""
    try:
        # Extract from JSON body if present, else use query params
        p_name = (payload.get("name") if payload else None) or name
        p_age = (payload.get("age") if payload else None) or age
        p_gender = (payload.get("gender") if payload else None) or gender or ""
        p_edu = (payload.get("education_years") if payload else None)
        if p_edu is None and payload and "educationYears" in payload:
            p_edu = payload.get("educationYears")
        if p_edu is None:
            p_edu = education_years or 12

        p_fam = (payload.get("family_history") if payload else None)
        if p_fam is None and payload and "familyHistory" in payload:
            p_fam = payload.get("familyHistory")
        if p_fam is None:
            p_fam = family_history or False

        p_med = (payload.get("medical_history") if payload else None)
        if p_med is None and payload and "medicalHistory" in payload:
            p_med = payload.get("medicalHistory")
        if p_med is None:
            p_med = medical_history or ""

        p_life = (payload.get("lifestyle_notes") if payload else None)
        if p_life is None and payload and "lifestyleNotes" in payload:
            p_life = payload.get("lifestyleNotes")
        if p_life is None:
            p_life = lifestyle_notes or ""

        if not p_name or not p_age:
            raise HTTPException(status_code=400, detail="Name and age are required.")

        patient = models.Patient(
            name=str(p_name).strip(),
            age=int(p_age),
            gender=str(p_gender),
            education_years=int(p_edu),
            family_history=bool(p_fam),
            medical_history=str(p_med),
            lifestyle_notes=str(p_life),
        )
        db.add(patient)
        db.commit()
        db.refresh(patient)
        return {"id": patient.id, "name": patient.name, "age": patient.age, "message": "Patient created successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error creating patient")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/patients", response_model=list)
async def list_patients(db: Session = Depends(get_db)):
    """List all registered patients."""
    try:
        patients = db.query(models.Patient).order_by(models.Patient.created_at.desc()).all()
        return [
            {
                "id": p.id,
                "name": p.name,
                "age": p.age,
                "gender": p.gender,
                "education_years": p.education_years,
                "family_history": p.family_history,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "session_count": len(p.sessions),
            }
            for p in patients
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/patients/{patient_id}")
async def get_patient(patient_id: int, db: Session = Depends(get_db)):
    """Get patient profile by ID."""
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {
        "id": patient.id,
        "name": patient.name,
        "age": patient.age,
        "gender": patient.gender,
        "education_years": patient.education_years,
        "family_history": patient.family_history,
        "medical_history": patient.medical_history,
        "lifestyle_notes": patient.lifestyle_notes,
        "created_at": patient.created_at.isoformat() if patient.created_at else None,
    }


@router.get("/patients/{patient_id}/history")
async def get_patient_history(patient_id: int, db: Session = Depends(get_db)):
    """Retrieve full screening and assessment history for longitudinal tracking."""
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    sessions = db.query(models.ScreeningSession).filter(
        models.ScreeningSession.patient_id == patient_id
    ).order_by(models.ScreeningSession.session_date.asc()).all()

    history = []
    for s in sessions:
        pred = db.query(models.Prediction).filter(models.Prediction.session_id == s.id).first()
        cog = db.query(models.CognitiveResult).filter(models.CognitiveResult.session_id == s.id).first()
        voice = db.query(models.VoiceResult).filter(models.VoiceResult.session_id == s.id).first()

        history.append({
            "session_id": s.id,
            "date": s.session_date.strftime("%b %Y") if s.session_date else "Recent",
            "iso_date": s.session_date.isoformat() if s.session_date else "",
            "status": s.status,
            "risk": pred.risk_level if pred else "Unassessed",
            "probabilities": {
                "low": pred.prob_low if pred else 0,
                "moderate": pred.prob_moderate if pred else 0,
                "high": pred.prob_high if pred else 0,
            } if pred else None,
            "feature_contributions": pred.feature_contributions if pred else {},
            "explanation": pred.explanation if pred else [],
            "recommendations": pred.recommendations if pred else [],
            "cognitive": {
                "mmse": cog.mmse_score if cog else 26,
                "memory": cog.memory_score if cog else 70,
                "attention": cog.attention_score if cog else 70,
                "language": cog.language_score if cog else 70,
                "total": cog.total_cognitive_score if cog else 70,
            } if cog else None,
            "voice": {
                "wpm": voice.wpm if voice else 120,
                "speech_pauses": voice.speech_pauses if voice else 4,
                "average_pause_duration": voice.average_pause_duration if voice else 0.5,
                "vocab_richness": voice.vocab_richness if voice else 0.7,
                "silence_percentage": voice.silence_percentage if voice else 20,
            } if voice else None,
        })

    return {
        "patient": {
            "id": patient.id,
            "name": patient.name,
            "age": patient.age,
            "gender": patient.gender,
            "education_years": patient.education_years,
            "family_history": patient.family_history,
            "medical_history": patient.medical_history,
            "lifestyle_notes": patient.lifestyle_notes,
        },
        "history": history,
    }


@router.delete("/patients/{patient_id}")
async def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    """Delete a patient record and associated sessions."""
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    db.delete(patient)
    db.commit()
    return {"message": f"Patient {patient_id} deleted successfully"}


@router.post("/sessions", response_model=dict)
async def create_session(patient_id: int, db: Session = Depends(get_db)):
    """Create a screening session for a patient."""
    try:
        session = models.ScreeningSession(patient_id=patient_id)
        db.add(session)
        db.commit()
        db.refresh(session)
        return {"id": session.id, "patient_id": patient_id, "status": "in_progress"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions/{session_id}")
async def get_session(session_id: int, db: Session = Depends(get_db)):
    """Get details for a single screening session."""
    session = db.query(models.ScreeningSession).filter(models.ScreeningSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    pred = db.query(models.Prediction).filter(models.Prediction.session_id == session_id).first()
    cog = db.query(models.CognitiveResult).filter(models.CognitiveResult.session_id == session_id).first()
    voice = db.query(models.VoiceResult).filter(models.VoiceResult.session_id == session_id).first()

    return {
        "id": session.id,
        "patient_id": session.patient_id,
        "status": session.status,
        "date": session.session_date.isoformat() if session.session_date else None,
        "prediction": {
            "risk_level": pred.risk_level,
            "probabilities": {"low": pred.prob_low, "moderate": pred.prob_moderate, "high": pred.prob_high},
            "recommendations": pred.recommendations,
        } if pred else None,
        "cognitive": {
            "mmse_score": cog.mmse_score,
            "memory_score": cog.memory_score,
            "attention_score": cog.attention_score,
            "language_score": cog.language_score,
        } if cog else None,
        "voice": {
            "wpm": voice.wpm,
            "pauses": voice.speech_pauses,
            "vocab_richness": voice.vocab_richness,
        } if voice else None,
    }


@router.get("/model-info")
async def get_model_info():
    """Return trained AI model metadata and performance metrics."""
    from app.services.ml_service import get_model_metadata
    meta = get_model_metadata()
    return {
        "status": "ready" if meta else "unloaded",
        "metadata": meta,
    }
