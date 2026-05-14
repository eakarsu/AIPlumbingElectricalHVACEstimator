const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const { JobQuote, AiResult } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { analyzeJobQuote, analyzePhoto, parseAIJson } = require('../services/aiService');

// Multer setup for photo uploads
const upload = multer({
  dest: path.join(__dirname, '../../uploads/photos/'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  }
});

// Multer setup for document/invoice uploads
const docUpload = multer({
  dest: path.join(__dirname, '../../uploads/documents/'),
  limits: { fileSize: 25 * 1024 * 1024 }
});

// Get all job quotes with pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await JobQuote.findAndCountAll({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
    res.json({ quotes: rows, total: count, page, totalPages: Math.ceil(count / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single job quote
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const quote = await JobQuote.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    res.json(quote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create job quote (with input validation)
router.post('/',
  authenticateToken,
  [
    body('title').notEmpty().withMessage('title is required'),
    body('description').notEmpty().withMessage('description is required'),
    body('jobType').notEmpty().withMessage('jobType is required'),
    body('customerName').notEmpty().withMessage('customerName is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const quote = await JobQuote.create({ ...req.body, user_id: req.user.id });
      res.status(201).json(quote);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Update job quote
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const quote = await JobQuote.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    await quote.update(req.body);
    res.json(quote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete job quote
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const quote = await JobQuote.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    await quote.destroy();
    res.json({ message: 'Quote deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Customer accept (e-signature simulation)
router.put('/:id/customer-accept', authenticateToken, async (req, res) => {
  try {
    const quote = await JobQuote.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    await quote.update({
      status: 'accepted',
      accepted_at: new Date(),
      customer_signature: 'accepted_digitally'
    });
    res.json(quote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Analysis for job quote
router.post('/:id/analyze', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const quote = await JobQuote.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!quote) return res.status(404).json({ error: 'Quote not found' });

    const result = await analyzeJobQuote(quote.description, quote.jobType);
    const aiContent = result.choices[0].message.content;
    const parsed = parseAIJson(aiContent);

    const updates = { aiAnalysis: aiContent };
    if (parsed) {
      if (parsed.estimated_cost_range) {
        updates.estimatedCost = parsed.estimated_cost_range.max || 0;
      }
      if (parsed.labor_hours) {
        updates.laborHours = parsed.labor_hours;
      }
    }

    await quote.update(updates);

    // Persist to ai_results
    await AiResult.create({
      userId: req.user.id,
      endpoint: 'job-quotes/analyze',
      quoteId: quote.id,
      result: parsed || { raw: aiContent }
    });

    res.json({ analysis: aiContent, parsed, quote });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Analysis for new quote (without saving)
router.post('/ai/analyze', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { description, jobType } = req.body;
    const result = await analyzeJobQuote(description, jobType);
    const aiContent = result.choices[0].message.content;
    const parsed = parseAIJson(aiContent);

    // Persist to ai_results
    await AiResult.create({
      userId: req.user.id,
      endpoint: 'job-quotes/ai/analyze',
      quoteId: null,
      result: parsed || { raw: aiContent }
    });

    res.json({ analysis: aiContent, parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload file (photo/invoice/document) to a job quote estimate
router.post('/:id/upload', authenticateToken, docUpload.single('file'), async (req, res) => {
  try {
    const quote = await JobQuote.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const fileRef = {
      originalName: req.file.originalname,
      storedName: req.file.filename,
      path: req.file.path,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date().toISOString()
    };

    // Store file reference in photoUrl field (as JSON string with file metadata)
    const existing = quote.photoUrl ? (() => { try { return JSON.parse(quote.photoUrl); } catch { return []; } })() : [];
    const updated = Array.isArray(existing) ? [...existing, fileRef] : [fileRef];
    await quote.update({ photoUrl: JSON.stringify(updated) });

    res.json({ message: 'File uploaded successfully', file: fileRef, quote });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Photo-to-Quote vision AI
router.post('/analyze-photo', authenticateToken, aiRateLimiter, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No photo uploaded' });

    const fileBuffer = fs.readFileSync(req.file.path);
    const base64Image = fileBuffer.toString('base64');

    // Clean up temp file
    fs.unlinkSync(req.file.path);

    const result = await analyzePhoto(base64Image);
    const aiContent = result.choices[0].message.content;
    const parsed = parseAIJson(aiContent);

    // Create a pre-filled JobQuote from the photo analysis
    let newQuote = null;
    if (parsed) {
      newQuote = await JobQuote.create({
        user_id: req.user.id,
        title: `Photo Analysis - ${parsed.service_type || 'Unknown'} Service`,
        description: `Equipment: ${(parsed.equipment_identified || []).join(', ')}. Issues: ${(parsed.visible_issues || []).join(', ')}`,
        jobType: parsed.service_type || 'general',
        customerName: 'TBD',
        status: 'pending',
        estimatedCost: parsed.preliminary_cost_range ? parsed.preliminary_cost_range.max : 0,
        aiAnalysis: aiContent
      });
    }

    // Persist to ai_results
    await AiResult.create({
      userId: req.user.id,
      endpoint: 'job-quotes/analyze-photo',
      quoteId: newQuote ? newQuote.id : null,
      result: parsed || { raw: aiContent }
    });

    res.json({ analysis: aiContent, parsed, quote: newQuote });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
