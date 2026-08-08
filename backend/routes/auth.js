const express = require('express');
const User = require('../models/User');
const Admin = require('../models/Admin');
const { signToken, authenticateUser, authenticateAdmin } = require('../middleware/auth');
const { logActivity } = require('../utils/activity');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, college, year, bio, skills } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role || 'junior',
      college: college || '',
      year: year || '',
      bio: bio || '',
      skills: Array.isArray(skills) ? skills : skills ? String(skills).split(',').map((s) => s.trim()).filter(Boolean) : [],
    });

    await logActivity({
      user: user._id,
      action: 'register',
      description: `${user.name} registered as ${user.role}`,
      meta: { email: user.email, role: user.role },
    });

    const token = signToken({ id: user._id, type: 'user', role: user.role });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated' });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    await logActivity({
      user: user._id,
      action: 'login',
      description: `${user.name} logged in`,
    });

    const token = signToken({ id: user._id, type: 'user', role: user.role });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Login failed' });
  }
});

router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!admin.isActive) {
      return res.status(403).json({ success: false, message: 'Admin account is deactivated' });
    }

    const match = await admin.comparePassword(password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    await logActivity({
      admin: admin._id,
      action: 'login',
      description: `Admin ${admin.name} logged in`,
    });

    const token = signToken({ id: admin._id, type: 'admin' });

    res.json({
      success: true,
      message: 'Admin login successful',
      token,
      admin: admin.toSafeObject(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Admin login failed' });
  }
});

router.get('/me', authenticateUser, async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
});

router.get('/admin/me', authenticateAdmin, async (req, res) => {
  res.json({ success: true, admin: req.admin.toSafeObject() });
});

module.exports = router;
