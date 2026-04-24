const express = require('express');
const router = express.Router();
const { Equipment } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { callOpenRouter } = require('../services/aiService');

// Get all equipment
router.get('/', authenticateToken, async (req, res) => {
  try {
    const equipment = await Equipment.findAll({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(equipment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single equipment
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const equipment = await Equipment.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!equipment) return res.status(404).json({ error: 'Equipment not found' });
    res.json(equipment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create equipment
router.post('/', authenticateToken, async (req, res) => {
  try {
    const equipment = await Equipment.create({ ...req.body, user_id: req.user.id });
    res.status(201).json(equipment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update equipment
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const equipment = await Equipment.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!equipment) return res.status(404).json({ error: 'Equipment not found' });
    await equipment.update(req.body);
    res.json(equipment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete equipment
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const equipment = await Equipment.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!equipment) return res.status(404).json({ error: 'Equipment not found' });
    await equipment.destroy();
    res.json({ message: 'Equipment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Equipment Analysis
router.post('/ai/analyze', authenticateToken, async (req, res) => {
  try {
    const { description, equipmentType } = req.body;
    const messages = [
      {
        role: 'system',
        content: 'You are an expert equipment manager for plumbing, electrical, and HVAC service companies. Provide detailed equipment analysis including maintenance schedules, depreciation, replacement recommendations, and cost optimization strategies.'
      },
      {
        role: 'user',
        content: `Analyze this ${equipmentType || 'general'} equipment and provide recommendations:\n\n${description}\n\nProvide:\n1. **Condition Assessment** and expected remaining lifespan\n2. **Maintenance Schedule** recommendations\n3. **Depreciation Analysis** and current estimated value\n4. **Replacement Recommendations** with cost-benefit analysis\n5. **Safety Considerations** and compliance requirements\n6. **Cost Optimization** suggestions`
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
