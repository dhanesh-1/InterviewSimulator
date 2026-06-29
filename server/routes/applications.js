const express = require('express');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/roleGuard');
const Application = require('../models/Application');
const Job = require('../models/Job');
const Resume = require('../models/Resume');
const Session = require('../models/Session');
const { extractText, cleanupFile } = require('../services/resumeParser');
const { parseResumeWithAI, generateQuestions } = require('../services/openai');

const router = express.Router();

// ── Multer config (same as resume.js) ────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ];
  allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only PDF and DOCX files are allowed.'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// ── POST /api/applications — Apply to a job (candidate only) ─────────────────
// Accepts a resume file upload + jobId in the body.
// Creates Resume → Application → Session in one atomic flow.
router.post('/', auth, requireRole('candidate'), upload.single('resume'), async (req, res) => {
  let filePath = null;
  try {
    const { jobId } = req.body;

    if (!jobId) return res.status(400).json({ error: 'jobId is required.' });
    if (!req.file) return res.status(400).json({ error: 'Please upload your resume (PDF or DOCX).' });

    filePath = req.file.path;

    // 1. Validate job exists and is still open
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found.' });
    if (job.status !== 'open') return res.status(400).json({ error: 'This job is no longer accepting applications.' });

    // 2. Prevent duplicate applications (edge case)
    const existing = await Application.findOne({ jobId, candidateId: req.userId });
    if (existing) {
      cleanupFile(filePath);
      return res.status(400).json({
        error: 'You have already applied to this job.',
        applicationId: existing._id,
        sessionId: existing.sessionId
      });
    }

    // 3. Parse resume
    const rawText = await extractText(filePath, req.file.originalname);
    if (!rawText || rawText.trim().length < 50) {
      cleanupFile(filePath);
      return res.status(400).json({ error: 'Could not extract enough text from the file. Please upload a valid resume.' });
    }

    const parsedData = await parseResumeWithAI(rawText);
    if (parsedData.isResume === false) {
      cleanupFile(filePath);
      return res.status(400).json({ error: 'Uploaded file does not appear to be a valid resume.' });
    }

    // 4. Save resume
    const resume = new Resume({
      userId: req.userId,
      originalName: req.file.originalname,
      parsedData,
      rawText: rawText.substring(0, 10000)
    });
    await resume.save();
    cleanupFile(filePath);
    filePath = null;

    // 5. Generate questions tailored to BOTH resume and job description
    const questions = await generateQuestions(
      parsedData,
      job.role,
      job.difficulty || 'medium',
      null,
      job.description  // Job description context — new parameter
    );

    // 6. Create interview session
    const session = new Session({
      userId: req.userId,
      resumeId: resume._id,
      role: job.role,
      difficulty: job.difficulty || 'medium',
      questions: questions.map(q => ({ text: q.text, type: q.type, difficulty: q.difficulty })),
      status: 'in-progress'
    });
    await session.save();

    // 7. Create application record
    const application = new Application({
      jobId,
      candidateId: req.userId,
      resumeId: resume._id,
      sessionId: session._id,
      status: 'interviewing'
    });
    await application.save();

    // 8. Increment job applicant count (denormalized)
    await Job.findByIdAndUpdate(jobId, { $inc: { applicantCount: 1 } });

    res.status(201).json({
      applicationId: application._id,
      sessionId: session._id,
      role: job.role,
      difficulty: job.difficulty,
      questions: session.questions.map(q => ({
        id: q._id,
        text: q.text,
        type: q.type,
        difficulty: q.difficulty
      })),
      startedAt: session.startedAt
    });
  } catch (error) {
    if (filePath) cleanupFile(filePath);
    console.error('Apply to job error:', error);
    if (error.message?.includes('Only PDF and DOCX')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Failed to process application.' });
  }
});

// ── GET /api/applications/mine — Candidate's own applications ────────────────
router.get('/mine', auth, requireRole('candidate'), async (req, res) => {
  try {
    const applications = await Application.find({ candidateId: req.userId })
      .populate('jobId', 'title company location type role status')
      .populate('sessionId', 'overallScore status completedAt')
      .sort({ appliedAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── GET /api/applications/job/:jobId — All applicants for a job (recruiter) ──
router.get('/job/:jobId', auth, requireRole('recruiter'), async (req, res) => {
  try {
    // Verify recruiter owns this job
    const job = await Job.findOne({ _id: req.params.jobId, recruiterId: req.userId });
    if (!job) return res.status(404).json({ error: 'Job not found or access denied.' });

    const applications = await Application.find({ jobId: req.params.jobId })
      .populate('candidateId', 'name email')
      .populate('resumeId', 'originalName parsedData')
      .populate('sessionId', 'overallScore status completedAt questions')
      .sort({ appliedAt: -1 });

    // Sort completed applications by score descending (highest first)
    const sorted = applications.sort((a, b) => {
      const scoreA = a.sessionId?.overallScore || 0;
      const scoreB = b.sessionId?.overallScore || 0;
      return scoreB - scoreA;
    });

    res.json(sorted);
  } catch (error) {
    console.error('Get job applicants error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── GET /api/applications/:id — Full application detail ──────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('jobId', 'title company role difficulty description recruiterId')
      .populate('candidateId', 'name email')
      .populate('resumeId', 'originalName parsedData')
      .populate('sessionId');

    if (!application) return res.status(404).json({ error: 'Application not found.' });

    // Authorization: only the candidate themselves OR the job's recruiter
    const isCandidate = application.candidateId._id.toString() === req.userId;
    const isOwningRecruiter = application.jobId.recruiterId?.toString() === req.userId;

    if (!isCandidate && !isOwningRecruiter) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    res.json(application);
  } catch (error) {
    console.error('Get application detail error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── PATCH /api/applications/:id/status — Recruiter: shortlist or reject ──────
router.patch('/:id/status', auth, requireRole('recruiter'), async (req, res) => {
  try {
    const { status, recruiterNote } = req.body;
    if (!['shortlisted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be shortlisted or rejected.' });
    }

    const application = await Application.findById(req.params.id)
      .populate('jobId', 'recruiterId');

    if (!application) return res.status(404).json({ error: 'Application not found.' });
    if (application.jobId.recruiterId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    if (application.status !== 'completed') {
      return res.status(400).json({ error: 'Can only shortlist or reject completed interviews.' });
    }

    application.status = status;
    if (recruiterNote !== undefined) application.recruiterNote = recruiterNote;
    await application.save();

    res.json({ message: `Candidate ${status}.`, application });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── PATCH /api/applications/:id/flags — Anti-cheat flag update (system) ──────
router.patch('/:id/flags', auth, requireRole('candidate'), async (req, res) => {
  try {
    const { tabSwitchCount } = req.body;

    const application = await Application.findOne({
      _id: req.params.id,
      candidateId: req.userId
    });

    if (!application) return res.status(404).json({ error: 'Application not found.' });

    if (typeof tabSwitchCount === 'number') {
      application.tabSwitchCount = tabSwitchCount;
    }

    await application.save();
    res.json({ ok: true });
  } catch (error) {
    console.error('Update flags error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Multer error handler
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File size must be less than 5MB.' });
    return res.status(400).json({ error: error.message });
  }
  next(error);
});

module.exports = router;
