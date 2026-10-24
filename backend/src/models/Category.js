const mongoose = require('mongoose');

const DEFAULT_CATEGORIES = [
  { name: 'Housing', icon: '🏠', color: '#6366f1', type: 'expense' },
  { name: 'Groceries', icon: '🛒', color: '#22c55e', type: 'expense' },
  { name: 'Dining Out', icon: '🍽️', color: '#f59e0b', type: 'expense' },
  { name: 'Transport', icon: '🚗', color: '#06b6d4', type: 'expense' },
  { name: 'Utilities', icon: '💡', color: '#eab308', type: 'expense' },
  { name: 'Entertainment', icon: '🎬', color: '#ec4899', type: 'expense' },
  { name: 'Healthcare', icon: '🏥', color: '#ef4444', type: 'expense' },
  { name: 'Shopping', icon: '🛍️', color: '#a855f7', type: 'expense' },
  { name: 'Subscriptions', icon: '🔁', color: '#64748b', type: 'expense' },
  { name: 'Salary', icon: '💼', color: '#16a34a', type: 'income' },
  { name: 'Freelance', icon: '💻', color: '#0ea5e9', type: 'income' },
  { name: 'Investments', icon: '📈', color: '#059669', type: 'income' },
  { name: 'Other Income', icon: '💰', color: '#84cc16', type: 'income' },
  { name: 'Other Expense', icon: '📌', color: '#94a3b8', type: 'expense' },
];

const categorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  icon: { type: String, default: '📌' },
  color: { type: String, default: '#6366f1' },
  type: { type: String, enum: ['income', 'expense', 'both'], default: 'expense' },
}, { timestamps: true });
categorySchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
module.exports.DEFAULT_CATEGORIES = DEFAULT_CATEGORIES;
