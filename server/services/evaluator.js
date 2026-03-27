const { evaluateAnswer } = require('./gemini');

/**
 * Evaluate a single answer and return normalized scores
 */
async function evaluateSingleAnswer(question, userAnswer, resumeContext) {
  const evaluation = await evaluateAnswer(question, userAnswer, resumeContext);

  // Normalize scores to be within 1-10
  return {
    relevance: Math.min(10, Math.max(1, Math.round(evaluation.relevance || 5))),
    clarity: Math.min(10, Math.max(1, Math.round(evaluation.clarity || 5))),
    confidence: Math.min(10, Math.max(1, Math.round(evaluation.confidence || 5))),
    overall: Math.min(10, Math.max(1, Math.round(evaluation.overall || 5))),
    feedback: evaluation.feedback || 'No feedback available.',
    suggestions: evaluation.suggestions || ['Practice more', 'Structure your answers better', 'Research the topic further']
  };
}

/**
 * Calculate overall session score from all evaluated questions
 */
function calculateSessionScore(questions) {
  const answered = questions.filter(q => q.evaluation && q.evaluation.overall > 0);
  if (answered.length === 0) return 0;

  const totalScore = answered.reduce((sum, q) => sum + q.evaluation.overall, 0);
  return Math.round((totalScore / answered.length) * 10) / 10;
}

/**
 * Determine adaptive difficulty for next question
 */
function getAdaptiveDifficulty(recentScores) {
  if (!recentScores || recentScores.length === 0) return 'medium';

  const avg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;

  if (avg >= 8) return 'hard';
  if (avg >= 5) return 'medium';
  return 'easy';
}

module.exports = { evaluateSingleAnswer, calculateSessionScore, getAdaptiveDifficulty };
