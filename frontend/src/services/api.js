/**
 * NeuroSense AI - API Service Layer
 * Handles all communication with the FastAPI backend.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function handleResponse(res) {
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body.detail || JSON.stringify(body);
    } catch {}
    throw new ApiError(detail, res.status);
  }
  return res.json();
}

// ── Patient & Session ───────────────────────────────────────────────────────

export async function createPatient(patientData) {
  const payload = {
    name: patientData.name,
    age: parseInt(patientData.age, 10),
    gender: patientData.gender || '',
    education_years: parseInt(patientData.educationYears || patientData.education_years || 12, 10),
    family_history: Boolean(patientData.familyHistory ?? patientData.family_history),
    medical_history: patientData.medicalHistory || patientData.medical_history || '',
    lifestyle_notes: patientData.lifestyleNotes || patientData.lifestyle_notes || '',
  };

  const res = await fetch(`${API_BASE}/patients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function listPatients() {
  const res = await fetch(`${API_BASE}/patients`);
  return handleResponse(res);
}

export async function getPatient(patientId) {
  const res = await fetch(`${API_BASE}/patients/${patientId}`);
  return handleResponse(res);
}

export async function getPatientHistory(patientId) {
  const res = await fetch(`${API_BASE}/patients/${patientId}/history`);
  return handleResponse(res);
}

export async function deletePatient(patientId) {
  const res = await fetch(`${API_BASE}/patients/${patientId}`, { method: 'DELETE' });
  return handleResponse(res);
}

export async function createSession(patientId) {
  const res = await fetch(`${API_BASE}/sessions?patient_id=${patientId}`, { method: 'POST' });
  return handleResponse(res);
}

export async function getSession(sessionId) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`);
  return handleResponse(res);
}

// ── Cognitive Screening ─────────────────────────────────────────────────────

export async function runScreening(screenData) {
  const res = await fetch(`${API_BASE}/screen`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(screenData),
  });
  return handleResponse(res);
}

// ── Voice Analysis ──────────────────────────────────────────────────────────

export async function analyzeVoice(audioBlob, durationSeconds = 0, demoMode = false, sessionId = null) {
  const formData = new FormData();
  if (audioBlob) {
    formData.append('audio', audioBlob, 'recording.webm');
  }
  formData.append('duration', String(durationSeconds));
  formData.append('demo_mode', String(demoMode));
  if (sessionId) {
    formData.append('session_id', String(sessionId));
  }

  const res = await fetch(`${API_BASE}/analyze-voice`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(res);
}

export async function getVoiceStatus() {
  const res = await fetch(`${API_BASE}/voice-status`);
  return handleResponse(res);
}

// ── Model Info ──────────────────────────────────────────────────────────────

export async function getModelInfo() {
  const res = await fetch(`${API_BASE}/model-info`);
  return handleResponse(res);
}

// ── Health Check ────────────────────────────────────────────────────────────

export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (res.ok) return true;
    const fallback = await fetch('/health');
    return fallback.ok;
  } catch {
    return false;
  }
}

