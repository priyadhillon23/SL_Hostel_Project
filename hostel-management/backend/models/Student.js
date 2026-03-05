const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  rollNumber: { type: String, required: true, unique: true, uppercase: true },
  roomNumber: { type: String, required: true },
  parentName: { type: String, required: true },
  parentMobile: { type: String, required: true },
  parentEmail: { type: String, required: true },
  course: { type: String },
  year: { type: Number },
  hostelBlock: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Student', studentSchema);
