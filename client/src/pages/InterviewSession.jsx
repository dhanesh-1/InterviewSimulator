import { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import SpeechInput from '../components/SpeechInput';
import { speakText, stopSpeaking, getScoreColor, getScoreClass } from '../utils/speechUtils';
import { FiMic, FiEdit3, FiVolume2, FiVolumeX, FiSend, FiArrowRight, FiCheckCircle, FiHome, FiEye } from 'react-icons/fi';

export default function InterviewSession() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [session, setSession] = useState(location.state?.session || null);
  const [resumeContext, setResumeContext] = useState(location.state?.resumeContext || null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerMode, setAnswerMode] = useState('text'); // 'text' or 'speech'
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [finalResult, setFinalResult] = useState(null);
  const [loading, setLoading] = useState(!location.state?.session);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  // Load session if navigated directly
  useEffect(() => {
    if (!session) {
      loadSession();
    }
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const res = await api.get(`/sessions/${sessionId}`);
      const data = res.data;

      if (data.status === 'completed') {
        navigate(`/session/${sessionId}`, { replace: true });
        return;
      }

      // Find first unanswered question
      const firstUnanswered = data.questions.findIndex(q => !q.userAnswer);
      setCurrentIndex(firstUnanswered >= 0 ? firstUnanswered : 0);

      setSession({
        sessionId: data._id,
        role: data.role,
        difficulty: data.difficulty,
        questions: data.questions.map(q => ({
          id: q._id,
          text: q.text,
          type: q.type,
          difficulty: q.difficulty
        }))
      });

      setLoading(false);
    } catch (err) {
      console.error('Load session error:', err);
      navigate('/dashboard');
    }
  };

  const currentQuestion = session?.questions?.[currentIndex];
  const totalQuestions = session?.questions?.length || 0;
  const progress = totalQuestions > 0 ? ((currentIndex + (feedback ? 1 : 0)) / totalQuestions) * 100 : 0;

  // Speak question when it changes
  useEffect(() => {
    if (voiceEnabled && currentQuestion && !feedback) {
      speakText(currentQuestion.text);
    }
    return () => stopSpeaking();
  }, [currentIndex, voiceEnabled, feedback]);

  const handleSpeechTranscript = useCallback((text) => {
    setAnswer(text);
  }, []);

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return;

    setSubmitting(true);
    stopSpeaking();

    try {
      const res = await api.post('/interview/evaluate', {
        sessionId: session.sessionId,
        questionId: currentQuestion.id,
        answer: answer.trim(),
        answeredVia: answerMode
      });

      setFeedback(res.data.evaluation);
    } catch (err) {
      console.error('Evaluate error:', err);
      alert(err.response?.data?.error || 'Failed to evaluate answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    setFeedback(null);
    setAnswer('');

    if (currentIndex + 1 >= totalQuestions) {
      completeSession();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const completeSession = async () => {
    try {
      const res = await api.post('/interview/complete', {
        sessionId: session.sessionId
      });
      setFinalResult(res.data);
      setCompleted(true);
    } catch (err) {
      console.error('Complete session error:', err);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container" style={{ minHeight: '60vh' }}>
          <div className="spinner"></div>
          <p className="loading-text">Loading interview session...</p>
        </div>
      </div>
    );
  }

  // Session completed state
  if (completed && finalResult) {
    return (
      <div className="page-container">
        <div className="glass-card session-complete" style={{ maxWidth: 600, margin: '3rem auto' }}>
          <div className="complete-icon">🎉</div>
          <h1 style={{ fontSize: 'var(--font-3xl)', fontWeight: 700, marginBottom: '0.5rem' }}>Interview Complete!</h1>
          <div className="complete-score">{finalResult.overallScore?.toFixed(1)}/10</div>
          <div className="complete-label">Overall Score</div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--font-xl)', fontWeight: 700, color: 'var(--accent-blue)' }}>
                {finalResult.questions?.length || 0}
              </div>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Questions</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--font-xl)', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                {finalResult.questions?.filter(q => q.evaluation?.overall >= 7).length || 0}
              </div>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Strong Answers</div>
            </div>
          </div>

          <div className="complete-actions">
            <Link to={`/session/${session.sessionId}`} className="btn btn-primary">
              <FiEye size={18} /> Review Answers
            </Link>
            <Link to="/dashboard" className="btn btn-secondary">
              <FiHome size={18} /> Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Progress */}
      <div className="interview-progress">
        <div className="progress-text">
          {session?.role} — Question {currentIndex + 1}/{totalQuestions}
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <button
          className={`btn btn-icon btn-secondary ${voiceEnabled ? 'active' : ''}`}
          onClick={() => { setVoiceEnabled(!voiceEnabled); stopSpeaking(); }}
          title={voiceEnabled ? 'Disable voice' : 'Enable voice for questions'}
          style={voiceEnabled ? { background: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)', borderColor: 'var(--accent-blue)' } : {}}
        >
          {voiceEnabled ? <FiVolume2 size={18} /> : <FiVolumeX size={18} />}
        </button>
      </div>

      <div className="interview-layout">
        {/* Question Panel */}
        <div className="interview-panel">
          <div className="glass-card question-card glass-card-accent">
            <div className="question-header">
              <span className="question-number">Q{currentIndex + 1}</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <span className={`badge badge-${currentQuestion?.type}`}>
                  {currentQuestion?.type}
                </span>
                <span className={`badge badge-${currentQuestion?.difficulty}`}>
                  {currentQuestion?.difficulty}
                </span>
              </div>
            </div>
            <p className="question-text">{currentQuestion?.text}</p>

            {voiceEnabled && !feedback && (
              <div className="question-actions">
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => speakText(currentQuestion?.text)}
                >
                  <FiVolume2 size={14} /> Read Aloud
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Answer Panel */}
        <div className="interview-panel">
          {!feedback ? (
            <div className="glass-card answer-panel" style={{ flex: 1 }}>
              <div className="answer-mode-toggle">
                <button
                  className={`mode-btn ${answerMode === 'text' ? 'active' : ''}`}
                  onClick={() => setAnswerMode('text')}
                >
                  <FiEdit3 size={16} /> Text
                </button>
                <button
                  className={`mode-btn ${answerMode === 'speech' ? 'active' : ''}`}
                  onClick={() => setAnswerMode('speech')}
                >
                  <FiMic size={16} /> Speech
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
                <div style={{ padding: '0.75rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Captured:</strong> {answer}
                </div>
              )}

              <div className="answer-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleSubmitAnswer}
                  disabled={!answer.trim() || submitting}
                  id="submit-answer-btn"
                >
                  {submitting ? (
                    <>
                      <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div>
                      Evaluating...
                    </>
                  ) : (
                    <>
                      <FiSend size={16} /> Submit Answer
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Inline Feedback */
            <div className="glass-card" style={{ flex: 1, animation: 'slideInRight 0.4s ease-out' }}>
              <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiCheckCircle size={20} color="var(--accent-emerald)" /> Evaluation
              </h3>

              <div className="feedback-scores">
                {[
                  { label: 'Relevance', value: feedback.relevance },
                  { label: 'Clarity', value: feedback.clarity },
                  { label: 'Confidence', value: feedback.confidence },
                  { label: 'Overall', value: feedback.overall }
                ].map((score) => (
                  <div className="score-item" key={score.label}>
                    <div className="score-item-value" style={{ color: getScoreColor(score.value) }}>
                      {score.value}
                    </div>
                    <div className="score-item-label">{score.label}</div>
                  </div>
                ))}
              </div>

              <div className="feedback-text">
                <h3>💬 Feedback</h3>
                <p>{feedback.feedback}</p>
              </div>

              {feedback.suggestions?.length > 0 && (
                <div className="feedback-text">
                  <h3>💡 Suggestions</h3>
                  <ul className="suggestions-list">
                    {feedback.suggestions.map((sug, i) => (
                      <li key={i} className="suggestion-item">
                        <span className="suggestion-icon">→</span>
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
                >
                  {currentIndex + 1 >= totalQuestions ? (
                    <><FiCheckCircle size={16} /> Finish Interview</>
                  ) : (
                    <><FiArrowRight size={16} /> Next Question</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
