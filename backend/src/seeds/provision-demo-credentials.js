const bcrypt = require('bcryptjs');
const { sequelize, User } = require('../models');

async function main() {
  const email = String(process.env.DEMO_EMAIL || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.DEMO_PASSWORD || process.env.ADMIN_PASSWORD || '');
  if (!email || password.length < 12) throw new Error('Local demo credentials are incomplete');
  await sequelize.sync();
  const hash = await bcrypt.hash(password, 10);
  const [user] = await User.findOrCreate({ where: { email }, defaults: { email, password: hash, name: 'Runtime Administrator', role: 'admin' } });
  await user.update({ password: hash, name: 'Runtime Administrator', role: 'admin' });
  await sequelize.close();
  console.log('Provisioned local demo administrator.');
}
main().catch((error) => { console.error(error.message); process.exit(1); });
