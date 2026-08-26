"""
NeuroSense AI - SHAP Explainability Service
Provides feature-level explanations using SHAP TreeExplainer.
"""
import numpy as np
import shap
import logging
from app.services.ml_service import load_model, FEATURE_COLS, CLASS_NAMES

logger = logging.getLogger(__name__)

_explainer = None

FEATURE_DISPLAY_NAMES = {
    "age": "Age",
    "mmse_score": "MMSE Score",
    "avg_pause_duration": "Speech Pause Duration",
    "vocab_richness": "Vocabulary Richness",
    "reaction_time_ms": "Reaction Time",
    "family_history": "Family History",
}


def get_explainer():
    global _explainer
    if _explainer is None:
        model = load_model()
        _explainer = shap.TreeExplainer(model)
        logger.info("✅ SHAP explainer initialized")
    return _explainer


def explain_prediction(features: dict, predicted_class_idx: int) -> dict:
    """
    Generate SHAP feature contributions for a given prediction.

    Returns
    -------
    dict:
        feature_contributions: {feature_name: shap_value}
        top_factors: list of explanation strings
    """
    try:
        explainer = get_explainer()

        x = np.array([[
            features.get("age", 65),
            features.get("mmse_score", 26),
            features.get("avg_pause_duration", 0.5),
            features.get("vocab_richness", 0.7),
            features.get("reaction_time_ms", 450),
            features.get("family_history", 0),
        ]], dtype=np.float32)

        # shap_values shape in modern shap/xgboost: [n_samples, n_features, n_classes] or list
        shap_values = explainer.shap_values(x)

        if isinstance(shap_values, list):
            # Multi-class list format: list of [n_samples, n_features]
            class_shap = shap_values[predicted_class_idx][0]
        elif isinstance(shap_values, np.ndarray):
            if shap_values.ndim == 3:
                # Shape: [n_samples, n_features, n_classes]
                if shap_values.shape[2] == len(CLASS_NAMES):
                    class_shap = shap_values[0, :, predicted_class_idx]
                # Shape: [n_classes, n_samples, n_features]
                elif shap_values.shape[0] == len(CLASS_NAMES):
                    class_shap = shap_values[predicted_class_idx, 0, :]
                else:
                    class_shap = shap_values[0, :, 0]
            elif shap_values.ndim == 2:
                class_shap = shap_values[0]
            else:
                class_shap = shap_values
        else:
            class_shap = [0.0] * len(FEATURE_COLS)

        # Build contribution dict
        contributions = {}
        for i, feat in enumerate(FEATURE_COLS):
            contributions[FEATURE_DISPLAY_NAMES.get(feat, feat)] = round(float(class_shap[i]), 4)

        # Build natural language explanation
        sorted_contribs = sorted(contributions.items(), key=lambda x: abs(x[1]), reverse=True)
        risk_class = CLASS_NAMES[predicted_class_idx]

        explanation_lines = []
        top_three = sorted_contribs[:3]
        top_names = [name for name, _ in top_three]

        explanation_lines.append(
            f"The {risk_class} Risk classification was most influenced by: "
            f"{', '.join(top_names)}."
        )

        for feat_name, val in sorted_contribs:
            direction = "increased" if val > 0 else "decreased"
            strength = "strongly" if abs(val) > 0.3 else ("moderately" if abs(val) > 0.1 else "slightly")
            if abs(val) > 0.05:
                explanation_lines.append(
                    f"• {feat_name} {strength} {direction} the risk estimate (SHAP: {val:+.3f})."
                )

        return {
            "feature_contributions": contributions,
            "explanation": explanation_lines,
            "top_factors": top_names,
        }

    except Exception as e:
        logger.error(f"SHAP explanation failed: {e}")
        # Fallback: uniform contributions
        fallback_contribs = {
            FEATURE_DISPLAY_NAMES.get(f, f): 0.0 for f in FEATURE_COLS
        }
        return {
            "feature_contributions": fallback_contribs,
            "explanation": ["Feature explanation unavailable for this prediction."],
            "top_factors": [],
        }
