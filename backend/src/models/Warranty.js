const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Warranty = sequelize.define('Warranty', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
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
  productName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'product_name'
  },
  serialNumber: {
    type: DataTypes.STRING,
    defaultValue: '',
    field: 'serial_number'
  },
  warrantyType: {
    type: DataTypes.STRING,
    defaultValue: 'manufacturer',
    field: 'warranty_type'
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
  coverage: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active'
  },
  claimHistory: {
    type: DataTypes.TEXT,
    defaultValue: '',
    field: 'claim_history'
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
  tableName: 'warranties',
  timestamps: true,
  underscored: true
});

module.exports = Warranty;
