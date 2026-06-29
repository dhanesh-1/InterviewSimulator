import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { FiBriefcase, FiUsers, FiCalendar, FiPlusCircle } from 'react-icons/fi';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function Profile() {
  const { user } = useAuth();

  const initial = user?.name?.charAt(0)?.toUpperCase() || 'R';

  return (
    <div className="page-container">
      <div className="profile-container">
        <div className="glass-card profile-card">
          <div className="profile-header">
            <div className="profile-avatar-lg" aria-label={`Avatar for ${user?.name}`}>
              {initial}
            </div>
            <div className="profile-details">
              <h1>{user?.name || 'Recruiter'}</h1>
              <p className="profile-email">{user?.email}</p>
              {user?.company && (
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', marginTop: '0.25rem' }}>
                  <FiBriefcase size={13} style={{ marginRight: '0.35rem', verticalAlign: 'middle' }} aria-hidden="true" />
                  {user.company}
                </p>
              )}
              <p className="profile-member-since">
                <FiCalendar size={13} aria-hidden="true" />
                Member since {formatDate(user?.createdAt)}
              </p>
            </div>
          </div>

          <div className="profile-stats-grid" role="list" aria-label="Recruiter statistics">
            <div className="profile-stat-card" role="listitem">
              <div className="profile-stat-icon activity" aria-hidden="true">
                <FiBriefcase size={20} />
              </div>
              <div className="profile-stat-value">{user?.jobsPosted || 0}</div>
              <div className="profile-stat-label">Jobs Posted</div>
            </div>

            <div className="profile-stat-card" role="listitem">
              <div className="profile-stat-icon target" aria-hidden="true">
                <FiUsers size={20} />
              </div>
              <div className="profile-stat-value">{user?.totalApplicants || 0}</div>
              <div className="profile-stat-label">Total Applicants</div>
            </div>
          </div>

          <div className="profile-cta">
            <Link to="/post-job" className="btn btn-primary" id="profile-post-job-btn">
              <FiPlusCircle size={16} aria-hidden="true" /> Post a Job
            </Link>
            <Link to="/dashboard" className="btn btn-secondary">
              View Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
