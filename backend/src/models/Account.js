const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['checking', 'savings', 'credit', 'cash', 'investment'], default: 'checking' },
  institution: { type: String, default: '' },
  startingBalance: { type: Number, default: 0 },
  color: { type: String, default: '#6366f1' },
  isArchived: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Account', accountSchema);
