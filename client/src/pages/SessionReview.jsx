import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { formatDate, getScoreClass, getScoreColor } from '../utils/speechUtils';
import { FiArrowLeft, FiClock, FiTarget, FiAward } from 'react-icons/fi';

export default function SessionReview() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const res = await api.get(`/sessions/${sessionId}`);
      setSession(res.data);
    } catch (err) {
      console.error('Load session error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading session review...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <h3>Session not found</h3>
          <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const answeredQuestions = session.questions?.filter(q => q.userAnswer) || [];

  return (
    <div className="page-container">
      <Link to="/dashboard" className="btn btn-secondary btn-sm" style={{ marginBottom: '1.5rem' }}>
        <FiArrowLeft size={14} /> Back to Dashboard
      </Link>

      <div className="review-header">
        <div>
          <h1>{session.role}</h1>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', alignItems: 'center' }}>
            <span className={`badge badge-${session.difficulty}`}>{session.difficulty}</span>
            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <FiClock size={14} /> {formatDate(session.completedAt || session.startedAt)}
            </span>
          </div>
        </div>

        <div className="review-stats">
          <div className="review-stat">
            <div className="review-stat-value" style={{ color: getScoreColor(session.overallScore) }}>
              {session.overallScore?.toFixed(1)}
            </div>
            <div className="review-stat-label">Overall</div>
          </div>
          <div className="review-stat">
            <div className="review-stat-value" style={{ color: 'var(--accent-blue)' }}>
              {answeredQuestions.length}/{session.questions?.length || 0}
            </div>
            <div className="review-stat-label">Answered</div>
          </div>
          <div className="review-stat">
            <div className="review-stat-value" style={{ color: 'var(--accent-emerald)' }}>
              {answeredQuestions.filter(q => q.evaluation?.overall >= 7).length}
            </div>
            <div className="review-stat-label">Strong</div>
          </div>
        </div>
      </div>

      <div className="review-questions">
        {session.questions?.map((q, idx) => (
          <div key={q._id || idx} className="glass-card review-question-card">
            <div className="review-question-header">
              <div className="review-q-number">{idx + 1}</div>
              <div style={{ flex: 1 }}>
                <div className="review-q-text">{q.text}</div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <span className={`badge badge-${q.type}`}>{q.type}</span>
                  <span className={`badge badge-${q.difficulty}`}>{q.difficulty}</span>
                </div>
              </div>
            </div>

            {q.userAnswer ? (
              <>
                <div className="review-answer">
                  <div className="review-answer-label">
                    Your Answer {q.answeredVia === 'speech' ? '🎤' : '⌨️'}
                  </div>
                  <p>{q.userAnswer}</p>
                </div>

                {q.evaluation && (
                  <>
                    <div className="review-scores-inline">
                      {[
                        { label: 'Relevance', value: q.evaluation.relevance },
                        { label: 'Clarity', value: q.evaluation.clarity },
                        { label: 'Confidence', value: q.evaluation.confidence },
                        { label: 'Overall', value: q.evaluation.overall }
                      ].map(score => (
                        <div key={score.label} className="review-score-pill">
                          <span style={{ color: getScoreColor(score.value), fontWeight: 700 }}>
                            {score.value}
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>{score.label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="review-feedback">
                      <p>{q.evaluation.feedback}</p>
                      {q.evaluation.suggestions?.length > 0 && (
                        <ul style={{ marginTop: '0.75rem', paddingLeft: '1.25rem', fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
                          {q.evaluation.suggestions.map((sug, i) => (
                            <li key={i} style={{ marginBottom: '0.25rem' }}>{sug}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div style={{ padding: '1rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 'var(--font-sm)' }}>
                Not answered
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
