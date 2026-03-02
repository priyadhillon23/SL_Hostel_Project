const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  menuId: { type: mongoose.Schema.Types.ObjectId, ref: 'MessMenu' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  feedback: { type: String },
  mealType: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'general'], default: 'general' },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);
