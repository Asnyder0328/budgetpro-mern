const router = require('express').Router();
const { auth } = require('../middleware/auth');
const Goal = require('../models/Goal');
const { goalEta } = require('../utils/analytics');
router.use(auth);

router.get('/', async (req, res) => {
  const goals = await Goal.find({ user: req.user.id }).sort({ isCompleted: 1, createdAt: -1 });
  const out = goals.map(g => {
    const { months, date } = goalEta(g, req.query.monthly ? Number(req.query.monthly) : 200);
    return { ...g.toObject(), etaMonths: months, etaDate: date };
  });
  res.json(out);
});

router.post('/', async (req, res) => { res.status(201).json(await Goal.create({ ...req.body, user: req.user.id })); });

router.put('/:id', async (req, res) => {
  const g = await Goal.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, req.body, { new: true });
  if (!g) return res.status(404).json({ message: 'Goal not found' });
  res.json(g);
});

router.delete('/:id', async (req, res) => {
  await Goal.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  res.json({ message: 'Deleted' });
});

router.post('/:id/contribute', async (req, res) => {
  const { amount, note } = req.body;
  const g = await Goal.findOne({ _id: req.params.id, user: req.user.id });
  if (!g) return res.status(404).json({ message: 'Goal not found' });
  g.currentAmount = +(g.currentAmount + Number(amount)).toFixed(2);
  g.contributions.push({ amount: Number(amount), note: note || '' });
  if (g.currentAmount >= g.targetAmount) g.isCompleted = true;
  await g.save();
  res.json(g);
});

module.exports = router;
