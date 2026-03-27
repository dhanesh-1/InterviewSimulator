const express = require('express');
const auth = require('../middleware/auth');
const Session = require('../models/Session');
const Resume = require('../models/Resume');
const User = require('../models/User');
const { generateQuestions } = require('../services/gemini');
const { evaluateSingleAnswer, calculateSessionScore, getAdaptiveDifficulty } = require('../services/evaluator');

const router = express.Router();

// POST /api/interview/start — Generate questions and create session
router.post('/start', auth, async (req, res) => {
  try {
    const { resumeId, role, difficulty } = req.body;

    if (!role) {
      return res.status(400).json({ error: 'Role is required to start an interview.' });
    }

    // Get resume data
    let parsedResume = { skills: [], experience: [], education: [], summary: '' };
    if (resumeId) {
      const resume = await Resume.findOne({ _id: resumeId, userId: req.userId });
      if (resume) {
        parsedResume = resume.parsedData;
      }
    }

    // Get previous performance for adaptive difficulty
    let previousPerformance = null;
    if (difficulty === 'adaptive') {
      const recentSessions = await Session.find({
        userId: req.userId,
        status: 'completed'
      }).sort({ completedAt: -1 }).limit(5);

      if (recentSessions.length > 0) {
        const avgScore = recentSessions.reduce((sum, s) => sum + s.overallScore, 0) / recentSessions.length;
        previousPerformance = { averageScore: avgScore };
      }
    }

    // Generate questions via Gemini
    const questions = await generateQuestions(parsedResume, role, difficulty || 'medium', previousPerformance);

    // Create session
    const session = new Session({
      userId: req.userId,
      resumeId: resumeId || undefined,
      role,
      difficulty: difficulty || 'medium',
      questions: questions.map(q => ({
        text: q.text,
        type: q.type,
        difficulty: q.difficulty
      })),
      status: 'in-progress'
    });

    await session.save();

    res.status(201).json({
      sessionId: session._id,
      role: session.role,
      difficulty: session.difficulty,
      questions: session.questions.map(q => ({
        id: q._id,
        text: q.text,
        type: q.type,
        difficulty: q.difficulty
      })),
      startedAt: session.startedAt
    });
  } catch (error) {
    console.error('Start interview error:', error);
    res.status(500).json({ error: error.message || 'Failed to start interview.' });
  }
});

// POST /api/interview/evaluate — Evaluate a single answer
router.post('/evaluate', auth, async (req, res) => {
  try {
    const { sessionId, questionId, answer, answeredVia } = req.body;

    if (!sessionId || !questionId || !answer) {
      return res.status(400).json({ error: 'sessionId, questionId, and answer are required.' });
    }

    const session = await Session.findOne({ _id: sessionId, userId: req.userId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    const question = session.questions.id(questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found.' });
    }

    // Get resume context for better evaluation
    let resumeContext = null;
    if (session.resumeId) {
      const resume = await Resume.findById(session.resumeId);
      if (resume) resumeContext = resume.parsedData;
    }

    // Evaluate with AI
    const evaluation = await evaluateSingleAnswer(question, answer, resumeContext);

    // Update question in session
    question.userAnswer = answer;
    question.answeredVia = answeredVia || 'text';
    question.evaluation = evaluation;
    question.answeredAt = new Date();

    await session.save();

    res.json({
      questionId,
      evaluation,
      answeredVia: question.answeredVia
    });
  } catch (error) {
    console.error('Evaluate answer error:', error);
    res.status(500).json({ error: error.message || 'Failed to evaluate answer.' });
  }
});

// POST /api/interview/complete — Finalize a session
router.post('/complete', auth, async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required.' });
    }

    const session = await Session.findOne({ _id: sessionId, userId: req.userId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    // Calculate overall score
    const overallScore = calculateSessionScore(session.questions);
    session.overallScore = overallScore;
    session.status = 'completed';
    session.completedAt = new Date();

    await session.save();

    // Update user stats
    const user = await User.findById(req.userId);
    const completedSessions = await Session.countDocuments({
      userId: req.userId,
      status: 'completed'
    });

    const allSessions = await Session.find({
      userId: req.userId,
      status: 'completed'
    });

    const avgScore = allSessions.length > 0
      ? Math.round((allSessions.reduce((sum, s) => sum + s.overallScore, 0) / allSessions.length) * 10) / 10
      : 0;

    user.totalSessions = completedSessions;
    user.averageScore = avgScore;
    await user.save();

    res.json({
      sessionId: session._id,
      overallScore,
      status: 'completed',
      completedAt: session.completedAt,
      questions: session.questions
    });
  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({ error: error.message || 'Failed to complete session.' });
  }
});

module.exports = router;
