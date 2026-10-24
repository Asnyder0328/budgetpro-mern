const router = require('express').Router();
const { auth } = require('../middleware/auth');
const Transaction = require('../models/Transaction');
router.use(auth);

router.get('/', async (req, res) => {
  const { type, category, account, search, from, to, page = 1, limit = 50, sort = '-date' } = req.query;
  const q = { user: req.user.id };
  if (type) q.type = type;
  if (category) q.category = category;
  if (account) q.account = account;
  if (from || to) { q.date = {}; if (from) q.date.$gte = new Date(from); if (to) q.date.$lte = new Date(to); }
  if (search) q.$or = [{ description: new RegExp(search, 'i') }, { merchant: new RegExp(search, 'i') }, { category: new RegExp(search, 'i') }];
  const total = await Transaction.countDocuments(q);
  const items = await Transaction.find(q).sort(sort.replace(',', ' ')).skip((page - 1) * limit).limit(Number(limit));
  res.json({ items, total, page: Number(page), pages: Math.ceil(total / limit) });
});

router.post('/', async (req, res) => {
  const tx = await Transaction.create({ ...req.body, user: req.user.id });
  res.status(201).json(tx);
});

router.put('/:id', async (req, res) => {
  const tx = await Transaction.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, req.body, { new: true, runValidators: true });
  if (!tx) return res.status(404).json({ message: 'Transaction not found' });
  res.json(tx);
});

router.delete('/:id', async (req, res) => {
  const tx = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!tx) return res.status(404).json({ message: 'Transaction not found' });
  res.json({ message: 'Deleted' });
});

router.post('/bulk', async (req, res) => {
  const { transactions } = req.body;
  if (!Array.isArray(transactions)) return res.status(400).json({ message: 'transactions array required' });
  const docs = transactions.map(t => ({ ...t, user: req.user.id }));
  const created = await Transaction.insertMany(docs);
  res.status(201).json({ created: created.length });
});

// CSV export
router.get('/export/csv', async (req, res) => {
  const items = await Transaction.find({ user: req.user.id }).sort({ date: -1 });
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = ['date,type,category,description,merchant,amount', ...items.map(t => [t.date.toISOString().slice(0, 10), t.type, esc(t.category), esc(t.description), esc(t.merchant), t.amount].join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
  res.send(csv);
});

module.exports = router;
