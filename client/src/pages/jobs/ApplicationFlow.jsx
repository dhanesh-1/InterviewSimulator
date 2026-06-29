import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorAlert from '../../components/ui/ErrorAlert';
import { FiUploadCloud, FiFileText, FiCheckCircle, FiX, FiArrowLeft, FiPlay, FiAlertTriangle } from 'react-icons/fi';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

export default function ApplicationFlow({ job, onCancel }) {
  const navigate   = useNavigate();
  const [step,     setStep]     = useState(1); // 1=upload, 2=confirm, 3=starting
  const [file,     setFile]     = useState(null);
  const [error,    setError]    = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const submittingRef = useRef(false);

  // ── File selection ───────────────────────────────────────────────────────────
  const handleFile = useCallback((f) => {
    if (!f) return;
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError('Please upload a PDF or DOCX file only.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('File must be smaller than 5MB.');
      return;
    }
    setError('');
    setFile(f);
    setStep(2);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files?.[0]);
  }, [handleFile]);

  // ── Submit: upload resume + apply in one API call ────────────────────────────
  const handleApply = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setStep(3);
    setError('');

    try {
      const form = new FormData();
      form.append('resume', file);
      form.append('jobId', job._id);

      const res = await api.post('/applications', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Navigate to interview session
      navigate(`/interview/${res.data.sessionId}`, {
        state: {
          session: {
            sessionId:  res.data.sessionId,
            role:       res.data.role,
            difficulty: res.data.difficulty,
            questions:  res.data.questions,
          },
          applicationId: res.data.applicationId
        }
      });
    } catch (err) {
      submittingRef.current = false;
      setStep(2);
      const msg = err.response?.data?.error || 'Failed to submit application. Please try again.';
      // If already applied, redirect to existing session
      if (err.response?.data?.sessionId) {
        navigate(`/interview/${err.response.data.sessionId}`);
        return;
      }
      setError(msg);
    }
  };

  return (
    <div className="page-container">
      {/* Progress steps */}
      <div className="apply-steps">
        {['Upload Resume', 'Confirm', 'Starting Interview'].map((label, i) => (
          <div key={label} className={`apply-step ${step > i + 1 ? 'done' : ''} ${step === i + 1 ? 'active' : ''}`}>
            <div className="apply-step-dot">
              {step > i + 1 ? <FiCheckCircle size={14} /> : i + 1}
            </div>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="apply-card glass-card">
        {/* ── Step 1: Upload Resume ──────────────────────────────────────────── */}
        {step === 1 && (
          <>
            <h2 className="apply-card-title">Upload Your Resume</h2>
            <p className="apply-card-sub">For the role: <strong>{job.title}</strong> at <strong>{job.company}</strong></p>

            <ErrorAlert message={error} onDismiss={() => setError('')} style={{ marginBottom: '1.25rem' }} />

            <div
              className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Drop resume here or click to upload"
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                style={{ display: 'none' }}
                onChange={(e) => handleFile(e.target.files?.[0])}
                id="resume-upload-input"
              />
              <FiUploadCloud size={36} className="upload-icon" />
              <p className="upload-label">Drag & drop your resume here</p>
              <p className="upload-sub">or click to browse &mdash; PDF or DOCX, max 5MB</p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={onCancel} type="button">
                <FiArrowLeft size={14} /> Cancel
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: Confirm ───────────────────────────────────────────────── */}
        {step === 2 && (
          <>
            <h2 className="apply-card-title">Ready to Apply?</h2>
            <p className="apply-card-sub">Review your details before the interview begins.</p>

            <ErrorAlert message={error} onDismiss={() => setError('')} style={{ marginBottom: '1.25rem' }} />

            <div className="apply-confirm-grid">
              <div className="apply-confirm-item">
                <span className="apply-confirm-label">Job</span>
                <span className="apply-confirm-value">{job.title}</span>
              </div>
              <div className="apply-confirm-item">
                <span className="apply-confirm-label">Company</span>
                <span className="apply-confirm-value">{job.company}</span>
              </div>
              <div className="apply-confirm-item">
                <span className="apply-confirm-label">Role</span>
                <span className="apply-confirm-value">{job.role}</span>
              </div>
              <div className="apply-confirm-item">
                <span className="apply-confirm-label">Difficulty</span>
                <span className="apply-confirm-value" style={{ textTransform: 'capitalize' }}>{job.difficulty}</span>
              </div>
              <div className="apply-confirm-item">
                <span className="apply-confirm-label">Resume</span>
                <span className="apply-confirm-value">
                  <FiFileText size={13} style={{ marginRight: '0.35rem' }} />
                  {file?.name}
                </span>
              </div>
            </div>

            <div className="apply-warning">
              <FiAlertTriangle size={14} style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />
              The AI interview will start <strong>immediately</strong> after you click Apply. Ensure you are in a quiet environment.
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => { setStep(1); setFile(null); }} type="button">
                <FiX size={14} /> Change Resume
              </button>
              <button className="btn btn-primary" onClick={handleApply} id="confirm-apply-btn" style={{ flex: 1, justifyContent: 'center' }} type="button">
                <FiPlay size={14} /> Confirm & Start Interview
              </button>
            </div>
          </>
        )}

        {/* ── Step 3: Starting ─────────────────────────────────────────────── */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <LoadingSpinner size="lg" center />
            <h2 style={{ marginTop: '1.5rem' }}>Parsing your resume...</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Generating AI questions tailored to this job. Please wait.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
