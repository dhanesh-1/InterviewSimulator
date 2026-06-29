import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ScoreCircle from '../components/ui/ScoreCircle';
import Badge from '../components/ui/Badge';
import { formatDate, getScoreColor } from '../utils/speechUtils';
import { FiArrowLeft, FiClock, FiSearch, FiMic, FiEdit3 } from 'react-icons/fi';

export default function SessionReview() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadSession(); }, [sessionId]);

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
        <LoadingSpinner size="lg" label="Loading session review..." center />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon" aria-hidden="true"><FiSearch size={36} /></div>
          <h3>Session Not Found</h3>
          <p>This session may have been deleted or the link is incorrect.</p>
          <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const answeredQuestions = session.questions?.filter((q) => q.userAnswer) || [];
  const strongCount       = answeredQuestions.filter((q) => q.evaluation?.overall >= 7).length;

  return (
    <div className="page-container">
      <Link
        to="/dashboard"
        className="btn btn-secondary btn-sm"
        style={{ marginBottom: '1.5rem', display: 'inline-flex' }}
        aria-label="Back to dashboard"
      >
        <FiArrowLeft size={14} aria-hidden="true" /> Back to Dashboard
      </Link>

      {/* ── Review Header ── */}
      <div className="review-header">
        <div>
          <h1>{session.role}</h1>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Badge variant={session.difficulty}>{session.difficulty}</Badge>
            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <FiClock size={14} aria-hidden="true" />
              {formatDate(session.completedAt || session.startedAt)}
            </span>
          </div>
        </div>

        <div className="review-stats" role="list" aria-label="Session statistics">
          <div className="review-stat" role="listitem" aria-label={`Overall score: ${session.overallScore?.toFixed(1)}`}>
            <div className="review-stat-value" style={{ color: getScoreColor(session.overallScore) }}>
              {session.overallScore?.toFixed(1)}
            </div>
            <div className="review-stat-label">Overall</div>
          </div>
          <div className="review-stat" role="listitem" aria-label={`${answeredQuestions.length} of ${session.questions?.length || 0} answered`}>
            <div className="review-stat-value" style={{ color: 'var(--accent-blue)' }}>
              {answeredQuestions.length}/{session.questions?.length || 0}
            </div>
            <div className="review-stat-label">Answered</div>
          </div>
          <div className="review-stat" role="listitem" aria-label={`${strongCount} strong answers`}>
            <div className="review-stat-value" style={{ color: 'var(--accent-emerald)' }}>
              {strongCount}
            </div>
            <div className="review-stat-label">Strong</div>
          </div>
        </div>
      </div>

      {/* ── Questions List ── */}
      <div className="review-questions" role="list" aria-label="Interview questions and answers">
        {session.questions?.map((q, idx) => (
          <div key={q._id || idx} className="glass-card review-question-card" role="listitem">
            <div className="review-question-header">
              <div className="review-q-number" aria-hidden="true">{idx + 1}</div>
              <div style={{ flex: 1 }}>
                <div className="review-q-text">{q.text}</div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <Badge variant={q.type}>{q.type}</Badge>
                  <Badge variant={q.difficulty}>{q.difficulty}</Badge>
                </div>
              </div>
              {q.evaluation && (
                <ScoreCircle score={q.evaluation.overall} size="sm" />
              )}
            </div>

            {q.userAnswer ? (
              <>
                <div className="review-answer">
                  <div className="review-answer-label">
                    Your Answer {q.answeredVia === 'speech'
                      ? <><FiMic size={12} style={{ verticalAlign: 'middle' }} /> Voice</>
                      : <><FiEdit3 size={12} style={{ verticalAlign: 'middle' }} /> Typed</>
                    }
                  </div>
                  <p>{q.userAnswer}</p>
                </div>

                {q.evaluation && (
                  <>
                    <div className="review-scores-inline" role="list" aria-label="Score breakdown">
                      {[
                        { label: 'Relevance',  value: q.evaluation.relevance },
                        { label: 'Clarity',    value: q.evaluation.clarity },
                        { label: 'Confidence', value: q.evaluation.confidence },
                        { label: 'Overall',    value: q.evaluation.overall },
                      ].map((score) => (
                        <div
                          key={score.label}
                          className="review-score-pill"
                          role="listitem"
                          aria-label={`${score.label}: ${score.value}`}
                        >
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
              <div
                style={{ padding: '1rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 'var(--font-sm)' }}
                aria-label="Question not answered"
              >
                Not answered
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
