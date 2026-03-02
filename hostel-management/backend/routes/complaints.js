const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Complaint = require('../models/Complaint');
const Student = require('../models/Student');
const User = require('../models/User');
const { sendComplaintResolvedEmail } = require('../utils/emailService');

// Student: Raise complaint
router.post('/', protect, authorize('student'), async (req, res) => {
  try {
    const { complaintType, description } = req.body;
    const student = await Student.findOne({ userId: req.user._id });
    const complaint = await Complaint.create({
      studentId: student._id,
      roomNumber: student.roomNumber,
      complaintType,
      description
    });
    res.status(201).json({ success: true, data: complaint, message: 'Complaint raised successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Student: Get my complaints
router.get('/my', protect, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    const complaints = await Complaint.find({ studentId: student._id })
      .populate({ path: 'assignedTo', select: 'name employeeId' })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Worker/Warden: Get all complaints
router.get('/all', protect, authorize('worker', 'warden', 'super_admin'), async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};
    
    // Worker only sees assigned/unassigned complaints relevant to them
    if (req.user.role === 'worker') {
      filter = { $or: [{ assignedTo: req.user._id }, { assignedTo: null }] };
    }
    if (status) filter.status = status;
    
    const complaints = await Complaint.find(filter)
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email mobile' } })
      .populate({ path: 'assignedTo', select: 'name employeeId' })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Worker: Update complaint status
router.put('/:id', protect, authorize('worker', 'warden', 'super_admin'), async (req, res) => {
  try {
    const { status, resolutionNote, completionDate } = req.body;
    const complaint = await Complaint.findById(req.params.id)
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } });
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

    complaint.status = status;
    if (resolutionNote) complaint.resolutionNote = resolutionNote;
    if (completionDate) complaint.completionDate = completionDate;
    if (status === 'working' && !complaint.assignedTo) complaint.assignedTo = req.user._id;
    if (status === 'resolved') {
      complaint.resolvedAt = new Date();
      // Send email notification to student
      const student = complaint.studentId;
      const user = student.userId;
      if (user?.email && !complaint.notificationSent) {
        await sendComplaintResolvedEmail({
          studentEmail: user.email,
          studentName: user.name,
          complaintType: complaint.complaintType,
          resolutionNote: resolutionNote || complaint.resolutionNote
        });
        complaint.notificationSent = true;
      }
    }
    await complaint.save();
    res.json({ success: true, data: complaint, message: 'Complaint updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
