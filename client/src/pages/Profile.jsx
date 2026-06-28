import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { formatDate } from '../utils/speechUtils';
import { FiActivity, FiTarget, FiCalendar, FiPlusCircle } from 'react-icons/fi';

export default function Profile() {
  const { user } = useAuth();

  const initial = user?.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="page-container">
      <div className="profile-container">
        {/* ── Profile Card ── */}
        <div className="glass-card profile-card">
          <div className="profile-header">
            <div className="profile-avatar-lg" aria-label={`Avatar for ${user?.name}`}>
              {initial}
            </div>
            <div className="profile-details">
              <h1>{user?.name || 'User'}</h1>
              <p className="profile-email">{user?.email}</p>
              <p className="profile-member-since">
                <FiCalendar size={13} aria-hidden="true" />
                Member since {formatDate(user?.createdAt)}
              </p>
            </div>
          </div>

          {/* ── Stats ── */}
          <div className="profile-stats-grid" role="list" aria-label="Profile statistics">
            <div className="profile-stat-card" role="listitem">
              <div className="profile-stat-icon activity" aria-hidden="true">
                <FiActivity size={20} />
              </div>
              <div className="profile-stat-value">{user?.totalSessions || 0}</div>
              <div className="profile-stat-label">Total Sessions</div>
            </div>

            <div className="profile-stat-card" role="listitem">
              <div className="profile-stat-icon target" aria-hidden="true">
                <FiTarget size={20} />
              </div>
              <div
                className="profile-stat-value"
                aria-label={`Average score: ${user?.averageScore?.toFixed(1) || '0.0'} out of 10`}
              >
                {user?.averageScore?.toFixed(1) || '0.0'}<span className="profile-stat-unit">/10</span>
              </div>
              <div className="profile-stat-label">Average Score</div>
            </div>
          </div>

          {/* ── CTA ── */}
          <div className="profile-cta">
            <Link to="/interview/setup" className="btn btn-primary" id="profile-new-interview-btn">
              <FiPlusCircle size={16} aria-hidden="true" /> New Interview
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
