const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CodeCompliance = sequelize.define('CodeCompliance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  codeReference: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'code_reference'
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  jurisdiction: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  requirements: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active'
  },
  effectiveDate: {
    type: DataTypes.DATEONLY,
    field: 'effective_date'
  },
  penalties: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  inspectionRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'inspection_required'
  },
  notes: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  aiRecommendation: {
    type: DataTypes.TEXT,
    defaultValue: '',
    field: 'ai_recommendation'
  },
  userId: {
    type: DataTypes.INTEGER,
    field: 'user_id'
  }
}, {
  tableName: 'code_compliance',
  timestamps: true,
  underscored: true
});

module.exports = CodeCompliance;
