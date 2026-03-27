import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { FiUploadCloud, FiFileText, FiCheckCircle, FiPlay, FiBriefcase } from 'react-icons/fi';

export default function InterviewSetup() {
  const [resume, setResume] = useState(null);
  const [parsedResume, setParsedResume] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [role, setRole] = useState('');
  const [difficulty, setDifficulty] = useState('adaptive');
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileChange = async (file) => {
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];

    if (!allowedTypes.includes(file.type)) {
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
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setResume(res.data);
      setParsedResume(res.data.parsedData);

      // Auto-suggest role from resume
      if (res.data.parsedData?.experience?.length > 0) {
        setRole(res.data.parsedData.experience[0].title || '');
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
    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleStartInterview = async () => {
    if (!role.trim()) {
      setError('Please enter the role you want to practice for.');
      return;
    }

    setError('');
    setStarting(true);

    try {
      const res = await api.post('/interview/start', {
        resumeId: resume?.id,
        role: role.trim(),
        difficulty
      });

      navigate(`/interview/${res.data.sessionId}`, {
        state: {
          session: res.data,
          resumeContext: parsedResume
        }
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start interview. Please try again.');
      setStarting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="setup-container">
        <div className="setup-header">
          <h1>Prepare Your Interview</h1>
          <p>Upload your resume and configure your practice session</p>
        </div>

        {error && <div className="auth-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

        {/* Resume Upload */}
        <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiFileText size={20} /> Upload Resume
          </h3>

          {!resume ? (
            <div
              className={`upload-zone ${dragActive ? 'dragging' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              id="upload-zone"
            >
              <div className="upload-zone-content">
                {uploading ? (
                  <>
                    <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                    <h3>Parsing your resume with AI...</h3>
                    <p>This may take a few seconds</p>
                  </>
                ) : (
                  <>
                    <div className="upload-icon">
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
              />
            </div>
          ) : (
            <>
              <div className="upload-success">
                <FiCheckCircle size={20} />
                <span>{resume.originalName} — parsed successfully!</span>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => { setResume(null); setParsedResume(null); setRole(''); }}
                  style={{ marginLeft: 'auto' }}
                >
                  Change
                </button>
              </div>

              {parsedResume && (
                <div className="resume-preview">
                  {parsedResume.skills?.length > 0 && (
                    <>
                      <h3>Detected Skills</h3>
                      <div className="skills-cloud">
                        {parsedResume.skills.map((skill, i) => (
                          <span key={i} className="skill-tag">{skill}</span>
                        ))}
                      </div>
                    </>
                  )}

                  {parsedResume.experience?.length > 0 && (
                    <>
                      <h3 style={{ marginTop: '0.75rem' }}>Experience</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                        {parsedResume.experience.slice(0, 3).map((exp, i) => (
                          <div key={i} style={{ padding: '0.75rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                            <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>{exp.title}</div>
                            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                              {exp.company} {exp.duration ? `• ${exp.duration}` : ''}
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

        {/* Interview Settings */}
        <div className="glass-card">
          <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiBriefcase size={20} /> Interview Settings
          </h3>

          <div className="setup-form">
            <div className="setup-row">
              <div className="form-group">
                <label className="form-label" htmlFor="role-input">Target Role *</label>
                <input
                  id="role-input"
                  type="text"
                  className="form-input"
                  placeholder="e.g., Frontend Developer, Data Scientist"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="difficulty-select">Difficulty</label>
                <select
                  id="difficulty-select"
                  className="form-select"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option value="adaptive">🧠 Adaptive (AI adjusts)</option>
                  <option value="easy">🟢 Easy</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="hard">🔴 Hard</option>
                </select>
              </div>
            </div>

            <button
              className="btn btn-primary btn-lg"
              onClick={handleStartInterview}
              disabled={starting || !role.trim()}
              id="start-interview-btn"
              style={{ width: '100%' }}
            >
              {starting ? (
                <>
                  <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></div>
                  Generating questions...
                </>
              ) : (
                <>
                  <FiPlay size={20} /> Start Interview
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
