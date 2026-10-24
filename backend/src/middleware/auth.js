const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-budgetpro');
    req.user = { id: decoded.id };
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Token is not valid' });
  }
}

function errorHandler(err, req, res, next) {
  console.error(err.stack || err.message);
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(err.errors).map(v => v.message).join(', ') });
  }
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
}

module.exports = { auth, errorHandler };
