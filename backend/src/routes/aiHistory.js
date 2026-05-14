const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { AiResult } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { callOpenRouter, parseAIJson, estimateMaterials } = require('../services/aiService');

// GET /api/ai/history - paginated AI result history for logged-in user
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await AiResult.findAndCountAll({
      where: { userId: req.user.id },
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    res.json({
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/material-estimate - itemized materials list with quantities and unit costs
router.post(
  '/material-estimate',
  authenticateToken,
  aiRateLimiter,
  [
    body('jobType').notEmpty().withMessage('jobType is required'),
    body('description').notEmpty().withMessage('description is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { jobType, description, area, units } = req.body;
      const areaInfo = area ? `Area/Quantity: ${area} ${units || 'sq ft'}` : '';
      const fullDescription = `${description}\n${areaInfo}`.trim();

      const result = await estimateMaterials(fullDescription, jobType);
      const aiContent = result.choices[0].message.content;
      const parsed = parseAIJson(aiContent);

      await AiResult.create({
        userId: req.user.id,
        endpoint: 'ai/material-estimate',
        quoteId: null,
        result: parsed || { raw: aiContent }
      });

      res.json({ estimation: aiContent, parsed });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// POST /api/ai/project-timeline - phased timeline with milestones, labor hours, permit requirements
router.post(
  '/project-timeline',
  authenticateToken,
  aiRateLimiter,
  [
    body('projectScope').notEmpty().withMessage('projectScope is required'),
    body('projectType').notEmpty().withMessage('projectType is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { projectScope, projectType, startDate, teamSize } = req.body;

      const messages = [
        {
          role: 'system',
          content: 'You are an expert project manager for plumbing, electrical, and HVAC contracting. Generate detailed phased project timelines with realistic labor estimates and permit requirements. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: `Generate a detailed project timeline for this ${projectType} project:\n\nScope: ${projectScope}\n${startDate ? `Start Date: ${startDate}` : ''}\n${teamSize ? `Team Size: ${teamSize} technicians` : ''}\n\nReturn ONLY valid JSON in this exact format:\n{"total_duration_days":0,"phases":[{"phase_number":1,"name":"","description":"","duration_days":0,"labor_hours":0,"dependencies":[],"milestones":[{"name":"","day":0}]}],"permit_requirements":[{"permit_type":"","estimated_days":0,"notes":""}],"total_labor_hours":0,"critical_path":""}`
        }
      ];

      const result = await callOpenRouter(messages);
      const aiContent = result.choices[0].message.content;
      const parsed = parseAIJson(aiContent);

      await AiResult.create({
        userId: req.user.id,
        endpoint: 'ai/project-timeline',
        quoteId: null,
        result: parsed || { raw: aiContent }
      });

      res.json({ timeline: aiContent, parsed });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// POST /api/ai/code-compliance - applicable codes, required permits, inspection checkpoints
router.post(
  '/code-compliance',
  authenticateToken,
  aiRateLimiter,
  [
    body('workDescription').notEmpty().withMessage('workDescription is required'),
    body('jurisdiction').notEmpty().withMessage('jurisdiction is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { workDescription, jurisdiction, workType } = req.body;

      const messages = [
        {
          role: 'system',
          content: 'You are an expert in US building codes for plumbing (IPC), electrical (NEC), and HVAC (IMC) systems. Provide detailed compliance guidance including specific code sections, required permits, and inspection checkpoints. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: `Check code compliance for:\n\nWork: ${workDescription}\nJurisdiction: ${jurisdiction}\n${workType ? `Work Type: ${workType}` : ''}\n\nReturn ONLY valid JSON in this exact format:\n{"jurisdiction":"","applicable_codes":[{"code_name":"","edition":"","sections":[{"section":"","requirement":"","status":"compliant|non_compliant|review_needed"}]}],"required_permits":[{"permit_type":"","estimated_cost_range":"","processing_days":0,"notes":""}],"inspection_checkpoints":[{"checkpoint":"","timing":"","inspector_type":"","notes":""}],"violations":[],"recommendations":[],"overall_status":"compliant|non_compliant|needs_review"}`
        }
      ];

      const result = await callOpenRouter(messages);
      const aiContent = result.choices[0].message.content;
      const parsed = parseAIJson(aiContent);

      await AiResult.create({
        userId: req.user.id,
        endpoint: 'ai/code-compliance',
        quoteId: null,
        result: parsed || { raw: aiContent }
      });

      res.json({ compliance: aiContent, parsed });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// POST /api/ai/quote-estimate-ai - auto-generate itemized quote (materials + labor + markup) from a job description
router.post(
  '/quote-estimate-ai',
  authenticateToken,
  aiRateLimiter,
  [
    body('jobType').notEmpty().withMessage('jobType is required'),
    body('description').notEmpty().withMessage('description is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { jobType, description, customerType, region, urgency } = req.body;

      const messages = [
        {
          role: 'system',
          content: 'You are an expert plumbing/electrical/HVAC estimator. Produce conservative, itemized quotes with materials, labor hours at typical regional rates, markup, taxes, and a total. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: `Generate an itemized quote for this ${jobType} job:\n\nDescription: ${description}\n${customerType ? `Customer Type: ${customerType}` : ''}\n${region ? `Region: ${region}` : ''}\n${urgency ? `Urgency: ${urgency}` : ''}\n\nReturn ONLY valid JSON in this exact format:\n{"job_type":"","summary":"","materials":[{"item":"","qty":0,"unit":"","unit_cost":0,"line_total":0}],"labor":[{"role":"","hours":0,"rate":0,"line_total":0}],"materials_subtotal":0,"labor_subtotal":0,"markup_percent":0,"markup_amount":0,"tax_percent":0,"tax_amount":0,"total":0,"assumptions":[],"exclusions":[],"warranty_terms":""}`
        }
      ];

      const result = await callOpenRouter(messages);
      const aiContent = result.choices[0].message.content;
      const parsed = parseAIJson(aiContent);

      await AiResult.create({
        userId: req.user.id,
        endpoint: 'ai/quote-estimate-ai',
        quoteId: null,
        result: parsed || { raw: aiContent }
      });

      res.json({ quote: aiContent, parsed });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// POST /api/ai/schedule-optimize - optimize technician routes/schedule for a set of jobs
router.post(
  '/schedule-optimize',
  authenticateToken,
  aiRateLimiter,
  [body('jobs').isArray({ min: 1 }).withMessage('jobs (non-empty array) is required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { jobs, technicians, constraints, target_date } = req.body;

      const jobsBlock = jobs.map((j, idx) => `${idx + 1}. id=${j.id || idx} type=${j.type || 'unknown'} duration=${j.duration_minutes || j.duration || 'unknown'} address=${j.address || j.location || 'n/a'} priority=${j.priority || 'normal'} window=${j.window || 'flex'}`).join('\n');
      const techsBlock = (technicians || []).map((t, idx) => `${idx + 1}. id=${t.id || idx} skills=${(t.skills || []).join('|') || 'general'} home_base=${t.home_base || 'n/a'} shift=${t.shift || '8h'}`).join('\n');

      const messages = [
        {
          role: 'system',
          content: 'You are a dispatch and routing optimization AI for a plumbing/electrical/HVAC service company. Minimize travel time and overtime while honoring priorities, skills, and service windows. Respond with valid JSON only.'
        },
        {
          role: 'user',
          content: `Optimize the schedule for ${target_date || 'the next service day'}.

Jobs:
${jobsBlock}

Technicians:
${techsBlock || 'No technicians provided'}

Constraints: ${constraints ? JSON.stringify(constraints) : 'standard 8h shift, lunch buffer'}

Return ONLY valid JSON:
{"date":"","assignments":[{"technician_id":"","stops":[{"job_id":"","arrival":"HH:MM","duration_minutes":0,"travel_minutes_to":0}],"total_drive_minutes":0,"total_work_minutes":0}],"unassigned_jobs":[{"job_id":"","reason":""}],"recommendations":[],"summary":""}`
        }
      ];

      const result = await callOpenRouter(messages);
      const aiContent = result.choices[0].message.content;
      const parsed = parseAIJson(aiContent);

      await AiResult.create({
        userId: req.user.id,
        endpoint: 'ai/schedule-optimize',
        quoteId: null,
        result: parsed || { raw: aiContent }
      });

      res.json({ schedule: aiContent, parsed });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
