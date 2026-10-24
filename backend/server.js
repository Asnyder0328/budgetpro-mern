require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB } = require('./src/config/db');
const { errorHandler } = require('./src/middleware/auth');

const app = express();
const isProd = process.env.NODE_ENV === 'production';
app.set('trust proxy', 1);

// Minimal security headers (helmet-equivalent for the headers that matter here)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
app.use(cors({ origin: process.env.CLIENT_URL || true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
if (!isProd) app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'BudgetPro API', env: process.env.NODE_ENV || 'development', timestamp: new Date() }));
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/accounts', require('./src/routes/accounts'));
app.use('/api/transactions', require('./src/routes/transactions'));
app.use('/api/budgets', require('./src/routes/budgets'));
app.use('/api/goals', require('./src/routes/goals'));
app.use('/api/categories', require('./src/routes/categories'));
app.use('/api/analytics', require('./src/routes/analytics'));
app.use('/api/recurring', require('./src/routes/recurring'));
app.use('/api', (req, res) => res.status(404).json({ message: 'API route not found' }));

// Production: serve the React build from this same server (single-service deploy on Render/Railway)
const dist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
}
app.use(errorHandler);

const PORT = process.env.PORT || 5001;
if (require.main === module) {
  connectDB().then(() => app.listen(PORT, () => console.log(`🚀 BudgetPro on http://localhost:${PORT} (${isProd ? 'production' : 'dev'})`)));
}
module.exports = app;
