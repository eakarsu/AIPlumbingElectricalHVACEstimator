const jwt = require('jsonwebtoken');
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });

const JWT_SECRET = String(process.env.JWT_SECRET || '');
if (JWT_SECRET.length < 32 || /replace|change|example|generate|secret-key-2024/i.test(JWT_SECRET)) {
  throw new Error('JWT_SECRET must be a non-placeholder value of at least 32 characters.');
}

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
    { id: user.id, email: user.email, name: user.name, role: user.role },
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
