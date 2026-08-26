import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Square, Play, RotateCcw, ChevronRight, ChevronLeft, Zap, Volume2, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { analyzeVoice } from '../services/api';

const RECORDING_PROMPT = `Please describe what you did yesterday morning in detail, or describe your favorite memory in as much detail as you can.`;

const TARGET_DURATION = 45; // seconds target

function WaveformVisualizer({ isRecording }) {
  const bars = Array.from({ length: 32 }, (_, i) => i);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', height: '60px' }}>
      {bars.map((i) => (
        <div
          key={i}
          className="waveform-bar"
          style={{
            height: isRecording ? `${Math.random() > 0.5 ? 20 + Math.sin(i * 0.3) * 30 : 8}px` : '8px',
            opacity: isRecording ? 1 : 0.3,
            animationDelay: `${i * 0.04}s`,
            animationDuration: `${0.6 + Math.sin(i) * 0.3}s`,
          }}
        />
      ))}
    </div>
  );
}

function BiomarkerCard({ label, value, unit = '', color = '#06b6d4', description }) {
  return (
    <div style={{
      background: 'rgba(15,23,42,0.6)',
      border: `1px solid ${color}30`,
      borderRadius: '12px',
      padding: '16px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color, lineHeight: 1 }}>
        {typeof value === 'number' ? value.toFixed(value < 10 ? 2 : 0) : value}{unit}
      </div>
      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      {description && (
        <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px', lineHeight: 1.4 }}>{description}</div>
      )}
    </div>
  );
}

export default function VoiceTest({ sessionId, onComplete, onSkip, onBack }) {
  const [phase, setPhase] = useState('intro'); // intro | recording | analyzing | results | error
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [audioURL, setAudioURL] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [permError, setPermError] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // Timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setElapsed(t => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const startRecording = useCallback(async () => {
    setError('');
    setPermError(false);

    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setError('Your browser does not support audio recording. Please use Chrome, Firefox, or Edge.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const options = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? { mimeType: 'audio/webm;codecs=opus' }
        : MediaRecorder.isTypeSupported('audio/webm')
        ? { mimeType: 'audio/webm' }
        : {};

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: options.mimeType || 'audio/webm' });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
      };

      recorder.start(250); // collect every 250ms
      setIsRecording(true);
      setElapsed(0);
      setPhase('recording');
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermError(true);
        setError('Microphone permission denied. Please allow microphone access and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.');
      } else {
        setError(`Recording error: ${err.message}`);
      }
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach(t => t.stop());
      setIsRecording(false);
    }
  }, [isRecording]);

  const resetRecording = useCallback(() => {
    stopRecording();
    setAudioBlob(null);
    setAudioURL(null);
    setResults(null);
    setElapsed(0);
    setError('');
    setPhase('intro');
  }, [stopRecording]);

  const analyzeRecording = useCallback(async () => {
    setPhase('analyzing');
    setError('');
    try {
      const data = await analyzeVoice(audioBlob, elapsed, false, sessionId);
      setResults(data);
      setPhase('results');
    } catch (err) {
      // If real analysis fails, try demo mode
      try {
        const data = await analyzeVoice(audioBlob, elapsed, true, sessionId);
        setResults(data);
        setPhase('results');
      } catch (err2) {
        setError(`Analysis failed: ${err2.message || 'Unable to connect to backend.'}`);
        setPhase('recording');
      }
    }
  }, [audioBlob, elapsed, sessionId]);

  const progressPct = Math.min((elapsed / TARGET_DURATION) * 100, 100);
  const isGoodLength = elapsed >= 20;

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '48px 24px' }}>
      {/* Header */}
      <div className="animate-fade-in-up" style={{ marginBottom: '32px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.25)',
          borderRadius: '20px', padding: '5px 14px', marginBottom: '14px',
          fontSize: '13px', color: '#14b8a6',
        }}>
          <Mic size={13} />
          Step 2 of 5
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '10px', color: '#f1f5f9' }}>
          Voice Assessment
        </h1>
        <p style={{ color: '#94a3b8', lineHeight: 1.7, fontSize: '0.95rem' }}>
          Your speech patterns provide valuable biomarkers. Speak naturally for 30–60 seconds.
        </p>
      </div>

      {/* ── INTRO PHASE ─────────────────────────────────────────────────── */}
      {phase === 'intro' && (
        <div className="animate-fade-in-up">
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              width: 80, height: 80,
              background: 'linear-gradient(135deg, rgba(20,184,166,0.2), rgba(6,182,212,0.15))',
              border: '2px solid rgba(20,184,166,0.3)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <Mic size={36} color="#14b8a6" />
            </div>

            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '16px', color: '#f1f5f9' }}>
              Recording Prompt
            </h2>

            <div style={{
              background: 'rgba(6,182,212,0.06)',
              border: '1px solid rgba(6,182,212,0.2)',
              borderRadius: '12px',
              padding: '20px 28px',
              marginBottom: '28px',
              fontSize: '1.05rem',
              lineHeight: 1.7,
              color: '#cbd5e1',
              fontStyle: 'italic',
            }}>
              "{RECORDING_PROMPT}"
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', marginBottom: '32px' }}>
              {[
                'Find a quiet environment for clearest results.',
                'Speak clearly and at a natural pace — no need to rush.',
                'Target 30–60 seconds of speech for best analysis.',
                'This recording is processed locally and not shared.',
              ].map(tip => (
                <div key={tip} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '14px', color: '#94a3b8' }}>
                  <CheckCircle2 size={16} color="#14b8a6" style={{ flexShrink: 0, marginTop: 2 }} />
                  {tip}
                </div>
              ))}
            </div>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '8px', padding: '12px 16px', marginBottom: '20px',
                color: '#f87171', fontSize: '14px',
                display: 'flex', alignItems: 'flex-start', gap: '8px', textAlign: 'left',
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                {error}
                {permError && (
                  <span> Check your browser's site permissions and reload.</span>
                )}
              </div>
            )}

            <button onClick={startRecording} className="btn-primary" style={{ padding: '16px 36px', fontSize: '1rem' }}>
              <Mic size={20} />
              Start Recording
            </button>
          </div>
        </div>
      )}

      {/* ── RECORDING PHASE ──────────────────────────────────────────────── */}
      {phase === 'recording' && (
        <div className="animate-fade-in-up">
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', marginBottom: '24px' }}>
            {/* Pulsing mic */}
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '24px' }}>
              <div
                className="animate-pulse-ring"
                style={{
                  width: 100, height: 100,
                  background: isRecording
                    ? 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.1))'
                    : 'rgba(51,65,85,0.3)',
                  border: `3px solid ${isRecording ? 'rgba(239,68,68,0.5)' : '#334155'}`,
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Mic size={42} color={isRecording ? '#f87171' : '#64748b'} />
              </div>
              {isRecording && (
                <div style={{
                  position: 'absolute', top: -4, right: -4,
                  width: 20, height: 20,
                  background: '#ef4444',
                  borderRadius: '50%',
                  border: '2px solid #0f172a',
                  animation: 'pulse 1s ease-in-out infinite',
                }} />
              )}
            </div>

            {/* Timer */}
            <div style={{ fontSize: '3rem', fontWeight: 800, color: isRecording ? '#f87171' : '#94a3b8', marginBottom: '8px', fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(elapsed)}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
              {isRecording ? '🔴 Recording in progress...' : '⏸ Recording paused'}
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: '8px' }}>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '24px' }}>
              Target: {TARGET_DURATION}s · {isGoodLength ? '✅ Good length' : `${TARGET_DURATION - elapsed}s more recommended`}
            </div>

            {/* Waveform */}
            <WaveformVisualizer isRecording={isRecording} />

            {/* Prompt reminder */}
            <div style={{
              background: 'rgba(6,182,212,0.05)',
              border: '1px solid rgba(6,182,212,0.15)',
              borderRadius: '10px',
              padding: '12px 16px',
              marginTop: '20px',
              marginBottom: '28px',
              fontSize: '13px',
              color: '#94a3b8',
              fontStyle: 'italic',
            }}>
              "{RECORDING_PROMPT}"
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {isRecording && (
                <button onClick={stopRecording} style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white', fontWeight: 600, padding: '12px 28px',
                  borderRadius: '10px', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem',
                }}>
                  <Square size={18} fill="white" />
                  Stop Recording
                </button>
              )}
              {!isRecording && audioBlob && (
                <>
                  <button onClick={analyzeRecording} className="btn-primary" style={{ padding: '12px 28px', fontSize: '1rem' }}>
                    <Zap size={18} />
                    Analyze Speech
                  </button>
                  <button onClick={startRecording} className="btn-secondary" style={{ padding: '12px 20px' }}>
                    <RotateCcw size={16} />
                    Re-record
                  </button>
                </>
              )}
              <button onClick={resetRecording} className="btn-secondary" style={{ padding: '12px 16px' }}>
                <RotateCcw size={16} />
              </button>
            </div>

            {/* Playback */}
            {audioURL && !isRecording && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Volume2 size={12} /> Review your recording
                </div>
                <audio controls src={audioURL} style={{ width: '100%', borderRadius: '8px' }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ANALYZING PHASE ──────────────────────────────────────────────── */}
      {phase === 'analyzing' && (
        <div className="animate-fade-in-up">
          <div className="glass-card" style={{ padding: '60px 40px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 24px' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px', color: '#f1f5f9' }}>
              Analyzing Speech...
            </h2>
            <p style={{ color: '#94a3b8', lineHeight: 1.7 }}>
              Extracting acoustic and linguistic biomarkers.<br />
              This may take 15–30 seconds.
            </p>
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left', maxWidth: '300px', margin: '24px auto 0' }}>
              {['Transcribing audio...', 'Detecting pause patterns...', 'Measuring vocabulary richness...', 'Calculating speaking rate...'].map((step, i) => (
                <div key={step} style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px', color: '#64748b' }}>
                  <div style={{ width: 6, height: 6, background: '#06b6d4', borderRadius: '50%', opacity: 0.6 + i * 0.1 }} />
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── RESULTS PHASE ────────────────────────────────────────────────── */}
      {phase === 'results' && results && (
        <div className="animate-fade-in-up">
          {/* Demo mode notice */}
          {results.demo_mode && (
            <div style={{
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: '10px', padding: '12px 16px', marginBottom: '16px',
              display: 'flex', gap: '10px', alignItems: 'flex-start',
              color: '#fbbf24', fontSize: '13px',
            }}>
              <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>Demo Mode Active:</strong> Whisper transcription unavailable. Realistic simulated biomarkers are displayed.
                These values can still be used to test the full screening pipeline.
              </div>
            </div>
          )}

          <div className="glass-card" style={{ padding: '32px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#14b8a6', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Speech Biomarkers
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
              <BiomarkerCard label="Speech Pauses" value={results.speech_pauses} color="#06b6d4" description="Pauses >0.5s" />
              <BiomarkerCard label="Avg Pause" value={results.average_pause_duration} unit="s" color="#14b8a6" description="Duration" />
              <BiomarkerCard label="Speaking Rate" value={results.wpm} unit=" WPM" color="#8b5cf6" description="Words/min" />
              <BiomarkerCard label="Vocab Richness" value={(results.vocab_richness * 100).toFixed(0)} unit="%" color="#f59e0b" description="TTR proxy" />
              <BiomarkerCard label="Silence" value={results.silence_percentage} unit="%" color="#64748b" description="% of audio" />
              <BiomarkerCard label="Filler Words" value={results.filler_words} color="#ef4444" description="um, uh, like..." />
              <BiomarkerCard label="Total Words" value={results.total_words} color="#06b6d4" />
              <BiomarkerCard label="Unique Words" value={results.unique_words} color="#14b8a6" />
            </div>

            {/* Transcript */}
            <div style={{
              background: 'rgba(15,23,42,0.5)',
              border: '1px solid rgba(51,65,85,0.6)',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '16px',
            }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                Transcript
              </div>
              <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.8, margin: 0 }}>
                {results.transcript || '(No transcript available)'}
              </p>
            </div>

            {/* Insight */}
            <div style={{
              background: 'rgba(6,182,212,0.05)',
              border: '1px solid rgba(6,182,212,0.15)',
              borderRadius: '10px',
              padding: '14px 16px',
              fontSize: '13px',
              color: '#94a3b8',
            }}>
              💡 {results.summary_insight}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
            <button onClick={resetRecording} className="btn-secondary">
              <RotateCcw size={16} />
              Re-record
            </button>
            <button onClick={() => onComplete(results)} className="btn-primary" style={{ padding: '14px 32px' }}>
              Continue to Screening
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ── Navigation when in intro ─────────────────────────────────────── */}
      {phase === 'intro' && (
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', marginTop: '8px' }}>
          <button onClick={onBack} className="btn-secondary">
            <ChevronLeft size={18} /> Back
          </button>
          <button onClick={onSkip} className="btn-secondary" style={{ color: '#64748b' }}>
            Skip Voice Test
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
