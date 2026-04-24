const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Equipment = sequelize.define('Equipment', {
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
  serialNumber: {
    type: DataTypes.STRING,
    field: 'serial_number'
  },
  purchaseDate: {
    type: DataTypes.DATEONLY,
    field: 'purchase_date'
  },
  purchaseCost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'purchase_cost'
  },
  currentValue: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'current_value'
  },
  condition: {
    type: DataTypes.STRING,
    defaultValue: 'good'
  },
  location: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  assignedTo: {
    type: DataTypes.STRING,
    defaultValue: '',
    field: 'assigned_to'
  },
  nextMaintenanceDate: {
    type: DataTypes.DATEONLY,
    field: 'next_maintenance_date'
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'available'
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
  tableName: 'equipment',
  timestamps: true,
  underscored: true
});

module.exports = Equipment;
