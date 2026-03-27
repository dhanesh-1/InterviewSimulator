const express = require('express');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const Resume = require('../models/Resume');
const { extractText, cleanupFile } = require('../services/resumeParser');
const { parseResumeWithAI } = require('../services/gemini');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and DOCX files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// POST /api/resume/upload
router.post('/upload', auth, upload.single('resume'), async (req, res) => {
  let filePath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please upload a PDF or DOCX file.' });
    }

    filePath = req.file.path;
    const originalName = req.file.originalname;

    // Step 1: Extract raw text
    const rawText = await extractText(filePath, originalName);

    if (!rawText || rawText.trim().length < 50) {
      cleanupFile(filePath);
      return res.status(400).json({ error: 'Could not extract enough text from the file. Please upload a valid resume.' });
    }

    // Step 2: Parse with Gemini AI
    const parsedData = await parseResumeWithAI(rawText);

    if (parsedData.isResume === false) {
      cleanupFile(filePath);
      return res.status(400).json({ error: 'Uploaded file does not appear to be a valid resume. Please upload a real resume.' });
    }

    // Step 3: Save to database
    const resume = new Resume({
      userId: req.userId,
      originalName,
      parsedData,
      rawText: rawText.substring(0, 10000) // Limit stored raw text
    });

    await resume.save();

    // Clean up uploaded file
    cleanupFile(filePath);

    res.status(201).json({
      id: resume._id,
      originalName: resume.originalName,
      parsedData: resume.parsedData,
      uploadedAt: resume.uploadedAt
    });
  } catch (error) {
    if (filePath) cleanupFile(filePath);
    console.error('Resume upload error:', error);

    if (error.message && error.message.includes('Only PDF and DOCX')) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: error.message || 'Failed to process resume.' });
  }
});

// GET /api/resume/latest
router.get('/latest', auth, async (req, res) => {
  try {
    const resume = await Resume.findOne({ userId: req.userId })
      .sort({ uploadedAt: -1 });

    if (!resume) {
      return res.status(404).json({ error: 'No resume found. Please upload one.' });
    }

    res.json({
      id: resume._id,
      originalName: resume.originalName,
      parsedData: resume.parsedData,
      uploadedAt: resume.uploadedAt
    });
  } catch (error) {
    console.error('Get latest resume error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/resume/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.userId });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found.' });
    }

    res.json({
      id: resume._id,
      originalName: resume.originalName,
      parsedData: resume.parsedData,
      uploadedAt: resume.uploadedAt
    });
  } catch (error) {
    console.error('Get resume error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Error handling for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size must be less than 5MB.' });
    }
    return res.status(400).json({ error: error.message });
  }
  next(error);
});

module.exports = router;
