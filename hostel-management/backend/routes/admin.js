const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Student = require('../models/Student');
const LeaveRequest = require('../models/LeaveRequest');
const Complaint = require('../models/Complaint');
const Review = require('../models/Review');

// Get all users
router.get('/users', protect, authorize('super_admin', 'warden'), async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    
    // Attach student data
    const enriched = await Promise.all(users.map(async u => {
      if (u.role === 'student') {
        const student = await Student.findOne({ userId: u._id });
        return { ...u.toObject(), student };
      }
      return u.toObject();
    }));
    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add user (super admin)
router.post('/users', protect, authorize('super_admin'), async (req, res) => {
  try {
    const { name, email, password, role, employeeId, mobile, address, rollNumber, roomNumber, parentName, parentMobile, parentEmail, course, year, hostelBlock } = req.body;
    
    const user = await User.create({ name, email, password, role, employeeId, mobile, address, isActive: true, isVerified: true });
    
    let studentData = null;
    if (role === 'student') {
      studentData = await Student.create({
        userId: user._id, rollNumber, roomNumber, parentName, parentMobile, parentEmail, course, year, hostelBlock
      });
    }
    
    res.status(201).json({ success: true, data: { user: { ...user.toObject(), password: undefined }, student: studentData }, message: 'User created' });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'Email or ID already exists' });
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user
router.put('/users/:id', protect, authorize('super_admin'), async (req, res) => {
  try {
    const { password, ...updates } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    if (user.role === 'student' && req.body.roomNumber) {
      await Student.findOneAndUpdate({ userId: user._id }, req.body, { new: true });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete user
router.delete('/users/:id', protect, authorize('super_admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'student') await Student.findOneAndDelete({ userId: user._id });
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reset password
router.put('/users/:id/reset-password', protect, authorize('super_admin'), async (req, res) => {
  try {
    const { newPassword } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Analytics
router.get('/analytics', protect, authorize('super_admin', 'warden'), async (req, res) => {
  try {
    const [totalStudents, totalLeaves, pendingLeaves, approvedLeaves, totalComplaints, pendingComplaints, resolvedComplaints, reviews] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      LeaveRequest.countDocuments(),
      LeaveRequest.countDocuments({ status: 'pending' }),
      LeaveRequest.countDocuments({ status: 'approved' }),
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'pending' }),
      Complaint.countDocuments({ status: 'resolved' }),
      Review.find()
    ]);
    const avgRating = reviews.length > 0 ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : 0;
    res.json({ success: true, data: {
      totalStudents, totalLeaves, pendingLeaves, approvedLeaves,
      totalComplaints, pendingComplaints, resolvedComplaints,
      avgMessRating: avgRating, totalReviews: reviews.length
    }});
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Warden: Get student details
router.get('/students/:id', protect, authorize('warden', 'super_admin'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('userId', '-password');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
