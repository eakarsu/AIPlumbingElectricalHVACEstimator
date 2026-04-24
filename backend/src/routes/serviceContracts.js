const express = require('express');
const router = express.Router();
const { ServiceContract } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { callOpenRouter } = require('../services/aiService');

// Get all
router.get('/', authenticateToken, async (req, res) => {
  try {
    const items = await ServiceContract.findAll({
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
    const item = await ServiceContract.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!item) return res.status(404).json({ error: 'Service contract not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create
router.post('/', authenticateToken, async (req, res) => {
  try {
    const data = { ...req.body, user_id: req.user.id };
    const item = await ServiceContract.create(data);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const item = await ServiceContract.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!item) return res.status(404).json({ error: 'Service contract not found' });

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
    const item = await ServiceContract.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!item) return res.status(404).json({ error: 'Service contract not found' });
    await item.destroy();
    res.json({ message: 'Service contract deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Service Contract Analysis
router.post('/ai/analyze', authenticateToken, async (req, res) => {
  try {
    const messages = [
      {
        role: 'system',
        content: 'You are an expert service contract analyst for plumbing, electrical, and HVAC trades businesses. Provide detailed analysis of service contracts including pricing competitiveness, coverage adequacy, renewal strategies, and profitability insights.'
      },
      {
        role: 'user',
        content: `Analyze this service contract and provide insights:\n\n${JSON.stringify(req.body, null, 2)}\n\nProvide:\n1. **Pricing Analysis** - is the monthly/annual fee competitive?\n2. **Coverage Assessment** - are visits and services adequate?\n3. **Profitability Estimate** based on service type\n4. **Renewal Strategy** recommendations\n5. **Risk Assessment** for the contract terms\n6. **Upsell Opportunities** for additional services`
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
