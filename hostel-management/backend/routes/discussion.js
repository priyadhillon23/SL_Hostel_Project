const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const DiscussionMessage = require('../models/DiscussionMessage');

// Get recent discussion messages (global board for all roles)
router.get('/', protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const messages = await DiscussionMessage.find()
      .populate('userId', 'name role')
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json({ success: true, data: messages.reverse() }); // send oldest -> newest
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Post a new message
router.post('/', protect, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }
    const doc = await DiscussionMessage.create({
      userId: req.user._id,
      role: req.user.role,
      message: message.trim()
    });
    const populated = await doc.populate('userId', 'name role');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a message (super admin only)
router.delete('/:id', protect, async (req, res) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ success: false, message: 'Only super admin can delete messages' });
  }
  try {
    await DiscussionMessage.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

