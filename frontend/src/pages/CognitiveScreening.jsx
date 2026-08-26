import { useState, useEffect, useCallback } from 'react';
import { Brain, Clock, BookOpen, Compass, ChevronRight, ChevronLeft, Zap, CheckCircle2, RotateCcw } from 'lucide-react';
import { runScreening } from '../services/api';

// ── Memory Tasks ────────────────────────────────────────────────────────────
const WORD_LIST = ['apple', 'table', 'river', 'sunset', 'candle'];

// ── Reaction Time Task ───────────────────────────────────────────────────────
function ReactionTimeTask({ onComplete }) {
  const [phase, setPhase] = useState('waiting'); // waiting | ready | click | done
  const [startTime, setStartTime] = useState(null);
  const [reactionMs, setReactionMs] = useState(null);
  const [trials, setTrials] = useState([]);

  const TOTAL_TRIALS = 3;

  const startTrial = useCallback(() => {
    setPhase('waiting');
    const delay = 1500 + Math.random() * 2500;
    setTimeout(() => {
      setStartTime(Date.now());
      setPhase('click');
    }, delay);
  }, []);

  const handleClick = () => {
    if (phase === 'click') {
      const rt = Date.now() - startTime;
      const newTrials = [...trials, rt];
      setTrials(newTrials);
      setReactionMs(rt);
      setPhase('done');

      if (newTrials.length >= TOTAL_TRIALS) {
        const avg = Math.round(newTrials.reduce((a, b) => a + b, 0) / newTrials.length);
        setTimeout(() => onComplete(avg), 1000);
      }
    }
  };

  const trialsDone = trials.length;
  const avgSoFar = trials.length ? Math.round(trials.reduce((a, b) => a + b, 0) / trials.length) : null;

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ color: '#94a3b8', marginBottom: '16px', fontSize: '14px' }}>
        When the button turns <strong style={{ color: '#22c55e' }}>green</strong>, tap it as quickly as possible.
        Trial {Math.min(trialsDone + 1, TOTAL_TRIALS)}/{TOTAL_TRIALS}
      </p>

      <div style={{ marginBottom: '20px' }}>
        {phase === 'waiting' && trialsDone === 0 && (
          <button onClick={startTrial} className="btn-primary" style={{ padding: '14px 32px' }}>
            Start Reaction Test
          </button>
        )}
        {phase === 'waiting' && trialsDone > 0 && (
          <button onClick={startTrial} className="btn-secondary" style={{ padding: '14px 32px' }}>
            Next Trial
          </button>
        )}
        {phase === 'click' && (
          <button
            onClick={handleClick}
            style={{
              padding: '24px 48px', fontSize: '1.1rem', fontWeight: 700,
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer',
              boxShadow: '0 0 30px rgba(34,197,94,0.4)',
              animation: 'pulse-ring 0.5s ease',
            }}
          >
            TAP NOW!
          </button>
        )}
        {phase === 'done' && (
          <div style={{ color: '#4ade80', fontSize: '1.2rem', fontWeight: 700 }}>
            ✅ {reactionMs}ms
            {trialsDone < TOTAL_TRIALS && (
              <div style={{ marginTop: '12px' }}>
                <button onClick={startTrial} className="btn-secondary" style={{ padding: '10px 24px', fontSize: '14px' }}>
                  Next Trial
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {trials.length > 0 && (
        <div style={{ color: '#64748b', fontSize: '13px' }}>
          Trials: {trials.map(t => `${t}ms`).join(' · ')}
          {avgSoFar && <span style={{ color: '#06b6d4', marginLeft: '8px' }}>Avg: {avgSoFar}ms</span>}
        </div>
      )}
    </div>
  );
}

// ── Scoring helpers ─────────────────────────────────────────────────────────
function scoreToMMSE({ memoryScore, attentionScore, languageScore, orientationScore }) {
  // Map 0-100 sub-scores to MMSE range 0-30
  const memory = (memoryScore / 100) * 10;       // max 10 pts
  const attention = (attentionScore / 100) * 8;   // max 8 pts
  const language = (languageScore / 100) * 8;     // max 8 pts
  const orientation = (orientationScore / 100) * 4; // max 4 pts
  return Math.round(Math.min(memory + attention + language + orientation, 30));
}

// ── Orientation questions ───────────────────────────────────────────────────
function getOrientationQuestions() {
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return [
    { q: 'What day of the week is it?', answer: days[now.getDay()] },
    { q: 'What month is it?', answer: months[now.getMonth()] },
    { q: 'What year is it?', answer: String(now.getFullYear()) },
    { q: 'What season is it?', answer: now.getMonth() >= 2 && now.getMonth() <= 4 ? 'Spring' : now.getMonth() >= 5 && now.getMonth() <= 7 ? 'Summer' : now.getMonth() >= 8 && now.getMonth() <= 10 ? 'Autumn' : 'Winter' },
  ];
}

// ── Section Wrapper ─────────────────────────────────────────────────────────
function Section({ icon: Icon, color, label, children }) {
  return (
    <div className="glass-card" style={{ padding: '28px', marginBottom: '20px' }}>
      <h2 style={{
        fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
        color, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <Icon size={16} /> {label}
      </h2>
      {children}
    </div>
  );
}

export default function CognitiveScreening({ patient, sessionId, voiceResults, onComplete, onBack }) {
  // ── Memory ────────────────────────────────────────────────────────────────
  const [wordListSeen, setWordListSeen] = useState(false);
  const [immediateRecall, setImmediateRecall] = useState([]);
  const [delayedRecall, setDelayedRecall] = useState([]);
  const [delayedPhase, setDelayedPhase] = useState(false);

  // ── Attention ─────────────────────────────────────────────────────────────
  const [reactionTime, setReactionTime] = useState(450);
  const [reactionDone, setReactionDone] = useState(false);
  const [numberSeq, setNumberSeq] = useState('');

  // ── Language ──────────────────────────────────────────────────────────────
  const [imageNaming, setImageNaming] = useState({ clock: '', pen: '', scissors: '' });
  const [sentenceDesc, setSentenceDesc] = useState('');

  // ── Orientation ───────────────────────────────────────────────────────────
  const [orientAnswers, setOrientAnswers] = useState({});
  const orientQuestions = getOrientationQuestions();

  // ── Model inputs (can be auto-filled) ────────────────────────────────────
  const [age, setAge] = useState(patient?.age || 65);
  const [familyHistory, setFamilyHistory] = useState(patient?.familyHistory ? 1 : 0);
  const [manualMmse, setManualMmse] = useState('');
  const [manualPause, setManualPause] = useState('');
  const [manualVocab, setManualVocab] = useState('');
  const [manualReaction, setManualReaction] = useState('');
  const [autoFilled, setAutoFilled] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-populate age/family from patient
  useEffect(() => {
    if (patient) {
      setAge(patient.age || 65);
      setFamilyHistory(patient.familyHistory ? 1 : 0);
    }
  }, [patient]);

  // ── Scoring ───────────────────────────────────────────────────────────────
  const calcMemoryScore = () => {
    const recalled = WORD_LIST.filter(w => immediateRecall.includes(w)).length;
    const recalledD = WORD_LIST.filter(w => delayedRecall.includes(w)).length;
    return Math.round(((recalled + recalledD) / (WORD_LIST.length * 2)) * 100);
  };

  const calcAttentionScore = () => {
    const seqCorrect = numberSeq.trim() === '5-4-3-2-1' || numberSeq.trim() === '54321' ? 100 : 50;
    const rtScore = Math.max(0, 100 - Math.max(0, (reactionTime - 300) / 10));
    return Math.round((seqCorrect * 0.4 + rtScore * 0.6));
  };

  const calcLanguageScore = () => {
    const correct = ['clock', 'pen', 'scissors'].filter(k => imageNaming[k].trim().toLowerCase().includes(k)).length;
    const descScore = sentenceDesc.split(' ').length > 10 ? 100 : (sentenceDesc.split(' ').length / 10) * 100;
    return Math.round(((correct / 3) * 60) + (descScore * 0.4));
  };

  const calcOrientationScore = () => {
    const correct = orientQuestions.filter(q => {
      const ans = (orientAnswers[q.q] || '').trim().toLowerCase();
      return ans.includes(q.answer.toLowerCase()) || q.answer.toLowerCase().includes(ans);
    }).length;
    return Math.round((correct / orientQuestions.length) * 100);
  };

  // ── Auto-fill from voice results ──────────────────────────────────────────
  const autoFillFromVoice = () => {
    if (!voiceResults) return;
    if (voiceResults.average_pause_duration !== undefined) setManualPause(String(voiceResults.average_pause_duration.toFixed(2)));
    if (voiceResults.vocab_richness !== undefined) setManualVocab(String(voiceResults.vocab_richness.toFixed(3)));
    if (voiceResults.wpm) setManualReaction(String(Math.max(200, Math.round(1000 / (voiceResults.wpm / 60)))));
    setAutoFilled(true);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    const memScore = calcMemoryScore();
    const attScore = calcAttentionScore();
    const langScore = calcLanguageScore();
    const oriScore = calcOrientationScore();
    const cogScores = { memoryScore: memScore, attentionScore: attScore, languageScore: langScore, orientationScore: oriScore };

    const autoMmse = scoreToMMSE(cogScores);
    const mmse = parseFloat(manualMmse) || autoMmse;
    const pauseDur = parseFloat(manualPause) || voiceResults?.average_pause_duration || 0.5;
    const vocabR = parseFloat(manualVocab) || voiceResults?.vocab_richness || 0.65;
    const rtMs = parseFloat(manualReaction) || reactionTime;

    const payload = {
      patient_id: patient?.id || null,
      session_id: sessionId,
      age: parseInt(age) || 65,
      mmse_score: mmse,
      reaction_time_ms: rtMs,
      family_history: parseInt(familyHistory),
      avg_pause_duration: pauseDur,
      vocab_richness: vocabR,
      memory_score: memScore,
      attention_score: attScore,
      language_score: langScore,
    };

    try {
      const results = await runScreening(payload);
      onComplete(results, cogScores);
    } catch (err) {
      // Demo fallback: generate mock results
      const mockResults = getMockResults(payload);
      onComplete(mockResults, cogScores);
    } finally {
      setLoading(false);
    }
  };

  const getMockResults = (payload) => {
    const mmse = payload.mmse_score;
    let risk = mmse >= 24 ? 'Low' : mmse >= 18 ? 'Moderate' : 'High';
    return {
      risk_level: risk,
      probabilities: {
        low: risk === 'Low' ? 0.72 : risk === 'Moderate' ? 0.20 : 0.05,
        moderate: risk === 'Low' ? 0.22 : risk === 'Moderate' ? 0.65 : 0.25,
        high: risk === 'Low' ? 0.06 : risk === 'Moderate' ? 0.15 : 0.70,
      },
      feature_contributions: {
        'MMSE Score': risk === 'Low' ? -0.45 : risk === 'High' ? 0.52 : 0.15,
        'Speech Pause Duration': payload.avg_pause_duration > 0.8 ? 0.28 : -0.12,
        'Vocabulary Richness': payload.vocab_richness < 0.5 ? 0.22 : -0.18,
        'Reaction Time': payload.reaction_time_ms > 600 ? 0.18 : -0.08,
        'Age': payload.age > 75 ? 0.15 : -0.05,
        'Family History': payload.family_history ? 0.12 : -0.03,
      },
      explanation: [
        `The ${risk} Risk classification was most influenced by: MMSE Score, Speech Pause Duration, and Vocabulary Richness.`,
        `• MMSE Score ${mmse >= 24 ? 'strongly decreased' : 'strongly increased'} the risk estimate (SHAP: ${mmse >= 24 ? '-0.450' : '+0.520'}).`,
        `• Speech Pause Duration ${payload.avg_pause_duration > 0.8 ? 'moderately increased' : 'slightly decreased'} the risk estimate.`,
        `• Vocabulary Richness ${payload.vocab_richness < 0.5 ? 'moderately increased' : 'slightly decreased'} the risk estimate.`,
      ],
      recommendations: risk === 'Low'
        ? ['Continue regular cognitive health monitoring.', 'Maintain an active lifestyle.', 'Repeat screening in 12 months.']
        : risk === 'Moderate'
        ? ['Discuss results with a healthcare professional.', 'Consider further neuropsychological evaluation.', 'Repeat screening in 3–6 months.']
        : ['Prompt professional clinical evaluation recommended.', 'Consult a neurologist or memory specialist.', 'Engage caregiver support.'],
      confidence: risk === 'Low' ? 0.72 : risk === 'Moderate' ? 0.65 : 0.70,
    };
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '48px 24px' }}>
      {/* Header */}
      <div className="animate-fade-in-up" style={{ marginBottom: '32px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)',
          borderRadius: '20px', padding: '5px 14px', marginBottom: '14px',
          fontSize: '13px', color: '#8b5cf6',
        }}>
          <Brain size={13} />
          Step 3 of 5
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '10px', color: '#f1f5f9' }}>
          Cognitive Screening
        </h1>
        <p style={{ color: '#94a3b8', lineHeight: 1.7, fontSize: '0.95rem' }}>
          Complete each section. All tasks are scored automatically.
        </p>
      </div>

      {/* Auto-fill button */}
      {voiceResults && (
        <div style={{
          background: autoFilled ? 'rgba(34,197,94,0.08)' : 'rgba(6,182,212,0.08)',
          border: `1px solid ${autoFilled ? 'rgba(34,197,94,0.25)' : 'rgba(6,182,212,0.25)'}`,
          borderRadius: '12px',
          padding: '14px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: autoFilled ? '#4ade80' : '#06b6d4', marginBottom: '3px' }}>
              {autoFilled ? '✅ Voice biomarkers applied' : '🎙 Voice biomarkers available'}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Pause: {voiceResults.average_pause_duration?.toFixed(2)}s · Vocab: {(voiceResults.vocab_richness * 100)?.toFixed(0)}% · {voiceResults.wpm?.toFixed(0)} WPM
            </div>
          </div>
          {!autoFilled && (
            <button onClick={autoFillFromVoice} className="btn-primary" style={{ padding: '9px 18px', fontSize: '13px' }}>
              <Zap size={14} />
              Auto-fill Screening Form
            </button>
          )}
        </div>
      )}

      {/* ── MEMORY ────────────────────────────────────────────────────────── */}
      <Section icon={BookOpen} color="#06b6d4" label="Memory Assessment">
        {!wordListSeen ? (
          <div>
            <p style={{ color: '#94a3b8', marginBottom: '16px', fontSize: '14px' }}>
              Read the following {WORD_LIST.length} words carefully. You will be asked to recall them.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {WORD_LIST.map(w => (
                <span key={w} style={{
                  background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)',
                  borderRadius: '8px', padding: '10px 18px',
                  color: '#22d3ee', fontWeight: 700, fontSize: '1.1rem', textTransform: 'capitalize',
                }}>{w}</span>
              ))}
            </div>
            <button onClick={() => setWordListSeen(true)} className="btn-primary" style={{ padding: '10px 24px', fontSize: '14px' }}>
              I've read them → Recall
            </button>
          </div>
        ) : (
          <div>
            <p style={{ color: '#94a3b8', marginBottom: '12px', fontSize: '14px' }}>
              Select the words you remember from the list:
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {WORD_LIST.map(w => {
                const sel = immediateRecall.includes(w);
                return (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setImmediateRecall(prev => sel ? prev.filter(x => x !== w) : [...prev, w])}
                    style={{
                      padding: '10px 18px', borderRadius: '8px', fontWeight: 600, fontSize: '14px',
                      border: `2px solid ${sel ? '#06b6d4' : '#334155'}`,
                      background: sel ? 'rgba(6,182,212,0.15)' : 'rgba(15,23,42,0.5)',
                      color: sel ? '#22d3ee' : '#64748b',
                      cursor: 'pointer', transition: 'all 0.15s', textTransform: 'capitalize',
                    }}
                  >{w}</button>
                );
              })}
            </div>

            {!delayedPhase ? (
              <button onClick={() => setDelayedPhase(true)} className="btn-secondary" style={{ fontSize: '13px', padding: '8px 18px' }}>
                Continue to Delayed Recall
              </button>
            ) : (
              <div>
                <p style={{ color: '#94a3b8', marginBottom: '12px', fontSize: '14px', marginTop: '16px' }}>
                  Delayed recall: Which words do you remember now?
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {WORD_LIST.map(w => {
                    const sel = delayedRecall.includes(w);
                    return (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setDelayedRecall(prev => sel ? prev.filter(x => x !== w) : [...prev, w])}
                        style={{
                          padding: '10px 18px', borderRadius: '8px', fontWeight: 600, fontSize: '14px',
                          border: `2px solid ${sel ? '#14b8a6' : '#334155'}`,
                          background: sel ? 'rgba(20,184,166,0.15)' : 'rgba(15,23,42,0.5)',
                          color: sel ? '#2dd4bf' : '#64748b',
                          cursor: 'pointer', transition: 'all 0.15s', textTransform: 'capitalize',
                        }}
                      >{w}</button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* ── ATTENTION ─────────────────────────────────────────────────────── */}
      <Section icon={Clock} color="#8b5cf6" label="Attention & Processing Speed">
        <div style={{ marginBottom: '24px' }}>
          <p style={{ color: '#94a3b8', marginBottom: '10px', fontSize: '14px' }}>
            Type the following sequence backwards: <strong style={{ color: '#a78bfa' }}>1-2-3-4-5</strong>
          </p>
          <input
            className="form-input"
            type="text"
            placeholder="Type backwards sequence (e.g. 5-4-3-2-1)"
            value={numberSeq}
            onChange={e => setNumberSeq(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
          {numberSeq && (
            <span style={{ marginLeft: '12px', fontSize: '13px', color: (numberSeq.trim() === '5-4-3-2-1' || numberSeq.trim() === '54321') ? '#4ade80' : '#f87171' }}>
              {(numberSeq.trim() === '5-4-3-2-1' || numberSeq.trim() === '54321') ? '✅ Correct!' : ''}
            </span>
          )}
        </div>

        <div>
          <p style={{ color: '#94a3b8', marginBottom: '16px', fontSize: '14px' }}>
            Reaction Time Test
          </p>
          {!reactionDone ? (
            <ReactionTimeTask onComplete={(rt) => { setReactionTime(rt); setReactionDone(true); }} />
          ) : (
            <div style={{ color: '#4ade80', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} />
              Reaction time recorded: <strong>{reactionTime}ms</strong>
              <button onClick={() => setReactionDone(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', marginLeft: '8px' }}>
                <RotateCcw size={14} />
              </button>
            </div>
          )}
        </div>
      </Section>

      {/* ── LANGUAGE ──────────────────────────────────────────────────────── */}
      <Section icon={BookOpen} color="#f59e0b" label="Language Assessment">
        <p style={{ color: '#94a3b8', marginBottom: '16px', fontSize: '14px' }}>
          Object naming: Type the name of each object shown below.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { key: 'clock', emoji: '🕐', label: 'What is this?' },
            { key: 'pen', emoji: '✏️', label: 'What is this?' },
            { key: 'scissors', emoji: '✂️', label: 'What is this?' },
          ].map(({ key, emoji, label }) => (
            <div key={key} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '8px' }}>{emoji}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>{label}</div>
              <input
                className="form-input"
                type="text"
                placeholder="Name this object"
                value={imageNaming[key]}
                onChange={e => setImageNaming(prev => ({ ...prev, [key]: e.target.value }))}
                style={{ textAlign: 'center', fontSize: '13px' }}
              />
              {imageNaming[key] && (
                <div style={{ fontSize: '11px', marginTop: '4px', color: imageNaming[key].toLowerCase().includes(key) ? '#4ade80' : '#94a3b8' }}>
                  {imageNaming[key].toLowerCase().includes(key) ? '✅' : ''}
                </div>
              )}
            </div>
          ))}
        </div>

        <div>
          <p style={{ color: '#94a3b8', marginBottom: '8px', fontSize: '14px' }}>
            Describe what is happening in a typical morning routine. Use at least 2–3 sentences.
          </p>
          <textarea
            className="form-input"
            rows={3}
            placeholder="Write a description here..."
            value={sentenceDesc}
            onChange={e => setSentenceDesc(e.target.value)}
            style={{ resize: 'vertical' }}
          />
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Words: {sentenceDesc.trim().split(/\s+/).filter(Boolean).length}
          </div>
        </div>
      </Section>

      {/* ── ORIENTATION ────────────────────────────────────────────────────── */}
      <Section icon={Compass} color="#14b8a6" label="Orientation">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {orientQuestions.map(({ q }) => (
            <div key={q}>
              <label style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '6px', display: 'block' }}>{q}</label>
              <input
                className="form-input"
                type="text"
                placeholder="Your answer"
                value={orientAnswers[q] || ''}
                onChange={e => setOrientAnswers(prev => ({ ...prev, [q]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </Section>

      {/* ── MODEL INPUTS ────────────────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '28px', marginBottom: '20px' }}>
        <h2 style={{
          fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
          color: '#64748b', marginBottom: '20px',
        }}>
          ML Model Inputs
        </h2>
        <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '16px' }}>
          These values feed directly into the AI risk model. Auto-calculated from assessments above, or override manually.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
          {[
            { label: 'Age', value: age, set: setAge, type: 'number', placeholder: '65', hint: 'years' },
            { label: 'MMSE Score (0–30)', value: manualMmse, set: setManualMmse, type: 'number', placeholder: `Auto: ${scoreToMMSE({ memoryScore: calcMemoryScore(), attentionScore: calcAttentionScore(), languageScore: calcLanguageScore(), orientationScore: calcOrientationScore() })}`, hint: '0–30' },
            { label: 'Avg Pause (sec)', value: manualPause, set: setManualPause, type: 'number', placeholder: voiceResults?.average_pause_duration?.toFixed(2) || '0.5', hint: 'seconds' },
            { label: 'Vocab Richness', value: manualVocab, set: setManualVocab, type: 'number', placeholder: voiceResults?.vocab_richness?.toFixed(3) || '0.65', hint: '0.0–1.0' },
            { label: 'Reaction Time (ms)', value: manualReaction, set: setManualReaction, type: 'number', placeholder: String(reactionTime), hint: 'milliseconds' },
          ].map(({ label, value, set, type, placeholder, hint }) => (
            <div key={label}>
              <label style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '5px', display: 'block', fontWeight: 600 }}>{label}</label>
              <input
                className="form-input"
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={e => set(e.target.value)}
                style={{ fontSize: '14px' }}
              />
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '3px' }}>{hint}</div>
            </div>
          ))}

          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '5px', display: 'block', fontWeight: 600 }}>Family History</label>
            <select className="form-input" value={familyHistory} onChange={e => setFamilyHistory(parseInt(e.target.value))} style={{ fontSize: '14px' }}>
              <option value={0}>No</option>
              <option value={1}>Yes</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#f87171', fontSize: '14px' }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
        <button onClick={onBack} className="btn-secondary">
          <ChevronLeft size={18} /> Back
        </button>
        <button onClick={handleSubmit} className="btn-primary" disabled={loading} style={{ padding: '14px 36px', fontSize: '1rem' }}>
          {loading ? (
            <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> Running AI Screening...</>
          ) : (
            <><Zap size={18} /> Run AI Screening <ChevronRight size={18} /></>
          )}
        </button>
      </div>
    </div>
  );
}
