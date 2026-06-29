import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorAlert from '../../components/ui/ErrorAlert';
import {
  FiArrowLeft, FiCheckCircle, FiXCircle, FiAlertTriangle, FiUser,
  FiFileText, FiMessageSquare
} from 'react-icons/fi';

function ScoreCircleSm({ score, label }) {
  const color = score >= 7 ? '#10b981' : score >= 5 ? '#f59e0b' : '#f43f5e';
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color }}>{score}</div>
      <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{label}</div>
    </div>
  );
}

export default function ApplicantDetail() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [app,      setApp]      = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [note,     setNote]     = useState('');
  const [deciding, setDeciding] = useState(false);
  const [decided,  setDecided]  = useState(false);

  useEffect(() => {
    api.get(`/applications/${applicationId}`)
      .then(res => {
        setApp(res.data);
        setNote(res.data.recruiterNote || '');
        setLoading(false);
      })
      .catch(err => { setError(err.response?.data?.error || 'Failed to load.'); setLoading(false); });
  }, [applicationId]);

  const makeDecision = async (status) => {
    setDeciding(true);
    try {
      await api.patch(`/applications/${applicationId}/status`, { status, recruiterNote: note });
      setApp(prev => ({ ...prev, status, recruiterNote: note }));
      setDecided(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update decision.');
    } finally {
      setDeciding(false);
    }
  };

  if (loading) return <div className="page-container"><LoadingSpinner size="lg" center /></div>;
  if (!app)   return <div className="page-container"><ErrorAlert message={error || 'Not found.'} /></div>;

  const candidate = app.candidateId;
  const session   = app.sessionId;
  const resume    = app.resumeId;
  const job       = app.jobId;
  const isDecided = ['shortlisted', 'rejected'].includes(app.status);

  return (
    <div className="page-container">
      <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: '1.5rem' }}>
        <FiArrowLeft size={14} /> Back
      </button>

      <ErrorAlert message={error} onDismiss={() => setError('')} style={{ marginBottom: '1.5rem' }} />

      <div className="applicant-detail-layout">
        {/* LEFT: Transcript */}
        <div className="applicant-detail-main">
          {/* Candidate header */}
          <div className="glass-card applicant-detail-header-card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
            <div className="applicant-avatar-lg">
              {candidate?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ marginBottom: '0.25rem' }}>{candidate?.name}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>{candidate?.email}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-xs)', marginTop: '0.25rem' }}>
                Applied for: <strong>{job?.title}</strong>
              </p>
            </div>
            {session?.overallScore !== undefined && (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 'var(--font-4xl)',
                  fontWeight: 900,
                  color: session.overallScore >= 7 ? '#10b981' : session.overallScore >= 5 ? '#f59e0b' : '#f43f5e'
                }}>
                  {session.overallScore}
                </div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Overall Score</div>
              </div>
            )}
          </div>

          {/* Anti-cheat flags */}
          {app.tabSwitchCount > 0 && (
            <div className="anti-cheat-banner">
              <FiAlertTriangle size={16} style={{ color: 'var(--accent-amber)' }} />
              <strong>Integrity Notice:</strong> Candidate switched tabs {app.tabSwitchCount} time{app.tabSwitchCount > 1 ? 's' : ''} during the interview.
            </div>
          )}

          {/* Resume summary */}
          {resume?.parsedData && (
            <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiFileText size={16} /> Resume Summary
              </h3>
              {resume.parsedData.skills?.length > 0 && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>SKILLS</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {resume.parsedData.skills.slice(0, 15).map(s => (
                      <span key={s} className="req-chip">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {resume.parsedData.summary && (
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', lineHeight: 1.7 }}>
                  {resume.parsedData.summary}
                </p>
              )}
            </div>
          )}

          {/* Full Q&A Transcript */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiMessageSquare size={16} /> Interview Transcript
            </h3>
            {session?.questions?.map((q, i) => (
              <div key={q._id || i} className="transcript-item">
                <div className="transcript-q-header">
                  <span className="transcript-q-num">Q{i + 1}</span>
                  <span className={`badge badge-${q.type === 'technical' ? 'blue' : q.type === 'behavioral' ? 'purple' : q.type === 'HR' ? 'amber' : 'emerald'}`}>{q.type}</span>
                  <span className="transcript-difficulty">{q.difficulty}</span>
                </div>
                <p className="transcript-question">{q.text}</p>
                {q.userAnswer ? (
                  <>
                    <div className="transcript-answer">
                      <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                        &ldquo;{q.userAnswer}&rdquo;
                      </p>
                      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                        via {q.answeredVia}
                      </span>
                    </div>
                    {q.evaluation && (
                      <div className="transcript-scores">
                        <ScoreCircleSm score={q.evaluation.relevance}  label="Relevance" />
                        <ScoreCircleSm score={q.evaluation.clarity}    label="Clarity" />
                        <ScoreCircleSm score={q.evaluation.confidence} label="Confidence" />
                        <ScoreCircleSm score={q.evaluation.overall}    label="Overall" />
                      </div>
                    )}
                    {q.evaluation?.feedback && (
                      <p className="transcript-feedback">{q.evaluation.feedback}</p>
                    )}
                  </>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 'var(--font-sm)' }}>No answer provided.</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Decision Panel */}
        <aside className="applicant-detail-sidebar">
          <div className="glass-card decision-panel" style={{ padding: '1.5rem', position: 'sticky', top: '80px' }}>
            <h3 style={{ marginBottom: '1.25rem' }}>Recruiter Decision</h3>

            {decided || isDecided ? (
              <div className={`decision-result ${app.status === 'shortlisted' ? 'decision-shortlisted' : 'decision-rejected'}`}>
                {app.status === 'shortlisted'
                  ? <><FiCheckCircle size={18} /> Candidate Shortlisted</>
                  : <><FiXCircle size={18} /> Candidate Rejected</>
                }
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="recruiter-note">
                    <FiUser size={13} style={{ marginRight: '0.3rem' }} /> Notes (private)
                  </label>
                  <textarea
                    id="recruiter-note"
                    className="form-input form-textarea"
                    rows={4}
                    placeholder="Add private notes about this candidate..."
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => makeDecision('shortlisted')}
                    disabled={deciding || app.status !== 'completed'}
                    id="shortlist-btn"
                    type="button"
                    style={{ justifyContent: 'center', background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
                  >
                    <FiCheckCircle size={15} />
                    {deciding ? 'Saving...' : 'Shortlist Candidate'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => makeDecision('rejected')}
                    disabled={deciding || app.status !== 'completed'}
                    id="reject-btn"
                    type="button"
                    style={{ justifyContent: 'center', color: 'var(--accent-rose)', borderColor: 'rgba(244,63,94,0.3)' }}
                  >
                    <FiXCircle size={15} /> Reject Candidate
                  </button>
                </div>

                {app.status !== 'completed' && (
                  <p style={{ marginTop: '0.75rem', fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textAlign: 'center' }}>
                    Decisions can only be made after the interview is completed.
                  </p>
                )}
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
