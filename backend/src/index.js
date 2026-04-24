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

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Middleware
app.use(cors());
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
async function start() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    await sequelize.sync({ alter: true });
    console.log('✅ Models synchronized');

    app.listen(PORT, () => {
      console.log(`✅ Backend server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
