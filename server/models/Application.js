const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    default: null
  },
  status: {
    type: String,
    enum: ['applied', 'interviewing', 'completed', 'shortlisted', 'rejected'],
    default: 'applied',
    index: true
  },
  // Anti-cheat integrity fields
  tabSwitchCount: {
    type: Number,
    default: 0
  },
  interviewFlags: {
    disconnected: { type: Boolean, default: false },
    resumedAt: { type: Date, default: null }
  },
  // Recruiter decision
  recruiterNote: {
    type: String,
    maxlength: 1000,
    default: ''
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Prevent duplicate applications (one per candidate per job)
applicationSchema.index({ jobId: 1, candidateId: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
