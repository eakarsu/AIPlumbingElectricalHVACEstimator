const express = require('express');
const router = express.Router();
const { Material, AiResult } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { estimateMaterials, parseAIJson } = require('../services/aiService');

// Get all materials
router.get('/', authenticateToken, async (req, res) => {
  try {
    const materials = await Material.findAll({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(materials);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single material
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const material = await Material.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!material) return res.status(404).json({ error: 'Material not found' });
    res.json(material);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create material
router.post('/', authenticateToken, async (req, res) => {
  try {
    const material = await Material.create({ ...req.body, user_id: req.user.id });
    res.status(201).json(material);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update material
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const material = await Material.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!material) return res.status(404).json({ error: 'Material not found' });
    await material.update(req.body);
    res.json(material);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete material
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const material = await Material.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!material) return res.status(404).json({ error: 'Material not found' });
    await material.destroy();
    res.json({ message: 'Material deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Material Estimation
router.post('/ai/estimate', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { description, jobType } = req.body;
    const result = await estimateMaterials(description, jobType);
    const aiContent = result.choices[0].message.content;
    const parsed = parseAIJson(aiContent);

    // Persist to ai_results
    await AiResult.create({
      userId: req.user.id,
      endpoint: 'materials/ai/estimate',
      quoteId: null,
      result: parsed || { raw: aiContent }
    });

    res.json({ estimation: aiContent, parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
