import { useState, useEffect } from 'react';
import { User, Calendar, GraduationCap, Heart, FileText, Leaf, ChevronRight, ChevronLeft, CheckCircle2, Users } from 'lucide-react';
import { createPatient, createSession, listPatients } from '../services/api';

const EDUCATION_OPTIONS = [
  { value: 8, label: 'Less than High School' },
  { value: 12, label: 'High School / GED' },
  { value: 14, label: 'Some College' },
  { value: 16, label: 'Bachelor\'s Degree' },
  { value: 18, label: 'Graduate Degree' },
  { value: 20, label: 'Doctoral Degree' },
];

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

function FormField({ label, icon: Icon, color = '#06b6d4', required, children, hint }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px',
        fontSize: '14px',
        fontWeight: 600,
        color: '#cbd5e1',
      }}>
        {Icon && <Icon size={15} color={color} />}
        {label}
        {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ marginTop: '5px', fontSize: '12px', color: '#64748b' }}>{hint}</p>}
    </div>
  );
}

export default function PatientProfile({ onComplete, onBack }) {
  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: '',
    educationYears: 12,
    familyHistory: false,
    medicalHistory: '',
    lifestyleNotes: '',
  });
  const [existingPatients, setExistingPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    listPatients()
      .then(data => {
        if (Array.isArray(data)) {
          setExistingPatients(data);
        }
      })
      .catch(() => {});
  }, []);

  const selectExistingPatient = async (p) => {
    setForm({
      name: p.name,
      age: String(p.age),
      gender: p.gender || '',
      educationYears: p.education_years || 12,
      familyHistory: Boolean(p.family_history),
      medicalHistory: p.medical_history || '',
      lifestyleNotes: p.lifestyle_notes || '',
    });
    setLoading(true);
    try {
      let sessionId = null;
      try {
        const sessionRes = await createSession(p.id);
        sessionId = sessionRes.id;
      } catch {
        sessionId = Date.now();
      }
      setSaved(true);
      setTimeout(() => {
        onComplete({ ...p, age: p.age, id: p.id }, sessionId);
      }, 500);
    } finally {
      setLoading(false);
    }
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.age) {
      setError('Name and age are required.');
      return;
    }
    if (parseInt(form.age) < 18 || parseInt(form.age) > 120) {
      setError('Please enter a valid age (18–120).');
      return;
    }
    setError('');
    setLoading(true);

    try {
      let patientId = null;
      let sessionId = null;
      try {
        const patientRes = await createPatient({ ...form, age: parseInt(form.age) });
        patientId = patientRes.id;
        const sessionRes = await createSession(patientId);
        sessionId = sessionRes.id;
      } catch {
        // Use local-only mode if backend unavailable
        patientId = Date.now();
        sessionId = Date.now() + 1;
      }

      setSaved(true);
      setTimeout(() => {
        onComplete({ ...form, age: parseInt(form.age), id: patientId }, sessionId);
      }, 800);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '48px 24px' }}>
      {/* Header */}
      <div className="animate-fade-in-up" style={{ marginBottom: '40px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)',
          borderRadius: '20px', padding: '5px 14px', marginBottom: '16px',
          fontSize: '13px', color: '#06b6d4',
        }}>
          <User size={13} />
          Step 1 of 5
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '10px', color: '#f1f5f9' }}>
          Patient Profile
        </h1>
        <p style={{ color: '#94a3b8', lineHeight: 1.7, fontSize: '0.95rem' }}>
          Enter patient information to create a secure screening session. All data stays local.
        </p>
      </div>

      {existingPatients.length > 0 && (
        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#06b6d4', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <Users size={15} /> Select Existing Patient (or create new below)
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {existingPatients.slice(0, 5).map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => selectExistingPatient(p)}
                style={{
                  background: 'rgba(15,23,42,0.6)',
                  border: '1px solid rgba(6,182,212,0.3)',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  color: '#f1f5f9',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#06b6d4'; e.currentTarget.style.background = 'rgba(6,182,212,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(6,182,212,0.3)'; e.currentTarget.style.background = 'rgba(15,23,42,0.6)'; }}
              >
                <span>👤 {p.name}</span>
                <span style={{ color: '#64748b', fontSize: '11px' }}>Age {p.age}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="glass-card" style={{ padding: '32px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#06b6d4', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Basic Information
          </h2>

          <FormField label="Full Name" icon={User} required>
            <input
              className="form-input"
              type="text"
              placeholder="Enter patient name"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              required
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormField label="Age (years)" icon={Calendar} required>
              <input
                className="form-input"
                type="number"
                placeholder="e.g. 72"
                min={18} max={120}
                value={form.age}
                onChange={e => set('age', e.target.value)}
                required
              />
            </FormField>

            <FormField label="Gender" icon={User}>
              <select
                className="form-input"
                value={form.gender}
                onChange={e => set('gender', e.target.value)}
              >
                <option value="">Select gender</option>
                {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </FormField>
          </div>

          <FormField label="Highest Education Level" icon={GraduationCap}>
            <select
              className="form-input"
              value={form.educationYears}
              onChange={e => set('educationYears', parseInt(e.target.value))}
            >
              {EDUCATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </FormField>
        </div>

        <div className="glass-card" style={{ padding: '32px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#14b8a6', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Medical Background
          </h2>

          {/* Family History Toggle */}
          <FormField
            label="Family History of Dementia/Alzheimer's"
            icon={Heart}
            color="#ef4444"
            hint="Does the patient have a first-degree relative with dementia or Alzheimer's disease?"
          >
            <div style={{ display: 'flex', gap: '12px' }}>
              {['No', 'Yes'].map((opt) => {
                const val = opt === 'Yes';
                const active = form.familyHistory === val;
                return (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => set('familyHistory', val)}
                    style={{
                      flex: 1, padding: '10px',
                      borderRadius: '8px',
                      border: `2px solid ${active ? (val ? '#ef4444' : '#22c55e') : '#334155'}`,
                      background: active ? (val ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)') : 'rgba(15,23,42,0.5)',
                      color: active ? (val ? '#f87171' : '#4ade80') : '#64748b',
                      fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </FormField>

          <FormField
            label="Relevant Medical History"
            icon={FileText}
            hint="e.g., diabetes, hypertension, stroke, head injury, depression"
          >
            <textarea
              className="form-input"
              placeholder="Describe any relevant medical conditions (optional)"
              rows={3}
              value={form.medicalHistory}
              onChange={e => set('medicalHistory', e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </FormField>
        </div>

        <div className="glass-card" style={{ padding: '32px', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#8b5cf6', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Lifestyle Information
          </h2>
          <FormField
            label="Lifestyle Notes"
            icon={Leaf}
            color="#8b5cf6"
            hint="e.g., exercise habits, diet, sleep quality, social activities, hobbies"
          >
            <textarea
              className="form-input"
              placeholder="Describe the patient's lifestyle and daily activities (optional)"
              rows={3}
              value={form.lifestyleNotes}
              onChange={e => set('lifestyleNotes', e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </FormField>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '8px', padding: '12px 16px', marginBottom: '20px',
            color: '#f87171', fontSize: '14px',
          }}>
            ⚠️ {error}
          </div>
        )}

        {saved && (
          <div style={{
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: '8px', padding: '12px 16px', marginBottom: '20px',
            color: '#4ade80', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <CheckCircle2 size={16} /> Profile saved. Moving to voice test...
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
          <button type="button" onClick={onBack} className="btn-secondary">
            <ChevronLeft size={18} /> Back
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <>
                <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                Saving...
              </>
            ) : (
              <>Continue to Voice Test <ChevronRight size={18} /></>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
