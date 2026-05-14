const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { sequelize } = require('./models');

const authRoutes = require('./routes/auth');
const jobQuoteRoutes = require('./routes/jobQuotes');
const materialRoutes = require('./routes/materials');
const codeComplianceRoutes = require('./routes/codeCompliance');
const scheduleRoutes = require('./routes/schedules');
const invoiceRoutes = require('./routes/invoices');
const customerRoutes = require('./routes/customers');
const technicianRoutes = require('./routes/technicians');
const projectRoutes = require('./routes/projects');
const expenseRoutes = require('./routes/expenses');
const warrantyRoutes = require('./routes/warranties');
const equipmentRoutes = require('./routes/equipment');
const serviceContractRoutes = require('./routes/serviceContracts');
const permitRoutes = require('./routes/permits');
const supplierRoutes = require('./routes/suppliers');
const aiHistoryRoutes = require('./routes/aiHistory');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Security: helmet for HTTP headers
const helmet = require('helmet');
app.use(helmet());

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/job-quotes', jobQuoteRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/code-compliance', codeComplianceRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/technicians', technicianRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/warranties', warrantyRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/service-contracts', serviceContractRoutes);
app.use('/api/permits', permitRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/ai', aiHistoryRoutes);
app.use('/api/integrations', require('./routes/integrations'));
// Alias: /api/estimates maps to job-quotes (file upload endpoint uses estimates/:id/upload)
app.use('/api/estimates', jobQuoteRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    // Use migrations for schema changes in production
    await sequelize.sync({ alter: false });
    console.log('Models synchronized');

    
// === Custom Feature Mounts (batch_06) ===
app.use('/api/cf-ai-job-estimator', require('./routes/customFeat01_AiJobEstimator'));
app.use('/api/cf-code-compliance-automation', require('./routes/customFeat02_CodeComplianceAutomation'));
app.use('/api/cf-route-optimization', require('./routes/customFeat03_RouteOptimization'));
app.use('/api/cf-material-waste-prediction', require('./routes/customFeat04_MaterialWastePrediction'));
app.use('/api/cf-technician-productivity-tracking', require('./routes/customFeat05_TechnicianProductivityTracking'));


// === Batch 06 Gaps & Frontend Mounts ===
app.use('/api/gap-aihistory-js-stub-needs-real-implementation', require('./routes/gapFeat_aihistory_js_stub_needs_real_implementation'));
app.use('/api/gap-jobquotes-without-quote', require('./routes/gapFeat_jobquotes_without_quote'));
app.use('/api/gap-schedules-without-schedule', require('./routes/gapFeat_schedules_without_schedule'));
app.use('/api/gap-code-compliance-without-code', require('./routes/gapFeat_code_compliance_without_code'));
app.use('/api/gap-no-real-integration-with-permit-code-databases-onl', require('./routes/gapFeat_no_real_integration_with_permit_code_databases_onl'));
app.use('/api/gap-no-customer-financing-options-credit-payment-plans', require('./routes/gapFeat_no_customer_financing_options_credit_payment_plans'));
app.use('/api/gap-no-supply-chain-integration-material-ordering-auto', require('./routes/gapFeat_no_supply_chain_integration_material_ordering_auto'));
app.use('/api/gap-limited-photo-documentation-before-after', require('./routes/gapFeat_limited_photo_documentation_before_after'));
app.use('/api/gap-no-accounting-system-integration-quickbooks-freshb', require('./routes/gapFeat_no_accounting_system_integration_quickbooks_freshb'));
app.use('/api/gap-no-notifications-module-grep-0', require('./routes/gapFeat_no_notifications_module_grep_0'));
app.use('/api/gap-no-audit-logging-grep-0', require('./routes/gapFeat_no_audit_logging_grep_0'));
app.use('/api/gap-no-webhooks', require('./routes/gapFeat_no_webhooks'));
app.use('/api/gap-no-mobile-app-for-techs', require('./routes/gapFeat_no_mobile_app_for_techs'));

app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
