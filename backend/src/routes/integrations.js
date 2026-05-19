/**
 * HVAC integrations + product-decision wrappers (apply pass 5).
 *
 * Env vars (NEEDS-CREDS):
 *  - PERMIT_DB_API_URL, PERMIT_DB_API_KEY        (state/local permit/code DB)
 *  - QUICKBOOKS_CLIENT_ID, QUICKBOOKS_CLIENT_SECRET, QUICKBOOKS_REALM_ID  (QuickBooks Online)
 *  - SUPPLIER_API_URL, SUPPLIER_API_KEY          (Supply-chain ordering)
 *  - MAPS_API_KEY                                 (Live route optimization, Google Maps style)
 *
 * If credentials are missing, endpoints return HTTP 503 with `{ error, missing: <ENV> }`.
 *
 * PRODUCT-DECISION endpoints in this file:
 *  - /financing/options     defaults to a fixed APR/term ladder.
 *  - /photo-doc             stores metadata only, file uploads remain on existing /upload routes.
 *  - /productivity/score    uses scheduled-vs-actual hours from `schedules` table.
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { sequelize } = require('../models');

router.use(authenticateToken);

function gateOnEnv(req, res, vars) {
  for (const v of vars) {
    if (!process.env[v]) {
      return res.status(503).json({ error: 'Integration not configured', missing: v });
    }
  }
  return null;
}

// ─── Permit DB ─────────────────────────────────────────────────────────────
router.post('/permit-db/lookup', async (req, res) => {
  const gate = gateOnEnv(req, res, ['PERMIT_DB_API_URL', 'PERMIT_DB_API_KEY']);
  if (gate) return;
  const { jurisdiction, code_section } = req.body || {};
  if (!jurisdiction) return res.status(400).json({ error: 'jurisdiction required' });
  res.json({ success: true, jurisdiction, code_section: code_section || null, results: [], note: 'Stub — permit DB not called; creds present.' });
});

// ─── QuickBooks ────────────────────────────────────────────────────────────
router.post('/quickbooks/sync-invoice', async (req, res) => {
  const gate = gateOnEnv(req, res, ['QUICKBOOKS_CLIENT_ID', 'QUICKBOOKS_CLIENT_SECRET', 'QUICKBOOKS_REALM_ID']);
  if (gate) return;
  const { invoice_id } = req.body || {};
  if (!invoice_id) return res.status(400).json({ error: 'invoice_id required' });
  res.json({ success: true, invoice_id, qb_id: null, note: 'Stub — QBO sync not called; creds present.' });
});

// ─── Supplier ordering ─────────────────────────────────────────────────────
router.post('/supplier/order', async (req, res) => {
  const gate = gateOnEnv(req, res, ['SUPPLIER_API_URL', 'SUPPLIER_API_KEY']);
  if (gate) return;
  const { items } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'items[] required' });
  res.json({ success: true, ordered: items.length, po_id: null, note: 'Stub — supplier order not placed; creds present.' });
});

// ─── Live route optimization (NEEDS-CREDS: MAPS_API_KEY) ──────────────────
router.post('/route/optimize', async (req, res) => {
  const gate = gateOnEnv(req, res, ['MAPS_API_KEY']);
  if (gate) return;
  const { stops } = req.body || {};
  if (!Array.isArray(stops) || stops.length < 2) return res.status(400).json({ error: 'stops[] (>=2) required' });
  res.json({ success: true, stops_count: stops.length, ordered_stops: stops, note: 'Stub — Maps API not called; creds present.' });
});

// ─── Customer financing (PRODUCT-DECISION) ───────────────────────────────
// PRODUCT-DECISION: default ladder of 0%/12mo, 7.99%/24mo, 9.99%/60mo. Replace with
// real lender API once vendor is selected (Affirm, Synchrony, Wisetack, etc.).
router.post('/financing/options', async (req, res) => {
  const { amount } = req.body || {};
  if (!amount || isNaN(amount) || amount <= 0) return res.status(400).json({ error: 'amount > 0 required' });
  const opts = [
    { plan: '0% / 12mo (promo)', apr: 0, term_months: 12, monthly_payment: +(amount / 12).toFixed(2) },
    { plan: '7.99% / 24mo',     apr: 7.99, term_months: 24, monthly_payment: +((amount * (1 + 0.0799 * 2)) / 24).toFixed(2) },
    { plan: '9.99% / 60mo',     apr: 9.99, term_months: 60, monthly_payment: +((amount * (1 + 0.0999 * 5)) / 60).toFixed(2) }
  ];
  res.json({ success: true, amount, options: opts });
});

// ─── Photo documentation (PRODUCT-DECISION) ──────────────────────────────
// PRODUCT-DECISION: persist metadata only (job_id, kind=before|after, url, caption).
// Heavy lifting (uploads) lives on existing /api/estimates/:id/upload routes.
async function ensurePhotoDocsTable() {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS job_photo_docs (
      id SERIAL PRIMARY KEY,
      job_id INTEGER,
      user_id INTEGER,
      kind VARCHAR(20),
      url TEXT NOT NULL,
      caption TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `).catch(() => {});
}
ensurePhotoDocsTable();

router.post('/photo-doc', async (req, res) => {
  const { job_id, kind, url, caption } = req.body || {};
  if (!url) return res.status(400).json({ error: 'url required' });
  const k = (kind || 'misc').toLowerCase();
  try {
    const r = await sequelize.query(
      'INSERT INTO job_photo_docs (job_id, user_id, kind, url, caption) VALUES (:j, :u, :k, :url, :c) RETURNING id, created_at',
      { replacements: { j: job_id || null, u: req.user?.id || null, k, url, c: caption || null } }
    );
    res.status(201).json({ success: true, id: r[0]?.[0]?.id, kind: k });
  } catch (err) { res.status(500).json({ error: 'Insert failed', details: err.message }); }
});

router.get('/photo-doc/:job_id', async (req, res) => {
  try {
    const r = await sequelize.query(
      'SELECT id, kind, url, caption, created_at FROM job_photo_docs WHERE job_id = :j ORDER BY created_at DESC',
      { replacements: { j: req.params.job_id } }
    );
    res.json(r[0] || []);
  } catch (err) { res.status(500).json({ error: 'Read failed', details: err.message }); }
});

// ─── Technician productivity score (PRODUCT-DECISION) ────────────────────
// PRODUCT-DECISION: aggregates schedules (scheduled vs actual hours when present).
// Privacy: only operator-visible; no per-minute tracking.
router.get('/productivity/:technician_id', async (req, res) => {
  try {
    const r = await sequelize.query(
      `SELECT COUNT(*)::int AS jobs,
              COALESCE(SUM(estimated_hours),0)::float AS estimated_hours,
              COALESCE(SUM(actual_hours),0)::float AS actual_hours
       FROM schedules WHERE technician_id = :t`,
      { replacements: { t: req.params.technician_id } }
    ).catch(() => [[{ jobs: 0, estimated_hours: 0, actual_hours: 0 }]]);
    const row = r[0]?.[0] || { jobs: 0, estimated_hours: 0, actual_hours: 0 };
    const efficiency = row.actual_hours > 0 ? +(row.estimated_hours / row.actual_hours).toFixed(2) : null;
    res.json({ technician_id: req.params.technician_id, ...row, efficiency, note: 'PRODUCT-DECISION default scoring.' });
  } catch (err) { res.status(500).json({ error: 'Score failed', details: err.message }); }
});

// ─── CV job estimation from photo (TOO-RISKY: in-memory stub) ─────────────
// TOO-RISKY: no model is invoked. We return a deterministic placeholder so the FE
// contract is exercisable. Wire to a real CV service later.
router.post('/cv/estimate-from-photo', async (req, res) => {
  const { photo_url, scope } = req.body || {};
  if (!photo_url) return res.status(400).json({ error: 'photo_url required' });
  res.json({
    success: true,
    photo_url,
    scope: scope || 'unspecified',
    extracted_items: [],
    confidence: 0,
    note: 'TOO-RISKY stub — no CV model invoked.'
  });
});

module.exports = router;
