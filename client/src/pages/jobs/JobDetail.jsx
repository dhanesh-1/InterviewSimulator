import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorAlert from '../../components/ui/ErrorAlert';
import ApplicationFlow from './ApplicationFlow';
import {
  FiBriefcase, FiMapPin, FiClock, FiArrowLeft, FiCheckCircle,
  FiUsers, FiZap
} from 'react-icons/fi';

const TYPE_LABELS = { 'full-time': 'Full Time', 'part-time': 'Part Time', 'contract': 'Contract', 'internship': 'Internship' };

export default function JobDetail() {
  const { jobId }  = useParams();
  const navigate   = useNavigate();
  const [job,      setJob]      = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    api.get(`/jobs/${jobId}`)
      .then(res => { setJob(res.data); setLoading(false); })
      .catch(err => {
        setError(err.response?.data?.error || 'Failed to load job.');
        setLoading(false);
      });
  }, [jobId]);

  if (loading) return <div className="page-container"><LoadingSpinner size="lg" label="Loading job..." center /></div>;

  if (!job) return (
    <div className="page-container">
      <ErrorAlert message={error || 'Job not found.'} onDismiss={() => navigate('/jobs')} />
    </div>
  );

  if (applying) {
    return <ApplicationFlow job={job} onCancel={() => setApplying(false)} />;
  }

  return (
    <div className="page-container">
      <button className="btn btn-secondary btn-sm" onClick={() => navigate('/jobs')} style={{ marginBottom: '1.5rem' }}>
        <FiArrowLeft size={14} /> Back to Jobs
      </button>

      <div className="job-detail-layout">
        {/* Main Content */}
        <div className="job-detail-main">
          <div className="glass-card job-detail-card">
            <div className="job-detail-header">
              <div className="job-detail-company-icon">
                {job.company?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <h1 className="job-detail-title">{job.title}</h1>
                <p className="job-detail-company">{job.company}</p>
              </div>
            </div>

            <div className="job-detail-chips">
              <span className="job-chip"><FiBriefcase size={13} /> {job.role}</span>
              <span className="job-chip"><FiMapPin size={13} /> {job.location}</span>
              <span className="job-chip"><FiClock size={13} /> {TYPE_LABELS[job.type] || job.type}</span>
              <span className="job-chip"><FiUsers size={13} /> {job.applicantCount || 0} applicants</span>
            </div>

            <hr className="job-detail-divider" />

            <h2 className="job-detail-section-title">Job Description</h2>
            <p className="job-detail-description" style={{ whiteSpace: 'pre-wrap' }}>
              {job.description}
            </p>

            {job.requirements?.length > 0 && (
              <>
                <h2 className="job-detail-section-title" style={{ marginTop: '1.5rem' }}>Requirements</h2>
                <ul className="job-detail-reqs">
                  {job.requirements.map((r, i) => (
                    <li key={i}>
                      <FiCheckCircle size={14} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
                      {r}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        {/* Sidebar CTA */}
        <aside className="job-detail-sidebar">
          <div className="glass-card job-apply-box">
            <div className="job-apply-difficulty">
              <FiZap size={16} style={{ color: 'var(--accent-blue)' }} />
              <span>Interview Difficulty: <strong>{job.difficulty}</strong></span>
            </div>
            <p className="job-apply-info">
              Applying will immediately start an AI-powered interview tailored specifically to this job description and your resume.
            </p>
            {error && <ErrorAlert message={error} onDismiss={() => setError('')} style={{ marginBottom: '1rem' }} />}
            <button
              className="btn btn-primary"
              onClick={() => setApplying(true)}
              id="apply-btn"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <FiBriefcase size={16} /> Apply & Start Interview
            </button>
            <p className="job-apply-note">
              Upload your resume once and the AI interview begins instantly.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
