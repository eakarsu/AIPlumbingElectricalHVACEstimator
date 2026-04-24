const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Schedule = sequelize.define('Schedule', {
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
    defaultValue: ''
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
  address: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  technicianName: {
    type: DataTypes.STRING,
    defaultValue: '',
    field: 'technician_name'
  },
  scheduledDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'scheduled_date'
  },
  startTime: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'start_time'
  },
  endTime: {
    type: DataTypes.STRING,
    defaultValue: '',
    field: 'end_time'
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'scheduled'
  },
  priority: {
    type: DataTypes.STRING,
    defaultValue: 'medium'
  },
  estimatedDuration: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 1,
    field: 'estimated_duration'
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
  tableName: 'schedules',
  timestamps: true,
  underscored: true
});

module.exports = Schedule;
