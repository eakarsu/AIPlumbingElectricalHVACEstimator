// Simple in-memory rate limiter (20 AI requests per hour per user)
const requestCounts = new Map();

function aiRateLimiter(req, res, next) {
  const userId = req.user && req.user.id ? req.user.id : req.ip;
  const key = `ai:${userId}`;
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxRequests = 20;

  if (!requestCounts.has(key)) {
    requestCounts.set(key, { count: 1, windowStart: now });
    return next();
  }

  const entry = requestCounts.get(key);
  if (now - entry.windowStart > windowMs) {
    // Reset window
    requestCounts.set(key, { count: 1, windowStart: now });
    return next();
  }

  if (entry.count >= maxRequests) {
    return res.status(429).json({
      error: 'Too many AI requests. Limit is 20 per hour. Please try again later.'
    });
  }

  entry.count++;
  next();
}

module.exports = { aiRateLimiter };
