const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const LeaveRequest = require('../models/LeaveRequest');
const Student = require('../models/Student');
const User = require('../models/User');
const { sendLeaveApprovalEmail, sendLeaveRejectionEmail } = require('../utils/emailService');

// Student: Apply for leave
router.post('/', protect, authorize('student'), async (req, res) => {
  try {
    const { fromDate, toDate, reason } = req.body;
    if (!fromDate || !toDate || !reason) return res.status(400).json({ success: false, message: 'All fields required' });
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return res.status(404).json({ success: false, message: 'Student record not found' });
    
    const leave = await LeaveRequest.create({
      studentId: student._id, fromDate, toDate, reason
    });
    res.status(201).json({ success: true, data: leave, message: 'Leave applied successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Student: Get my leaves
router.get('/my', protect, authorize('student'), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    const leaves = await LeaveRequest.find({ studentId: student._id }).sort({ appliedAt: -1 });
    res.json({ success: true, data: leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Warden: Get all leaves
router.get('/all', protect, authorize('warden', 'super_admin'), async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const leaves = await LeaveRequest.find(filter)
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email mobile address' } })
      .sort({ appliedAt: -1 });
    res.json({ success: true, data: leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Warden: Approve/Reject leave
router.put('/:id', protect, authorize('warden', 'super_admin'), async (req, res) => {
  try {
    const { status, remark } = req.body;
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

    const leave = await LeaveRequest.findById(req.params.id)
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email mobile' } });
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });

    leave.status = status;
    leave.remark = remark || '';
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    await leave.save();

    // Send email notification
    const student = leave.studentId;
    const user = student.userId;
    if (student.parentEmail) {
      if (status === 'approved') {
        await sendLeaveApprovalEmail({
          parentEmail: student.parentEmail,
          parentName: student.parentName,
          studentName: user.name,
          fromDate: leave.fromDate,
          toDate: leave.toDate,
          remark
        });
      } else {
        await sendLeaveRejectionEmail({
          parentEmail: student.parentEmail,
          parentName: student.parentName,
          studentName: user.name,
          fromDate: leave.fromDate,
          toDate: leave.toDate,
          remark
        });
      }
      leave.notificationSent = true;
      await leave.save();
    }

    res.json({ success: true, data: leave, message: `Leave ${status} successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
