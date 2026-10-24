const router = require('express').Router();
const { auth } = require('../middleware/auth');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
router.use(auth);

// Compute live balance = startingBalance + income - expenses for this account
async function withBalance(account, userId) {
  const agg = await Transaction.aggregate([
    { $match: { user: account.user, account: account._id } },
    { $group: { _id: '$type', total: { $sum: '$amount' } } },
  ]);
  let delta = 0;
  agg.forEach(r => { if (r._id === 'income') delta += r.total; if (r._id === 'expense') delta -= r.total; });
  return { ...account.toObject(), balance: +(account.startingBalance + delta).toFixed(2) };
}

router.get('/', async (req, res) => {
  const accounts = await Account.find({ user: req.user.id, isArchived: false }).sort({ createdAt: 1 });
  const out = [];
  for (const a of accounts) out.push(await withBalance(a, req.user.id));
  const netWorth = out.filter(a => a.type !== 'credit').reduce((s, a) => s + a.balance, 0)
    - out.filter(a => a.type === 'credit').reduce((s, a) => s + Math.abs(Math.min(0, a.balance)), 0);
  res.json({ accounts: out, netWorth: +netWorth.toFixed(2) });
});

router.post('/', async (req, res) => {
  const account = await Account.create({ ...req.body, user: req.user.id });
  res.status(201).json(await withBalance(account));
});

router.put('/:id', async (req, res) => {
  const account = await Account.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, req.body, { new: true });
  if (!account) return res.status(404).json({ message: 'Account not found' });
  res.json(await withBalance(account));
});

router.delete('/:id', async (req, res) => {
  const account = await Account.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, { isArchived: true }, { new: true });
  if (!account) return res.status(404).json({ message: 'Account not found' });
  res.json({ message: 'Account archived' });
});

module.exports = router;
