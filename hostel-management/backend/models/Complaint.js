const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  roomNumber: { type: String, required: true },
  complaintType: { 
    type: String, 
    enum: ['electrical', 'plumbing', 'carpentry', 'cleaning', 'internet', 'furniture', 'other'],
    required: true 
  },
  description: { type: String, required: true },
  status: { type: String, enum: ['pending', 'working', 'resolved'], default: 'pending' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolutionNote: { type: String },
  completionDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date },
  notificationSent: { type: Boolean, default: false }
});

module.exports = mongoose.model('Complaint', complaintSchema);
