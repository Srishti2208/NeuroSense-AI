import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend
} from 'chart.js';
import { Users, Bell, CheckCircle2, Clock, AlertTriangle, ChevronLeft, FileText, Activity } from 'lucide-react';
import { getPatientHistory } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const DEMO_ASSESSMENTS = [
  { date: 'Aug 2026', score: 68, risk: 'Moderate', mmse: 22 },
  { date: 'Jul 2026', score: 70, risk: 'Moderate', mmse: 23 },
  { date: 'Jun 2026', score: 72, risk: 'Moderate', mmse: 23 },
  { date: 'May 2026', score: 74, risk: 'Moderate', mmse: 24 },
  { date: 'Apr 2026', score: 78, risk: 'Low', mmse: 26 },
  { date: 'Mar 2026', score: 81, risk: 'Low', mmse: 26 },
];

const REMINDERS = [
  { text: 'Next screening due', date: 'Sep 15, 2026', icon: Clock, color: '#06b6d4', status: 'upcoming' },
  { text: 'Neurologist appointment', date: 'Sep 20, 2026', icon: Activity, color: '#14b8a6', status: 'upcoming' },
  { text: 'Medication review', date: 'Oct 1, 2026', icon: Bell, color: '#f59e0b', status: 'upcoming' },
  { text: 'June screening completed', date: 'Jun 15, 2026', icon: CheckCircle2, color: '#22c55e', status: 'done' },
];

function RiskBadge({ risk, large = false }) {
  const cfg = {
    Low: { bg: 'rgba(34,197,94,0.15)', color: '#4ade80', border: 'rgba(34,197,94,0.3)' },
    Moderate: { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
    High: { bg: 'rgba(239,68,68,0.15)', color: '#f87171', border: 'rgba(239,68,68,0.3)' },
  }[risk] || {};

  return (
    <span style={{
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      borderRadius: '20px', padding: large ? '6px 16px' : '3px 10px',
      fontSize: large ? '16px' : '12px', fontWeight: 700,
    }}>{risk}</span>
  );
}

export default function CaregiverPortal({ patient, latestResults, cognitiveScores, onBack }) {
  const [dbAssessments, setDbAssessments] = useState(null);

  useEffect(() => {
    if (patient?.id) {
      getPatientHistory(patient.id)
        .then(data => {
          if (data && data.history && data.history.length > 0) {
            const formatted = data.history.map(item => ({
              date: item.date || 'Recent',
              score: item.cognitive?.total || 70,
              risk: item.risk || 'Low',
              mmse: item.cognitive?.mmse || 26,
            }));
            setDbAssessments(formatted);
          }
        })
        .catch(() => {});
    }
  }, [patient?.id]);

  const patientName = patient?.name || 'Patient';
  const assessments = dbAssessments && dbAssessments.length > 0 ? dbAssessments : DEMO_ASSESSMENTS;
  const currentRisk = latestResults?.risk_level || (assessments[0]?.risk) || 'Moderate';
  const currentScore = cognitiveScores
    ? Math.round((cognitiveScores.memoryScore + cognitiveScores.attentionScore + cognitiveScores.languageScore + cognitiveScores.orientationScore) / 4)
    : (assessments[0]?.score || 68);

  const barData = {
    labels: assessments.map(a => a.date).reverse(),
    datasets: [{
      label: 'Cognitive Score',
      data: assessments.map(a => a.score).reverse(),
      backgroundColor: assessments.map(a =>
        a.risk === 'Low' ? 'rgba(34,197,94,0.7)' :
        a.risk === 'Moderate' ? 'rgba(245,158,11,0.7)' : 'rgba(239,68,68,0.7)'
      ).reverse(),
      borderColor: assessments.map(a =>
        a.risk === 'Low' ? '#22c55e' : a.risk === 'Moderate' ? '#f59e0b' : '#ef4444'
      ).reverse(),
      borderWidth: 1.5,
      borderRadius: 6,
    }],
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.25)',
            borderRadius: '20px', padding: '5px 14px', marginBottom: '12px',
            fontSize: '13px', color: '#14b8a6',
          }}>
            <Users size={13} /> Caregiver Portal
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '8px', color: '#f1f5f9' }}>
            Patient Overview
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Monitoring status and latest screening results for {patientName}</p>
        </div>
        <button onClick={onBack} className="btn-secondary" style={{ padding: '10px 18px', fontSize: '14px' }}>
          <ChevronLeft size={15} /> Back to Dashboard
        </button>
      </div>

      {/* ── Patient Status Card ───────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '28px', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(30,41,59,0.9), rgba(20,32,50,0.9))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{
            width: 72, height: 72,
            background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(20,184,166,0.2))',
            border: '2px solid rgba(6,182,212,0.3)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px',
          }}>
            👤
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9', marginBottom: '4px' }}>{patientName}</h2>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '14px', color: '#64748b' }}>
              {patient?.age && <span>Age: <strong style={{ color: '#94a3b8' }}>{patient.age}</strong></span>}
              {patient?.gender && <span>Gender: <strong style={{ color: '#94a3b8' }}>{patient.gender}</strong></span>}
              {patient?.familyHistory !== undefined && (
                <span>Family Hx: <strong style={{ color: patient.familyHistory ? '#f87171' : '#4ade80' }}>{patient.familyHistory ? 'Yes' : 'No'}</strong></span>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.06em' }}>Current Risk</div>
            <RiskBadge risk={currentRisk} large />
          </div>
        </div>
      </div>

      {/* ── Status Grid ──────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Cognitive Score', value: `${currentScore}%`, color: '#06b6d4' },
          { label: 'Memory', value: `${cognitiveScores?.memoryScore || 68}%`, color: '#06b6d4' },
          { label: 'Attention', value: `${cognitiveScores?.attentionScore || 65}%`, color: '#8b5cf6' },
          { label: 'Language', value: `${cognitiveScores?.languageScore || 70}%`, color: '#f59e0b' },
          { label: 'Last Screening', value: 'Aug 2026', color: '#14b8a6' },
          { label: 'Total Sessions', value: '7', color: '#64748b' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-card" style={{ padding: '18px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color, marginBottom: '4px' }}>{value}</div>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Score History Chart ───────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '28px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '20px' }}>
          Cognitive Score Trend
        </h2>
        <Bar
          data={barData}
          options={{
            responsive: true,
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: 1,
                titleColor: '#f1f5f9', bodyColor: '#94a3b8',
              },
            },
            scales: {
              x: { grid: { color: 'rgba(51,65,85,0.4)' }, ticks: { color: '#64748b' } },
              y: { grid: { color: 'rgba(51,65,85,0.4)' }, ticks: { color: '#64748b' }, min: 50, max: 100 },
            },
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* ── Recent Assessments ─────────────────────────────────────────── */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '16px' }}>
            Recent Assessments
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {DEMO_ASSESSMENTS.slice(0, 5).map((a, i) => (
              <div key={a.date} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px',
                background: i === 0 ? 'rgba(6,182,212,0.06)' : 'rgba(15,23,42,0.4)',
                borderRadius: '8px',
                border: `1px solid ${i === 0 ? 'rgba(6,182,212,0.2)' : 'rgba(51,65,85,0.4)'}`,
              }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>{a.date}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>MMSE: {a.mmse}/30</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#06b6d4' }}>{a.score}%</div>
                  <RiskBadge risk={a.risk} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Reminders ──────────────────────────────────────────────────── */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={16} color="#f59e0b" /> Reminders & Appointments
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {REMINDERS.map(({ text, date, icon: Icon, color, status }) => (
              <div key={text} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 14px',
                background: status === 'done' ? 'rgba(15,23,42,0.3)' : 'rgba(15,23,42,0.5)',
                borderRadius: '8px',
                border: `1px solid ${status === 'done' ? 'rgba(51,65,85,0.3)' : `${color}30`}`,
                opacity: status === 'done' ? 0.6 : 1,
              }}>
                <Icon size={18} color={color} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: status === 'done' ? '#64748b' : '#f1f5f9', textDecoration: status === 'done' ? 'line-through' : 'none' }}>
                    {text}
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569' }}>{date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Latest Report ─────────────────────────────────────────────────── */}
      {latestResults && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} color="#06b6d4" /> Latest Screening Summary
          </h2>

          {currentRisk === 'Moderate' || currentRisk === 'High' ? (
            <div style={{
              display: 'flex', gap: '10px',
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: '10px', padding: '14px 16px', marginBottom: '16px',
            }}>
              <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.7 }}>
                <strong style={{ color: '#fbbf24' }}>Attention recommended:</strong>{' '}
                The latest screening indicates {currentRisk} risk. Consider scheduling a professional clinical evaluation.
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex', gap: '10px',
              background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: '10px', padding: '14px 16px', marginBottom: '16px',
            }}>
              <CheckCircle2 size={18} color="#22c55e" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.7 }}>
                <strong style={{ color: '#4ade80' }}>Good news:</strong>{' '}
                The latest screening indicates Low risk. Continue regular monitoring and healthy lifestyle habits.
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(latestResults.recommendations || []).map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', fontSize: '13px', color: '#94a3b8' }}>
                <span style={{ color: '#06b6d4', fontWeight: 700, flexShrink: 0 }}>→</span> {r}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div style={{
        marginTop: '24px',
        background: 'rgba(239,68,68,0.05)',
        border: '1px solid rgba(239,68,68,0.15)',
        borderRadius: '10px',
        padding: '14px 18px',
        fontSize: '12px',
        color: '#64748b',
      }}>
        ⚕️ <strong>Caregiver Disclaimer:</strong> This portal provides a research/demo cognitive screening summary only.
        It does not replace clinical medical diagnosis. Always involve qualified healthcare professionals in care decisions.
      </div>
    </div>
  );
}
