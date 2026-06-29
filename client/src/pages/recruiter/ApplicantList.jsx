import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorAlert from '../../components/ui/ErrorAlert';
import { FiArrowLeft, FiUsers, FiAlertTriangle, FiCheckCircle, FiXCircle, FiEye } from 'react-icons/fi';

const STATUS_CONFIG = {
  applied:      { label: 'Applied',      className: 'status-applied' },
  interviewing: { label: 'Interviewing', className: 'status-interviewing' },
  completed:    { label: 'Completed',    className: 'status-completed' },
  shortlisted:  { label: 'Shortlisted',  className: 'status-shortlisted' },
  rejected:     { label: 'Rejected',     className: 'status-rejected' },
};

function ScoreBar({ score }) {
  const color = score >= 7 ? '#10b981' : score >= 5 ? '#f59e0b' : '#f43f5e';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ flex: 1, height: 6, background: 'var(--border-subtle)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${(score / 10) * 100}%`, height: '100%', background: color, borderRadius: 99 }} />
      </div>
      <span style={{ color, fontWeight: 700, fontSize: 'var(--font-sm)', minWidth: 32 }}>{score}/10</span>
    </div>
  );
}

export default function ApplicantList() {
  const { jobId }   = useParams();
  const navigate    = useNavigate();
  const [job,       setJob]       = useState(null);
  const [apps,      setApps]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/jobs/${jobId}`),
      api.get(`/applications/job/${jobId}`)
    ]).then(([jobRes, appsRes]) => {
      setJob(jobRes.data);
      setApps(appsRes.data);
      setLoading(false);
    }).catch(err => {
      setError(err.response?.data?.error || 'Failed to load applicants.');
      setLoading(false);
    });
  }, [jobId]);

  const completed = apps.filter(a => ['completed', 'shortlisted', 'rejected'].includes(a.status));

  return (
    <div className="page-container">
      <button className="btn btn-secondary btn-sm" onClick={() => navigate('/recruiter/listings')} style={{ marginBottom: '1.5rem' }}>
        <FiArrowLeft size={14} /> Back to Listings
      </button>

      {job && (
        <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
          <div>
            <h1>{job.title}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>{job.role} &bull; {job.location} &bull; {apps.length} applicant{apps.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      )}

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {loading ? (
        <LoadingSpinner size="lg" label="Loading applicants..." center />
      ) : apps.length === 0 ? (
        <div className="empty-state">
          <FiUsers size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3>No applicants yet</h3>
          <p>Share the job opening to attract candidates.</p>
        </div>
      ) : (
        <>
          {completed.length > 0 && (
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: 'var(--font-sm)' }}>
              ✨ Candidates are ranked by AI interview score (highest first)
            </p>
          )}
          <div className="applicants-list">
            {apps.map((app, index) => {
              const score      = app.sessionId?.overallScore;
              const candidate  = app.candidateId;
              const statusConf = STATUS_CONFIG[app.status] || STATUS_CONFIG.applied;
              const hasScore   = score !== null && score !== undefined;

              return (
                <div key={app._id} className="applicant-card glass-card">
                  <div className="applicant-card-header">
                    <div className="applicant-rank">#{index + 1}</div>
                    <div className="applicant-avatar">
                      {candidate?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="applicant-info">
                      <h4 className="applicant-name">{candidate?.name || 'Unknown'}</h4>
                      <span className="applicant-email">{candidate?.email}</span>
                    </div>
                    <span className={`status-pill ${statusConf.className}`}>
                      {statusConf.label}
                    </span>
                  </div>

                  {hasScore && (
                    <div style={{ margin: '1rem 0 0.5rem' }}>
                      <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>AI Interview Score</p>
                      <ScoreBar score={score} />
                    </div>
                  )}

                  {app.tabSwitchCount > 0 && (
                    <div className="anti-cheat-flag">
                      <FiAlertTriangle size={13} style={{ color: 'var(--accent-amber)' }} />
                      <span>Tab switched {app.tabSwitchCount} time{app.tabSwitchCount > 1 ? 's' : ''} during interview</span>
                    </div>
                  )}

                  <div className="applicant-actions">
                    {app.status === 'completed' && (
                      <>
                        <Link to={`/recruiter/applicants/${app._id}`} className="btn btn-secondary btn-sm">
                          <FiEye size={13} /> View Full Transcript
                        </Link>
                      </>
                    )}
                    {app.status === 'shortlisted' && (
                      <Link to={`/recruiter/applicants/${app._id}`} className="btn btn-secondary btn-sm">
                        <FiEye size={13} /> View Details
                      </Link>
                    )}
                    {app.status === 'rejected' && (
                      <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>Rejected</span>
                    )}
                    {!['completed','shortlisted','rejected'].includes(app.status) && (
                      <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-xs)', fontStyle: 'italic' }}>
                        Interview in progress...
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
