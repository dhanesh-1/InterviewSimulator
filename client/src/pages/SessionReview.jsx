import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ScoreCircle from '../components/ui/ScoreCircle';
import Badge from '../components/ui/Badge';
import SpeechInput from '../components/SpeechInput';
import { formatDate, getScoreColor } from '../utils/speechUtils';
import { FiArrowLeft, FiClock, FiSearch, FiMic, FiEdit3, FiSend, FiType, FiX } from 'react-icons/fi';

export default function SessionReview() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [draftAnswers, setDraftAnswers] = useState({});
  const [revisionModes, setRevisionModes] = useState({});
  const [activeRevisionQuestion, setActiveRevisionQuestion] = useState(null);
  const [submittingQuestionId, setSubmittingQuestionId] = useState(null);

  useEffect(() => { loadSession(); }, [sessionId]);

  const loadSession = async () => {
    try {
      const res = await api.get(`/sessions/${sessionId}`);
      setSession(res.data);
      if (res.data?.questions) {
        const initialDrafts = Object.fromEntries(res.data.questions.map((q) => [q._id, q.userAnswer || '']));
        setDraftAnswers(initialDrafts);
      }
    } catch (err) {
      console.error('Load session error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openRevisionModal = (question) => {
    setActiveRevisionQuestion(question);
    setRevisionModes((prev) => ({ ...prev, [question._id]: prev[question._id] || 'text' }));
    setDraftAnswers((prev) => ({ ...prev, [question._id]: prev[question._id] || question.userAnswer || '' }));
  };

  const closeRevisionModal = () => {
    setActiveRevisionQuestion(null);
  };

  const handleSubmitRevision = async () => {
    if (!activeRevisionQuestion) return;

    const questionId = activeRevisionQuestion._id;
    const answer = (draftAnswers[questionId] || '').trim();
    if (!answer) return;

    const answeredVia = revisionModes[questionId] === 'speech' ? 'speech' : 'text';

    setSubmittingQuestionId(questionId);
    try {
      await api.post('/interview/evaluate', {
        sessionId,
        questionId,
        answer,
        answeredVia
      });
      await loadSession();
      closeRevisionModal();
    } catch (err) {
      console.error('Submit revision error:', err);
    } finally {
      setSubmittingQuestionId(null);
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

  // Hide feedback for job-linked sessions
  if (session.applicationId) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon" aria-hidden="true"><FiX size={36} color="var(--accent-red)" /></div>
          <h3>Feedback Not Available</h3>
          <p>This interview was completed as part of a job application. Detailed feedback is only visible to the recruiter.</p>
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

                {session.status === 'completed' && (
                  <div style={{ marginTop: '1rem' }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => openRevisionModal(q)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <FiSend size={14} aria-hidden="true" />
                      Re-evaluate Answer
                    </button>
                  </div>
                )}

                {q.answerVersions?.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <div className="review-answer-label">Version History</div>
                    <ul style={{ marginTop: '0.5rem', paddingLeft: '1.2rem', color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>
                      {[...q.answerVersions].sort((a, b) => (a.versionNumber || 0) - (b.versionNumber || 0)).map((version) => (
                        <li key={`${version.versionNumber}-${version.answeredAt || version.answer}`} style={{ marginBottom: '0.4rem' }}>
                          <strong>Version {version.versionNumber}</strong> · {formatDate(version.answeredAt)} · Score {version.evaluation?.overall ?? 0}/10
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

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

      {activeRevisionQuestion && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(4, 12, 24, 0.72)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 1000
          }}
          onClick={closeRevisionModal}
        >
          <div
            className="glass-card"
            style={{ width: '100%', maxWidth: '640px', padding: '1.5rem', position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="btn btn-secondary btn-sm"
              onClick={closeRevisionModal}
              style={{ position: 'absolute', right: '1rem', top: '1rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              aria-label="Close revision modal"
            >
              <FiX size={14} aria-hidden="true" />
            </button>

            <div className="review-answer-label" style={{ marginBottom: '0.5rem' }}>Re-evaluate your answer</div>
            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              {activeRevisionQuestion.text}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <button
                className={`btn btn-sm ${revisionModes[activeRevisionQuestion._id] === 'text' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setRevisionModes((prev) => ({ ...prev, [activeRevisionQuestion._id]: 'text' }))}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <FiType size={14} aria-hidden="true" /> Text
              </button>
              <button
                className={`btn btn-sm ${revisionModes[activeRevisionQuestion._id] === 'speech' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setRevisionModes((prev) => ({ ...prev, [activeRevisionQuestion._id]: 'speech' }))}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <FiMic size={14} aria-hidden="true" /> Voice
              </button>
            </div>

            {revisionModes[activeRevisionQuestion._id] === 'speech' ? (
              <div className="review-answer" style={{ padding: '1rem' }}>
                <SpeechInput
                  onTranscript={(text) => setDraftAnswers((prev) => ({ ...prev, [activeRevisionQuestion._id]: text }))}
                  disabled={submittingQuestionId === activeRevisionQuestion._id}
                  initialTranscript={draftAnswers[activeRevisionQuestion._id] || ''}
                />
              </div>
            ) : (
              <textarea
                value={draftAnswers[activeRevisionQuestion._id] || ''}
                onChange={(e) => setDraftAnswers((prev) => ({ ...prev, [activeRevisionQuestion._id]: e.target.value }))}
                rows={8}
                style={{ width: '100%', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.15)', padding: '0.9rem', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', resize: 'vertical' }}
                placeholder="Type your revised answer here..."
              />
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <button className="btn btn-secondary btn-sm" onClick={closeRevisionModal}>Cancel</button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSubmitRevision}
                disabled={!draftAnswers[activeRevisionQuestion._id]?.trim() || submittingQuestionId === activeRevisionQuestion._id}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <FiSend size={14} aria-hidden="true" />
                {submittingQuestionId === activeRevisionQuestion._id ? 'Submitting...' : 'Submit Re-evaluation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
