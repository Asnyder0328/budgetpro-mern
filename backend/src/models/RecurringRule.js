const mongoose = require('mongoose');

const recurringSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  category: { type: String, required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  amount: { type: Number, required: true, min: 0.01 },
  description: { type: String, default: '' },
  frequency: { type: String, enum: ['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'], default: 'monthly' },
  nextDate: { type: Date, required: true },
  endDate: { type: Date },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('RecurringRule', recurringSchema);
