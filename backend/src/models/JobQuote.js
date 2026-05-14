const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const JobQuote = sequelize.define('JobQuote', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  jobType: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'job_type'
  },
  customerName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'customer_name'
  },
  customerPhone: {
    type: DataTypes.STRING,
    defaultValue: '',
    field: 'customer_phone'
  },
  customerEmail: {
    type: DataTypes.STRING,
    defaultValue: '',
    field: 'customer_email'
  },
  address: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  photoUrl: {
    type: DataTypes.STRING,
    defaultValue: '',
    field: 'photo_url'
  },
  estimatedCost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'estimated_cost'
  },
  laborHours: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'labor_hours'
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending'
  },
  aiAnalysis: {
    type: DataTypes.TEXT,
    defaultValue: '',
    field: 'ai_analysis'
  },
  priority: {
    type: DataTypes.STRING,
    defaultValue: 'medium'
  },
  acceptedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'accepted_at'
  },
  customerSignature: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'customer_signature'
  },
  userId: {
    type: DataTypes.INTEGER,
    field: 'user_id'
  }
}, {
  tableName: 'job_quotes',
  timestamps: true,
  underscored: true
});

module.exports = JobQuote;
