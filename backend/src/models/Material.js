const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Material = sequelize.define('Material', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  unit: {
    type: DataTypes.STRING,
    allowNull: false
  },
  unitPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'unit_price'
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  supplier: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  sku: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  inStock: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'in_stock'
  },
  minOrderQty: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    field: 'min_order_qty'
  },
  leadTimeDays: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    field: 'lead_time_days'
  },
  userId: {
    type: DataTypes.INTEGER,
    field: 'user_id'
  }
}, {
  tableName: 'materials',
  timestamps: true,
  underscored: true
});

module.exports = Material;
