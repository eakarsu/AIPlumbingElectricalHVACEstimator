const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Technician = sequelize.define('Technician', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING
  },
  phone: {
    type: DataTypes.STRING
  },
  specialty: {
    type: DataTypes.STRING,
    allowNull: false
  },
  certifications: {
    type: DataTypes.TEXT
  },
  hourlyRate: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'hourly_rate'
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active'
  },
  hireDate: {
    type: DataTypes.DATEONLY,
    field: 'hire_date'
  },
  address: {
    type: DataTypes.STRING
  },
  emergencyContact: {
    type: DataTypes.STRING,
    field: 'emergency_contact'
  },
  notes: {
    type: DataTypes.TEXT
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 5.0
  },
  jobsCompleted: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'jobs_completed'
  },
  userId: {
    type: DataTypes.INTEGER,
    field: 'user_id'
  }
}, {
  tableName: 'technicians',
  timestamps: true,
  underscored: true
});

module.exports = Technician;
