const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ServiceContract = sequelize.define('ServiceContract', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  contractNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'contract_number'
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
  serviceType: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'service_type'
  },
  description: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'start_date'
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'end_date'
  },
  monthlyFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'monthly_fee'
  },
  annualValue: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'annual_value'
  },
  visitsIncluded: {
    type: DataTypes.INTEGER,
    defaultValue: 2,
    field: 'visits_included'
  },
  visitsUsed: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'visits_used'
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active'
  },
  renewalDate: {
    type: DataTypes.DATEONLY,
    field: 'renewal_date'
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
  tableName: 'service_contracts',
  timestamps: true,
  underscored: true
});

module.exports = ServiceContract;
