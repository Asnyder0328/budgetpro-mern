const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  category: { type: String, required: true, trim: true },
  month: { type: String, required: true }, // YYYY-MM
  limit: { type: Number, required: true, min: 0 },
  rollover: { type: Boolean, default: false },
  alertThreshold: { type: Number, default: 80 }, // percent
}, { timestamps: true });
budgetSchema.index({ user: 1, category: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
