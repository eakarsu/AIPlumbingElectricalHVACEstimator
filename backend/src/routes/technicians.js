const express = require('express');
const router = express.Router();
const { Technician } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { analyzeTechnicianWorkload } = require('../services/aiService');

// Get all technicians
router.get('/', authenticateToken, async (req, res) => {
  try {
    const technicians = await Technician.findAll({
      where: { user_id: req.user.id },
      order: [['name', 'ASC']]
    });
    res.json(technicians);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single technician
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const technician = await Technician.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!technician) return res.status(404).json({ error: 'Technician not found' });
    res.json(technician);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create technician
router.post('/', authenticateToken, async (req, res) => {
  try {
    const technician = await Technician.create({ ...req.body, user_id: req.user.id });
    res.status(201).json(technician);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update technician
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const technician = await Technician.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!technician) return res.status(404).json({ error: 'Technician not found' });
    await technician.update(req.body);
    res.json(technician);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete technician
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const technician = await Technician.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!technician) return res.status(404).json({ error: 'Technician not found' });
    await technician.destroy();
    res.json({ message: 'Technician deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Technician Workload Analysis
router.post('/ai/analyze', authenticateToken, async (req, res) => {
  try {
    const { technicians, jobs } = req.body;
    const result = await analyzeTechnicianWorkload(technicians, jobs);
    const aiContent = result.choices[0].message.content;
    res.json({ analysis: aiContent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
