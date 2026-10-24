const router = require('express').Router();
const { auth } = require('../middleware/auth');
const RecurringRule = require('../models/RecurringRule');
const Transaction = require('../models/Transaction');
const { nextRecurringDate } = require('../utils/analytics');
router.use(auth);

router.get('/', async (req, res) => res.json(await RecurringRule.find({ user: req.user.id }).sort({ nextDate: 1 })));
router.post('/', async (req, res) => res.status(201).json(await RecurringRule.create({ ...req.body, user: req.user.id })));
router.put('/:id', async (req, res) => res.json(await RecurringRule.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, req.body, { new: true })));
router.delete('/:id', async (req, res) => { await RecurringRule.findOneAndDelete({ _id: req.params.id, user: req.user.id }); res.json({ message: 'Deleted' }); });

// Generate all due transactions up to today
router.post('/generate', async (req, res) => {
  const rules = await RecurringRule.find({ user: req.user.id, isActive: true, nextDate: { $lte: new Date() } });
  let generated = 0;
  for (const r of rules) {
    let d = new Date(r.nextDate);
    while (d <= new Date() && (!r.endDate || d <= r.endDate)) {
      await Transaction.create({ user: r.user, account: r.account, category: r.category, type: r.type, amount: r.amount, description: r.description, date: new Date(d), isRecurring: true, recurringRule: r._id });
      generated++;
      d = nextRecurringDate(d, r.frequency);
    }
    r.nextDate = d; await r.save();
  }
  res.json({ generated });
});

module.exports = router;
