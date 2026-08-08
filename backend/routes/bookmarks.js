const express = require('express');
const Bookmark = require('../models/Bookmark');
const Project = require('../models/Project');
const { authenticateUser } = require('../middleware/auth');
const { logActivity } = require('../utils/activity');

const router = express.Router();

router.get('/', authenticateUser, async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user._id })
      .populate({
        path: 'project',
        populate: { path: 'author', select: 'name email role' },
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, bookmarks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', authenticateUser, async (req, res) => {
  try {
    const { projectId, note } = req.body;
    if (!projectId) {
      return res.status(400).json({ success: false, message: 'projectId is required' });
    }

    const project = await Project.findById(projectId);
    if (!project || project.status !== 'approved') {
      return res.status(404).json({ success: false, message: 'Project not available' });
    }

    const existing = await Bookmark.findOne({ user: req.user._id, project: projectId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Already bookmarked' });
    }

    const bookmark = await Bookmark.create({
      user: req.user._id,
      project: projectId,
      note: note || '',
    });

    await logActivity({
      user: req.user._id,
      action: 'bookmark_add',
      description: `${req.user.name} bookmarked "${project.title}"`,
      meta: { projectId },
    });

    const populated = await Bookmark.findById(bookmark._id).populate('project');
    res.status(201).json({ success: true, message: 'Bookmarked', bookmark: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:projectId', authenticateUser, async (req, res) => {
  try {
    const bookmark = await Bookmark.findOneAndDelete({
      user: req.user._id,
      project: req.params.projectId,
    });

    if (!bookmark) {
      return res.status(404).json({ success: false, message: 'Bookmark not found' });
    }

    await logActivity({
      user: req.user._id,
      action: 'bookmark_remove',
      description: `${req.user.name} removed a bookmark`,
      meta: { projectId: req.params.projectId },
    });

    res.json({ success: true, message: 'Bookmark removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/check/:projectId', authenticateUser, async (req, res) => {
  try {
    const bookmark = await Bookmark.findOne({
      user: req.user._id,
      project: req.params.projectId,
    });
    res.json({ success: true, bookmarked: !!bookmark });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
