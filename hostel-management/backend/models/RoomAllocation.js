const mongoose = require('mongoose');

const roomAllocationSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true, trim: true },
  hostelBlock: { type: String, trim: true },
  studentRollNumber: { type: String, trim: true },
  studentName: { type: String, trim: true },
  status: { type: String, enum: ['allocated', 'vacant'], default: 'vacant' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RoomAllocation', roomAllocationSchema);

