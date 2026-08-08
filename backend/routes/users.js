const express = require('express');
const User = require('../models/User');
const { authenticateUser } = require('../middleware/auth');
const { logActivity } = require('../utils/activity');

const router = express.Router();

router.get('/profile', authenticateUser, async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
});

router.put('/profile', authenticateUser, async (req, res) => {
  try {
    const { name, college, year, bio, skills, role } = req.body;
    const user = req.user;

    if (name !== undefined) user.name = name.trim();
    if (college !== undefined) user.college = college;
    if (year !== undefined) user.year = year;
    if (bio !== undefined) user.bio = bio;
    if (skills !== undefined) {
      user.skills = Array.isArray(skills)
        ? skills
        : String(skills)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
    }
    if (role !== undefined && ['junior', 'mentor', 'both'].includes(role)) {
      user.role = role;
    }

    await user.save();

    await logActivity({
      user: user._id,
      action: 'profile_update',
      description: `${user.name} updated their profile`,
    });

    res.json({ success: true, message: 'Profile updated', user: user.toSafeObject() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Update failed' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user || !user.isActive) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user: user.toSafeObject() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
