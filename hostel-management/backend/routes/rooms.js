const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const RoomAllocation = require('../models/RoomAllocation');

// Get allocation summary: allocated vs vacant rooms
router.get('/summary', protect, authorize('warden', 'super_admin'), async (req, res) => {
  try {
    const rooms = await RoomAllocation.find().sort({ roomNumber: 1 });
    const allocated = rooms.filter(r => r.status === 'allocated').map(r => ({
      roomNumber: r.roomNumber,
      hostelBlock: r.hostelBlock,
      studentRollNumber: r.studentRollNumber,
      studentName: r.studentName
    }));
    const vacant = rooms.filter(r => r.status === 'vacant').map(r => ({
      roomNumber: r.roomNumber,
      hostelBlock: r.hostelBlock
    }));
    res.json({ success: true, data: { allocated, vacant } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

