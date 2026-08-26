# 🧠 NeuroSense AI

**AI-Assisted Cognitive Screening & Monitoring Platform**

> ⚠️ **IMPORTANT DISCLAIMER:** NeuroSense AI is an AI-assisted cognitive screening tool for **research and demonstration purposes only**. It is **NOT a medical diagnosis system** and must not replace professional clinical evaluation.

---

## 📋 Overview

NeuroSense AI combines cognitive assessments, real-time speech biomarker extraction, XGBoost machine learning, SHAP explainability, and longitudinal tracking into a single hackathon-ready web application.

### Core Features

| Feature | Description |
|---|---|
| 🧠 Cognitive Assessment | Memory recall, attention sequences, language naming, orientation tasks |
| 🎙️ Voice Biomarkers | Acoustic (pauses, silence) + linguistic (TTR, WPM, filler words) from real audio |
| 🤖 ML Risk Prediction | XGBoost classifier → Low / Moderate / High risk |
| 🔍 Explainable AI | SHAP TreeExplainer feature attributions + plain-language explanation |
| 📈 Dashboard | 6-month cognitive trajectory, domain trends, radar profile |
| 👥 Caregiver Portal | Patient status, reminders, assessment history |
| 📄 Downloadable Report | HTML report with all biomarkers, SHAP values, and recommendations |

---

## 🗂️ Architecture

```
NeuroSense-AI/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application + CORS + startup
│   │   ├── database.py          # SQLAlchemy engine + session
│   │   ├── models.py            # ORM models (patients, sessions, predictions...)
│   │   ├── schemas.py           # Pydantic request/response schemas
│   │   ├── api/
│   │   │   ├── screen_endpoint.py   # POST /api/screen
│   │   │   └── voice_endpoint.py    # POST /api/analyze-voice
│   │   └── services/
│   │       ├── ml_service.py        # XGBoost model loader + predictor
│   │       ├── speech_service.py    # Whisper transcription + demo fallback
│   │       ├── audio_features.py    # Librosa acoustic feature extraction
│   │       └── explainability.py    # SHAP TreeExplainer service
│   ├── train_model.py           # Synthetic dataset + XGBoost training
│   ├── requirements.txt
│   ├── models/                  # Saved model artifacts (after training)
│   └── uploads/                 # Temporary audio uploads
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── PatientProfile.jsx
│   │   │   ├── CognitiveScreening.jsx
│   │   │   ├── ResultsPage.jsx
│   │   │   ├── CognitiveDashboard.jsx
│   │   │   └── CaregiverPortal.jsx
│   │   ├── components/
│   │   │   └── VoiceTest.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css            # Global dark healthcare theme
│   ├── index.html
│   ├── package.json
│   └── vite.config.js           # Vite + Tailwind v4 + API proxy
│
├── .env.example
└── README.md
```

---

## 🚀 Quick Start (Windows — VS Code Terminal)

### 1. Create Python Virtual Environment

```powershell
cd C:\Users\Admin\OneDrive\Desktop\AI_Dementia\backend
python -m venv venv
.\venv\Scripts\activate
```

### 2. Install Backend Dependencies

```powershell
pip install -r requirements.txt
```

> **Note on Whisper:** If `openai-whisper` fails to install (requires ffmpeg), the app automatically falls back to **Demo Mode** — realistic mock biomarkers are generated so the full demo pipeline still works.

### 3. Train the ML Model

```powershell
# From backend/ directory with venv activated
python train_model.py
```

This generates:
- `models/risk_model.joblib` — trained XGBoost classifier
- `models/model_metadata.json` — evaluation metrics

### 4. Start the FastAPI Backend

```powershell
# From backend/ directory with venv activated
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs available at: http://localhost:8000/docs

### 5. Start the React Frontend

```powershell
# In a new terminal
cd C:\Users\Admin\OneDrive\Desktop\AI_Dementia\frontend
npm install
npm run dev
```

### 6. Access the Application

Open: **http://localhost:5173**

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | API info + disclaimer |
| GET | `/health` | Health check |
| POST | `/api/screen` | Run ML risk prediction with SHAP |
| POST | `/api/analyze-voice` | Upload audio → extract biomarkers |
| GET | `/api/voice-status` | Check Whisper availability |
| POST | `/api/patients` | Create patient record |
| POST | `/api/sessions` | Create screening session |

Full interactive docs: http://localhost:8000/docs

---

## 🎯 Demo Workflow

1. **Landing Page** → Click "Start Screening"
2. **Patient Profile** → Enter name, age, medical history
3. **Voice Test** → Click mic, speak for 30–60s, get biomarkers auto-extracted
4. **Cognitive Screening** → Complete memory/attention/language/orientation tasks
   - Click **"Auto-fill Screening Form with Voice Biomarkers"** to transfer speech data
5. **Click "Run AI Screening"** → XGBoost predicts risk level
6. **Results Page** → See risk badge, probability doughnut, SHAP bar chart
7. **Dashboard** → 6-month cognitive trajectory + domain trends
8. **Caregiver Portal** → Patient summary + reminders
9. **Download Report** → HTML report with all data

---

## 🤖 ML Model Details

- **Algorithm:** XGBoost (multi-class classification)
- **Dataset:** 2,000 synthetic samples (CLEARLY LABELED — NOT real patient data)
- **Features:** Age, MMSE score, Speech pause duration, Vocabulary richness (TTR), Reaction time, Family history
- **Classes:** Low Risk / Moderate Risk / High Risk
- **Explainability:** SHAP TreeExplainer
- **Evaluation:** Accuracy, Precision, Recall, F1, Confusion Matrix (all on synthetic test set)

---

## 🎤 Speech Analysis Pipeline

```
Audio Upload (.webm/.wav)
    → Librosa (acoustic: pause detection, silence %)
    → Whisper (transcription) [or Demo Mode]
    → NLP (TTR, WPM, filler words, sentence length)
    → Structured biomarker JSON
```

**Whisper Fallback:** If Whisper is unavailable, realistic demo biomarkers are generated with labeled transcript so the full pipeline still demonstrates correctly.

---

## 🛡️ Limitations & Disclaimers

- **Synthetic Training Data:** The ML model is trained on programmatically generated synthetic data. It has NO clinical validity.
- **Not a Medical Device:** This application is for research/hackathon demonstration only.
- **Demo Mode:** Speech analysis may run in demo mode without real Whisper transcription.
- **No PHI Storage:** No real patient data should be entered. All data is local.
- **Accuracy Claims:** No clinical accuracy is claimed or implied.

---

## 🔧 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS v4, Chart.js, Lucide React |
| Backend | Python 3.11+, FastAPI, Uvicorn, SQLAlchemy |
| Database | SQLite (zero-config) |
| ML | XGBoost, Scikit-learn, SHAP, Joblib, Pandas, NumPy |
| Speech | OpenAI Whisper / faster-whisper, Librosa, SciPy, NLTK |

---

*Built for hackathon demonstration. Not for clinical use.*
