const express = require('express');
const router = express.Router();
const { JobQuote } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { analyzeJobQuote } = require('../services/aiService');

// Get all job quotes
router.get('/', authenticateToken, async (req, res) => {
  try {
    const quotes = await JobQuote.findAll({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(quotes);
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

// Create job quote
router.post('/', authenticateToken, async (req, res) => {
  try {
    const quote = await JobQuote.create({ ...req.body, user_id: req.user.id });
    res.status(201).json(quote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

// AI Analysis for job quote
router.post('/:id/analyze', authenticateToken, async (req, res) => {
  try {
    const quote = await JobQuote.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!quote) return res.status(404).json({ error: 'Quote not found' });

    const result = await analyzeJobQuote(quote.description, quote.jobType);
    const aiContent = result.choices[0].message.content;

    await quote.update({ aiAnalysis: aiContent });
    res.json({ analysis: aiContent, quote });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Analysis for new quote (without saving)
router.post('/ai/analyze', authenticateToken, async (req, res) => {
  try {
    const { description, jobType } = req.body;
    const result = await analyzeJobQuote(description, jobType);
    const aiContent = result.choices[0].message.content;
    res.json({ analysis: aiContent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
