const express = require('express');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/roleGuard');
const Job = require('../models/Job');
const User = require('../models/User');
const { isTechnicalRole } = require('../utils/validation');

const router = express.Router();

// POST /api/jobs — Create a job posting (recruiter only)
router.post('/', auth, requireRole('recruiter'), async (req, res) => {
  try {
    const { title, description, role, difficulty, requirements, location, type } = req.body;

    if (!title || !description || !role) {
      return res.status(400).json({ error: 'Title, description, and role are required.' });
    }

    if (!isTechnicalRole(role)) {
      return res.status(400).json({ error: 'Please enter a valid technical role (e.g., Software Engineer, Frontend Developer).' });
    }

    // Get company name from recruiter's profile
    const recruiter = await User.findById(req.userId).select('company name');

    const job = new Job({
      recruiterId: req.userId,
      title: title.trim(),
      company: recruiter.company || recruiter.name,
      location: location?.trim() || 'Remote',
      type: type || 'full-time',
      description: description.trim(),
      requirements: Array.isArray(requirements) ? requirements.filter(r => r.trim()) : [],
      role: role.trim(),
      difficulty: difficulty || 'medium',
      status: 'open'
    });

    await job.save();
    res.status(201).json(job);
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ error: 'Failed to create job posting.' });
  }
});

// GET /api/jobs — List all open jobs (public — candidates browse)
router.get('/', auth, async (req, res) => {
  try {
    const { search, type } = req.query;
    const filter = { status: 'open' };
    if (type && ['full-time', 'part-time', 'contract', 'internship'].includes(type)) {
      filter.type = type;
    }

    let jobs = await Job.find(filter)
      .populate('recruiterId', 'name company')
      .sort({ createdAt: -1 })
      .select('-__v');

    if (search) {
      const q = search.toLowerCase();
      jobs = jobs.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.role.toLowerCase().includes(q) ||
        j.company?.toLowerCase().includes(q)
      );
    }

    res.json(jobs);
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch job listings.' });
  }
});

// GET /api/jobs/mine — Recruiter's own job postings
router.get('/mine', auth, requireRole('recruiter'), async (req, res) => {
  try {
    const jobs = await Job.find({ recruiterId: req.userId })
      .sort({ createdAt: -1 })
      .select('-__v');
    res.json(jobs);
  } catch (error) {
    console.error('Get my jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch your job listings.' });
  }
});

// GET /api/jobs/:id — Single job detail
router.get('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('recruiterId', 'name company');
    if (!job) {
      return res.status(404).json({ error: 'Job not found.' });
    }
    res.json(job);
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ error: 'Failed to fetch job.' });
  }
});

// PATCH /api/jobs/:id — Edit a job (recruiter, own job only)
router.patch('/:id', auth, requireRole('recruiter'), async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, recruiterId: req.userId });
    if (!job) {
      return res.status(404).json({ error: 'Job not found or access denied.' });
    }

    const { title, description, role, difficulty, requirements, location, type } = req.body;

    if (role && !isTechnicalRole(role)) {
      return res.status(400).json({ error: 'Please enter a valid technical role.' });
    }

    if (title) job.title = title.trim();
    if (description) job.description = description.trim();
    if (role) job.role = role.trim();
    if (difficulty) job.difficulty = difficulty;
    if (requirements) job.requirements = requirements.filter(r => r.trim());
    if (location) job.location = location.trim();
    if (type) job.type = type;

    await job.save();
    res.json(job);
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ error: 'Failed to update job.' });
  }
});

// PATCH /api/jobs/:id/status — Open or close a job (soft delete)
router.patch('/:id/status', auth, requireRole('recruiter'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['open', 'closed', 'draft'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be open, closed, or draft.' });
    }

    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, recruiterId: req.userId },
      { status },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({ error: 'Job not found or access denied.' });
    }

    res.json({ message: `Job status updated to '${status}'.`, job });
  } catch (error) {
    console.error('Update job status error:', error);
    res.status(500).json({ error: 'Failed to update job status.' });
  }
});

module.exports = router;
