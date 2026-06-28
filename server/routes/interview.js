const express = require('express');
const auth = require('../middleware/auth');
const Session = require('../models/Session');
const Resume = require('../models/Resume');
const User = require('../models/User');
const { generateQuestions } = require('../services/openai');
const { evaluateSingleAnswer, calculateSessionScore, getAdaptiveDifficulty } = require('../services/evaluator');
const { isTechnicalRole } = require('../utils/validation');
const { getNextVersionNumber, shouldCreateRevision } = require('../utils/answerVersioning');

const router = express.Router();

// POST /api/interview/start — Generate questions and create session
router.post('/start', auth, async (req, res) => {
  try {
    const { resumeId, role, difficulty } = req.body;

    if (!resumeId) {
      return res.status(400).json({ error: 'Resume is required to start an interview.' });
    }

    if (!role) {
      return res.status(400).json({ error: 'Role is required to start an interview.' });
    }

    if (!isTechnicalRole(role)) {
      return res.status(400).json({
        error: 'Please enter a valid technical role (e.g., Software Engineer, Frontend Developer, Backend Developer, Full Stack Developer, Data Scientist, DevOps Engineer, QA Engineer, Cybersecurity Engineer, AI/ML Engineer, Cloud Engineer, Mobile Developer, UI/UX Developer, Data Engineer, SRE, Product Engineer).'
      });
    }

    // Get resume data
    const resume = await Resume.findOne({ _id: resumeId, userId: req.userId });
    if (!resume) {
      return res.status(400).json({ error: 'Valid resume is required to start an interview.' });
    }
    const parsedResume = resume.parsedData;

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

    // Generate questions via AI
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

    const hasExistingAnswer = Boolean(question.userAnswer && question.userAnswer.trim());
    const shouldStoreRevision = shouldCreateRevision({
      sessionStatus: session.status,
      question,
      hasExistingAnswer
    });

    if (!Array.isArray(question.answerVersions) || question.answerVersions.length === 0) {
      const baseAnswer = hasExistingAnswer ? question.userAnswer : answer;
      const baseEvaluation = hasExistingAnswer ? question.evaluation : evaluation;
      const baseVia = hasExistingAnswer ? (question.answeredVia || 'text') : (answeredVia || 'text');
      const baseAnsweredAt = hasExistingAnswer ? (question.answeredAt || new Date()) : new Date();

      question.answerVersions = [{
        versionNumber: 1,
        answer: baseAnswer,
        answeredVia: baseVia,
        evaluation: baseEvaluation,
        answeredAt: baseAnsweredAt
      }];
    }

    let newVersionNumber = 1;
    if (shouldStoreRevision) {
      newVersionNumber = getNextVersionNumber(question);
      question.answerVersions.push({
        versionNumber: newVersionNumber,
        answer,
        answeredVia: answeredVia || 'text',
        evaluation,
        answeredAt: new Date()
      });
    }

    // Update question in session
    question.userAnswer = answer;
    question.answeredVia = answeredVia || 'text';
    question.evaluation = evaluation;
    question.answeredAt = new Date();

    if (session.status === 'completed') {
      session.overallScore = calculateSessionScore(session.questions);
    }

    await session.save();

    res.json({
      questionId,
      evaluation,
      answeredVia: question.answeredVia,
      versionNumber: newVersionNumber,
      answerVersions: question.answerVersions,
      overallScore: session.overallScore
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
