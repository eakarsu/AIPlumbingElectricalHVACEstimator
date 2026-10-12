// Shared raw PostgreSQL pool for scaffolded feature routes.
// The Sequelize instance from ./database.js is NOT a pg pool; using it with
// positional ($1) placeholders made queries fail ("there is no parameter $1").
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

module.exports = pool;
