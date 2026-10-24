const router = require('express').Router();
const mongoose = require('mongoose');
const { auth } = require('../middleware/auth');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const { monthRange, currentMonthStr, budgetStatus } = require('../utils/analytics');
router.use(auth);

async function spentFor(userId, category, month) {
  const { start, end } = monthRange(month);
  const agg = await Transaction.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId), category, type: 'expense', date: { $gte: start, $lt: end } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return agg[0]?.total || 0;
}

async function enrich(budget, userId) {
  const spent = await spentFor(userId, budget.category, budget.month);
  const { percent, status, remaining } = budgetStatus(spent, budget.limit, budget.alertThreshold);
  // daily burn + projected month-end spend
  const now = new Date();
  const isCurrent = budget.month === currentMonthStr(now);
  const dayOfMonth = isCurrent ? now.getDate() : 30;
  const projected = isCurrent && dayOfMonth > 0 ? Math.round((spent / dayOfMonth) * 30) : spent;
  return { ...budget.toObject(), spent: +spent.toFixed(2), percent, status, remaining, projected };
}

router.get('/', async (req, res) => {
  const month = req.query.month || currentMonthStr();
  const budgets = await Budget.find({ user: req.user.id, month }).sort({ category: 1 });
  const out = [];
  for (const b of budgets) out.push(await enrich(b, req.user.id));
  const totals = out.reduce((a, b) => ({ limit: a.limit + b.limit, spent: a.spent + b.spent }), { limit: 0, spent: 0 });
  res.json({ month, budgets: out, totals: { ...totals, remaining: +(totals.limit - totals.spent).toFixed(2) } });
});

router.post('/', async (req, res) => {
  const { category, month, limit, rollover, alertThreshold } = req.body;
  const budget = await Budget.findOneAndUpdate(
    { user: req.user.id, category, month: month || currentMonthStr() },
    { limit, rollover, alertThreshold },
    { new: true, upsert: true, runValidators: true }
  );
  res.status(201).json(await enrich(budget, req.user.id));
});

router.put('/:id', async (req, res) => {
  const b = await Budget.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, req.body, { new: true });
  if (!b) return res.status(404).json({ message: 'Budget not found' });
  res.json(await enrich(b, req.user.id));
});

router.delete('/:id', async (req, res) => {
  await Budget.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  res.json({ message: 'Deleted' });
});

// Copy all budgets from one month to another
router.post('/copy', async (req, res) => {
  const { fromMonth, toMonth } = req.body;
  const src = await Budget.find({ user: req.user.id, month: fromMonth });
  let copied = 0;
  for (const b of src) {
    await Budget.findOneAndUpdate({ user: req.user.id, category: b.category, month: toMonth },
      { limit: b.limit, rollover: b.rollover, alertThreshold: b.alertThreshold }, { upsert: true });
    copied++;
  }
  res.json({ copied, toMonth });
});

module.exports = router;
