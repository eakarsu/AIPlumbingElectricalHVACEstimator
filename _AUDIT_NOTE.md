# Audit Note — AIPlumbingElectricalHVACEstimator

Source: `/Users/erolakarsu/projects/_AUDIT/reports/batch_06.md` section #25.

## Original Recommendations
TSV said `0 AI endpoints`, but `aiHistory.js` already exposes `/material-estimate`, `/project-timeline`, `/code-compliance`. Audit count is wrong.

### Gaps — AI Counterparts
- `/quote-estimate-ai`
- `/schedule-optimize`
- `/material-quantity-predict`
- `/code-compliance-check` (already exists as `/code-compliance`)

### Gaps — Non-AI Features
- Permit/code database integration
- Customer financing
- Supply-chain ordering automation
- Photo documentation (before/after)
- Accounting integration (QuickBooks)

### Custom Feature Suggestions
1. AI job estimator (photo/video → quote)
2. Code compliance automation
3. Route optimization
4. Material waste prediction
5. Technician productivity tracking

## Implemented (Mechanical)
- `POST /api/ai/quote-estimate-ai` — added in `backend/src/routes/aiHistory.js`. Generates an itemized quote (materials, labor, markup, tax, total) from job description; persists to `AiResult`.
- `POST /api/ai/schedule-optimize` — added in `backend/src/routes/aiHistory.js`. Accepts jobs + technicians + constraints, returns assignments with drive/work-time totals and unassigned-job reasons; persists to `AiResult`.

Both follow existing `callOpenRouter`/`parseAIJson`/`authenticateToken`/`aiRateLimiter` style.

## Backlog (deferred)

### NEEDS-CREDS / NEW-DEPS
- Permit/code DB integration (state/local APIs).
- QuickBooks/FreshBooks integration.
- Supply-chain ordering integration.

### NEEDS-PRODUCT-DECISION
- Customer financing flows.
- Mobile-first photo documentation UX.
- Real-time technician productivity tracking (data model + privacy decisions).

### TOO-RISKY
- Computer-vision job estimation from site photos/video (model + cost).
- Live route optimization with maps API (creds + recurring cost).

## Apply pass 3 (frontend)

- **Stack:** Express + React (CRA) SPA. `services/api.js` axios instance with JWT bearer interceptor (`localStorage.getItem('token')`).
- **Backend AI endpoints surfaced:** `/material-estimate`, `/project-timeline`, `/code-compliance`, `/quote-estimate-ai`, `/schedule-optimize`, `/history` (all in `backend/src/routes/aiHistory.js`).
- **Action:** LEFT-AS-IS — FE already wired.
- Pages: `MaterialEstimate.js`, `ProjectTimeline.js`, `CodeComplianceChecker.js`, `QuoteEstimateAI.js`, `ScheduleOptimize.js`, plus `AIHistory.js` listing.
- Files written/modified: none.
- Syntax check: N/A.

## Apply pass 4 (mechanical backlog)

- **Action:** LEFT-AS-IS — no remaining MECHANICAL backlog items.
- **Backlog reviewed:** permit/code DB, QuickBooks/FreshBooks, supply-chain ordering (NEEDS-CREDS / NEW-DEPS); financing flows, photo-doc UX, productivity tracking (NEEDS-PRODUCT-DECISION); CV quote-from-photo, live route optimization (TOO-RISKY).
- **Files written/modified:** none.
- **Smoke test:** N/A.
