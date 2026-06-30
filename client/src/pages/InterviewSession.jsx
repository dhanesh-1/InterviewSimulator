import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import SpeechInput from '../components/SpeechInput';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorAlert from '../components/ui/ErrorAlert';
import Badge from '../components/ui/Badge';
import { speakText, stopSpeaking, getScoreColor } from '../utils/speechUtils';
import {
  FiMic, FiEdit3, FiVolume2, FiVolumeX, FiSend, FiArrowRight,
  FiCheckCircle, FiHome, FiEye, FiAlertTriangle, FiMessageSquare, FiZap,
} from 'react-icons/fi';

export default function InterviewSession() {
  const { sessionId } = useParams();
  const location      = useLocation();
  const navigate      = useNavigate();

  // If this session was started via a job application, receive applicationId
  const applicationId = location.state?.applicationId || null;

  const [session,      setSession]      = useState(location.state?.session ? { ...location.state.session, applicationId } : null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerMode,   setAnswerMode]   = useState('text');
  const [answer,       setAnswer]       = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [feedback,     setFeedback]     = useState(null);
  const [completed,    setCompleted]    = useState(false);
  const [finalResult,  setFinalResult]  = useState(null);
  const [loading,      setLoading]      = useState(!location.state?.session);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [submitError,  setSubmitError]  = useState('');
  const [tabWarning,   setTabWarning]   = useState(false);

  const submitRef   = useRef(false);  // prevent duplicate submits
  const questionRef = useRef(null);   // for focus management
  const tabCountRef = useRef(0);      // anti-cheat tab switch counter

  const currentApplicationId = session?.applicationId || applicationId;

  // ── Anti-cheat: tab switch detection (only for job-linked interviews) ─────────
  useEffect(() => {
    if (!currentApplicationId) return;
    const onBlur = () => {
      tabCountRef.current += 1;
      setTabWarning(true);
      // Report to backend (fire and forget)
      api.patch(`/applications/${currentApplicationId}/flags`, { tabSwitchCount: tabCountRef.current }).catch(() => {});
    };
    window.addEventListener('blur', onBlur);
    return () => window.removeEventListener('blur', onBlur);
  }, [currentApplicationId]);

  // ── Load session if navigated directly ──────────────────────────────────────
  useEffect(() => {
    if (!session) loadSession();
  }, [sessionId]);   // eslint-disable-line react-hooks/exhaustive-deps

  const loadSession = async () => {
    try {
      const res  = await api.get(`/sessions/${sessionId}`);
      const data = res.data;

      if (data.status === 'completed') {
        navigate(`/session/${sessionId}`, { replace: true });
        return;
      }

      const firstUnanswered = data.questions.findIndex((q) => !q.userAnswer);
      setCurrentIndex(firstUnanswered >= 0 ? firstUnanswered : 0);

      setSession({
        sessionId: data._id,
        role:       data.role,
        difficulty: data.difficulty,
        questions:  data.questions.map((q) => ({
          id:         q._id,
          text:       q.text,
          type:       q.type,
          difficulty: q.difficulty,
        })),
        applicationId: data.applicationId || applicationId
      });
      setLoading(false);
    } catch (err) {
      console.error('Load session error:', err);
      navigate('/dashboard');
    }
  };

  const currentQuestion = session?.questions?.[currentIndex];
  const totalQuestions  = session?.questions?.length || 0;
  const progress        = totalQuestions > 0
    ? ((currentIndex + (feedback ? 1 : 0)) / totalQuestions) * 100
    : 0;

  // ── Speak question on change ─────────────────────────────────────────────────
  useEffect(() => {
    if (voiceEnabled && currentQuestion && !feedback) {
      speakText(currentQuestion.text);
    }
    return () => stopSpeaking();
  }, [currentIndex, voiceEnabled, feedback]);

  // ── Focus question card on question change for accessibility ─────────────────
  useEffect(() => {
    if (questionRef.current && !loading && !completed) {
      questionRef.current.focus();
    }
  }, [currentIndex, loading, completed]);

  const handleSpeechTranscript = useCallback((text) => setAnswer(text), []);

  // ── Submit answer ────────────────────────────────────────────────────────────
  const handleSubmitAnswer = async () => {
    if (!answer.trim() || submitRef.current) return;

    submitRef.current = true;
    setSubmitting(true);
    setSubmitError('');
    stopSpeaking();

    try {
      const res = await api.post('/interview/evaluate', {
        sessionId:   session.sessionId,
        questionId:  currentQuestion.id,
        answer:      answer.trim(),
        answeredVia: answerMode,
      });

      if (currentApplicationId) {
        setAnswer('');
        if (currentIndex + 1 >= totalQuestions) {
          completeSession();
        } else {
          setCurrentIndex((prev) => prev + 1);
        }
      } else {
        setFeedback(res.data.evaluation);
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to evaluate answer. Please try again.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
      submitRef.current = false;
    }
  };

  // ── Next question ────────────────────────────────────────────────────────────
  const handleNextQuestion = () => {
    setFeedback(null);
    setAnswer('');
    setSubmitError('');

    if (currentIndex + 1 >= totalQuestions) {
      completeSession();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // ── Complete session ─────────────────────────────────────────────────────────
  const completeSession = async () => {
    try {
      const res = await api.post('/interview/complete', { sessionId: session.sessionId });
      setFinalResult(res.data);
      setCompleted(true);
    } catch (err) {
      console.error('Complete session error:', err);
      setSubmitError('Failed to save your session. Please try again.');
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page-container">
        <LoadingSpinner size="lg" label="Loading interview session..." center />
      </div>
    );
  }

  // ── Session complete screen ──────────────────────────────────────────────────
  if (completed && finalResult) {
    const strongCount = finalResult.questions?.filter((q) => q.evaluation?.overall >= 7).length || 0;
    return (
      <div className="page-container">
        <div className="glass-card session-complete" style={{ maxWidth: 600, margin: '3rem auto', textAlign: 'center' }}>
          <div className="complete-icon" aria-hidden="true"><FiCheckCircle size={48} color="var(--accent-emerald)" /></div>
          <h1 style={{ fontSize: 'var(--font-3xl)', fontWeight: 700, marginBottom: '0.5rem' }}>
            Interview Complete!
          </h1>
          
          {currentApplicationId ? (
            <p style={{ margin: '1.5rem 0', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Thank you for completing the interview. Your responses have been submitted to the recruiter. We will be in touch with you soon regarding your application.
            </p>
          ) : (
            <>
              <div className="complete-score" aria-label={`Overall score: ${finalResult.overallScore?.toFixed(1)} out of 10`}>
                {finalResult.overallScore?.toFixed(1)}/10
              </div>
              <div className="complete-label">Overall Score</div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', margin: '1.5rem 0' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--font-xl)', fontWeight: 700, color: 'var(--accent-blue)' }}>
                    {finalResult.questions?.length || 0}
                  </div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Questions</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--font-xl)', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                    {strongCount}
                  </div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Strong Answers</div>
                </div>
              </div>
            </>
          )}

          <div className="complete-actions">
            {!currentApplicationId && (
              <Link to={`/session/${session.sessionId}`} className="btn btn-primary">
                <FiEye size={18} aria-hidden="true" /> Review Answers
              </Link>
            )}
            <Link to="/dashboard" className="btn btn-secondary">
              <FiHome size={18} aria-hidden="true" /> Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* ── Progress bar ── */}
      <div className="interview-progress" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Interview progress">
        <div className="progress-text">
          {session?.role} — Question {currentIndex + 1}/{totalQuestions}
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <button
          className={`btn btn-icon btn-secondary ${voiceEnabled ? 'active' : ''}`}
          onClick={() => { setVoiceEnabled((v) => !v); stopSpeaking(); }}
          aria-label={voiceEnabled ? 'Disable voice read-aloud' : 'Enable voice read-aloud'}
          style={voiceEnabled ? { background: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)', borderColor: 'var(--accent-blue)' } : {}}
          type="button"
        >
          {voiceEnabled ? <FiVolume2 size={18} /> : <FiVolumeX size={18} />}
        </button>
      </div>

      {/* ── Anti-cheat tab warning ── */}
      {tabWarning && currentApplicationId && (
        <div className="anti-cheat-banner" role="alert" style={{ margin: '0 0 1rem' }}>
          <FiAlertTriangle size={16} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
          <span><strong>Warning:</strong> Tab switching detected ({tabCountRef.current} time{tabCountRef.current > 1 ? 's' : ''}). This is recorded and visible to the recruiter. Please stay on this page.</span>
        </div>
      )}

      <div className="interview-layout">
        {/* ── Question Panel ── */}
        <div className="interview-panel">
          <div
            className="glass-card question-card glass-card-accent"
            ref={questionRef}
            tabIndex={-1}
            aria-label={`Question ${currentIndex + 1}: ${currentQuestion?.text}`}
          >
            <div className="question-header">
              <span className="question-number" aria-hidden="true">Q{currentIndex + 1}</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Badge variant={currentQuestion?.type}>{currentQuestion?.type}</Badge>
                <Badge variant={currentQuestion?.difficulty}>{currentQuestion?.difficulty}</Badge>
              </div>
            </div>
            <p className="question-text">{currentQuestion?.text}</p>

            {voiceEnabled && !feedback && (
              <div className="question-actions">
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => speakText(currentQuestion?.text)}
                  type="button"
                  aria-label="Read question aloud"
                >
                  <FiVolume2 size={14} aria-hidden="true" /> Read Aloud
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Answer Panel ── */}
        <div className="interview-panel">
          {!feedback ? (
            <div className="glass-card answer-panel" style={{ flex: 1 }}>
              {/* Mode toggle */}
              <div className="answer-mode-toggle" role="group" aria-label="Answer mode">
                <button
                  className={`mode-btn ${answerMode === 'text' ? 'active' : ''}`}
                  onClick={() => setAnswerMode('text')}
                  aria-pressed={answerMode === 'text'}
                  type="button"
                >
                  <FiEdit3 size={16} aria-hidden="true" /> Text
                </button>
                <button
                  className={`mode-btn ${answerMode === 'speech' ? 'active' : ''}`}
                  onClick={() => setAnswerMode('speech')}
                  aria-pressed={answerMode === 'speech'}
                  type="button"
                >
                  <FiMic size={16} aria-hidden="true" /> Speech
                </button>
              </div>

              {answerMode === 'text' ? (
                <div className="answer-textarea-wrapper">
                  <textarea
                    className="form-textarea"
                    placeholder="Type your answer here... Be detailed and structured for a better evaluation."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    disabled={submitting}
                    id="answer-textarea"
                    aria-label="Your answer"
                    aria-required="true"
                  />
                </div>
              ) : (
                <SpeechInput
                  onTranscript={handleSpeechTranscript}
                  disabled={submitting}
                  initialTranscript={answer}
                />
              )}

              {answerMode === 'speech' && answer && (
                <div
                  style={{ padding: '0.75rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}
                  aria-live="polite"
                >
                  <strong style={{ color: 'var(--text-primary)' }}>Captured:</strong> {answer}
                </div>
              )}

              <ErrorAlert message={submitError} onDismiss={() => setSubmitError('')} />

              <div className="answer-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleSubmitAnswer}
                  disabled={!answer.trim() || submitting}
                  id="submit-answer-btn"
                  aria-busy={submitting}
                  type="button"
                >
                  {submitting ? (
                    <><LoadingSpinner size="sm" /> Evaluating...</>
                  ) : (
                    <><FiSend size={16} aria-hidden="true" /> Submit Answer</>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* ── Inline Feedback ── */
            <div className="glass-card" style={{ flex: 1, animation: 'slideInRight 0.4s ease-out' }}>
              <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiCheckCircle size={20} color="var(--accent-emerald)" aria-hidden="true" /> Evaluation
              </h3>

              <div className="feedback-scores" role="list" aria-label="Score breakdown">
                {[
                  { label: 'Relevance',  value: feedback.relevance },
                  { label: 'Clarity',    value: feedback.clarity },
                  { label: 'Confidence', value: feedback.confidence },
                  { label: 'Overall',    value: feedback.overall },
                ].map((score) => (
                  <div
                    key={score.label}
                    className="score-item"
                    role="listitem"
                    aria-label={`${score.label}: ${score.value} out of 10`}
                  >
                    <div className="score-item-value" style={{ color: getScoreColor(score.value) }}>
                      {score.value}
                    </div>
                    <div className="score-item-label">{score.label}</div>
                  </div>
                ))}
              </div>

              <div className="feedback-text">
                <h3><FiMessageSquare size={15} style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />Feedback</h3>
                <p>{feedback.feedback}</p>
              </div>

              {feedback.suggestions?.length > 0 && (
                <div className="feedback-text">
                  <h3><FiZap size={15} style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />Suggestions</h3>
                  <ul className="suggestions-list" role="list">
                    {feedback.suggestions.map((sug, i) => (
                      <li key={i} className="suggestion-item" role="listitem">
                        <span className="suggestion-icon" aria-hidden="true">→</span>
                        {sug}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="feedback-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleNextQuestion}
                  id="next-question-btn"
                  type="button"
                >
                  {currentIndex + 1 >= totalQuestions
                    ? <><FiCheckCircle size={16} aria-hidden="true" /> Finish Interview</>
                    : <><FiArrowRight size={16} aria-hidden="true" /> Next Question</>
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
