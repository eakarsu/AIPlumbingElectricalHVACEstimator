const express = require('express');
const router = express.Router();
const { Warranty } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { callOpenRouter } = require('../services/aiService');

// Get all
router.get('/', authenticateToken, async (req, res) => {
  try {
    const items = await Warranty.findAll({
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
    const item = await Warranty.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!item) return res.status(404).json({ error: 'Warranty not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create
router.post('/', authenticateToken, async (req, res) => {
  try {
    const data = { ...req.body, user_id: req.user.id };
    const item = await Warranty.create(data);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const item = await Warranty.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!item) return res.status(404).json({ error: 'Warranty not found' });

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
    const item = await Warranty.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!item) return res.status(404).json({ error: 'Warranty not found' });
    await item.destroy();
    res.json({ message: 'Warranty deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Warranty Analysis
router.post('/ai/analyze', authenticateToken, async (req, res) => {
  try {
    const messages = [
      {
        role: 'system',
        content: 'You are an expert warranty specialist for plumbing, electrical, and HVAC systems. Analyze warranty details, coverage terms, claim eligibility, and provide recommendations on warranty management, extensions, and claim processes.'
      },
      {
        role: 'user',
        content: `Analyze this warranty information and provide insights:\n\n${JSON.stringify(req.body, null, 2)}\n\nProvide:\n1. **Coverage Assessment** - what is and isn't covered\n2. **Claim Eligibility** - is a claim likely to be approved?\n3. **Warranty Status** - time remaining, expiration concerns\n4. **Recommendations** - steps to take, extensions to consider\n5. **Documentation Tips** - what to prepare for a claim\n6. **Cost-Benefit Analysis** - repair vs. warranty claim vs. replacement`
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
