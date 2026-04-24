const express = require('express');
const router = express.Router();
const { Permit } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { callOpenRouter } = require('../services/aiService');

// Get all
router.get('/', authenticateToken, async (req, res) => {
  try {
    const items = await Permit.findAll({
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
    const item = await Permit.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!item) return res.status(404).json({ error: 'Permit not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create
router.post('/', authenticateToken, async (req, res) => {
  try {
    const data = { ...req.body, user_id: req.user.id };
    const item = await Permit.create(data);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const item = await Permit.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!item) return res.status(404).json({ error: 'Permit not found' });

    const data = { ...req.body };
    await item.update(data);
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const item = await Permit.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!item) return res.status(404).json({ error: 'Permit not found' });
    await item.destroy();
    res.json({ message: 'Permit deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Permit Analysis
router.post('/ai/analyze', authenticateToken, async (req, res) => {
  try {
    const messages = [
      {
        role: 'system',
        content: 'You are an expert building permit specialist for plumbing, electrical, and HVAC trades. Provide detailed guidance on permit requirements, application processes, inspection preparation, code compliance, and approval timelines.'
      },
      {
        role: 'user',
        content: `Analyze this permit information and provide insights:\n\n${JSON.stringify(req.body, null, 2)}\n\nProvide:\n1. **Permit Requirements** assessment\n2. **Application Status** guidance\n3. **Inspection Preparation** checklist\n4. **Code Compliance** considerations\n5. **Timeline Estimates** for approval\n6. **Recommendations** for expediting the process`
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
