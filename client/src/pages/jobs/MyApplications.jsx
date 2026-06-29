import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorAlert from '../../components/ui/ErrorAlert';
import { FiBriefcase, FiClock, FiCheckCircle, FiXCircle, FiActivity } from 'react-icons/fi';

const STATUS_CONFIG = {
  applied:      { label: 'Applied',      color: 'var(--accent-blue)',    icon: <FiClock size={13} /> },
  interviewing: { label: 'Interviewing', color: 'var(--accent-amber)',   icon: <FiActivity size={13} /> },
  completed:    { label: 'Completed',    color: 'var(--text-secondary)', icon: <FiCheckCircle size={13} /> },
  shortlisted:  { label: 'Shortlisted', color: 'var(--accent-emerald)', icon: <FiCheckCircle size={13} /> },
  rejected:     { label: 'Rejected',     color: 'var(--accent-rose)',    icon: <FiXCircle size={13} /> }
};

function timeAgo(date) {
  if (!date) return '—';
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return `${Math.floor(days / 7)} weeks ago`;
}

export default function MyApplications() {
  const [apps,    setApps]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    api.get('/applications/mine')
      .then(res => { setApps(res.data); setLoading(false); })
      .catch(err => { setError(err.response?.data?.error || 'Failed to load applications.'); setLoading(false); });
  }, []);

  return (
    <div className="page-container">
      <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1>My Applications</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track your job applications and interview statuses</p>
        </div>
        <Link to="/jobs" className="btn btn-primary btn-sm">
          <FiBriefcase size={14} /> Browse More Jobs
        </Link>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {loading ? (
        <LoadingSpinner size="lg" label="Loading applications..." center />
      ) : apps.length === 0 ? (
        <div className="empty-state">
          <FiBriefcase size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3>No applications yet</h3>
          <p>Browse open jobs and apply — the AI interview starts instantly!</p>
          <Link to="/jobs" className="btn btn-primary" style={{ marginTop: '1rem' }}>Browse Jobs</Link>
        </div>
      ) : (
        <div className="my-apps-list">
          {apps.map(app => {
            const status   = STATUS_CONFIG[app.status] || STATUS_CONFIG.applied;
            const job      = app.jobId;
            const session  = app.sessionId;
            const score    = session?.overallScore;
            const isActive = app.status === 'interviewing';

            return (
              <div key={app._id} className="my-app-card glass-card">
                <div className="my-app-card-header">
                  <div className="my-app-company-icon">
                    {job?.company?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="my-app-info">
                    <h3 className="my-app-title">{job?.title || 'Unknown Job'}</h3>
                    <span className="my-app-company">{job?.company} &mdash; {job?.role}</span>
                  </div>
                  <span className="my-app-status-badge" style={{ color: status.color, borderColor: status.color }}>
                    {status.icon} {status.label}
                  </span>
                </div>

                <div className="my-app-meta">
                  <span><FiClock size={12} /> Applied {timeAgo(app.appliedAt)}</span>
                  {score !== undefined && score !== null && (
                    <span style={{ color: score >= 7 ? 'var(--accent-emerald)' : score >= 5 ? 'var(--accent-amber)' : 'var(--accent-rose)', fontWeight: 600 }}>
                      Score: {score}/10
                    </span>
                  )}
                </div>

                {app.status === 'shortlisted' && (
                  <div className="my-app-banner success">
                    Congratulations! You have been shortlisted by the recruiter.
                  </div>
                )}
                {app.status === 'rejected' && (
                  <div className="my-app-banner error">
                    Thank you for applying. The recruiter has decided to move forward with other candidates.
                  </div>
                )}

                <div className="my-app-actions">
                  {isActive && app.sessionId && (
                    <Link to={`/interview/${app.sessionId._id || app.sessionId}`} className="btn btn-primary btn-sm">
                      Continue Interview →
                    </Link>
                  )}
                  {app.status === 'completed' && app.sessionId && (
                    <Link to={`/session/${app.sessionId._id || app.sessionId}`} className="btn btn-secondary btn-sm">
                      View Results
                    </Link>
                  )}
                  {app.status === 'shortlisted' && app.sessionId && (
                    <Link to={`/session/${app.sessionId._id || app.sessionId}`} className="btn btn-secondary btn-sm">
                      View Results
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
