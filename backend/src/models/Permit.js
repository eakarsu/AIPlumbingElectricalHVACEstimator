const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Permit = sequelize.define('Permit', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  permitNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'permit_number'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  permitType: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'permit_type'
  },
  projectAddress: {
    type: DataTypes.STRING,
    field: 'project_address'
  },
  applicantName: {
    type: DataTypes.STRING,
    field: 'applicant_name'
  },
  issuingAuthority: {
    type: DataTypes.STRING,
    field: 'issuing_authority'
  },
  applicationDate: {
    type: DataTypes.DATEONLY,
    field: 'application_date'
  },
  issueDate: {
    type: DataTypes.DATEONLY,
    field: 'issue_date'
  },
  expirationDate: {
    type: DataTypes.DATEONLY,
    field: 'expiration_date'
  },
  fee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending'
  },
  inspectionDate: {
    type: DataTypes.DATEONLY,
    field: 'inspection_date'
  },
  inspectionResult: {
    type: DataTypes.STRING,
    field: 'inspection_result'
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
  tableName: 'permits',
  timestamps: true,
  underscored: true
});

module.exports = Permit;
