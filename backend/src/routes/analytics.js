const router = require('express').Router();
const mongoose = require('mongoose');
const { auth } = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const { monthRange, currentMonthStr, budgetStatus, savingsRate, forecastNextMonth } = require('../utils/analytics');
router.use(auth);
const oid = (id) => new mongoose.Types.ObjectId(id);

async function monthTotals(userId, month) {
  const { start, end } = monthRange(month);
  const agg = await Transaction.aggregate([
    { $match: { user: oid(userId), date: { $gte: start, $lt: end } } },
    { $group: { _id: '$type', total: { $sum: '$amount' } } },
  ]);
  let income = 0, expenses = 0;
  agg.forEach(r => { if (r._id === 'income') income = r.total; if (r._id === 'expense') expenses = r.total; });
  return { income: +income.toFixed(2), expenses: +expenses.toFixed(2), net: +(income - expenses).toFixed(2) };
}

router.get('/summary', async (req, res) => {
  const month = req.query.month || currentMonthStr();
  const cur = await monthTotals(req.user.id, month);
  // previous month for comparison
  const [y, m] = month.split('-').map(Number);
  const prevDate = new Date(y, m - 2, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  const prev = await monthTotals(req.user.id, prevMonth);
  const pct = (a, b) => b === 0 ? null : Math.round(((a - b) / b) * 1000) / 10;
  res.json({
    month, ...cur, savingsRate: savingsRate(cur.income, cur.expenses),
    previous: prev,
    changes: { income: pct(cur.income, prev.income), expenses: pct(cur.expenses, prev.expenses) },
    transactionCount: await Transaction.countDocuments({ user: req.user.id }),
  });
});

router.get('/category-breakdown', async (req, res) => {
  const month = req.query.month || currentMonthStr();
  const { start, end } = monthRange(month);
  const agg = await Transaction.aggregate([
    { $match: { user: oid(req.user.id), type: 'expense', date: { $gte: start, $lt: end } } },
    { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);
  const grand = agg.reduce((s, r) => s + r.total, 0);
  res.json(agg.map(r => ({ category: r._id, total: +r.total.toFixed(2), count: r.count, percent: grand ? Math.round((r.total / grand) * 1000) / 10 : 0 })));
});

router.get('/monthly-trend', async (req, res) => {
  const months = Number(req.query.months || 6);
  const out = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ms = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    out.push({ month: ms, ...(await monthTotals(req.user.id, ms)) });
  }
  res.json({ trend: out, forecast: forecastNextMonth(out) });
});

router.get('/budget-vs-actual', async (req, res) => {
  const month = req.query.month || currentMonthStr();
  const budgets = await Budget.find({ user: req.user.id, month });
  const out = [];
  for (const b of budgets) {
    const { start, end } = monthRange(month);
    const agg = await Transaction.aggregate([
      { $match: { user: oid(req.user.id), category: b.category, type: 'expense', date: { $gte: start, $lt: end } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const spent = agg[0]?.total || 0;
    out.push({ category: b.category, limit: b.limit, spent: +spent.toFixed(2), ...budgetStatus(spent, b.limit, b.alertThreshold) });
  }
  res.json(out.sort((a, b) => b.percent - a.percent));
});

router.get('/top-merchants', async (req, res) => {
  const month = req.query.month || currentMonthStr();
  const { start, end } = monthRange(month);
  const agg = await Transaction.aggregate([
    { $match: { user: oid(req.user.id), type: 'expense', merchant: { $ne: '' }, date: { $gte: start, $lt: end } } },
    { $group: { _id: '$merchant', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } }, { $limit: 5 },
  ]);
  res.json(agg.map(r => ({ merchant: r._id, total: +r.total.toFixed(2), count: r.count })));
});

// Net-worth trend: cumulative balance across all accounts, month by month (Plaid-style)
router.get('/net-worth-trend', async (req, res) => {
  const Account = require('../models/Account');
  const months = Number(req.query.months || 6);
  const accounts = await Account.find({ user: req.user.id });
  const starting = accounts.reduce((s, a) => s + a.startingBalance, 0);
  const all = await Transaction.find({ user: req.user.id }).sort({ date: 1 });
  const out = []; const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i + 1, 1); // end of that month
    let bal = starting;
    for (const t of all) { if (t.date < d) bal += t.type === 'income' ? t.amount : t.type === 'expense' ? -t.amount : 0; }
    out.push({ month: `${new Date(d.getFullYear(), d.getMonth() - 1, 1).getFullYear()}-${String(new Date(d.getFullYear(), d.getMonth() - 1, 1).getMonth() + 1).padStart(2, '0')}`, netWorth: +bal.toFixed(2) });
  }
  res.json(out);
});

// Stacked category trend: top-5 expense categories per month, for stacked bars
router.get('/category-trend', async (req, res) => {
  const months = Number(req.query.months || 6);
  const now = new Date(); const series = []; const catSet = new Set();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ms = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const { start, end } = monthRange(ms);
    const agg = await Transaction.aggregate([
      { $match: { user: oid(req.user.id), type: 'expense', date: { $gte: start, $lt: end } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } }, { $sort: { total: -1 } }, { $limit: 5 },
    ]);
    const row = { month: ms };
    agg.forEach(r => { row[r._id] = +r.total.toFixed(2); catSet.add(r._id); });
    series.push(row);
  }
  res.json({ categories: [...catSet], series });
});

// Auto-generated money insights (rules engine over the user's real data)
router.get('/insights', async (req, res) => {
  const month = req.query.month || currentMonthStr();
  const cur = await monthTotals(req.user.id, month);
  const [y, m] = month.split('-').map(Number);
  const prevD = new Date(y, m - 2, 1);
  const prevMonth = `${prevD.getFullYear()}-${String(prevD.getMonth() + 1).padStart(2, '0')}`;
  const prev = await monthTotals(req.user.id, prevMonth);
  const insights = [];
  const sr = savingsRate(cur.income, cur.expenses);
  insights.push(sr >= 20
    ? { type: 'positive', icon: '🌟', title: `Strong savings rate: ${sr}%`, detail: `You're keeping ${sr}% of income this month — above the classic 20% 50/30/20 target.` }
    : { type: 'warning', icon: '⚠️', title: `Savings rate is ${sr}%`, detail: `The 50/30/20 rule suggests aiming for 20%. At your income that's about $${Math.round(cur.income * 0.2).toLocaleString()}/mo.` });
  if (prev.expenses > 0) {
    const diff = Math.round(((cur.expenses - prev.expenses) / prev.expenses) * 100);
    insights.push({ type: diff <= 0 ? 'positive' : 'warning', icon: diff <= 0 ? '📉' : '📈', title: `Spending ${diff <= 0 ? 'down' : 'up'} ${Math.abs(diff)}% vs last month`, detail: `$${cur.expenses.toLocaleString()} this month vs $${prev.expenses.toLocaleString()} last month.` });
  }
  // biggest category mover
  const { start, end } = monthRange(month); const { start: ps, end: pe } = monthRange(prevMonth);
  const catAgg = async (s, e) => Transaction.aggregate([{ $match: { user: oid(req.user.id), type: 'expense', date: { $gte: s, $lt: e } } }, { $group: { _id: '$category', total: { $sum: '$amount' } } }]);
  const [cNow, cPrev] = [await catAgg(start, end), await catAgg(ps, pe)];
  const prevMap = Object.fromEntries(cPrev.map(r => [r._id, r.total]));
  let mover = null;
  for (const r of cNow) { const d = r.total - (prevMap[r._id] || 0); if (!mover || d > mover.diff) mover = { cat: r._id, diff: d, total: r.total }; }
  if (mover && mover.diff > 20) insights.push({ type: 'info', icon: '🔍', title: `${mover.cat} is your biggest riser`, detail: `Up $${Math.round(mover.diff).toLocaleString()} vs last month, at $${Math.round(mover.total).toLocaleString()} total.` });
  // average daily spend + large transactions
  const days = Math.max(1, new Date().getDate());
  insights.push({ type: 'info', icon: '📅', title: `$${Math.round(cur.expenses / days)} average daily spend`, detail: `Projected month-end spend: ~$${Math.round((cur.expenses / days) * 30).toLocaleString()} if the pace holds.` });
  const large = await Transaction.find({ user: req.user.id, type: 'expense', date: { $gte: start, $lt: end } }).sort({ amount: -1 }).limit(3);
  if (large[0]) insights.push({ type: 'info', icon: '🧾', title: `Largest purchase: $${large[0].amount.toLocaleString()}`, detail: `${large[0].description || large[0].category} at ${large[0].merchant || '—'} on ${large[0].date.toISOString().slice(0, 10)}.` });
  // 50/30/20 split (needs = housing/utilities/transport/groceries/healthcare, wants = rest)
  const NEEDS = ['Housing', 'Utilities', 'Transport', 'Groceries', 'Healthcare'];
  let needs = 0, wants = 0;
  cNow.forEach(r => { if (NEEDS.includes(r._id)) needs += r.total; else wants += r.total; });
  if (cur.income) insights.push({ type: 'info', icon: '🥧', title: `50/30/20 check: Needs ${Math.round((needs / cur.income) * 100)}% · Wants ${Math.round((wants / cur.income) * 100)}% · Saved ${sr}%`, detail: `Targets are 50% needs / 30% wants / 20% savings of take-home income.` });
  res.json({ month, insights });
});

module.exports = router;
