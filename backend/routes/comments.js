const express = require('express');
const Comment = require('../models/Comment');
const Project = require('../models/Project');
const { authenticateUser } = require('../middleware/auth');
const { logActivity } = require('../utils/activity');

const router = express.Router();

router.post('/', authenticateUser, async (req, res) => {
  try {
    const { content, projectId, parentComment } = req.body;
    if (!content || !projectId) {
      return res.status(400).json({ success: false, message: 'Content and projectId are required' });
    }

    const project = await Project.findById(projectId);
    if (!project || project.status !== 'approved') {
      return res.status(404).json({ success: false, message: 'Project not available for discussion' });
    }

    const comment = await Comment.create({
      content: content.trim(),
      author: req.user._id,
      project: projectId,
      parentComment: parentComment || null,
    });

    await logActivity({
      user: req.user._id,
      action: 'comment_create',
      description: `${req.user.name} commented on "${project.title}"`,
      meta: { projectId, commentId: comment._id },
    });

    const populated = await Comment.findById(comment._id).populate('author', 'name email role');
    res.status(201).json({ success: true, message: 'Comment added', comment: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    if (String(comment.author) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await comment.deleteOne();

    await logActivity({
      user: req.user._id,
      action: 'comment_delete',
      description: `${req.user.name} deleted a comment`,
      meta: { commentId: req.params.id },
    });

    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
