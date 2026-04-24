const express = require('express');
const router = express.Router();
const { Schedule } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { optimizeSchedule } = require('../services/aiService');

// Get all
router.get('/', authenticateToken, async (req, res) => {
  try {
    const items = await Schedule.findAll({
      where: { user_id: req.user.id },
      order: [['scheduled_date', 'ASC'], ['start_time', 'ASC']]
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const item = await Schedule.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!item) return res.status(404).json({ error: 'Schedule not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create
router.post('/', authenticateToken, async (req, res) => {
  try {
    const item = await Schedule.create({ ...req.body, user_id: req.user.id });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const item = await Schedule.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!item) return res.status(404).json({ error: 'Schedule not found' });
    await item.update(req.body);
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const item = await Schedule.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!item) return res.status(404).json({ error: 'Schedule not found' });
    await item.destroy();
    res.json({ message: 'Schedule deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Schedule Optimization
router.post('/ai/optimize', authenticateToken, async (req, res) => {
  try {
    const schedules = await Schedule.findAll({
      where: { user_id: req.user.id, status: 'scheduled' },
      order: [['scheduled_date', 'ASC']]
    });
    const result = await optimizeSchedule(schedules);
    const aiContent = result.choices[0].message.content;
    res.json({ optimization: aiContent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
