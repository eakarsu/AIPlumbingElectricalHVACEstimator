const express = require('express');
const router = express.Router();
const { Project } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { callOpenRouter } = require('../services/aiService');

// Get all
router.get('/', authenticateToken, async (req, res) => {
  try {
    const items = await Project.findAll({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(items);
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
router.post('/', authenticateToken, async (req, res) => {
  try {
    const data = { ...req.body, user_id: req.user.id };
    const item = await Project.create(data);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

// AI Project Status Analysis
router.post('/:id/analyze', authenticateToken, async (req, res) => {
  try {
    const item = await Project.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!item) return res.status(404).json({ error: 'Project not found' });

    const messages = [
      {
        role: 'system',
        content: 'You are an expert project manager for plumbing, electrical, and HVAC contracting businesses. Provide detailed project status analysis, risk assessment, and actionable recommendations to keep projects on track and within budget.'
      },
      {
        role: 'user',
        content: `Analyze this ${item.projectType} project and provide a status report:\n\n${JSON.stringify(item.toJSON(), null, 2)}\n\nProvide:\n1. **Project Health Assessment** - overall status and risk level\n2. **Budget Analysis** - budget vs actual cost, projected overruns\n3. **Timeline Assessment** - on track, delayed, or ahead of schedule\n4. **Completion Forecast** - estimated completion based on current progress\n5. **Risk Factors** - potential issues and mitigation strategies\n6. **Recommendations** - next steps and priority actions`
      }
    ];

    const result = await callOpenRouter(messages);
    const aiContent = result.choices[0].message.content;
    res.json({ analysis: aiContent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ai/analyze', authenticateToken, async (req, res) => {
  try {
    const messages = [
      {
        role: 'system',
        content: 'You are an expert project manager for plumbing, electrical, and HVAC contracting businesses. Provide detailed project status analysis, risk assessment, and actionable recommendations to keep projects on track and within budget.'
      },
      {
        role: 'user',
        content: `Analyze this project data and provide insights:\n\n${JSON.stringify(req.body, null, 2)}\n\nProvide:\n1. **Project Health Assessment** - overall status and risk level\n2. **Budget Analysis** - budget vs actual cost, projected overruns\n3. **Timeline Assessment** - on track, delayed, or ahead of schedule\n4. **Completion Forecast** - estimated completion based on current progress\n5. **Risk Factors** - potential issues and mitigation strategies\n6. **Recommendations** - next steps and priority actions`
      }
    ];

    const result = await callOpenRouter(messages);
    const aiContent = result.choices[0].message.content;
    res.json({ analysis: aiContent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
