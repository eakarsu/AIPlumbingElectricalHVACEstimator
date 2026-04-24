const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Expense = sequelize.define('Expense', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  vendor: {
    type: DataTypes.STRING
  },
  receiptNumber: {
    type: DataTypes.STRING,
    field: 'receipt_number'
  },
  paymentMethod: {
    type: DataTypes.STRING,
    field: 'payment_method',
    defaultValue: 'credit_card'
  },
  isReimbursable: {
    type: DataTypes.BOOLEAN,
    field: 'is_reimbursable',
    defaultValue: false
  },
  projectName: {
    type: DataTypes.STRING,
    field: 'project_name'
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending'
  },
  notes: {
    type: DataTypes.TEXT
  },
  userId: {
    type: DataTypes.INTEGER,
    field: 'user_id'
  }
}, {
  tableName: 'expenses',
  timestamps: true,
  underscored: true
});

module.exports = Expense;
