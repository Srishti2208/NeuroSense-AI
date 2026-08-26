import { useState, useCallback } from 'react';
import './index.css';
import LandingPage from './pages/LandingPage';
import PatientProfile from './pages/PatientProfile';
import CognitiveScreening from './pages/CognitiveScreening';
import VoiceTest from './components/VoiceTest';
import ResultsPage from './pages/ResultsPage';
import CognitiveDashboard from './pages/CognitiveDashboard';
import CaregiverPortal from './pages/CaregiverPortal';

// ── Navigation steps ───────────────────────────────────────────────────────
const STEPS = [
  'landing',
  'profile',
  'voice',
  'screening',
  'results',
  'dashboard',
  'caregiver',
];

const STEP_LABELS = {
  landing: 'Home',
  profile: 'Profile',
  voice: 'Voice Test',
  screening: 'Screening',
  results: 'Results',
  dashboard: 'Dashboard',
  caregiver: 'Caregiver',
};

export default function App() {
  const [currentStep, setCurrentStep] = useState('landing');

  // Shared state across steps
  const [patient, setPatient] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [voiceResults, setVoiceResults] = useState(null);
  const [screeningResults, setScreeningResults] = useState(null);
  const [cognitiveScores, setCognitiveScores] = useState(null);

  const navigate = useCallback((step) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Header nav — visible from step 2 onwards
  const showNav = currentStep !== 'landing';
  const stepIndex = STEPS.indexOf(currentStep);

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      {/* ── Global Disclaimer Banner ────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(6,182,212,0.1), rgba(20,184,166,0.1))',
        borderBottom: '1px solid rgba(6,182,212,0.2)',
        padding: '6px 16px',
        textAlign: 'center',
        fontSize: '11px',
        color: '#94a3b8',
        letterSpacing: '0.02em',
      }}>
        ⚕️ NeuroSense AI is an AI-assisted cognitive screening tool for <strong>research/demo purposes</strong> and is <strong>NOT a medical diagnosis system</strong>.
      </div>

      {/* ── Navigation Header ───────────────────────────────────────────── */}
      {showNav && (
        <header style={{
          background: 'rgba(15,23,42,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(51,65,85,0.6)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          {/* Logo */}
          <button
            onClick={() => navigate('landing')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <div style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, #06b6d4, #14b8a6)',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px',
            }}>🧠</div>
            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#f1f5f9' }}>
              Neuro<span style={{ color: '#06b6d4' }}>Sense</span> AI
            </span>
          </button>

          {/* Step indicators */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {STEPS.filter(s => s !== 'landing').map((step, i) => {
              const idx = STEPS.indexOf(step);
              const isActive = step === currentStep;
              const isDone = stepIndex > idx;
              return (
                <button
                  key={step}
                  onClick={() => navigate(step)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '20px',
                    border: '1px solid',
                    borderColor: isActive ? '#06b6d4' : isDone ? 'rgba(6,182,212,0.3)' : 'rgba(51,65,85,0.5)',
                    background: isActive ? 'rgba(6,182,212,0.15)' : isDone ? 'rgba(6,182,212,0.05)' : 'transparent',
                    color: isActive ? '#06b6d4' : isDone ? '#22d3ee' : '#64748b',
                    fontSize: '12px',
                    fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {isDone ? '✓ ' : ''}{STEP_LABELS[step]}
                </button>
              );
            })}
          </div>

          {/* Patient badge */}
          {patient && (
            <div style={{
              background: 'rgba(30,41,59,0.8)',
              border: '1px solid rgba(51,65,85,0.6)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '12px',
              color: '#94a3b8',
            }}>
              👤 <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{patient.name}</span>
              {' '}· Age {patient.age}
            </div>
          )}
        </header>
      )}

      {/* ── Page Content ────────────────────────────────────────────────── */}
      <main>
        {currentStep === 'landing' && (
          <LandingPage onStart={() => navigate('profile')} onDashboard={() => navigate('dashboard')} />
        )}
        {currentStep === 'profile' && (
          <PatientProfile
            onComplete={(p, sid) => { setPatient(p); setSessionId(sid); navigate('voice'); }}
            onBack={() => navigate('landing')}
          />
        )}
        {currentStep === 'voice' && (
          <VoiceTest
            sessionId={sessionId}
            onComplete={(results) => { setVoiceResults(results); navigate('screening'); }}
            onSkip={() => navigate('screening')}
            onBack={() => navigate('profile')}
          />
        )}
        {currentStep === 'screening' && (
          <CognitiveScreening
            patient={patient}
            sessionId={sessionId}
            voiceResults={voiceResults}
            onComplete={(results, scores) => {
              setScreeningResults(results);
              setCognitiveScores(scores);
              navigate('results');
            }}
            onBack={() => navigate('voice')}
          />
        )}
        {currentStep === 'results' && (
          <ResultsPage
            results={screeningResults}
            cognitiveScores={cognitiveScores}
            patient={patient}
            voiceResults={voiceResults}
            onDashboard={() => navigate('dashboard')}
            onRestart={() => navigate('profile')}
          />
        )}
        {currentStep === 'dashboard' && (
          <CognitiveDashboard
            patient={patient}
            latestResults={screeningResults}
            cognitiveScores={cognitiveScores}
            onNewScreening={() => navigate('profile')}
            onCaregiver={() => navigate('caregiver')}
          />
        )}
        {currentStep === 'caregiver' && (
          <CaregiverPortal
            patient={patient}
            latestResults={screeningResults}
            cognitiveScores={cognitiveScores}
            onBack={() => navigate('dashboard')}
          />
        )}
      </main>
    </div>
  );
}
