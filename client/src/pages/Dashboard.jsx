import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ScoreLineChart, CategoryRadarChart } from '../components/PerformanceChart';
import api from '../utils/api';
import { formatDate, getScoreClass } from '../utils/speechUtils';
import { FiActivity, FiTarget, FiAward, FiTrendingUp, FiPlusCircle, FiClock, FiChevronRight } from 'react-icons/fi';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsRes, sessionsRes] = await Promise.all([
        api.get('/sessions/stats'),
        api.get('/sessions')
      ]);
      setStats(statsRes.data);
      setSessions(sessionsRes.data.slice(0, 8));
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <h1>
          Welcome back, <span>{user?.name?.split(' ')[0] || 'User'}</span> 👋
        </h1>
        <Link to="/interview/setup" className="btn btn-primary" id="new-interview-btn">
          <FiPlusCircle size={18} /> New Interview
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon"><FiActivity size={22} /></div>
          <div className="stat-value">{stats?.totalSessions || 0}</div>
          <div className="stat-label">Total Sessions</div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon"><FiTarget size={22} /></div>
          <div className="stat-value">{stats?.averageScore?.toFixed(1) || '0.0'}</div>
          <div className="stat-label">Average Score</div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon"><FiAward size={22} /></div>
          <div className="stat-value">{stats?.bestScore?.toFixed(1) || '0.0'}</div>
          <div className="stat-label">Best Score</div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon"><FiTrendingUp size={22} /></div>
          <div className="stat-value">
            {stats?.recentTrend > 0 ? '+' : ''}{stats?.recentTrend?.toFixed(1) || '0.0'}
          </div>
          <div className="stat-label">Recent Trend</div>
          {stats?.recentTrend !== 0 && (
            <span className={`stat-trend ${stats?.recentTrend > 0 ? 'positive' : 'negative'}`}>
              {stats?.recentTrend > 0 ? '↑ Improving' : '↓ Needs focus'}
            </span>
          )}
        </div>
      </div>

      {/* Charts and Sessions */}
      <div className="dashboard-grid">
        <div className="glass-card dashboard-section">
          <h2><FiTrendingUp size={20} /> Score Trend</h2>
          <ScoreLineChart data={stats?.scoreHistory} />
        </div>

        <div className="glass-card dashboard-section">
          <h2><FiTarget size={20} /> Category Breakdown</h2>
          <CategoryRadarChart data={stats?.categoryBreakdown} />
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="glass-card" style={{ marginTop: '0.5rem' }}>
        <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiClock size={20} /> Recent Sessions
        </h2>

        {sessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎤</div>
            <h3>No interviews yet</h3>
            <p>Start your first AI-powered interview to see your progress here.</p>
            <Link to="/interview/setup" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Start First Interview
            </Link>
          </div>
        ) : (
          <div className="session-list">
            {sessions.map(session => (
              <Link
                key={session.id}
                to={session.status === 'completed' ? `/session/${session.id}` : `/interview/${session.id}`}
                className="glass-card session-card"
                id={`session-card-${session.id}`}
              >
                <div className="session-info">
                  <div className="session-role">{session.role}</div>
                  <div className="session-meta">
                    <span className={`badge badge-${session.difficulty}`}>{session.difficulty}</span>
                    <span>{session.answeredCount}/{session.questionCount} answered</span>
                    <span>{formatDate(session.completedAt || session.startedAt)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {session.status === 'completed' ? (
                    <div className="session-score">
                      <div className={`score-circle ${getScoreClass(session.overallScore)}`}>
                        {session.overallScore.toFixed(1)}
                      </div>
                    </div>
                  ) : (
                    <span className="badge badge-medium">In Progress</span>
                  )}
                  <FiChevronRight size={18} color="var(--text-muted)" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
