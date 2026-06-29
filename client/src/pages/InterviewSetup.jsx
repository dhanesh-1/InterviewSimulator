import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { isTechnicalRole } from '../utils/validation';
import ErrorAlert from '../components/ui/ErrorAlert';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { FiUploadCloud, FiFileText, FiCheckCircle, FiPlay, FiBriefcase, FiAlertCircle } from 'react-icons/fi';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

export default function InterviewSetup() {
  const [resume,      setResume]      = useState(null);
  const [parsedResume, setParsedResume] = useState(null);
  const [uploading,   setUploading]   = useState(false);
  const [role,        setRole]        = useState('');
  const [difficulty,  setDifficulty]  = useState('adaptive');
  const [starting,    setStarting]    = useState(false);
  const [error,       setError]       = useState('');
  const [dragActive,  setDragActive]  = useState(false);
  const [roleError,   setRoleError]   = useState('');

  const fileInputRef  = useRef(null);
  const startingRef   = useRef(false);   // prevent duplicate requests
  const navigate      = useNavigate();

  // ── Role validation: real-time feedback ──────────────────────────────────────
  const handleRoleChange = useCallback((value) => {
    setRole(value);
    if (!value.trim()) {
      setRoleError('');
      return;
    }
    if (!isTechnicalRole(value.trim())) {
      setRoleError('Please enter a valid technical role (e.g., Software Engineer, Data Scientist).');
    } else {
      setRoleError('');
    }
  }, []);

  // ── File handling ─────────────────────────────────────────────────────────────
  const handleFileChange = async (file) => {
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please upload a PDF or DOCX file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('resume', file);

      const res = await api.post('/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResume(res.data);
      setParsedResume(res.data.parsedData);

      // Auto-suggest role from resume
      const suggestedRole = res.data.parsedData?.experience?.[0]?.title || '';
      if (suggestedRole) {
        setRole(suggestedRole);
        handleRoleChange(suggestedRole);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload resume. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFileChange(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragActive(true); };
  const handleDragLeave = () => setDragActive(false);

  const handleResumeReset = () => {
    setResume(null);
    setParsedResume(null);
    setRole('');
    setRoleError('');
  };

  // ── Start interview ───────────────────────────────────────────────────────────
  const handleStartInterview = async () => {
    if (startingRef.current) return;   // prevent duplicate submit

    if (!resume) {
      setError('Please upload your resume to start the interview.');
      return;
    }
    if (!role.trim()) {
      setError('Please enter the role you want to practice for.');
      return;
    }
    if (!isTechnicalRole(role.trim())) {
      setError('Please enter a valid technical role.');
      return;
    }

    setError('');
    setStarting(true);
    startingRef.current = true;

    try {
      const res = await api.post('/interview/start', {
        resumeId: resume?.id,
        role: role.trim(),
        difficulty,
      });

      navigate(`/interview/${res.data.sessionId}`, {
        state: { session: res.data, resumeContext: parsedResume },
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start interview. Please try again.');
      setStarting(false);
      startingRef.current = false;
    }
  };

  const isRoleValid = role.trim() && isTechnicalRole(role.trim());

  return (
    <div className="page-container">
      <div className="setup-container">
        <div className="setup-header">
          <h1>Prepare Your Interview</h1>
          <p>Upload your resume and configure your practice session</p>
        </div>

        <ErrorAlert
          message={error}
          onDismiss={() => setError('')}
          style={{ marginBottom: '1.5rem' }}
        />

        {/* ── Resume Upload ── */}
        <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiFileText size={20} aria-hidden="true" /> Upload Resume
          </h3>

          {!resume ? (
            <div
              className={`upload-zone ${dragActive ? 'dragging' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
              role="button"
              tabIndex={0}
              aria-label="Upload resume. Click or drag and drop a PDF or DOCX file."
              id="upload-zone"
            >
              <div className="upload-zone-content">
                {uploading ? (
                  <>
                    <LoadingSpinner size="lg" label="Parsing resume with AI..." />
                    <h3 style={{ marginTop: '1rem' }}>Parsing your resume with AI...</h3>
                    <p>This may take a few seconds</p>
                  </>
                ) : (
                  <>
                    <div className="upload-icon" aria-hidden="true">
                      <FiUploadCloud size={48} />
                    </div>
                    <h3>Drop your resume here</h3>
                    <p>or click to browse — PDF or DOCX, max 5MB</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc"
                onChange={(e) => handleFileChange(e.target.files[0])}
                style={{ display: 'none' }}
                id="resume-file-input"
                aria-label="Choose resume file"
              />
            </div>
          ) : (
            <>
              <div className="upload-success" role="status" aria-live="polite">
                <FiCheckCircle size={20} aria-hidden="true" />
                <span>{resume.originalName} — parsed successfully!</span>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={handleResumeReset}
                  style={{ marginLeft: 'auto' }}
                  type="button"
                >
                  Change
                </button>
              </div>

              {parsedResume && (
                <div className="resume-preview">
                  {parsedResume.skills?.length > 0 && (
                    <>
                      <h3>Detected Skills</h3>
                      <div className="skills-cloud" role="list" aria-label="Detected skills">
                        {parsedResume.skills.map((skill, i) => (
                          <span key={i} className="skill-tag" role="listitem">{skill}</span>
                        ))}
                      </div>
                    </>
                  )}

                  {parsedResume.experience?.length > 0 && (
                    <>
                      <h3 style={{ marginTop: '0.75rem' }}>Experience</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                        {parsedResume.experience.slice(0, 3).map((exp, i) => (
                          <div
                            key={i}
                            style={{ padding: '0.75rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}
                          >
                            <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>{exp.title}</div>
                            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                              {exp.company}{exp.duration ? ` • ${exp.duration}` : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {parsedResume.summary && (
                    <p style={{ marginTop: '1rem', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {parsedResume.summary}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Interview Settings ── */}
        <div className="glass-card">
          <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiBriefcase size={20} aria-hidden="true" /> Interview Settings
          </h3>

          <div className="setup-form">
            <div className="setup-row">
              {/* Role input */}
              <div className="form-group">
                <label className="form-label" htmlFor="role-input">
                  Target Role <span aria-label="required">*</span>
                </label>
                <input
                  id="role-input"
                  type="text"
                  className={`form-input ${roleError ? 'input-error' : isRoleValid ? 'input-success' : ''}`}
                  placeholder="e.g., Frontend Developer, Data Scientist"
                  value={role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  aria-required="true"
                  aria-invalid={!!roleError}
                  aria-describedby={roleError ? 'role-error' : 'role-hint'}
                />
                {roleError ? (
                  <div id="role-error" className="field-error" role="alert" aria-live="polite">
                    <FiAlertCircle size={13} /> {roleError}
                  </div>
                ) : isRoleValid ? (
                  <div className="field-success" aria-live="polite">
                    <FiCheckCircle size={13} /> Valid technical role
                  </div>
                ) : (
                  <div id="role-hint" className="field-hint">
                    Software, data, cloud, security, DevOps roles supported
                  </div>
                )}
              </div>

              {/* Difficulty */}
              <div className="form-group">
                <label className="form-label" htmlFor="difficulty-select">Difficulty</label>
                <select
                  id="difficulty-select"
                  className="form-select"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option value="adaptive">Adaptive (AI adjusts)</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <button
              className="btn btn-primary btn-lg"
              onClick={handleStartInterview}
              disabled={starting || !isRoleValid || !resume}
              id="start-interview-btn"
              style={{ width: '100%' }}
              aria-busy={starting}
              type="button"
            >
              {starting ? (
                <>
                  <LoadingSpinner size="sm" />
                  Generating questions...
                </>
              ) : (
                <>
                  <FiPlay size={20} aria-hidden="true" /> Start Interview
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
