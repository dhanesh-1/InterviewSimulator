const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: 120
  },
  company: {
    type: String,
    trim: true,
    maxlength: 100,
    default: ''
  },
  location: {
    type: String,
    trim: true,
    maxlength: 100,
    default: 'Remote'
  },
  type: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship'],
    default: 'full-time'
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    maxlength: 5000
  },
  requirements: {
    type: [String],
    default: []
  },
  role: {
    type: String,
    required: [true, 'Technical role is required'],
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'adaptive'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'draft'],
    default: 'open',
    index: true
  },
  applicantCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Job', jobSchema);
