const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Student = require('../models/Student');
const generateToken = require('../utils/generateToken');
const { protect } = require('../middleware/auth');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../utils/emailService');

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
      // Staff login with employeeId or email
      user = await User.findOne({
        role,
        $or: [
          { employeeId: identifier },
          { email: identifier?.toLowerCase() }
        ]
      });
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

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  [
    body('identifier').notEmpty().withMessage('Identifier is required'),
    body('role').isIn(['student', 'warden', 'mess_admin', 'worker', 'super_admin']).withMessage('Invalid role'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { identifier, role } = req.body;

    try {
      let user;

      if (role === 'student') {
        // Student: identifier can be email or roll number
        user = await User.findOne({ email: identifier.toLowerCase(), role: 'student' });
        if (!user) {
          const student = await Student.findOne({ rollNumber: identifier.toUpperCase() });
          if (student) user = await User.findById(student.userId);
        }
      } else {
        // Staff: identifier can be employeeId or email
        user = await User.findOne({
          role,
          $or: [
            { employeeId: identifier },
            { email: identifier.toLowerCase() }
          ]
        });
      }

      if (!user) {
        // Do not reveal whether user exists
        return res.json({ success: true, message: 'If this account exists, a reset link has been sent to the registered email.' });
      }

      // Generate reset token
      const token = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = token;
      user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
      await user.save();

      const baseUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
      const resetLink = `${baseUrl.replace(/\/+$/, '')}/reset-password?token=${token}`;

      if (user.email) {
        await sendPasswordResetEmail({
          userEmail: user.email,
          userName: user.name,
          resetLink,
        });
      }

      res.json({
        success: true,
        message: 'If this account exists, a reset link has been sent to the registered email.',
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Token is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { token, newPassword } = req.body;

    try {
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
      }

      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.json({ success: true, message: 'Password reset successfully. You can now log in with your new password.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

module.exports = router;
