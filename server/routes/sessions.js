const express = require('express');
const auth = require('../middleware/auth');
const Session = require('../models/Session');

const router = express.Router();

// GET /api/sessions/stats — Aggregated performance stats
router.get('/stats', auth, async (req, res) => {
  try {
    const sessions = await Session.find({
      userId: req.userId,
      status: 'completed'
    }).sort({ completedAt: -1 });

    const totalSessions = sessions.length;

    if (totalSessions === 0) {
      return res.json({
        totalSessions: 0,
        averageScore: 0,
        bestScore: 0,
        recentTrend: 0,
        scoreHistory: [],
        categoryBreakdown: { technical: 0, behavioral: 0, HR: 0, situational: 0 }
      });
    }

    const averageScore = Math.round(
      (sessions.reduce((sum, s) => sum + s.overallScore, 0) / totalSessions) * 10
    ) / 10;

    const bestScore = Math.max(...sessions.map(s => s.overallScore));

    // Calculate trend (last 5 vs previous 5)
    let recentTrend = 0;
    if (totalSessions >= 2) {
      const recent = sessions.slice(0, Math.min(5, totalSessions));
      const recentAvg = recent.reduce((s, sess) => s + sess.overallScore, 0) / recent.length;

      if (totalSessions > 5) {
        const older = sessions.slice(5, Math.min(10, totalSessions));
        const olderAvg = older.reduce((s, sess) => s + sess.overallScore, 0) / older.length;
        recentTrend = Math.round((recentAvg - olderAvg) * 10) / 10;
      }
    }

    // Score history for chart (last 20 sessions, oldest first)
    const scoreHistory = sessions
      .slice(0, 20)
      .reverse()
      .map(s => ({
        date: s.completedAt,
        score: s.overallScore,
        role: s.role
      }));

    // Category breakdown (average scores by question type)
    const categoryScores = { technical: [], behavioral: [], HR: [], situational: [] };
    sessions.forEach(s => {
      s.questions.forEach(q => {
        if (q.evaluation && q.evaluation.overall > 0 && categoryScores[q.type]) {
          categoryScores[q.type].push(q.evaluation.overall);
        }
      });
    });

    const categoryBreakdown = {};
    for (const [type, scores] of Object.entries(categoryScores)) {
      categoryBreakdown[type] = scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
        : 0;
    }

    res.json({
      totalSessions,
      averageScore,
      bestScore,
      recentTrend,
      scoreHistory,
      categoryBreakdown
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/sessions — List all sessions
router.get('/', auth, async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .select('role difficulty overallScore status startedAt completedAt questions');

    const result = sessions.map(s => ({
      id: s._id,
      role: s.role,
      difficulty: s.difficulty,
      overallScore: s.overallScore,
      status: s.status,
      questionCount: s.questions.length,
      answeredCount: s.questions.filter(q => q.userAnswer).length,
      startedAt: s.startedAt,
      completedAt: s.completedAt
    }));

    res.json(result);
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/sessions/:id — Get session detail
router.get('/:id', auth, async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    res.json(session);
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
