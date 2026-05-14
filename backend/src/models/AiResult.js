const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AiResult = sequelize.define('AiResult', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    field: 'user_id'
  },
  endpoint: {
    type: DataTypes.STRING(100)
  },
  quoteId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'quote_id'
  },
  result: {
    type: DataTypes.JSONB
  }
}, {
  tableName: 'ai_results',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = AiResult;
