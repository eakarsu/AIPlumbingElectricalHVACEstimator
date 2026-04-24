const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  invoiceNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'invoice_number'
  },
  customerName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'customer_name'
  },
  customerEmail: {
    type: DataTypes.STRING,
    defaultValue: '',
    field: 'customer_email'
  },
  customerPhone: {
    type: DataTypes.STRING,
    defaultValue: '',
    field: 'customer_phone'
  },
  customerAddress: {
    type: DataTypes.STRING,
    defaultValue: '',
    field: 'customer_address'
  },
  jobDescription: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'job_description'
  },
  laborCost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'labor_cost'
  },
  materialCost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'material_cost'
  },
  taxRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 8.5,
    field: 'tax_rate'
  },
  taxAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'tax_amount'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'total_amount'
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'draft'
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    field: 'due_date'
  },
  paidDate: {
    type: DataTypes.DATEONLY,
    field: 'paid_date'
  },
  notes: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  userId: {
    type: DataTypes.INTEGER,
    field: 'user_id'
  }
}, {
  tableName: 'invoices',
  timestamps: true,
  underscored: true
});

module.exports = Invoice;
