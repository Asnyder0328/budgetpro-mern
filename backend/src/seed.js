require('dotenv').config();
const { connectDB, disconnectDB } = require('./config/db');
const User = require('./models/User');
const Account = require('./models/Account');
const Category = require('./models/Category');
const Transaction = require('./models/Transaction');
const Budget = require('./models/Budget');
const Goal = require('./models/Goal');
const RecurringRule = require('./models/RecurringRule');

const rnd = (min, max) => Math.round((Math.random() * (max - min) + min) * 100) / 100;

(async () => {
  await connectDB();
  await Promise.all([User.deleteMany(), Account.deleteMany(), Category.deleteMany(), Transaction.deleteMany(), Budget.deleteMany(), Goal.deleteMany(), RecurringRule.deleteMany()]);

  const user = await User.create({ name: 'Demo User', email: 'demo@budgetpro.app', password: 'demo1234', currency: 'USD' });
  await Category.insertMany(Category.DEFAULT_CATEGORIES.map(c => ({ ...c, user: user._id })));

  const checking = await Account.create({ user: user._id, name: 'Main Checking', type: 'checking', institution: 'Chase', startingBalance: 3200, color: '#6366f1' });
  const savings = await Account.create({ user: user._id, name: 'High-Yield Savings', type: 'savings', institution: 'Ally', startingBalance: 8500, color: '#22c55e' });
  const credit = await Account.create({ user: user._id, name: 'Rewards Card', type: 'credit', institution: 'Amex', startingBalance: 0, color: '#f59e0b' });

  // 6 months of transactions
  const expenses = [
    ['Housing', 'Rent', 'Landlord', 1450, 1450], ['Groceries', 'Weekly groceries', 'HEB', 90, 180],
    ['Dining Out', 'Dinner out', 'Local Bistro', 35, 85], ['Transport', 'Gas', 'Shell', 35, 65],
    ['Utilities', 'Electric bill', 'Austin Energy', 80, 140], ['Entertainment', 'Movies / games', 'Steam', 15, 60],
    ['Subscriptions', 'Streaming + apps', 'Netflix', 15, 45], ['Shopping', 'Household items', 'Amazon', 25, 120],
    ['Healthcare', 'Pharmacy', 'CVS', 10, 50],
  ];
  const txs = [];
  const now = new Date();
  for (let m = 5; m >= 0; m--) {
    const base = new Date(now.getFullYear(), now.getMonth() - m, 1);
    txs.push({ user: user._id, account: checking._id, category: 'Salary', type: 'income', amount: 5200, description: 'Monthly salary', merchant: 'Employer', date: new Date(base.getFullYear(), base.getMonth(), 1) });
    if (m % 2 === 0) txs.push({ user: user._id, account: checking._id, category: 'Freelance', type: 'income', amount: rnd(300, 900), description: 'Freelance project', merchant: 'Client', date: new Date(base.getFullYear(), base.getMonth(), 14) });
    for (const [cat, desc, merch, lo, hi] of expenses) {
      const count = cat === 'Groceries' ? 4 : cat === 'Dining Out' ? 3 : 1;
      for (let i = 0; i < count; i++) {
        txs.push({ user: user._id, account: cat === 'Housing' || cat === 'Utilities' ? checking._id : credit._id, category: cat, type: 'expense', amount: cat === 'Housing' ? 1450 : rnd(lo, hi), description: desc, merchant: merch, date: new Date(base.getFullYear(), base.getMonth(), 2 + i * 6 + Math.floor(Math.random() * 3)) });
      }
    }
  }
  await Transaction.insertMany(txs);

  const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
  const budgetDefs = [['Housing', 1500], ['Groceries', 600], ['Dining Out', 250], ['Transport', 250], ['Utilities', 200], ['Entertainment', 150], ['Shopping', 300], ['Subscriptions', 60], ['Healthcare', 150]];
  for (const month of [curMonth, prevMonth]) for (const [category, limit] of budgetDefs) await Budget.create({ user: user._id, category, month, limit });

  await Goal.create({ user: user._id, name: 'Emergency Fund', icon: '🛡️', targetAmount: 15000, currentAmount: 8500, account: savings._id, priority: 'high', contributions: [{ amount: 500, note: 'Monthly transfer' }] });
  await Goal.create({ user: user._id, name: 'Japan Trip', icon: '✈️', targetAmount: 4000, currentAmount: 1350, priority: 'medium' });
  await Goal.create({ user: user._id, name: 'New Laptop', icon: '💻', targetAmount: 2200, currentAmount: 600, priority: 'low' });

  await RecurringRule.create({ user: user._id, account: checking._id, category: 'Housing', type: 'expense', amount: 1450, description: 'Rent', frequency: 'monthly', nextDate: new Date(now.getFullYear(), now.getMonth() + 1, 1) });
  await RecurringRule.create({ user: user._id, account: checking._id, category: 'Salary', type: 'income', amount: 5200, description: 'Monthly salary', frequency: 'monthly', nextDate: new Date(now.getFullYear(), now.getMonth() + 1, 1) });

  console.log(`✅ Seeded: demo@budgetpro.app / demo1234 — ${txs.length} transactions, ${budgetDefs.length * 2} budgets, 3 goals, 3 accounts`);
  await disconnectDB();
})();
