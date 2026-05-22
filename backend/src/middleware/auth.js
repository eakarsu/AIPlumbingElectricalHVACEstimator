const jwt = require('jsonwebtoken');
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'hvac-estimator-secret-key-2024';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// Export as callable (acts as authenticateToken when invoked directly)
// while preserving named exports for { authenticateToken, generateToken } consumers.
function exported(req, res, next) { return authenticateToken(req, res, next); }
exported.authenticateToken = authenticateToken;
exported.generateToken = generateToken;
module.exports = exported;
module.exports.default = authenticateToken;
