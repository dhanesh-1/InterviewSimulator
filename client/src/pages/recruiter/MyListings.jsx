import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorAlert from '../../components/ui/ErrorAlert';
import { FiBriefcase, FiUsers, FiToggleLeft, FiToggleRight, FiEye } from 'react-icons/fi';

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return `${Math.floor(days / 7)} weeks ago`;
}

export default function MyListings() {
  const navigate = useNavigate();
  const [jobs,    setJobs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    api.get('/jobs/mine')
      .then(res => { setJobs(res.data); setLoading(false); })
      .catch(err => { setError(err.response?.data?.error || 'Failed to load jobs.'); setLoading(false); });
  }, []);

  const toggleStatus = async (job) => {
    const newStatus = job.status === 'open' ? 'closed' : 'open';
    try {
      await api.patch(`/jobs/${job._id}/status`, { status: newStatus });
      setJobs(prev => prev.map(j => j._id === job._id ? { ...j, status: newStatus } : j));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update job status.');
    }
  };

  return (
    <div className="page-container">
      <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1>My Job Listings</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{jobs.length} posting{jobs.length !== 1 ? 's' : ''} total</p>
        </div>
        <Link to="/recruiter/post-job" className="btn btn-primary">
          + Post New Job
        </Link>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {loading ? (
        <LoadingSpinner size="lg" label="Loading listings..." center />
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          <FiBriefcase size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3>No jobs posted yet</h3>
          <Link to="/recruiter/post-job" className="btn btn-primary" style={{ marginTop: '1rem' }}>Post First Job</Link>
        </div>
      ) : (
        <div className="listings-table glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="recruiter-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Role</th>
                <th>Type</th>
                <th>Difficulty</th>
                <th>Applicants</th>
                <th>Posted</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job._id} className="recruiter-table-row">
                  <td><strong>{job.title}</strong></td>
                  <td><span className="role-chip-sm">{job.role}</span></td>
                  <td style={{ textTransform: 'capitalize' }}>{job.type?.replace('-', ' ')}</td>
                  <td style={{ textTransform: 'capitalize' }}>{job.difficulty}</td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <FiUsers size={13} /> {job.applicantCount || 0}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{timeAgo(job.createdAt)}</td>
                  <td>
                    <span className={`status-pill ${job.status === 'open' ? 'status-open' : 'status-closed'}`}>
                      {job.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <Link
                        to={`/recruiter/listings/${job._id}/applicants`}
                        className="btn btn-secondary btn-sm"
                        title="View Applicants"
                      >
                        <FiEye size={13} /> Applicants
                      </Link>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => toggleStatus(job)}
                        title={job.status === 'open' ? 'Close job' : 'Reopen job'}
                        type="button"
                      >
                        {job.status === 'open'
                          ? <><FiToggleRight size={14} /> Close</>
                          : <><FiToggleLeft size={14} /> Open</>
                        }
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
