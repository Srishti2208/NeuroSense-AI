"""
NeuroSense AI - Model Training Script
=======================================
Generates a clearly-labeled SYNTHETIC DEMO dataset and trains
an XGBoost classifier for cognitive risk stratification.

IMPORTANT: This model is trained on synthetic data for demonstration
purposes ONLY. It does NOT constitute a medical diagnostic tool.
"""

import os
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
import json
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, confusion_matrix, classification_report
)
from sklearn.preprocessing import LabelEncoder
import xgboost as xgb

# ── Configuration ─────────────────────────────────────────────────────────────
RANDOM_SEED = 42
N_SAMPLES = 2000
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODEL_DIR, exist_ok=True)

np.random.seed(RANDOM_SEED)

print("=" * 60)
print("  NeuroSense AI — Synthetic Model Training")
print("  NOTE: Training on SYNTHETIC demo data only")
print("=" * 60)


# ── 1. Generate Synthetic Dataset ─────────────────────────────────────────────

def generate_synthetic_data(n_samples: int) -> pd.DataFrame:
    """
    Generate a clearly labeled synthetic dataset simulating cognitive
    biomarker distributions across three risk classes.

    Features:
      - age: years (50–95)
      - mmse_score: Mini-Mental State Examination (0–30)
      - avg_pause_duration: speech pause duration in seconds
      - vocab_richness: Type-Token Ratio proxy (0–1)
      - reaction_time_ms: simple reaction time in ms
      - family_history: binary (0/1)

    Classes:
      - 0: Low Risk
      - 1: Moderate Risk
      - 2: High Risk
    """
    records = []

    # Low Risk (~50% of population in demo)
    n_low = int(n_samples * 0.5)
    records_low = {
        "age": np.random.normal(62, 8, n_low).clip(50, 80).astype(int),
        "mmse_score": np.random.normal(27.5, 1.5, n_low).clip(24, 30),
        "avg_pause_duration": np.random.normal(0.35, 0.1, n_low).clip(0.1, 0.8),
        "vocab_richness": np.random.normal(0.78, 0.08, n_low).clip(0.5, 1.0),
        "reaction_time_ms": np.random.normal(380, 50, n_low).clip(200, 600),
        "family_history": np.random.binomial(1, 0.15, n_low),
        "label": np.zeros(n_low, dtype=int),
    }

    # Moderate Risk (~30%)
    n_mod = int(n_samples * 0.30)
    records_mod = {
        "age": np.random.normal(72, 7, n_mod).clip(55, 90).astype(int),
        "mmse_score": np.random.normal(23.0, 2.5, n_mod).clip(18, 27),
        "avg_pause_duration": np.random.normal(0.75, 0.2, n_mod).clip(0.3, 1.5),
        "vocab_richness": np.random.normal(0.60, 0.10, n_mod).clip(0.35, 0.80),
        "reaction_time_ms": np.random.normal(550, 80, n_mod).clip(350, 900),
        "family_history": np.random.binomial(1, 0.35, n_mod),
        "label": np.ones(n_mod, dtype=int),
    }

    # High Risk (~20%)
    n_high = n_samples - n_low - n_mod
    records_high = {
        "age": np.random.normal(80, 7, n_high).clip(60, 95).astype(int),
        "mmse_score": np.random.normal(16.0, 4.0, n_high).clip(0, 22),
        "avg_pause_duration": np.random.normal(1.4, 0.4, n_high).clip(0.8, 3.5),
        "vocab_richness": np.random.normal(0.38, 0.10, n_high).clip(0.1, 0.60),
        "reaction_time_ms": np.random.normal(750, 120, n_high).clip(500, 1500),
        "family_history": np.random.binomial(1, 0.55, n_high),
        "label": np.full(n_high, 2, dtype=int),
    }

    df = pd.concat([
        pd.DataFrame(records_low),
        pd.DataFrame(records_mod),
        pd.DataFrame(records_high),
    ], ignore_index=True)

    # Shuffle
    df = df.sample(frac=1, random_state=RANDOM_SEED).reset_index(drop=True)
    return df


# ── 2. Train & Evaluate ───────────────────────────────────────────────────────

df = generate_synthetic_data(N_SAMPLES)

FEATURE_COLS = [
    "age", "mmse_score", "avg_pause_duration",
    "vocab_richness", "reaction_time_ms", "family_history"
]
LABEL_MAP = {0: "Low", 1: "Moderate", 2: "High"}
LABEL_NAMES = ["Low", "Moderate", "High"]

X = df[FEATURE_COLS].values
y = df["label"].values

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=RANDOM_SEED, stratify=y
)

print(f"\n📊 Dataset: {N_SAMPLES} synthetic samples")
print(f"   Train: {len(X_train)} | Test: {len(X_test)}")
print(f"   Class distribution: Low={sum(y==0)}, Moderate={sum(y==1)}, High={sum(y==2)}")

# XGBoost model
model = xgb.XGBClassifier(
    n_estimators=200,
    max_depth=5,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    use_label_encoder=False,
    eval_metric="mlogloss",
    random_state=RANDOM_SEED,
    n_jobs=-1,
)

model.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    verbose=False,
)

y_pred = model.predict(X_test)

# Metrics
acc = accuracy_score(y_test, y_pred)
prec = precision_score(y_test, y_pred, average="weighted")
rec = recall_score(y_test, y_pred, average="weighted")
f1 = f1_score(y_test, y_pred, average="weighted")
cm = confusion_matrix(y_test, y_pred).tolist()

print(f"\n✅ Model Evaluation (on held-out synthetic test set):")
print(f"   Accuracy : {acc:.4f}")
print(f"   Precision: {prec:.4f}")
print(f"   Recall   : {rec:.4f}")
print(f"   F1 Score : {f1:.4f}")
print(f"\n   Classification Report:")
print(classification_report(y_test, y_pred, target_names=LABEL_NAMES))

# ── 3. Save Artifacts ─────────────────────────────────────────────────────────

model_path = os.path.join(MODEL_DIR, "risk_model.joblib")
joblib.dump(model, model_path)
print(f"\n💾 Model saved → {model_path}")

# Save metadata
metadata = {
    "model_type": "XGBoostClassifier",
    "dataset": "SYNTHETIC_DEMO_ONLY",
    "n_samples": N_SAMPLES,
    "random_seed": RANDOM_SEED,
    "features": FEATURE_COLS,
    "classes": LABEL_NAMES,
    "metrics": {
        "accuracy": round(acc, 4),
        "precision_weighted": round(prec, 4),
        "recall_weighted": round(rec, 4),
        "f1_weighted": round(f1, 4),
        "confusion_matrix": cm,
    },
    "disclaimer": (
        "This model was trained on SYNTHETIC data for research/demo purposes only. "
        "It is NOT a validated clinical tool and must NOT be used for medical diagnosis."
    ),
}

meta_path = os.path.join(MODEL_DIR, "model_metadata.json")
with open(meta_path, "w") as f:
    json.dump(metadata, f, indent=2)
print(f"📄 Metadata saved → {meta_path}")

print("\n🎉 Training complete!")
print("   Run backend with: uvicorn app.main:app --reload")
