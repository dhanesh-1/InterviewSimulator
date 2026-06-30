import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FiFileText, FiUploadCloud, FiArrowLeft, FiCheck, FiX,
    FiAlertTriangle, FiBookOpen, FiActivity, FiBriefcase, FiZap
} from 'react-icons/fi';
import api from '../utils/api';
import ErrorAlert from '../components/ui/ErrorAlert';

export default function ResumeATS() {
    const [file, setFile] = useState(null);
    const [jobDescription, setJobDescription] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > 5 * 1024 * 1024) {
                setError('File size exceeds the 5MB limit. Please upload a smaller file.');
                return;
            }
            setFile(selectedFile);
            setError('');
        }
    };

    const handleAnalyze = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);

        if (!file) {
            setError('Please select a resume file to analyze.');
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append('jobDescription', jobDescription);
        formData.append('resume', file);

        try {
            const response = await api.post('/resume/ats-score', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setResult(response.data);
        } catch (err) {
            console.error('ATS Check Error:', err);
            setError(
                err.response?.data?.error ||
                'An error occurred during verification. Please upload a valid PDF or DOCX resume.'
            );
        } finally {
            setLoading(false);
        }
    };

    const getScoreColorClass = (score) => {
        if (score >= 75) return 'ats-score-high';
        if (score >= 50) return 'ats-score-med';
        return 'ats-score-low';
    };

    return (
        <div className="page-container">
            {/* Header breadcrumb */}
            <div className="dashboard-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <Link to="/dashboard" className="auth-back-link" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center' }}>
                        <FiArrowLeft style={{ marginRight: '0.25rem' }} /> Back to Dashboard
                    </Link>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        ATS <span>Checker & Optimizer</span>
                    </h1>
                </div>
            </div>

            <ErrorAlert message={error} onDismiss={() => setError('')} style={{ marginBottom: '1.5rem' }} />

            {!result ? (
                <div className="ats-setup-grid">
                    {/* Input Panel */}
                    <div className="glass-card">
                        <h2 className="ats-section-title">
                            <FiFileText size={20} /> 1. Upload Your CV / Resume
                        </h2>

                        <div className="upload-zone-wrapper" style={{ marginTop: '1.5rem' }}>
                            <label className="upload-dropzone">
                                <input
                                    type="file"
                                    accept=".pdf,.docx,.doc"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                                <FiUploadCloud size={36} className="upload-icon" />
                                <span className="upload-title">
                                    {file ? file.name : 'Click or Drag Resume Here'}
                                </span>
                                <span className="upload-subtitle text-muted">
                                    Only PDF, DOC, or DOCX formats accepted (Max 5MB)
                                </span>
                            </label>
                        </div>

                        <div className="job-desc-wrapper" style={{ marginTop: '2rem' }}>
                            <h2 className="ats-section-title">
                                <FiBriefcase size={20} /> 2. Target Job Description (Optional)
                            </h2>
                            <p className="description text-secondary" style={{ fontSize: 'var(--font-sm)', marginBottom: '1rem' }}>
                                Pasting the job description helps the AI perform specialized keyword matching and evaluate how well your resume matches the specific qualifications.
                            </p>
                            <div className="form-group">
                                <textarea
                                    className="form-textarea"
                                    placeholder="Paste the job description or requirements here..."
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                    style={{ minHeight: '180px' }}
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleAnalyze}
                            disabled={loading || !file}
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '2rem', height: '50px', fontSize: 'var(--font-base)' }}
                        >
                            {loading ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
                                    Analyzing ATS Score...
                                </div>
                            ) : (
                                <>
                                    <FiZap size={18} /> Analyze ATS Score
                                </>
                            )}
                        </button>
                    </div>

                    {/* Info Card */}
                    <div className="glass-card flex-col" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 600 }}>About ATS Scores</h3>
                        <p className="text-secondary" style={{ fontSize: 'var(--font-sm)' }}>
                            Applicant Tracking Systems (ATS) scan, parse, and rank resumes based on structural formats and keyword matches to quickly filter candidates.
                        </p>
                        <div className="info-sub-item">
                            <h4 style={{ fontWeight: 600, fontSize: 'var(--font-sm)', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
                                <FiCheck size={16} className="text-success" /> Layout Compatibility
                            </h4>
                            <p className="text-muted" style={{ fontSize: 'var(--font-xs)', marginLeft: '1.4rem' }}>
                                Multi-column templates, complex tables, graphics, or text boxes often cause ATS parsers to jumble details or fail scanning altogether. Use standard linear flows.
                            </p>
                        </div>
                        <div className="info-sub-item">
                            <h4 style={{ fontWeight: 600, fontSize: 'var(--font-sm)', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
                                <FiActivity size={16} className="text-accent" /> Keyword Optimisation
                            </h4>
                            <p className="text-muted" style={{ fontSize: 'var(--font-xs)', marginLeft: '1.4rem' }}>
                                ATS platforms look for EXACT technical skills (e.g. "React", "Docker") and methodologies mentioned in the requirements list.
                            </p>
                        </div>
                        <div className="info-sub-item">
                            <h4 style={{ fontWeight: 600, fontSize: 'var(--font-sm)', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
                                <FiBookOpen size={16} className="text-emerald" /> Experience Impact
                            </h4>
                            <p className="text-muted" style={{ fontSize: 'var(--font-xs)', marginLeft: '1.4rem' }}>
                                Resumes focusing on metrics, accomplishments, and active action verbs outperform brief tasks/responsibility descriptions.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                /* Report Results */
                <div className="ats-report-container animate-fade-in">
                    {/* Main Panel */}
                    <div className="ats-card-header glass-card">
                        <div className="ats-radial-score-wrapper">
                            <div className={`ats-radial-dial ${getScoreColorClass(result.score)}`}>
                                <div className="ats-radial-number">{result.score}</div>
                                <div className="ats-radial-label">Overall Match</div>
                            </div>
                        </div>

                        <div className="ats-score-intro">
                            <h2 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700 }}>ATS Compatibility Report</h2>
                            <p className="text-secondary" style={{ marginTop: '0.5rem', fontSize: 'var(--font-base)', lineHeight: 1.6 }}>
                                Based on our analysis, your CV has an ATS Score of <strong>{result.score}/100</strong>.
                                {result.score >= 75 ? (
                                    <span className="text-success"> This is a strong score! Your CV meets general ATS standards and matches requirements effectively.</span>
                                ) : result.score >= 50 ? (
                                    <span className="text-accent"> This is an average score. Some minor edits to layout, formatting, or keyword insertion will raise your score.</span>
                                ) : (
                                    <span className="text-danger"> This score needs focus. The layout or keywords do not meet ATS filter thresholds, suggesting significant room for adjustment.</span>
                                )}
                            </p>
                            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => setResult(null)}
                                    className="btn btn-secondary btn-sm"
                                >
                                    Analyze Another Resume
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Breakdown cards */}
                    <div className="ats-breakdown-grid" style={{ marginTop: '1.5rem' }}>
                        <div className="glass-card ats-breakdown-card">
                            <div className="breakdown-label">Formatting &amp; Layout</div>
                            <div className="breakdown-score-row">
                                <span className="breakdown-pct">{result.breakdown?.formatting ?? 0}%</span>
                                <div className="breakdown-bar-bg">
                                    <div
                                        className={`breakdown-bar-fill ${getScoreColorClass(result.breakdown?.formatting)}`}
                                        style={{ width: `${result.breakdown?.formatting ?? 0}%` }}
                                    />
                                </div>
                            </div>
                            <p className="text-muted" style={{ fontSize: 'var(--font-xs)', marginTop: '0.5rem' }}>
                                Evaluates file format consistency, contact details layout, and clear section dividers.
                            </p>
                        </div>

                        <div className="glass-card ats-breakdown-card">
                            <div className="breakdown-label">Keyword Match</div>
                            <div className="breakdown-score-row">
                                <span className="breakdown-pct">{result.breakdown?.keywords ?? 0}%</span>
                                <div className="breakdown-bar-bg">
                                    <div
                                        className={`breakdown-bar-fill ${getScoreColorClass(result.breakdown?.keywords)}`}
                                        style={{ width: `${result.breakdown?.keywords ?? 0}%` }}
                                    />
                                </div>
                            </div>
                            <p className="text-muted" style={{ fontSize: 'var(--font-xs)', marginTop: '0.5rem' }}>
                                Measures keyword density and overlap with standard tech terminology or job description requirements.
                            </p>
                        </div>

                        <div className="glass-card ats-breakdown-card">
                            <div className="breakdown-label">Experience Impact</div>
                            <div className="breakdown-score-row">
                                <span className="breakdown-pct">{result.breakdown?.impact ?? 0}%</span>
                                <div className="breakdown-bar-bg">
                                    <div
                                        className={`breakdown-bar-fill ${getScoreColorClass(result.breakdown?.impact)}`}
                                        style={{ width: `${result.breakdown?.impact ?? 0}%` }}
                                    />
                                </div>
                            </div>
                            <p className="text-muted" style={{ fontSize: 'var(--font-xs)', marginTop: '0.5rem' }}>
                                Evaluates results-oriented action verbs, quantifiable metrics, and impact representation.
                            </p>
                        </div>
                    </div>

                    {/* Keywords Matching Card (If Job Description provided) */}
                    {jobDescription && (result.matchedKeywords?.length > 0 || result.missingKeywords?.length > 0) && (
                        <div className="glass-card" style={{ marginTop: '1.5rem' }}>
                            <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, marginBottom: '1.25rem' }}>
                                Keyword Breakdown
                            </h3>
                            <div className="keywords-comparison-grid">
                                <div>
                                    <div className="keywords-col-title text-success" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                                        <FiCheck /> Matched Keywords ({result.matchedKeywords?.length || 0})
                                    </div>
                                    {result.matchedKeywords?.length > 0 ? (
                                        <div className="kw-pills-list">
                                            {result.matchedKeywords.map((kw, i) => (
                                                <span key={i} className="badge badge-easy" style={{ textTransform: 'capitalize' }}>{kw}</span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted" style={{ fontSize: 'var(--font-sm)' }}>No keyword match detected.</p>
                                    )}
                                </div>

                                <div>
                                    <div className="keywords-col-title text-danger" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                                        <FiX /> Missing Target Keywords ({result.missingKeywords?.length || 0})
                                    </div>
                                    {result.missingKeywords?.length > 0 ? (
                                        <div className="kw-pills-list">
                                            {result.missingKeywords.map((kw, i) => (
                                                <span key={i} className="badge badge-hard" style={{ textTransform: 'capitalize' }}>{kw}</span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted" style={{ fontSize: 'var(--font-sm)' }}>No missing keywords detected!</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actionable Improvements Accordion List */}
                    <div className="glass-card" style={{ marginTop: '1.5rem' }}>
                        <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FiAlertTriangle className="text-accent" /> Actionable Improvements
                        </h3>

                        {result.improvements?.length > 0 ? (
                            <div className="ats-improvements-list" role="list">
                                {result.improvements.map((imp, idx) => (
                                    <div
                                        key={idx}
                                        className="ats-improvement-card"
                                        role="listitem"
                                    >
                                        <div className="imp-card-header">
                                            <span className={`imp-badge imp-badge-${imp.category?.replace(/\s+/g, '-').toLowerCase()}`}>
                                                {imp.category}
                                            </span>
                                            <div className="imp-issue">{imp.issue}</div>
                                        </div>
                                        <div className="imp-suggestion">
                                            <strong>How to improve:</strong> {imp.suggestion}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <FiCheck className="text-success" size={24} />
                                <h3>No issues detected!</h3>
                                <p>Your resume meets all our ATS evaluation criteria perfectly.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
