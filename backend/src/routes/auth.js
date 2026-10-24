const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Category = require('../models/Category');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'dev-secret-budgetpro', { expiresIn: process.env.JWT_EXPIRE || '7d' });
const pub = (u) => ({ id: u._id, name: u.name, email: u.email, currency: u.currency, monthlyIncomeGoal: u.monthlyIncomeGoal });

router.post('/register', [
  body('name').notEmpty(), body('email').isEmail(), body('password').isLength({ min: 6 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  const { name, email, password } = req.body;
  if (await User.findOne({ email })) return res.status(400).json({ message: 'User already exists' });
  const user = await User.create({ name, email, password });
  // seed default categories for the new user
  await Category.insertMany(Category.DEFAULT_CATEGORIES.map(c => ({ ...c, user: user._id })));
  res.status(201).json({ token: sign(user._id), user: pub(user) });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password || ''))) return res.status(401).json({ message: 'Invalid credentials' });
  res.json({ token: sign(user._id), user: pub(user) });
});

router.get('/me', require('../middleware/auth').auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(pub(user));
});

router.put('/me', require('../middleware/auth').auth, async (req, res) => {
  const { name, currency, monthlyIncomeGoal } = req.body;
  const user = await User.findByIdAndUpdate(req.user.id, { name, currency, monthlyIncomeGoal }, { new: true });
  res.json(pub(user));
});

module.exports = router;
