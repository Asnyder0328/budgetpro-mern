const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  icon: { type: String, default: '🎯' },
  targetAmount: { type: Number, required: true, min: 0.01 },
  currentAmount: { type: Number, default: 0, min: 0 },
  deadline: { type: Date },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  isCompleted: { type: Boolean, default: false },
  contributions: [{
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    note: { type: String, default: '' },
  }],
}, { timestamps: true });

goalSchema.virtual('progress').get(function () {
  return this.targetAmount ? Math.min(100, Math.round((this.currentAmount / this.targetAmount) * 100)) : 0;
});
goalSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Goal', goalSchema);
