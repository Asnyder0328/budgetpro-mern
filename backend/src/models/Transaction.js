const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  category: { type: String, required: true, trim: true }, // category name (denormalized for fast analytics)
  type: { type: String, enum: ['income', 'expense', 'transfer'], required: true },
  amount: { type: Number, required: true, min: 0.01 }, // always positive; type drives sign
  description: { type: String, default: '', trim: true },
  merchant: { type: String, default: '', trim: true },
  date: { type: Date, required: true, default: Date.now, index: true },
  tags: [{ type: String, trim: true }],
  isRecurring: { type: Boolean, default: false },
  recurringRule: { type: mongoose.Schema.Types.ObjectId, ref: 'RecurringRule' },
  notes: { type: String, default: '' },
}, { timestamps: true });

transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
