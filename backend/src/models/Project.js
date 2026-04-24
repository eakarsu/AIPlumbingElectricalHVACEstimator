const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  customerName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'customer_name'
  },
  customerPhone: {
    type: DataTypes.STRING,
    field: 'customer_phone'
  },
  address: {
    type: DataTypes.STRING
  },
  projectType: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'project_type'
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'planning'
  },
  startDate: {
    type: DataTypes.DATEONLY,
    field: 'start_date'
  },
  endDate: {
    type: DataTypes.DATEONLY,
    field: 'end_date'
  },
  budget: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  actualCost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'actual_cost'
  },
  completionPercent: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'completion_percent'
  },
  priority: {
    type: DataTypes.STRING,
    defaultValue: 'medium'
  },
  assignedTechnician: {
    type: DataTypes.STRING,
    field: 'assigned_technician'
  },
  notes: {
    type: DataTypes.TEXT
  },
  userId: {
    type: DataTypes.INTEGER,
    field: 'user_id'
  }
}, {
  tableName: 'projects',
  timestamps: true,
  underscored: true
});

module.exports = Project;
