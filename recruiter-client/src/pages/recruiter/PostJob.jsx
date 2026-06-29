import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import ErrorAlert from '../../components/ui/ErrorAlert';
import { isTechnicalRole } from '../../utils/validation';
import { FiBriefcase, FiPlus, FiX, FiArrowLeft } from 'react-icons/fi';

const DIFFICULTIES = ['easy', 'medium', 'hard', 'adaptive'];
const JOB_TYPES    = ['full-time', 'part-time', 'contract', 'internship'];

export default function PostJob() {
  const navigate = useNavigate();
  const [title,        setTitle]        = useState('');
  const [location,     setLocation]     = useState('Remote');
  const [type,         setType]         = useState('full-time');
  const [role,         setRole]         = useState('');
  const [roleError,    setRoleError]    = useState('');
  const [difficulty,   setDifficulty]   = useState('medium');
  const [description,  setDescription]  = useState('');
  const [requirements, setRequirements] = useState([]);
  const [reqInput,     setReqInput]     = useState('');
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const submittingRef = useRef(false);

  const handleRoleChange = (v) => {
    setRole(v);
    if (!v.trim()) { setRoleError(''); return; }
    setRoleError(isTechnicalRole(v) ? '' : 'Please enter a valid technical role (e.g., Software Engineer, Data Scientist).');
  };

  const addReq = () => {
    if (reqInput.trim() && !requirements.includes(reqInput.trim())) {
      setRequirements(r => [...r, reqInput.trim()]);
      setReqInput('');
    }
  };

  const removeReq = (r) => setRequirements(prev => prev.filter(x => x !== r));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    if (roleError) return;

    submittingRef.current = true;
    setLoading(true);
    setError('');

    try {
      await api.post('/jobs', { title, location, type, role, difficulty, description, requirements });
      navigate('/listings');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post job.');
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  return (
    <div className="page-container">
      <button className="btn btn-secondary btn-sm" onClick={() => navigate('/dashboard')} style={{ marginBottom: '1.5rem' }}>
        <FiArrowLeft size={14} /> Back
      </button>

      <div className="setup-header" style={{ marginBottom: '2rem' }}>
        <h1><FiBriefcase size={28} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Post a New Job</h1>
        <p>Candidates will take an AI interview tailored to your job description.</p>
      </div>

      <div className="glass-card" style={{ maxWidth: '780px', margin: '0 auto', padding: '2.5rem' }}>
        <ErrorAlert message={error} onDismiss={() => setError('')} style={{ marginBottom: '1.5rem' }} />

        <form onSubmit={handleSubmit} noValidate>
          {/* Title + Location */}
          <div className="setup-row">
            <div className="form-group">
              <label className="form-label" htmlFor="job-title">Job Title *</label>
              <input id="job-title" type="text" className="form-input" placeholder="e.g. Senior React Developer"
                value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="job-location">Location</label>
              <input id="job-location" type="text" className="form-input" placeholder="e.g. Remote, Bangalore"
                value={location} onChange={e => setLocation(e.target.value)} />
            </div>
          </div>

          {/* Type + Difficulty */}
          <div className="setup-row">
            <div className="form-group">
              <label className="form-label" htmlFor="job-type">Job Type</label>
              <select id="job-type" className="form-input" value={type} onChange={e => setType(e.target.value)}>
                {JOB_TYPES.map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t.replace('-', ' ')}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="job-difficulty">Interview Difficulty</label>
              <select id="job-difficulty" className="form-input" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                {DIFFICULTIES.map(d => <option key={d} value={d} style={{ textTransform: 'capitalize' }}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Role (validated) */}
          <div className="form-group">
            <label className="form-label" htmlFor="job-role">Technical Role * <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(used for AI question generation)</span></label>
            <input id="job-role" type="text" className={`form-input ${roleError ? 'input-error' : ''}`}
              placeholder="e.g. Frontend Developer, Data Scientist"
              value={role} onChange={e => handleRoleChange(e.target.value)} required />
            {roleError && <p className="form-error">{roleError}</p>}
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="job-description">Job Description *</label>
            <textarea id="job-description" className="form-input form-textarea" rows={7}
              placeholder="Describe the role, responsibilities, and expectations. This is used by AI to generate relevant interview questions."
              value={description} onChange={e => setDescription(e.target.value)} required style={{ resize: 'vertical' }} />
          </div>

          {/* Requirements */}
          <div className="form-group">
            <label className="form-label">Key Requirements <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional tags)</span></label>
            <div className="req-input-row">
              <input type="text" className="form-input" placeholder="e.g. React, 3+ years experience"
                value={reqInput} onChange={e => setReqInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addReq(); } }}
                id="req-input" />
              <button type="button" className="btn btn-secondary btn-sm" onClick={addReq}>
                <FiPlus size={14} /> Add
              </button>
            </div>
            {requirements.length > 0 && (
              <div className="req-tags" style={{ marginTop: '0.75rem' }}>
                {requirements.map(r => (
                  <span key={r} className="req-tag">
                    {r}
                    <button type="button" onClick={() => removeReq(r)} aria-label={`Remove ${r}`}>
                      <FiX size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !!roleError || !title || !role || !description}
            id="post-job-btn"
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
          >
            {loading ? 'Posting...' : 'Post Job'}
          </button>
        </form>
      </div>
    </div>
  );
}
