import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/speechUtils';
import { FiUser, FiMail, FiCalendar, FiActivity, FiTarget } from 'react-icons/fi';

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="page-container">
      <div className="profile-container">
        <div className="glass-card" style={{ padding: '2rem' }}>
          <div className="profile-header">
            <div className="profile-avatar-lg">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="profile-details">
              <h1>{user?.name || 'User'}</h1>
              <p>{user?.email}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>
                <FiActivity size={16} /> Total Sessions
              </div>
              <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--accent-blue)' }}>
                {user?.totalSessions || 0}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>
                <FiTarget size={16} /> Average Score
              </div>
              <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                {user?.averageScore?.toFixed(1) || '0.0'}/10
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>
              <FiCalendar size={14} /> Member since {formatDate(user?.createdAt)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
