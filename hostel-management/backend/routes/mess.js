const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const MessMenu = require('../models/MessMenu');
const Review = require('../models/Review');
const Student = require('../models/Student');

// Get weekly/all menu (all authenticated users)
router.get('/menu', protect, async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const weekLater = new Date(today); weekLater.setDate(today.getDate() + 7);
    const menus = await MessMenu.find({ date: { $gte: today, $lte: weekLater } }).sort({ date: 1 });
    res.json({ success: true, data: menus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all menus (mess admin)
router.get('/menu/all', protect, authorize('mess_admin', 'super_admin'), async (req, res) => {
  try {
    const menus = await MessMenu.find().sort({ date: -1 }).limit(30);
    res.json({ success: true, data: menus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mess Admin: Create menu
router.post('/menu', protect, authorize('mess_admin', 'super_admin'), async (req, res) => {
  try {
    const { date, breakfast, lunch, dinner, snacks } = req.body;
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const d = new Date(date); d.setHours(0,0,0,0);
    const menu = await MessMenu.create({
      date: d, dayOfWeek: days[d.getDay()],
      breakfast, lunch, dinner, snacks, createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: menu });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'Menu for this date already exists' });
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mess Admin: Update menu
router.put('/menu/:id', protect, authorize('mess_admin', 'super_admin'), async (req, res) => {
  try {
    const menu = await MessMenu.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: new Date() }, { new: true });
    if (!menu) return res.status(404).json({ success: false, message: 'Menu not found' });
    res.json({ success: true, data: menu });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mess Admin: Delete menu
router.delete('/menu/:id', protect, authorize('mess_admin', 'super_admin'), async (req, res) => {
  try {
    await MessMenu.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Menu deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Student: Submit review
router.post('/review', protect, authorize('student'), async (req, res) => {
  try {
    const { rating, feedback, mealType, menuId } = req.body;
    const student = await Student.findOne({ userId: req.user._id });
    const review = await Review.create({ studentId: student._id, rating, feedback, mealType, menuId });
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mess Admin: Get all reviews
router.get('/reviews', protect, authorize('mess_admin', 'super_admin'), async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'name' } })
      .sort({ date: -1 });
    const avgRating = reviews.length > 0 ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : 0;
    res.json({ success: true, data: reviews, avgRating });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Student: Get reviews stats
router.get('/reviews/stats', protect, async (req, res) => {
  try {
    const reviews = await Review.find().sort({ date: -1 }).limit(50);
    const avgRating = reviews.length > 0 ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : 0;
    res.json({ success: true, avgRating, totalReviews: reviews.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
