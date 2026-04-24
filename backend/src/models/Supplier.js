const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Supplier = sequelize.define('Supplier', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  contactPerson: {
    type: DataTypes.STRING,
    field: 'contact_person'
  },
  email: {
    type: DataTypes.STRING
  },
  phone: {
    type: DataTypes.STRING
  },
  address: {
    type: DataTypes.STRING
  },
  website: {
    type: DataTypes.STRING
  },
  category: {
    type: DataTypes.STRING
  },
  accountNumber: {
    type: DataTypes.STRING,
    field: 'account_number'
  },
  paymentTerms: {
    type: DataTypes.STRING,
    field: 'payment_terms',
    defaultValue: 'Net 30'
  },
  rating: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  leadTimeDays: {
    type: DataTypes.INTEGER,
    field: 'lead_time_days',
    defaultValue: 3
  },
  minimumOrder: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'minimum_order',
    defaultValue: 0
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active'
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
  tableName: 'suppliers',
  timestamps: true,
  underscored: true
});

module.exports = Supplier;
