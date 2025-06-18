const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Update user location
router.patch('/location', auth, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const userId = req.user.userId;

    const user = await User.findByIdAndUpdate(
      userId,
      { location: { lat, lng } },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Location updated successfully',
      user
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle rider availability
router.patch('/availability', auth, async (req, res) => {
  try {
    const { available } = req.body;
    const userId = req.user.userId;

    if (req.user.role !== 'rider') {
      return res.status(403).json({ message: 'Only riders can update availability' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { available },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Availability updated successfully',
      user
    });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json({ user });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;