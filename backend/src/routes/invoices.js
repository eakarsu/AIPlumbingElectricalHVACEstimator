const express = require('express');
const router = express.Router();
const { Invoice } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { generateInvoiceAnalysis } = require('../services/aiService');

// Get all
router.get('/', authenticateToken, async (req, res) => {
  try {
    const items = await Invoice.findAll({
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
    const item = await Invoice.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!item) return res.status(404).json({ error: 'Invoice not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create
router.post('/', authenticateToken, async (req, res) => {
  try {
    const data = { ...req.body, user_id: req.user.id };
    const subtotal = parseFloat(data.laborCost || 0) + parseFloat(data.materialCost || 0);
    data.taxAmount = (subtotal * parseFloat(data.taxRate || 8.5) / 100).toFixed(2);
    data.totalAmount = (subtotal + parseFloat(data.taxAmount)).toFixed(2);

    const item = await Invoice.create(data);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const item = await Invoice.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!item) return res.status(404).json({ error: 'Invoice not found' });

    const data = { ...req.body };
    if (data.laborCost !== undefined || data.materialCost !== undefined) {
      const subtotal = parseFloat(data.laborCost || item.laborCost) + parseFloat(data.materialCost || item.materialCost);
      data.taxAmount = (subtotal * parseFloat(data.taxRate || item.taxRate) / 100).toFixed(2);
      data.totalAmount = (subtotal + parseFloat(data.taxAmount)).toFixed(2);
    }

    await item.update(data);
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const item = await Invoice.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!item) return res.status(404).json({ error: 'Invoice not found' });
    await item.destroy();
    res.json({ message: 'Invoice deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Invoice Analysis
router.post('/:id/analyze', authenticateToken, async (req, res) => {
  try {
    const item = await Invoice.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!item) return res.status(404).json({ error: 'Invoice not found' });

    const result = await generateInvoiceAnalysis(item.toJSON());
    const aiContent = result.choices[0].message.content;
    res.json({ analysis: aiContent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ai/analyze', authenticateToken, async (req, res) => {
  try {
    const result = await generateInvoiceAnalysis(req.body);
    const aiContent = result.choices[0].message.content;
    res.json({ analysis: aiContent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
