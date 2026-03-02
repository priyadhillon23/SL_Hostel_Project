const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Student = require('../models/Student');
const generateToken = require('../utils/generateToken');
const { protect } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', [
  body('password').notEmpty().withMessage('Password is required'),
  body('role').isIn(['student', 'warden', 'mess_admin', 'worker', 'super_admin']).withMessage('Invalid role'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { identifier, password, role } = req.body;
  // identifier = email/rollNumber for student, employeeId for others

  try {
    let user;
    
    if (role === 'student') {
      // Student can login with email or roll number
      user = await User.findOne({ 
        $or: [{ email: identifier?.toLowerCase() }],
        role: 'student'
      });
      
      if (!user) {
        // Try finding by roll number
        const student = await Student.findOne({ rollNumber: identifier?.toUpperCase() });
        if (student) user = await User.findById(student.userId);
      }
    } else {
      // Staff login with employeeId
      user = await User.findOne({ employeeId: identifier, role });
    }

    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (!user.isActive) return res.status(401).json({ success: false, message: 'Account is deactivated' });
    if (role === 'student' && !user.isVerified) return res.status(401).json({ success: false, message: 'Account not verified. Contact admin.' });
    if (user.role !== role) return res.status(403).json({ success: false, message: 'Access denied for this role' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    let studentData = null;
    if (role === 'student') {
      studentData = await Student.findOne({ userId: user._id });
    }

    const token = generateToken(user._id);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mobile: user.mobile,
        address: user.address,
        employeeId: user.employeeId,
        student: studentData
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    let studentData = null;
    if (user.role === 'student') {
      studentData = await Student.findOne({ userId: user._id });
    }
    res.json({ success: true, user: { ...user.toObject(), student: studentData } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', protect, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user._id);
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
