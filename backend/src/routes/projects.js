const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Project, AiResult } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { callOpenRouter, parseAIJson } = require('../services/aiService');

// Get all with pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await Project.findAndCountAll({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
    res.json({
      data: rows,
      pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const item = await Project.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!item) return res.status(404).json({ error: 'Project not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create
router.post('/',
  authenticateToken,
  [
    body('name').notEmpty().withMessage('name is required'),
    body('projectType').notEmpty().withMessage('projectType is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const data = { ...req.body, user_id: req.user.id };
      const item = await Project.create(data);
      res.status(201).json(item);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Update
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const item = await Project.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!item) return res.status(404).json({ error: 'Project not found' });
    await item.update(req.body);
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const item = await Project.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!item) return res.status(404).json({ error: 'Project not found' });
    await item.destroy();
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Project Status Analysis for existing project
router.post('/:id/analyze', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const item = await Project.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!item) return res.status(404).json({ error: 'Project not found' });

    const messages = [
      {
        role: 'system',
        content: 'You are an expert project manager for plumbing, electrical, and HVAC contracting businesses. Provide detailed project status analysis, risk assessment, and actionable recommendations.'
      },
      {
        role: 'user',
        content: `Analyze this ${item.projectType} project and provide a status report:\n\n${JSON.stringify(item.toJSON(), null, 2)}\n\nProvide:\n1. **Project Health Assessment** - overall status and risk level\n2. **Budget Analysis** - budget vs actual cost, projected overruns\n3. **Timeline Assessment** - on track, delayed, or ahead of schedule\n4. **Completion Forecast** - estimated completion based on current progress\n5. **Risk Factors** - potential issues and mitigation strategies\n6. **Recommendations** - next steps and priority actions`
      }
    ];

    const result = await callOpenRouter(messages);
    const aiContent = result.choices[0].message.content;

    await AiResult.create({
      userId: req.user.id,
      endpoint: 'projects/analyze',
      quoteId: item.id,
      result: { raw: aiContent }
    });

    res.json({ analysis: aiContent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Analysis for new/general project data
router.post('/ai/analyze', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const messages = [
      {
        role: 'system',
        content: 'You are an expert project manager for plumbing, electrical, and HVAC contracting businesses. Provide detailed project status analysis, risk assessment, and actionable recommendations.'
      },
      {
        role: 'user',
        content: `Analyze this project data and provide insights:\n\n${JSON.stringify(req.body, null, 2)}\n\nProvide:\n1. **Project Health Assessment** - overall status and risk level\n2. **Budget Analysis** - budget vs actual cost, projected overruns\n3. **Timeline Assessment** - on track, delayed, or ahead of schedule\n4. **Completion Forecast** - estimated completion based on current progress\n5. **Risk Factors** - potential issues and mitigation strategies\n6. **Recommendations** - next steps and priority actions`
      }
    ];

    const result = await callOpenRouter(messages);
    const aiContent = result.choices[0].message.content;

    await AiResult.create({
      userId: req.user.id,
      endpoint: 'projects/ai/analyze',
      quoteId: null,
      result: { raw: aiContent }
    });

    res.json({ analysis: aiContent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
