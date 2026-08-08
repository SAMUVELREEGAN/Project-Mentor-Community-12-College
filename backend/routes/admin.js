const express = require('express');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Project = require('../models/Project');
const Comment = require('../models/Comment');
const Question = require('../models/Question');
const Bookmark = require('../models/Bookmark');
const Activity = require('../models/Activity');
const { authenticateAdmin } = require('../middleware/auth');
const { logActivity } = require('../utils/activity');

const router = express.Router();

router.use(authenticateAdmin);

router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalProjects,
      pendingProjects,
      approvedProjects,
      rejectedProjects,
      totalComments,
      totalQuestions,
      totalBookmarks,
      recentActivities,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Project.countDocuments(),
      Project.countDocuments({ status: 'pending' }),
      Project.countDocuments({ status: 'approved' }),
      Project.countDocuments({ status: 'rejected' }),
      Comment.countDocuments(),
      Question.countDocuments(),
      Bookmark.countDocuments(),
      Activity.find()
        .populate('user', 'name email')
        .populate('admin', 'name email')
        .sort({ createdAt: -1 })
        .limit(15),
    ]);

    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    const projectsByCategory = await Project.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalProjects,
        pendingProjects,
        approvedProjects,
        rejectedProjects,
        totalComments,
        totalQuestions,
        totalBookmarks,
        usersByRole,
        projectsByCategory,
      },
      recentActivities,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const { search, role, status } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/users/:id/status', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isActive = req.body.isActive !== undefined ? !!req.body.isActive : !user.isActive;
    await user.save();

    await logActivity({
      admin: req.admin._id,
      action: 'admin_user_action',
      description: `Admin ${req.admin.name} ${user.isActive ? 'activated' : 'deactivated'} user ${user.name}`,
      meta: { userId: user._id, isActive: user.isActive },
    });

    res.json({ success: true, message: 'User status updated', user: user.toSafeObject() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const projects = await Project.find({ author: user._id }).select('_id');
    const projectIds = projects.map((p) => p._id);

    await Promise.all([
      Comment.deleteMany({ $or: [{ author: user._id }, { project: { $in: projectIds } }] }),
      Bookmark.deleteMany({ $or: [{ user: user._id }, { project: { $in: projectIds } }] }),
      Question.deleteMany({ author: user._id }),
      Project.deleteMany({ author: user._id }),
      user.deleteOne(),
    ]);

    await logActivity({
      admin: req.admin._id,
      action: 'admin_user_action',
      description: `Admin ${req.admin.name} deleted user ${user.name}`,
      meta: { email: user.email },
    });

    res.json({ success: true, message: 'User and related data deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/projects', async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const projects = await Project.find(filter)
      .populate('author', 'name email role')
      .sort({ createdAt: -1 });

    res.json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/projects/:id/verify', async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    project.status = status;
    project.rejectionReason = status === 'rejected' ? rejectionReason || 'Does not meet guidelines' : '';
    await project.save();

    await logActivity({
      admin: req.admin._id,
      action: 'admin_verify_project',
      description: `Admin ${req.admin.name} marked "${project.title}" as ${status}`,
      meta: { projectId: project._id, status },
    });

    const populated = await Project.findById(project._id).populate('author', 'name email role');
    res.json({ success: true, message: `Project ${status}`, project: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/projects/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    await Comment.deleteMany({ project: project._id });
    await Bookmark.deleteMany({ project: project._id });
    await project.deleteOne();

    await logActivity({
      admin: req.admin._id,
      action: 'admin_moderate',
      description: `Admin ${req.admin.name} deleted project "${project.title}"`,
    });

    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/comments', async (req, res) => {
  try {
    const comments = await Comment.find()
      .populate('author', 'name email')
      .populate('project', 'title')
      .sort({ createdAt: -1 });
    res.json({ success: true, comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/comments/:id/visibility', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    comment.isHidden = req.body.isHidden !== undefined ? !!req.body.isHidden : !comment.isHidden;
    await comment.save();

    await logActivity({
      admin: req.admin._id,
      action: 'admin_moderate',
      description: `Admin ${req.admin.name} ${comment.isHidden ? 'hid' : 'unhid'} a comment`,
      meta: { commentId: comment._id },
    });

    res.json({ success: true, message: 'Comment visibility updated', comment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/comments/:id', async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    await logActivity({
      admin: req.admin._id,
      action: 'admin_moderate',
      description: `Admin ${req.admin.name} deleted a comment`,
    });

    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/questions', async (req, res) => {
  try {
    const questions = await Question.find()
      .populate('author', 'name email')
      .populate('project', 'title')
      .populate('answers.author', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, questions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/questions/:id/visibility', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });

    question.isHidden = req.body.isHidden !== undefined ? !!req.body.isHidden : !question.isHidden;
    await question.save();

    await logActivity({
      admin: req.admin._id,
      action: 'admin_moderate',
      description: `Admin ${req.admin.name} ${question.isHidden ? 'hid' : 'unhid'} question "${question.title}"`,
    });

    res.json({ success: true, message: 'Question visibility updated', question });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/questions/:id', async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });

    await logActivity({
      admin: req.admin._id,
      action: 'admin_moderate',
      description: `Admin ${req.admin.name} deleted question "${question.title}"`,
    });

    res.json({ success: true, message: 'Question deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/admins', async (req, res) => {
  try {
    const admins = await Admin.find().select('-password').sort({ createdAt: -1 });
    res.json({
      success: true,
      admins: admins.map((a) => a.toSafeObject()),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/admins', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const exists = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Admin email already exists' });
    }

    const admin = await Admin.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
    });

    await logActivity({
      admin: req.admin._id,
      action: 'admin_create',
      description: `Admin ${req.admin.name} created new admin ${admin.name}`,
      meta: { newAdminId: admin._id, email: admin.email },
    });

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      admin: admin.toSafeObject(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/admins/:id/status', async (req, res) => {
  try {
    if (String(req.admin._id) === String(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate your own account' });
    }

    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    admin.isActive = req.body.isActive !== undefined ? !!req.body.isActive : !admin.isActive;
    await admin.save();

    res.json({ success: true, message: 'Admin status updated', admin: admin.toSafeObject() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/activities', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const activities = await Activity.find()
      .populate('user', 'name email')
      .populate('admin', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({ success: true, activities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/reports', async (req, res) => {
  try {
    const [users, projects, comments, questions, bookmarks, activities] = await Promise.all([
      User.find().select('-password').sort({ createdAt: -1 }),
      Project.find().populate('author', 'name email').sort({ createdAt: -1 }),
      Comment.countDocuments(),
      Question.countDocuments(),
      Bookmark.countDocuments(),
      Activity.find()
        .populate('user', 'name email')
        .populate('admin', 'name email')
        .sort({ createdAt: -1 })
        .limit(100),
    ]);

    const monthlyProjects = await Project.aggregate([
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      success: true,
      report: {
        summary: {
          totalUsers: users.length,
          activeUsers: users.filter((u) => u.isActive).length,
          totalProjects: projects.length,
          pendingProjects: projects.filter((p) => p.status === 'pending').length,
          approvedProjects: projects.filter((p) => p.status === 'approved').length,
          rejectedProjects: projects.filter((p) => p.status === 'rejected').length,
          totalComments: comments,
          totalQuestions: questions,
          totalBookmarks: bookmarks,
        },
        users,
        projects,
        monthlyProjects,
        recentActivities: activities,
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
