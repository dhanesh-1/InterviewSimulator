import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ScoreLineChart, CategoryRadarChart } from '../components/PerformanceChart';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorAlert from '../components/ui/ErrorAlert';
import ScoreCircle from '../components/ui/ScoreCircle';
import Badge from '../components/ui/Badge';
import api from '../utils/api';
import { formatDate } from '../utils/speechUtils';
import { FiActivity, FiTarget, FiAward, FiTrendingUp, FiPlusCircle, FiClock, FiChevronRight, FiMic, FiFileText } from 'react-icons/fi';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    setError('');
    try {
      const [statsRes, sessionsRes] = await Promise.all([
        api.get('/sessions/stats'),
        api.get('/sessions'),
      ]);
      setStats(statsRes.data);
      setSessions(sessionsRes.data.slice(0, 8));
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError('Failed to load dashboard data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <LoadingSpinner size="lg" label="Loading dashboard..." center />
      </div>
    );
  }

  const statCards = [
    {
      icon: <FiActivity size={22} />,
      value: stats?.totalSessions ?? 0,
      label: 'Total Sessions',
    },
    {
      icon: <FiTarget size={22} />,
      value: stats?.averageScore?.toFixed(1) ?? '0.0',
      label: 'Average Score',
    },
    {
      icon: <FiAward size={22} />,
      value: stats?.bestScore?.toFixed(1) ?? '0.0',
      label: 'Best Score',
    },
    {
      icon: <FiTrendingUp size={22} />,
      value: `${stats?.recentTrend > 0 ? '+' : ''}${stats?.recentTrend?.toFixed(1) ?? '0.0'}`,
      label: 'Recent Trend',
      trend: stats?.recentTrend,
    },
  ];

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <h1>
          Welcome back, <span>{user?.name?.split(' ')[0] || 'User'}</span>
        </h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/ats-checker" className="btn btn-secondary" id="ats-checker-btn">
            <FiFileText size={18} /> ATS Checker
          </Link>
          <Link to="/interview/setup" className="btn btn-primary" id="new-interview-btn">
            <FiPlusCircle size={18} /> New Interview
          </Link>
        </div>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError('')} style={{ marginBottom: '1.5rem' }} />

      {/* Stats Grid */}
      <div className="stats-grid" role="list" aria-label="Performance statistics">
        {statCards.map((card) => (
          <div key={card.label} className="glass-card stat-card" role="listitem">
            <div className="stat-icon" aria-hidden="true">{card.icon}</div>
            <div className="stat-value" aria-label={`${card.label}: ${card.value}`}>
              {card.value}
            </div>
            <div className="stat-label">{card.label}</div>
            {card.trend !== undefined && card.trend !== 0 && (
              <span className={`stat-trend ${card.trend > 0 ? 'positive' : 'negative'}`} aria-live="polite">
                {card.trend > 0 ? '↑ Improving' : '↓ Needs focus'}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="dashboard-grid">
        <div className="glass-card dashboard-section">
          <h2><FiTrendingUp size={20} aria-hidden="true" /> Score Trend</h2>
          <ScoreLineChart data={stats?.scoreHistory} />
        </div>
        <div className="glass-card dashboard-section">
          <h2><FiTarget size={20} aria-hidden="true" /> Category Breakdown</h2>
          <CategoryRadarChart data={stats?.categoryBreakdown} />
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="glass-card" style={{ marginTop: '0.5rem' }}>
        <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiClock size={20} aria-hidden="true" /> Recent Sessions
        </h2>

        {sessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon" aria-hidden="true"><FiMic size={36} /></div>
            <h3>No interviews yet</h3>
            <p>Start your first AI-powered interview to see your progress here.</p>
            <Link to="/interview/setup" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Start First Interview
            </Link>
          </div>
        ) : (
          <div className="session-list" role="list" aria-label="Recent interview sessions">
            {sessions.map((session) => (
              <Link
                key={session.id}
                to={session.status === 'completed' ? `/session/${session.id}` : `/interview/${session.id}`}
                className="glass-card session-card"
                id={`session-card-${session.id}`}
                role="listitem"
                aria-label={`${session.role} — ${session.status === 'completed' ? `Score: ${session.overallScore?.toFixed(1)}` : 'In Progress'}`}
              >
                <div className="session-info">
                  <div className="session-role">{session.role}</div>
                  <div className="session-meta">
                    <Badge variant={session.difficulty}>{session.difficulty}</Badge>
                    <span>{session.answeredCount}/{session.questionCount} answered</span>
                    <span><FiClock size={12} /> {formatDate(session.completedAt || session.startedAt)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {session.status === 'completed'
                    ? <ScoreCircle score={session.overallScore} size="md" />
                    : <Badge variant="medium">In Progress</Badge>
                  }
                  <FiChevronRight size={18} color="var(--text-muted)" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
