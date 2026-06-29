import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorAlert from '../../components/ui/ErrorAlert';
import {
  FiBriefcase, FiMapPin, FiClock, FiSearch, FiFilter, FiArrowRight, FiUsers
} from 'react-icons/fi';

const TYPE_LABELS = {
  'full-time': 'Full Time',
  'part-time': 'Part Time',
  'contract': 'Contract',
  'internship': 'Internship'
};

const TYPE_COLORS = {
  'full-time': 'emerald',
  'part-time': 'blue',
  'contract': 'amber',
  'internship': 'purple'
};

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export default function JobBoard() {
  const [jobs,    setJobs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [search,  setSearch]  = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    fetchJobs();
  }, [typeFilter]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      const res = await api.get(`/jobs?${params.toString()}`);
      setJobs(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load job listings.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = search
    ? jobs.filter(j =>
        j.title.toLowerCase().includes(search.toLowerCase()) ||
        j.role.toLowerCase().includes(search.toLowerCase()) ||
        j.company?.toLowerCase().includes(search.toLowerCase())
      )
    : jobs;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="jobs-header">
        <div>
          <h1 className="jobs-title">Browse Open Positions</h1>
          <p className="jobs-sub">Apply and take an AI-powered interview instantly</p>
        </div>
      </div>

      {/* Filters */}
      <div className="jobs-filters">
        <div className="jobs-search-wrap">
          <FiSearch size={16} className="jobs-search-icon" />
          <input
            id="job-search"
            type="text"
            className="form-input jobs-search-input"
            placeholder="Search by title, role, or company..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search jobs"
          />
        </div>
        <div className="jobs-filter-wrap">
          <FiFilter size={15} style={{ color: 'var(--text-muted)' }} />
          <select
            id="job-type-filter"
            className="form-input jobs-filter-select"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            aria-label="Filter by job type"
          >
            <option value="">All Types</option>
            <option value="full-time">Full Time</option>
            <option value="part-time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>
        </div>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {loading ? (
        <LoadingSpinner size="lg" label="Loading jobs..." center />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <FiBriefcase size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3>No jobs found</h3>
          <p>{search || typeFilter ? 'Try adjusting your filters.' : 'Check back soon for new openings.'}</p>
        </div>
      ) : (
        <>
          <p className="jobs-count">{filtered.length} position{filtered.length !== 1 ? 's' : ''} available</p>
          <div className="jobs-grid">
            {filtered.map(job => (
              <Link key={job._id} to={`/jobs/${job._id}`} className="job-card glass-card" id={`job-${job._id}`}>
                <div className="job-card-header">
                  <div className="job-card-company-icon">
                    {job.company?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="job-card-meta">
                    <span className="job-card-company">{job.company || 'Company'}</span>
                    <span className="job-card-posted">{timeAgo(job.createdAt)}</span>
                  </div>
                  <span className={`badge badge-${TYPE_COLORS[job.type] || 'blue'}`}>
                    {TYPE_LABELS[job.type] || job.type}
                  </span>
                </div>

                <h3 className="job-card-title">{job.title}</h3>

                <div className="job-card-tags">
                  <span className="job-tag"><FiBriefcase size={12} /> {job.role}</span>
                  <span className="job-tag"><FiMapPin size={12} /> {job.location}</span>
                  <span className="job-tag"><FiClock size={12} /> {job.difficulty} interview</span>
                </div>

                {job.requirements?.length > 0 && (
                  <div className="job-card-reqs">
                    {job.requirements.slice(0, 4).map((r, i) => (
                      <span key={i} className="req-chip">{r}</span>
                    ))}
                    {job.requirements.length > 4 && (
                      <span className="req-chip">+{job.requirements.length - 4} more</span>
                    )}
                  </div>
                )}

                <div className="job-card-footer">
                  <span className="job-applicants"><FiUsers size={13} /> {job.applicantCount || 0} applicants</span>
                  <span className="job-apply-cta">Apply & Interview <FiArrowRight size={13} /></span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
