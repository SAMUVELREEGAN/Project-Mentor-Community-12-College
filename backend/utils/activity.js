const Activity = require('../models/Activity');

async function logActivity({ user, admin, action, description, meta = {} }) {
  try {
    await Activity.create({
      user: user || null,
      admin: admin || null,
      action,
      description,
      meta,
    });
  } catch (error) {
    console.error('Activity log failed:', error.message);
  }
}

module.exports = { logActivity };
