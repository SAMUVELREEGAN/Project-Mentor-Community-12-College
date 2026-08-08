const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const Admin = require('../models/Admin');

function signToken(payload) {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, config.JWT_SECRET);
}

function extractToken(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice(7);
}

async function authenticateUser(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    if (decoded.type !== 'user') {
      return res.status(401).json({ success: false, message: 'Invalid user token' });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User account not found or inactive' });
    }

    req.user = user;
    req.authType = 'user';
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

async function authenticateAdmin(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ success: false, message: 'Admin authentication required' });
    }

    const decoded = verifyToken(token);
    if (decoded.type !== 'admin') {
      return res.status(401).json({ success: false, message: 'Invalid admin token' });
    }

    const admin = await Admin.findById(decoded.id);
    if (!admin || !admin.isActive) {
      return res.status(401).json({ success: false, message: 'Admin account not found or inactive' });
    }

    req.admin = admin;
    req.authType = 'admin';
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid or expired admin token' });
  }
}

function requireMentor(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  if (req.user.role !== 'mentor' && req.user.role !== 'both') {
    return res.status(403).json({
      success: false,
      message: 'Only mentors can perform this action. Update your role in profile.',
    });
  }
  next();
}

module.exports = {
  signToken,
  verifyToken,
  authenticateUser,
  authenticateAdmin,
  requireMentor,
};
