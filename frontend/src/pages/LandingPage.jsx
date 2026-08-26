import { Brain, Mic, BarChart3, TrendingUp, Shield, ChevronRight, Activity, Eye } from 'lucide-react';

const FEATURES = [
  {
    icon: Brain,
    color: '#06b6d4',
    glow: 'rgba(6,182,212,0.2)',
    title: 'Cognitive Assessment',
    desc: 'Structured memory, attention, language, and orientation tasks modeled after clinical screening instruments.',
  },
  {
    icon: Mic,
    color: '#14b8a6',
    glow: 'rgba(20,184,166,0.2)',
    title: 'Voice Biomarkers',
    desc: 'Real-time acoustic and linguistic analysis: pause patterns, vocabulary richness, speaking rate, and more.',
  },
  {
    icon: Eye,
    color: '#8b5cf6',
    glow: 'rgba(139,92,246,0.2)',
    title: 'Explainable AI',
    desc: 'SHAP-powered feature attributions show exactly which biomarkers influenced each risk estimate.',
  },
  {
    icon: TrendingUp,
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.2)',
    title: 'Progress Monitoring',
    desc: 'Longitudinal cognitive trajectory charts for six-month trend analysis and caregiver reporting.',
  },
];

const STATS = [
  { value: '6', label: 'Biomarker Types' },
  { value: 'XGB', label: 'ML Engine' },
  { value: 'SHAP', label: 'Explainability' },
  { value: '3', label: 'Risk Levels' },
];

export default function LandingPage({ onStart, onDashboard }) {
  return (
    <div style={{ minHeight: '100vh', overflow: 'hidden' }}>
      {/* ── Hero Section ───────────────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        minHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px',
        textAlign: 'center',
        overflow: 'hidden',
      }}>
        {/* Background gradient orbs */}
        <div style={{
          position: 'absolute', top: '10%', left: '15%',
          width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '10%',
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }} />

        {/* Brain icon */}
        <div className="animate-float" style={{
          width: 100, height: 100,
          background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(20,184,166,0.15))',
          border: '2px solid rgba(6,182,212,0.3)',
          borderRadius: '24px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '32px',
          boxShadow: '0 0 40px rgba(6,182,212,0.2)',
        }}>
          <span style={{ fontSize: '48px' }}>🧠</span>
        </div>

        {/* Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(6,182,212,0.1)',
          border: '1px solid rgba(6,182,212,0.3)',
          borderRadius: '20px',
          padding: '6px 16px',
          marginBottom: '24px',
          fontSize: '13px',
          color: '#06b6d4',
        }}>
          <Activity size={14} />
          AI-Powered Cognitive Health Screening
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 'clamp(3rem, 8vw, 5.5rem)',
          fontWeight: 900,
          lineHeight: 1.1,
          marginBottom: '16px',
          letterSpacing: '-0.03em',
        }}>
          <span className="gradient-text">NeuroSense</span>
          <span style={{ color: '#f1f5f9' }}> AI</span>
        </h1>

        <p style={{
          fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
          color: '#94a3b8',
          maxWidth: '600px',
          lineHeight: 1.7,
          marginBottom: '16px',
        }}>
          AI-Assisted Cognitive Screening & Monitoring Platform
        </p>

        <p style={{
          fontSize: '14px',
          color: '#64748b',
          maxWidth: '500px',
          lineHeight: 1.6,
          marginBottom: '48px',
          fontStyle: 'italic',
        }}>
          Combining cognitive assessments, speech biomarkers, machine learning,
          and explainable AI for research-grade cognitive health screening.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '80px' }}>
          <button
            onClick={onStart}
            className="btn-primary"
            style={{ padding: '16px 36px', fontSize: '1.05rem', borderRadius: '12px' }}
          >
            <Brain size={20} />
            Start Screening
            <ChevronRight size={18} />
          </button>
          <button
            onClick={onDashboard}
            className="btn-secondary"
            style={{ padding: '16px 36px', fontSize: '1.05rem', borderRadius: '12px' }}
          >
            <BarChart3 size={20} />
            Explore Dashboard
          </button>
        </div>

        {/* Stats strip */}
        <div style={{
          display: 'flex',
          gap: '40px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {STATS.map(({ value, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#06b6d4', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature Cards ──────────────────────────────────────────────── */}
      <section style={{
        padding: '80px 24px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '16px', color: '#f1f5f9' }}>
            Platform Capabilities
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', maxWidth: '560px', margin: '0 auto', lineHeight: 1.7 }}>
            A multi-modal screening pipeline combining structured cognitive tasks with AI-driven speech analysis.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '24px',
        }}>
          {FEATURES.map(({ icon: Icon, color, glow, title, desc }) => (
            <div
              key={title}
              className="glass-card"
              style={{
                padding: '32px',
                transition: 'all 0.3s ease',
                cursor: 'default',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = `0 0 30px ${glow}`;
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = `${color}40`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(51,65,85,0.6)';
              }}
            >
              <div style={{
                width: 56, height: 56,
                background: `${color}18`,
                border: `1px solid ${color}40`,
                borderRadius: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '20px',
              }}>
                <Icon size={26} color={color} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '10px', color: '#f1f5f9' }}>
                {title}
              </h3>
              <p style={{ color: '#94a3b8', lineHeight: 1.7, fontSize: '0.9rem' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Workflow Steps ──────────────────────────────────────────────── */}
      <section style={{
        padding: '60px 24px 100px',
        maxWidth: '900px',
        margin: '0 auto',
      }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: '48px', color: '#f1f5f9' }}>
          How It Works
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {[
            { n: '01', label: 'Create Patient Profile', desc: 'Enter age, medical history, and background information.' },
            { n: '02', label: 'Record Voice Sample', desc: 'Describe a memory aloud for 30–60 seconds. AI extracts acoustic and linguistic biomarkers.' },
            { n: '03', label: 'Complete Cognitive Tasks', desc: 'Memory recall, attention sequences, orientation, and language tasks scored automatically.' },
            { n: '04', label: 'AI Risk Prediction', desc: 'XGBoost classifier estimates Low / Moderate / High risk from all biomarkers.' },
            { n: '05', label: 'View Explainable Results', desc: 'SHAP chart shows which features drove the prediction with plain-language explanations.' },
            { n: '06', label: 'Track & Report', desc: 'Longitudinal dashboard, caregiver portal, and downloadable PDF report.' },
          ].map(({ n, label, desc }, i) => (
            <div key={n} style={{ display: 'flex', gap: '24px', position: 'relative', paddingBottom: i < 5 ? '0' : '0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: 52, height: 52, minWidth: 52,
                  background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(20,184,166,0.1))',
                  border: '2px solid rgba(6,182,212,0.4)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '13px', color: '#06b6d4',
                }}>
                  {n}
                </div>
                {i < 5 && (
                  <div style={{ width: '2px', height: '48px', background: 'rgba(6,182,212,0.2)', marginTop: '8px', marginBottom: '8px' }} />
                )}
              </div>
              <div style={{ paddingTop: '12px', paddingBottom: i < 5 ? '0' : '0' }}>
                <h3 style={{ fontWeight: 700, marginBottom: '6px', color: '#f1f5f9', fontSize: '1rem' }}>{label}</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Disclaimer Footer ───────────────────────────────────────────── */}
      <footer style={{
        background: 'rgba(239,68,68,0.05)',
        borderTop: '1px solid rgba(239,68,68,0.2)',
        padding: '24px',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'flex-start',
          gap: '10px',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '12px',
          padding: '16px 24px',
          maxWidth: '700px',
          textAlign: 'left',
        }}>
          <Shield size={20} color="#f87171" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 700, color: '#f87171', marginBottom: '4px', fontSize: '14px' }}>
              Important Disclaimer
            </div>
            <div style={{ color: '#94a3b8', fontSize: '13px', lineHeight: 1.6 }}>
              NeuroSense AI is an AI-assisted cognitive screening tool for <strong>research and demonstration purposes only</strong>.
              It is <strong>NOT a medical diagnosis system</strong> and must not be used to diagnose, treat, or manage any medical condition.
              Always consult a qualified healthcare professional for clinical evaluation.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
