const express = require('express');
const router = express.Router();
const { Supplier } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { callOpenRouter } = require('../services/aiService');

// Get all
router.get('/', authenticateToken, async (req, res) => {
  try {
    const items = await Supplier.findAll({
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
    const item = await Supplier.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!item) return res.status(404).json({ error: 'Supplier not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create
router.post('/', authenticateToken, async (req, res) => {
  try {
    const data = { ...req.body, user_id: req.user.id };
    const item = await Supplier.create(data);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const item = await Supplier.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!item) return res.status(404).json({ error: 'Supplier not found' });

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
    const item = await Supplier.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!item) return res.status(404).json({ error: 'Supplier not found' });
    await item.destroy();
    res.json({ message: 'Supplier deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Supplier Analysis
router.post('/ai/analyze', authenticateToken, async (req, res) => {
  try {
    const messages = [
      {
        role: 'system',
        content: 'You are an expert supply chain management specialist for plumbing, electrical, and HVAC trades. Provide detailed guidance on supplier evaluation, procurement optimization, inventory management, cost reduction, and vendor relationship strategies.'
      },
      {
        role: 'user',
        content: `Analyze this supplier information and provide insights:\n\n${JSON.stringify(req.body, null, 2)}\n\nProvide:\n1. **Supplier Evaluation** assessment\n2. **Pricing Analysis** and competitiveness\n3. **Lead Time Optimization** suggestions\n4. **Alternative Suppliers** recommendations\n5. **Inventory Strategy** based on this supplier\n6. **Recommendations** for improving the supply chain`
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
