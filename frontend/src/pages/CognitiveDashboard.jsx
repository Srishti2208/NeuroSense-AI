import { useState, useEffect } from 'react';
import {
  Line, Bar, Radar
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, RadialLinearScale, Filler,
  Title, Tooltip, Legend
} from 'chart.js';
import { Brain, TrendingUp, TrendingDown, Minus, Activity, Plus, Users } from 'lucide-react';
import { getPatientHistory } from '../services/api';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, RadialLinearScale, Filler,
  Title, Tooltip, Legend
);

// ── Demo historical data ───────────────────────────────────────────────────
const DEMO_HISTORY = [
  { date: 'Feb 2026', cognitive: 84, memory: 88, attention: 82, language: 85, speech: 80, vocab: 78, risk: 'Low', mmse: 27 },
  { date: 'Mar 2026', cognitive: 81, memory: 85, attention: 79, language: 83, speech: 77, vocab: 74, risk: 'Low', mmse: 26 },
  { date: 'Apr 2026', cognitive: 78, memory: 80, attention: 77, language: 79, speech: 74, vocab: 70, risk: 'Low', mmse: 26 },
  { date: 'May 2026', cognitive: 74, memory: 75, attention: 73, language: 75, speech: 70, vocab: 65, risk: 'Moderate', mmse: 24 },
  { date: 'Jun 2026', cognitive: 72, memory: 72, attention: 70, language: 73, speech: 68, vocab: 62, risk: 'Moderate', mmse: 23 },
  { date: 'Jul 2026', cognitive: 70, memory: 70, attention: 68, language: 72, speech: 66, vocab: 60, risk: 'Moderate', mmse: 23 },
];

const MONTHS = DEMO_HISTORY.map(h => h.date);
const CHART_DEFAULTS = {
  responsive: true,
  plugins: {
    legend: { labels: { color: '#94a3b8', font: { size: 12 } } },
    tooltip: { backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1, titleColor: '#f1f5f9', bodyColor: '#94a3b8' },
  },
  scales: {
    x: { grid: { color: 'rgba(51,65,85,0.4)' }, ticks: { color: '#64748b' } },
    y: { grid: { color: 'rgba(51,65,85,0.4)' }, ticks: { color: '#64748b' } },
  },
};

function StatCard({ label, value, unit = '', sub, color = '#06b6d4', trend, icon: Icon }) {
  return (
    <div className="glass-card" style={{ padding: '22px', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 80, height: 80,
        background: `${color}10`,
        borderRadius: '50%',
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
          {label}
        </div>
        {Icon && <Icon size={16} color={color} />}
      </div>
      <div style={{ fontSize: '2.2rem', fontWeight: 900, color, lineHeight: 1 }}>
        {value}<span style={{ fontSize: '1rem', color: '#64748b' }}>{unit}</span>
      </div>
      {sub && <div style={{ fontSize: '12px', color: '#475569', marginTop: '6px' }}>{sub}</div>}
      {trend !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', fontSize: '12px' }}>
          {trend < 0 ? <TrendingDown size={13} color="#ef4444" /> : trend > 0 ? <TrendingUp size={13} color="#22c55e" /> : <Minus size={13} color="#64748b" />}
          <span style={{ color: trend < 0 ? '#ef4444' : trend > 0 ? '#22c55e' : '#64748b' }}>
            {trend < 0 ? `${Math.abs(trend)} pts vs last month` : trend > 0 ? `+${trend} pts vs last month` : 'No change'}
          </span>
        </div>
      )}
    </div>
  );
}

function RiskPill({ risk }) {
  const cfg = {
    Low: { bg: 'rgba(34,197,94,0.15)', color: '#4ade80', border: 'rgba(34,197,94,0.3)' },
    Moderate: { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
    High: { bg: 'rgba(239,68,68,0.15)', color: '#f87171', border: 'rgba(239,68,68,0.3)' },
  }[risk] || {};
  return (
    <span style={{
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      borderRadius: '20px', padding: '2px 10px', fontSize: '12px', fontWeight: 700,
    }}>{risk}</span>
  );
}

export default function CognitiveDashboard({ patient, latestResults, cognitiveScores, onNewScreening, onCaregiver }) {
  const [dbHistory, setDbHistory] = useState(null);

  useEffect(() => {
    if (patient?.id) {
      getPatientHistory(patient.id)
        .then(data => {
          if (data && data.history && data.history.length > 0) {
            const formatted = data.history.map(item => ({
              date: item.date || 'Session',
              cognitive: item.cognitive?.total || 70,
              memory: item.cognitive?.memory || 70,
              attention: item.cognitive?.attention || 70,
              language: item.cognitive?.language || 70,
              speech: item.voice?.wpm ? Math.min(100, Math.round((item.voice.wpm / 150) * 100)) : 70,
              vocab: item.voice?.vocab_richness ? Math.round(item.voice.vocab_richness * 100) : 65,
              risk: item.risk || 'Low',
              mmse: item.cognitive?.mmse || 26,
            }));
            setDbHistory(formatted);
          }
        })
        .catch(() => {});
    }
  }, [patient?.id]);

  // Merge latest results into history
  const baseHistory = dbHistory && dbHistory.length > 0 ? dbHistory : DEMO_HISTORY;
  const history = latestResults && !dbHistory
    ? [...baseHistory, {
        date: 'Aug 2026',
        cognitive: Math.round((
          (cognitiveScores?.memoryScore || 68) +
          (cognitiveScores?.attentionScore || 65) +
          (cognitiveScores?.languageScore || 70) +
          (cognitiveScores?.orientationScore || 72)
        ) / 4),
        memory: cognitiveScores?.memoryScore || 68,
        attention: cognitiveScores?.attentionScore || 65,
        language: cognitiveScores?.languageScore || 70,
        speech: 65,
        vocab: 58,
        risk: latestResults.risk_level || 'Moderate',
        mmse: Math.round(latestResults?.probabilities?.low ? 26 : 22),
      }]
    : baseHistory;

  const latest = history[history.length - 1] || DEMO_HISTORY[DEMO_HISTORY.length - 1];
  const prev = history.length > 1 ? history[history.length - 2] : latest;
  const labels = history.map(h => h.date);

  const cogTrend = latest.cognitive - prev.cognitive;

  // ── Charts ────────────────────────────────────────────────────────────────

  const trajectoryData = {
    labels,
    datasets: [{
      label: 'Overall Cognitive Score',
      data: history.map(h => h.cognitive),
      borderColor: '#06b6d4',
      backgroundColor: 'rgba(6,182,212,0.08)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#06b6d4',
      pointBorderColor: '#0f172a',
      pointBorderWidth: 2,
      pointRadius: 5,
    }],
  };

  const domainData = {
    labels,
    datasets: [
      { label: 'Memory', data: history.map(h => h.memory), borderColor: '#06b6d4', backgroundColor: 'transparent', tension: 0.4 },
      { label: 'Attention', data: history.map(h => h.attention), borderColor: '#8b5cf6', backgroundColor: 'transparent', tension: 0.4 },
      { label: 'Language', data: history.map(h => h.language), borderColor: '#f59e0b', backgroundColor: 'transparent', tension: 0.4 },
      { label: 'Vocab', data: history.map(h => h.vocab), borderColor: '#14b8a6', backgroundColor: 'transparent', tension: 0.4 },
    ],
  };

  const radarData = {
    labels: ['Memory', 'Attention', 'Language', 'Orientation', 'Speech', 'Vocabulary'],
    datasets: [{
      label: 'Current Session',
      data: [
        cognitiveScores?.memoryScore || latest.memory,
        cognitiveScores?.attentionScore || latest.attention,
        cognitiveScores?.languageScore || latest.language,
        cognitiveScores?.orientationScore || 72,
        latest.speech,
        latest.vocab,
      ],
      borderColor: '#06b6d4',
      backgroundColor: 'rgba(6,182,212,0.15)',
      pointBackgroundColor: '#06b6d4',
    }, {
      label: '6 Months Ago',
      data: [DEMO_HISTORY[0].memory, DEMO_HISTORY[0].attention, DEMO_HISTORY[0].language, 90, DEMO_HISTORY[0].speech, DEMO_HISTORY[0].vocab],
      borderColor: '#334155',
      backgroundColor: 'rgba(51,65,85,0.1)',
      pointBackgroundColor: '#334155',
    }],
  };

  const radarOptions = {
    responsive: true,
    plugins: {
      legend: { labels: { color: '#94a3b8', font: { size: 12 } } },
    },
    scales: {
      r: {
        angleLines: { color: 'rgba(51,65,85,0.5)' },
        grid: { color: 'rgba(51,65,85,0.5)' },
        pointLabels: { color: '#94a3b8', font: { size: 12 } },
        ticks: { color: '#475569', backdropColor: 'transparent', stepSize: 25 },
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '36px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)',
            borderRadius: '20px', padding: '5px 14px', marginBottom: '12px',
            fontSize: '13px', color: '#06b6d4',
          }}>
            <Activity size={13} />
            Cognitive Dashboard
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '8px', color: '#f1f5f9' }}>
            {patient?.name ? `${patient.name}'s Dashboard` : 'Cognitive Dashboard'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>6-month longitudinal tracking with demo historical data</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={onCaregiver} className="btn-secondary" style={{ padding: '10px 18px', fontSize: '14px' }}>
            <Users size={15} /> Caregiver Portal
          </button>
          <button onClick={onNewScreening} className="btn-primary" style={{ padding: '10px 18px', fontSize: '14px' }}>
            <Plus size={15} /> New Screening
          </button>
        </div>
      </div>

      {/* ── Stat Cards ───────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <StatCard label="Cognitive Score" value={latest.cognitive} unit="%" trend={cogTrend} color="#06b6d4" icon={Brain} />
        <StatCard label="Memory" value={cognitiveScores?.memoryScore || latest.memory} unit="%" color="#06b6d4" icon={Brain} />
        <StatCard label="Attention" value={cognitiveScores?.attentionScore || latest.attention} unit="%" color="#8b5cf6" icon={Activity} />
        <StatCard label="Language" value={cognitiveScores?.languageScore || latest.language} unit="%" color="#f59e0b" icon={Activity} />
        <StatCard label="Current Risk" value={latest.risk} color={latest.risk === 'Low' ? '#22c55e' : latest.risk === 'High' ? '#ef4444' : '#f59e0b'} icon={Activity} />
        <StatCard label="Screenings" value={history.length} unit="" sub="Total sessions" color="#14b8a6" icon={TrendingUp} />
      </div>

      {/* ── 6-month Trajectory ───────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '28px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '20px' }}>
          6-Month Cognitive Trajectory
        </h2>
        <Line data={trajectoryData} options={{
          ...CHART_DEFAULTS,
          plugins: { ...CHART_DEFAULTS.plugins, legend: { display: false } },
          scales: { ...CHART_DEFAULTS.scales, y: { ...CHART_DEFAULTS.scales.y, min: 40, max: 100 } },
        }} />
      </div>

      {/* ── Domain trends + Radar ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '20px', marginBottom: '24px' }}>
        <div className="glass-card" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '20px' }}>
            Domain-Level Trends
          </h2>
          <Line data={domainData} options={{
            ...CHART_DEFAULTS,
            scales: { ...CHART_DEFAULTS.scales, y: { ...CHART_DEFAULTS.scales.y, min: 40, max: 100 } },
          }} />
        </div>
        <div className="glass-card" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '20px' }}>
            Cognitive Profile
          </h2>
          <Radar data={radarData} options={radarOptions} />
        </div>
      </div>

      {/* ── Previous Assessments Table ──────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '28px' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '20px' }}>
          Assessment History
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Date', 'Cognitive', 'Memory', 'Attention', 'Language', 'Vocab', 'Risk'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #334155' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...history].reverse().map((row, i) => (
                <tr key={row.date} style={{ borderBottom: '1px solid rgba(51,65,85,0.4)' }}>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: '#f1f5f9', fontWeight: i === 0 ? 700 : 400 }}>
                    {row.date} {i === 0 && <span style={{ fontSize: '10px', background: 'rgba(6,182,212,0.15)', color: '#06b6d4', borderRadius: '4px', padding: '1px 6px', marginLeft: '6px' }}>Latest</span>}
                  </td>
                  {['cognitive', 'memory', 'attention', 'language', 'vocab'].map(k => (
                    <td key={k} style={{ padding: '12px 14px', fontSize: '13px', color: '#94a3b8' }}>{row[k]}%</td>
                  ))}
                  <td style={{ padding: '12px 14px' }}>
                    <RiskPill risk={row.risk} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
