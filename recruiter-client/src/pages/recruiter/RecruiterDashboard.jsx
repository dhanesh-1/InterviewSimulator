import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { FiBriefcase, FiPlusCircle, FiList, FiUsers, FiCheckCircle, FiClock } from 'react-icons/fi';

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const [jobs,    setJobs]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/jobs/mine')
      .then(res => { setJobs(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const totalApplicants  = jobs.reduce((s, j) => s + (j.applicantCount || 0), 0);
  const openJobs         = jobs.filter(j => j.status === 'open').length;

  const stats = [
    { label: 'Jobs Posted',     value: jobs.length,       icon: <FiBriefcase size={22} />, color: 'blue' },
    { label: 'Total Applicants', value: totalApplicants,  icon: <FiUsers size={22} />,     color: 'purple' },
    { label: 'Open Positions',  value: openJobs,          icon: <FiClock size={22} />,     color: 'emerald' },
  ];

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div>
          <h1>Welcome, {user?.name?.split(' ')[0]}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{user?.company} &mdash; Recruiter Dashboard</p>
        </div>
        <Link to="/post-job" className="btn btn-primary" id="recruiter-post-job-btn">
          <FiPlusCircle size={16} /> Post a Job
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '2.5rem' }}>
        {stats.map(s => (
          <div key={s.label} className="stat-card glass-card">
            <div className={`stat-icon stat-icon-${s.color}`}>{s.icon}</div>
            <div className="stat-value">{loading ? '—' : s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Jobs */}
      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h2>Recent Job Postings</h2>
          <Link to="/listings" className="btn btn-secondary btn-sm">
            <FiList size={14} /> View All
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner size="md" label="Loading..." center />
        ) : jobs.length === 0 ? (
          <div className="empty-state" style={{ padding: '3rem' }}>
            <FiBriefcase size={36} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h3>No jobs posted yet</h3>
            <p>Post your first job and let AI automatically screen candidates.</p>
            <Link to="/post-job" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Post First Job
            </Link>
          </div>
        ) : (
          <div className="recruiter-jobs-table">
            {jobs.slice(0, 5).map(job => (
              <div key={job._id} className="recruiter-job-row glass-card">
                <div className="recruiter-job-info">
                  <h4>{job.title}</h4>
                  <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>{job.role} &bull; {job.location}</span>
                </div>
                <div className="recruiter-job-meta">
                  <span className={`status-pill ${job.status === 'open' ? 'status-open' : 'status-closed'}`}>
                    {job.status === 'open' ? <FiCheckCircle size={11} /> : <FiClock size={11} />}
                    {job.status}
                  </span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
                    <FiUsers size={13} style={{ marginRight: '0.3rem' }} />{job.applicantCount || 0}
                  </span>
                  <Link to={`/listings/${job._id}/applicants`} className="btn btn-secondary btn-sm">
                    View Applicants
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
