const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
  title: String,
  company: String,
  duration: String,
  description: String
}, { _id: false });

const educationSchema = new mongoose.Schema({
  degree: String,
  institution: String,
  year: String
}, { _id: false });

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  originalName: {
    type: String,
    required: true
  },
  parsedData: {
    skills: [String],
    experience: [experienceSchema],
    education: [educationSchema],
    summary: String,
    certifications: [String]
  },
  rawText: {
    type: String,
    default: ''
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Resume', resumeSchema);
