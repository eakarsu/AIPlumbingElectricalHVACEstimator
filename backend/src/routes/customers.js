const express = require('express');
const router = express.Router();
const { Customer } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { callOpenRouter } = require('../services/aiService');

// Get all customers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const customers = await Customer.findAll({
      where: { user_id: req.user.id },
      order: [['name', 'ASC']]
    });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single customer
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const customer = await Customer.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create customer
router.post('/', authenticateToken, async (req, res) => {
  try {
    const customer = await Customer.create({ ...req.body, user_id: req.user.id });
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update customer
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const customer = await Customer.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    await customer.update(req.body);
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete customer
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const customer = await Customer.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    await customer.destroy();
    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Analysis for customer retention
router.post('/ai/analyze', authenticateToken, async (req, res) => {
  try {
    const { customerData } = req.body;
    const messages = [
      {
        role: 'system',
        content: 'You are an expert CRM consultant specializing in trades businesses (plumbing, electrical, HVAC). Analyze customer data and provide actionable retention strategies, upsell opportunities, and relationship management recommendations.'
      },
      {
        role: 'user',
        content: `Analyze this customer history and provide retention recommendations:\n\n${JSON.stringify(customerData, null, 2)}\n\nProvide:\n1. **Customer Value Assessment** - lifetime value and engagement level\n2. **Retention Risk** - likelihood of churn\n3. **Recommended Actions** - specific steps to retain and grow this customer\n4. **Upsell Opportunities** - services they may need based on history\n5. **Communication Strategy** - best approach for outreach\n6. **Seasonal Recommendations** - timely service suggestions`
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
