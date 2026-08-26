import { useRef } from 'react';
import {
  Bar, Doughnut
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  Title, Tooltip, Legend
} from 'chart.js';
import { Shield, Brain, Download, RotateCcw, BarChart3, CheckCircle2, AlertTriangle, XCircle, ChevronRight } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const RISK_CONFIG = {
  Low: {
    color: '#22c55e', glow: 'rgba(34,197,94,0.25)', bg: 'rgba(34,197,94,0.1)',
    border: 'rgba(34,197,94,0.35)', icon: CheckCircle2, emoji: '✅',
    label: 'LOW RISK',
  },
  Moderate: {
    color: '#f59e0b', glow: 'rgba(245,158,11,0.25)', bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.35)', icon: AlertTriangle, emoji: '⚠️',
    label: 'MODERATE RISK',
  },
  High: {
    color: '#ef4444', glow: 'rgba(239,68,68,0.25)', bg: 'rgba(239,68,68,0.1)',
    border: 'rgba(239,68,68,0.35)', icon: XCircle, emoji: '🔴',
    label: 'HIGH RISK',
  },
};

function RiskBadge({ riskLevel }) {
  const cfg = RISK_CONFIG[riskLevel] || RISK_CONFIG.Low;
  const Icon = cfg.icon;
  return (
    <div style={{
      display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
      background: cfg.bg, border: `2px solid ${cfg.border}`,
      borderRadius: '20px', padding: '28px 48px',
      boxShadow: `0 0 40px ${cfg.glow}`,
    }}>
      <div style={{ fontSize: '48px', marginBottom: '12px' }}>{cfg.emoji}</div>
      <div style={{ fontSize: '2.2rem', fontWeight: 900, color: cfg.color, letterSpacing: '0.05em' }}>
        {cfg.label}
      </div>
    </div>
  );
}

function ProbabilityChart({ probabilities }) {
  const labels = ['Low Risk', 'Moderate Risk', 'High Risk'];
  const data = [probabilities.low, probabilities.moderate, probabilities.high];

  const doughnutData = {
    labels,
    datasets: [{
      data: data.map(v => (v * 100).toFixed(1)),
      backgroundColor: ['rgba(34,197,94,0.8)', 'rgba(245,158,11,0.8)', 'rgba(239,68,68,0.8)'],
      borderColor: ['#22c55e', '#f59e0b', '#ef4444'],
      borderWidth: 2,
    }],
  };

  return (
    <div style={{ maxWidth: 280, margin: '0 auto' }}>
      <Doughnut
        data={doughnutData}
        options={{
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#94a3b8', padding: 16, font: { size: 12 } },
            },
            tooltip: {
              callbacks: {
                label: ctx => ` ${ctx.label}: ${parseFloat(ctx.raw).toFixed(1)}%`,
              },
            },
          },
          cutout: '65%',
        }}
      />
    </div>
  );
}

function SHAPChart({ contributions }) {
  const entries = Object.entries(contributions).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  const labels = entries.map(([k]) => k);
  const values = entries.map(([, v]) => v);
  const colors = values.map(v => v >= 0 ? 'rgba(239,68,68,0.75)' : 'rgba(34,197,94,0.75)');
  const borders = values.map(v => v >= 0 ? '#ef4444' : '#22c55e');

  return (
    <Bar
      data={{
        labels,
        datasets: [{
          label: 'SHAP Feature Contribution',
          data: values,
          backgroundColor: colors,
          borderColor: borders,
          borderWidth: 1.5,
          borderRadius: 4,
        }],
      }}
      options={{
        indexAxis: 'y',
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` Impact: ${ctx.raw > 0 ? '+' : ''}${ctx.raw.toFixed(3)} (${ctx.raw > 0 ? 'increases' : 'decreases'} risk)`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(51,65,85,0.5)' },
            ticks: { color: '#64748b', font: { size: 11 } },
          },
          y: {
            grid: { display: false },
            ticks: { color: '#94a3b8', font: { size: 12 } },
          },
        },
      }}
    />
  );
}

function ScoreBar({ label, score, color = '#06b6d4' }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '13px', color: '#94a3b8' }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color }}>{score !== undefined ? `${score}%` : '—'}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${score || 0}%`, background: `linear-gradient(90deg, ${color}99, ${color})` }} />
      </div>
    </div>
  );
}

export default function ResultsPage({ results, cognitiveScores, patient, voiceResults, onDashboard, onRestart }) {
  const reportRef = useRef(null);

  if (!results) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 24px', color: '#64748b' }}>
        No results available. <button onClick={onRestart} className="btn-primary" style={{ marginLeft: '12px' }}>Start Screening</button>
      </div>
    );
  }

  const cfg = RISK_CONFIG[results.risk_level] || RISK_CONFIG.Low;
  const confPct = Math.round((results.confidence || 0.7) * 100);

  const handleDownload = () => {
    const now = new Date().toLocaleDateString();
    const reportHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>NeuroSense AI Screening Report</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1e293b; }
    h1 { color: #0f172a; border-bottom: 2px solid #06b6d4; padding-bottom: 12px; }
    h2 { color: #1e40af; margin-top: 28px; }
    .risk-badge { padding: 16px 28px; border-radius: 8px; font-size: 1.4rem; font-weight: 900; display: inline-block; margin: 16px 0; }
    .low { background: #dcfce7; color: #15803d; border: 2px solid #86efac; }
    .moderate { background: #fef3c7; color: #b45309; border: 2px solid #fcd34d; }
    .high { background: #fee2e2; color: #b91c1c; border: 2px solid #fca5a5; }
    .disclaimer { background: #fef2f2; border: 2px solid #fca5a5; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
    table { width: 100%; border-collapse: collapse; }
    td, th { padding: 8px 12px; border: 1px solid #e2e8f0; text-align: left; }
    th { background: #f8fafc; }
    footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <h1>🧠 NeuroSense AI — Cognitive Screening Report</h1>
  <div class="disclaimer">
    <strong>⚠️ IMPORTANT DISCLAIMER:</strong> NeuroSense AI is an AI-assisted cognitive screening tool for research/demo purposes ONLY.
    This report does NOT constitute a medical diagnosis and must not replace professional clinical evaluation.
  </div>

  <h2>Patient Information</h2>
  <table>
    <tr><th>Name</th><td>${patient?.name || 'Anonymous'}</td></tr>
    <tr><th>Age</th><td>${patient?.age || '—'}</td></tr>
    <tr><th>Gender</th><td>${patient?.gender || '—'}</td></tr>
    <tr><th>Family History</th><td>${patient?.familyHistory ? 'Yes' : 'No'}</td></tr>
    <tr><th>Assessment Date</th><td>${now}</td></tr>
  </table>

  <h2>AI Risk Assessment</h2>
  <div class="risk-badge ${results.risk_level.toLowerCase()}">${results.risk_level.toUpperCase()} RISK</div>
  <p>Confidence: ${confPct}%</p>

  <h3>Probability Distribution</h3>
  <table>
    <tr><th>Risk Level</th><th>Probability</th></tr>
    <tr><td>Low Risk</td><td>${(results.probabilities.low * 100).toFixed(1)}%</td></tr>
    <tr><td>Moderate Risk</td><td>${(results.probabilities.moderate * 100).toFixed(1)}%</td></tr>
    <tr><td>High Risk</td><td>${(results.probabilities.high * 100).toFixed(1)}%</td></tr>
  </table>

  <h2>Cognitive Scores</h2>
  <table>
    <tr><th>Domain</th><th>Score</th></tr>
    <tr><td>Memory</td><td>${cognitiveScores?.memoryScore ?? '—'}%</td></tr>
    <tr><td>Attention</td><td>${cognitiveScores?.attentionScore ?? '—'}%</td></tr>
    <tr><td>Language</td><td>${cognitiveScores?.languageScore ?? '—'}%</td></tr>
    <tr><td>Orientation</td><td>${cognitiveScores?.orientationScore ?? '—'}%</td></tr>
  </table>

  ${voiceResults ? `
  <h2>Speech Biomarkers</h2>
  <table>
    <tr><th>Metric</th><th>Value</th></tr>
    <tr><td>Speech Pauses</td><td>${voiceResults.speech_pauses}</td></tr>
    <tr><td>Avg Pause Duration</td><td>${voiceResults.average_pause_duration}s</td></tr>
    <tr><td>Words Per Minute</td><td>${voiceResults.wpm?.toFixed(0)}</td></tr>
    <tr><td>Vocabulary Richness (TTR)</td><td>${(voiceResults.vocab_richness * 100).toFixed(0)}%</td></tr>
    <tr><td>Filler Words</td><td>${voiceResults.filler_words}</td></tr>
    <tr><td>Silence %</td><td>${voiceResults.silence_percentage}%</td></tr>
  </table>
  ` : ''}

  <h2>AI Explanation</h2>
  <ul>
    ${(results.explanation || []).map(e => `<li>${e}</li>`).join('')}
  </ul>

  <h2>Feature Contributions (SHAP)</h2>
  <table>
    <tr><th>Feature</th><th>SHAP Value</th><th>Direction</th></tr>
    ${Object.entries(results.feature_contributions || {}).map(([k, v]) =>
      `<tr><td>${k}</td><td>${v > 0 ? '+' : ''}${v.toFixed(3)}</td><td>${v > 0 ? '↑ Increases risk' : '↓ Decreases risk'}</td></tr>`
    ).join('')}
  </table>

  <h2>Recommendations</h2>
  <ul>
    ${(results.recommendations || []).map(r => `<li>${r}</li>`).join('')}
  </ul>

  <footer>
    Generated by NeuroSense AI v1.0 — ${new Date().toISOString()} <br/>
    DISCLAIMER: This report is for research/demo purposes only and does NOT constitute a medical diagnosis.
    Consult a qualified healthcare professional for clinical evaluation.
  </footer>
</body>
</html>`;

    const blob = new Blob([reportHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NeuroSense_Report_${patient?.name || 'Patient'}_${now.replace(/\//g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px' }}>
      {/* Header */}
      <div className="animate-fade-in-up" style={{ marginBottom: '36px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)',
          borderRadius: '20px', padding: '5px 14px', marginBottom: '14px',
          fontSize: '13px', color: '#06b6d4',
        }}>
          <Brain size={13} />
          Step 4 of 5 — AI Results
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '10px', color: '#f1f5f9' }}>
          Screening Results
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
          {patient?.name && <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{patient.name}</span>}
          {patient?.age && <span> · Age {patient.age}</span>}
          {' '}· {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* ── Risk Badge ───────────────────────────────────────────────────── */}
      <div className="glass-card animate-fade-in-up" style={{ padding: '40px', textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '24px' }}>
          AI Risk Classification
        </h2>
        <RiskBadge riskLevel={results.risk_level} />
        <div style={{ marginTop: '20px', fontSize: '14px', color: '#64748b' }}>
          Model Confidence: <span style={{ color: cfg.color, fontWeight: 700 }}>{confPct}%</span>
        </div>

        {/* Probabilities text */}
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '20px', flexWrap: 'wrap' }}>
          {[
            { label: 'Low', value: results.probabilities.low, color: '#22c55e' },
            { label: 'Moderate', value: results.probabilities.moderate, color: '#f59e0b' },
            { label: 'High', value: results.probabilities.high, color: '#ef4444' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color }}>{(value * 100).toFixed(1)}%</div>
              <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Charts row ───────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Doughnut */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px' }}>
            Risk Probability Distribution
          </h2>
          <ProbabilityChart probabilities={results.probabilities} />
        </div>

        {/* Cognitive scores */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px' }}>
            Cognitive Domain Scores
          </h2>
          <ScoreBar label="Memory" score={cognitiveScores?.memoryScore} color="#06b6d4" />
          <ScoreBar label="Attention" score={cognitiveScores?.attentionScore} color="#8b5cf6" />
          <ScoreBar label="Language" score={cognitiveScores?.languageScore} color="#f59e0b" />
          <ScoreBar label="Orientation" score={cognitiveScores?.orientationScore} color="#14b8a6" />
        </div>
      </div>

      {/* ── SHAP Explanation ─────────────────────────────────────────────── */}
      <div className="glass-card animate-fade-in-up" style={{ padding: '32px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <BarChart3 size={20} color="#8b5cf6" />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9' }}>
            Explainable AI — Feature Contributions
          </h2>
          <span style={{
            background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: '20px', padding: '2px 10px', fontSize: '11px', color: '#a78bfa',
          }}>SHAP</span>
        </div>

        <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px', lineHeight: 1.7 }}>
          SHAP values show which biomarkers pushed the prediction toward higher (🔴 positive) or lower (🟢 negative) risk.
        </p>

        <div style={{ marginBottom: '24px' }}>
          <SHAPChart contributions={results.feature_contributions || {}} />
        </div>

        {/* Natural language explanation */}
        <div style={{
          background: 'rgba(139,92,246,0.06)',
          border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: '10px',
          padding: '16px 20px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
            Plain Language Explanation
          </div>
          {(results.explanation || []).map((line, i) => (
            <p key={i} style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.7, margin: '0 0 6px' }}>{line}</p>
          ))}
        </div>
      </div>

      {/* ── Recommendations ──────────────────────────────────────────────── */}
      <div className="glass-card animate-fade-in-up" style={{ padding: '32px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Shield size={20} color={cfg.color} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9' }}>
            Follow-up Recommendations
          </h2>
        </div>

        <div style={{
          background: cfg.bg, border: `1px solid ${cfg.border}`,
          borderRadius: '10px', padding: '14px 18px', marginBottom: '16px',
          fontSize: '13px', color: cfg.color, fontWeight: 600,
        }}>
          Based on {results.risk_level} Risk classification:
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(results.recommendations || []).map((rec, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', fontSize: '14px', color: '#94a3b8', lineHeight: 1.6 }}>
              <div style={{ width: 22, height: 22, minWidth: 22, background: `${cfg.color}18`, border: `1px solid ${cfg.border}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: cfg.color, fontWeight: 700 }}>
                {i + 1}
              </div>
              {rec}
            </div>
          ))}
        </div>

        {/* Always show medical disclaimer */}
        <div style={{
          marginTop: '20px',
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '12px',
          color: '#94a3b8',
        }}>
          <Shield size={12} color="#f87171" style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
          <strong>Disclaimer:</strong> These recommendations are informational only.
          NeuroSense AI does not diagnose medical conditions. Always consult a qualified healthcare professional.
        </div>
      </div>

      {/* ── Voice Biomarkers summary ──────────────────────────────────────── */}
      {voiceResults && (
        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
            Speech Biomarkers {voiceResults.demo_mode && <span style={{ color: '#f59e0b', fontSize: '10px' }}>(Demo)</span>}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
            {[
              { label: 'Pauses', value: voiceResults.speech_pauses, color: '#06b6d4' },
              { label: 'Avg Pause', value: `${voiceResults.average_pause_duration?.toFixed(2)}s`, color: '#14b8a6' },
              { label: 'WPM', value: voiceResults.wpm?.toFixed(0), color: '#8b5cf6' },
              { label: 'Vocab TTR', value: `${(voiceResults.vocab_richness * 100).toFixed(0)}%`, color: '#f59e0b' },
              { label: 'Fillers', value: voiceResults.filler_words, color: '#ef4444' },
              { label: 'Silence', value: `${voiceResults.silence_percentage}%`, color: '#64748b' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: 'center', background: 'rgba(15,23,42,0.5)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Actions ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button onClick={handleDownload} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '14px' }}>
          <Download size={18} /> Download Report
        </button>
        <button onClick={onDashboard} className="btn-primary" style={{ flex: 2, justifyContent: 'center', padding: '14px', fontSize: '1rem' }}>
          <BarChart3 size={18} /> View Cognitive Dashboard <ChevronRight size={18} />
        </button>
        <button onClick={onRestart} className="btn-secondary" style={{ padding: '14px 18px' }}>
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}
