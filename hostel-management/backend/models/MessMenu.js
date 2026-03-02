const mongoose = require('mongoose');

const messMenuSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  dayOfWeek: { type: String },
  breakfast: { type: String, required: true },
  lunch: { type: String, required: true },
  dinner: { type: String, required: true },
  snacks: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now }
});

messMenuSchema.index({ date: 1 }, { unique: true });

module.exports = mongoose.model('MessMenu', messMenuSchema);
