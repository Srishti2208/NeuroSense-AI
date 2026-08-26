"""
NeuroSense AI - ML Service
Loads trained XGBoost model and makes risk predictions.
"""
import os
import json
import numpy as np
import joblib
import logging

logger = logging.getLogger(__name__)

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "models")
MODEL_PATH = os.path.join(MODEL_DIR, "risk_model.joblib")
META_PATH = os.path.join(MODEL_DIR, "model_metadata.json")

FEATURE_COLS = [
    "age", "mmse_score", "avg_pause_duration",
    "vocab_richness", "reaction_time_ms", "family_history"
]

CLASS_NAMES = ["Low", "Moderate", "High"]

_model = None
_metadata = None


def load_model():
    global _model, _metadata
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"Model not found at {MODEL_PATH}. "
                "Please run: python train_model.py"
            )
        _model = joblib.load(MODEL_PATH)
        logger.info("✅ ML model loaded successfully")

        if os.path.exists(META_PATH):
            with open(META_PATH) as f:
                _metadata = json.load(f)

    return _model


def predict_risk(features: dict) -> dict:
    """
    Run risk prediction given a dict of feature values.

    Parameters
    ----------
    features : dict with keys matching FEATURE_COLS

    Returns
    -------
    dict with risk_level, probabilities, raw_scores
    """
    model = load_model()

    # Build feature vector in correct order
    x = np.array([[
        features.get("age", 65),
        features.get("mmse_score", 26),
        features.get("avg_pause_duration", 0.5),
        features.get("vocab_richness", 0.7),
        features.get("reaction_time_ms", 450),
        features.get("family_history", 0),
    ]], dtype=np.float32)

    proba = model.predict_proba(x)[0]
    predicted_class = int(np.argmax(proba))
    risk_level = CLASS_NAMES[predicted_class]
    confidence = float(proba[predicted_class])

    return {
        "risk_level": risk_level,
        "probabilities": {
            "low": round(float(proba[0]), 4),
            "moderate": round(float(proba[1]), 4),
            "high": round(float(proba[2]), 4),
        },
        "confidence": round(confidence, 4),
        "feature_vector": x[0].tolist(),
    }


def get_model_metadata() -> dict:
    global _metadata
    if _metadata is None and os.path.exists(META_PATH):
        with open(META_PATH) as f:
            _metadata = json.load(f)
    return _metadata or {}
