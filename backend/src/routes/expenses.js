const express = require('express');
const router = express.Router();
const { Expense } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { callOpenRouter } = require('../services/aiService');

// Get all
router.get('/', authenticateToken, async (req, res) => {
  try {
    const items = await Expense.findAll({
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
    const item = await Expense.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!item) return res.status(404).json({ error: 'Expense not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create
router.post('/', authenticateToken, async (req, res) => {
  try {
    const data = { ...req.body, user_id: req.user.id };
    const item = await Expense.create(data);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const item = await Expense.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!item) return res.status(404).json({ error: 'Expense not found' });
    await item.update(req.body);
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const item = await Expense.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!item) return res.status(404).json({ error: 'Expense not found' });
    await item.destroy();
    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Expense Analysis for single expense
router.post('/:id/analyze', authenticateToken, async (req, res) => {
  try {
    const item = await Expense.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!item) return res.status(404).json({ error: 'Expense not found' });

    const messages = [
      {
        role: 'system',
        content: 'You are an expert financial advisor for plumbing, electrical, and HVAC contracting businesses. Provide detailed expense analysis, cost optimization strategies, and tax deduction guidance to help contractors maximize profitability.'
      },
      {
        role: 'user',
        content: `Analyze this expense and provide optimization insights:\n\n${JSON.stringify(item.toJSON(), null, 2)}\n\nProvide:\n1. **Expense Assessment** - is this cost reasonable for the category?\n2. **Cost Optimization** - ways to reduce this type of expense\n3. **Tax Deductibility** - potential tax deduction opportunities\n4. **Vendor Comparison** - suggestions for better pricing\n5. **Budget Impact** - how this affects overall business finances\n6. **Recommendations** - actionable cost-saving tips`
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
        content: 'You are an expert financial advisor for plumbing, electrical, and HVAC contracting businesses. Provide detailed expense analysis, cost optimization strategies, and tax deduction guidance to help contractors maximize profitability.'
      },
      {
        role: 'user',
        content: `Analyze these expenses and provide optimization insights:\n\n${JSON.stringify(req.body, null, 2)}\n\nProvide:\n1. **Spending Overview** - breakdown by category and trends\n2. **Cost Optimization** - areas where spending can be reduced\n3. **Tax Deductibility** - potential tax deduction opportunities\n4. **Vendor Comparison** - suggestions for better pricing\n5. **Budget Recommendations** - suggested budget allocations\n6. **Actionable Tips** - immediate steps to reduce costs`
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
