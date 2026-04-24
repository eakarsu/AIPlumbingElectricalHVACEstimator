const express = require('express');
const router = express.Router();
const { CodeCompliance } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { checkCodeCompliance } = require('../services/aiService');

// Get all
router.get('/', authenticateToken, async (req, res) => {
  try {
    const items = await CodeCompliance.findAll({
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
    const item = await CodeCompliance.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!item) return res.status(404).json({ error: 'Record not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create
router.post('/', authenticateToken, async (req, res) => {
  try {
    const item = await CodeCompliance.create({ ...req.body, user_id: req.user.id });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const item = await CodeCompliance.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!item) return res.status(404).json({ error: 'Record not found' });
    await item.update(req.body);
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const item = await CodeCompliance.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!item) return res.status(404).json({ error: 'Record not found' });
    await item.destroy();
    res.json({ message: 'Record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Compliance Check
router.post('/ai/check', authenticateToken, async (req, res) => {
  try {
    const { description, jurisdiction, category } = req.body;
    const result = await checkCodeCompliance(description, jurisdiction, category);
    const aiContent = result.choices[0].message.content;
    res.json({ compliance: aiContent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
