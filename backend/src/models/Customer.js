const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Customer = sequelize.define('Customer', {
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
  address: {
    type: DataTypes.STRING
  },
  city: {
    type: DataTypes.STRING
  },
  state: {
    type: DataTypes.STRING
  },
  zipCode: {
    type: DataTypes.STRING,
    field: 'zip_code'
  },
  notes: {
    type: DataTypes.TEXT
  },
  propertyType: {
    type: DataTypes.STRING,
    field: 'property_type',
    defaultValue: 'residential'
  },
  preferredContact: {
    type: DataTypes.STRING,
    field: 'preferred_contact',
    defaultValue: 'phone'
  },
  totalSpent: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'total_spent',
    defaultValue: 0
  },
  jobCount: {
    type: DataTypes.INTEGER,
    field: 'job_count',
    defaultValue: 0
  },
  rating: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  userId: {
    type: DataTypes.INTEGER,
    field: 'user_id'
  }
}, {
  tableName: 'customers',
  timestamps: true,
  underscored: true
});

module.exports = Customer;
