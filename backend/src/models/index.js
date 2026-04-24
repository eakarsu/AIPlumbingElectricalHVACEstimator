const sequelize = require('../config/database');
const User = require('./User');
const JobQuote = require('./JobQuote');
const Material = require('./Material');
const CodeCompliance = require('./CodeCompliance');
const Schedule = require('./Schedule');
const Invoice = require('./Invoice');
const Technician = require('./Technician');
const Customer = require('./Customer');
const Project = require('./Project');
const Expense = require('./Expense');
const Warranty = require('./Warranty');
const Equipment = require('./Equipment');
const ServiceContract = require('./ServiceContract');
const Permit = require('./Permit');
const Supplier = require('./Supplier');

// Associations
const models = [JobQuote, Material, CodeCompliance, Schedule, Invoice, Technician, Customer, Project, Expense, Warranty, Equipment, ServiceContract, Permit, Supplier];
models.forEach(Model => {
  User.hasMany(Model, { foreignKey: 'user_id' });
  Model.belongsTo(User, { foreignKey: 'user_id' });
});

module.exports = {
  sequelize, User, JobQuote, Material, CodeCompliance, Schedule, Invoice,
  Technician, Customer, Project, Expense, Warranty, Equipment, ServiceContract, Permit, Supplier
};
