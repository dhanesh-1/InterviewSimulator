const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema({
  relevance: { type: Number, min: 0, max: 10, default: 0 },
  clarity: { type: Number, min: 0, max: 10, default: 0 },
  confidence: { type: Number, min: 0, max: 10, default: 0 },
  overall: { type: Number, min: 0, max: 10, default: 0 },
  feedback: { type: String, default: '' },
  suggestions: [String]
}, { _id: false });

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: {
    type: String,
    enum: ['technical', 'behavioral', 'HR', 'situational'],
    default: 'technical'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  userAnswer: { type: String, default: '' },
  answeredVia: {
    type: String,
    enum: ['text', 'speech', ''],
    default: ''
  },
  evaluation: { type: evaluationSchema, default: () => ({}) },
  answeredAt: Date
}, { _id: true });

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume'
  },
  role: {
    type: String,
    required: true,
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'adaptive'],
    default: 'medium'
  },
  questions: [questionSchema],
  overallScore: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed'],
    default: 'in-progress'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Session', sessionSchema);
