const express = require('express');
const Project = require('../models/Project');
const Comment = require('../models/Comment');
const Bookmark = require('../models/Bookmark');
const { authenticateUser, requireMentor } = require('../middleware/auth');
const { logActivity } = require('../utils/activity');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { search, category, status, author, page = 1, limit = 12 } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    } else if (!author) {
      filter.status = 'approved';
    }

    if (category && category !== 'All') filter.category = category;
    if (author) filter.author = author;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { technologies: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate('author', 'name email role college year')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Project.countDocuments(filter),
    ]);

    res.json({
      success: true,
      projects,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)) || 1,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/mine', authenticateUser, async (req, res) => {
  try {
    const projects = await Project.find({ author: req.user._id })
      .populate('author', 'name email role')
      .sort({ createdAt: -1 });
    res.json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate(
      'author',
      'name email role college year bio skills'
    );
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    project.views += 1;
    await project.save();

    const comments = await Comment.find({ project: project._id, isHidden: false })
      .populate('author', 'name email role')
      .sort({ createdAt: 1 });

    res.json({ success: true, project, comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', authenticateUser, requireMentor, upload.array('attachments', 5), async (req, res) => {
  try {
    const {
      title,
      description,
      technologies,
      challenges,
      commonErrors,
      debuggingTechniques,
      solutions,
      documentation,
      resources,
      category,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required' });
    }

    const techList = Array.isArray(technologies)
      ? technologies
      : technologies
        ? String(technologies)
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

    const attachments = (req.files || []).map((f) => f.filename);

    const project = await Project.create({
      title: title.trim(),
      description,
      technologies: techList,
      challenges: challenges || '',
      commonErrors: commonErrors || '',
      debuggingTechniques: debuggingTechniques || '',
      solutions: solutions || '',
      documentation: documentation || '',
      resources: resources || '',
      category: category || 'Other',
      author: req.user._id,
      status: 'pending',
      attachments,
    });

    await logActivity({
      user: req.user._id,
      action: 'project_create',
      description: `${req.user.name} uploaded project "${project.title}"`,
      meta: { projectId: project._id, title: project.title },
    });

    const populated = await Project.findById(project._id).populate('author', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Project submitted for admin verification',
      project: populated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (String(project.author) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this project' });
    }

    const fields = [
      'title',
      'description',
      'challenges',
      'commonErrors',
      'debuggingTechniques',
      'solutions',
      'documentation',
      'resources',
      'category',
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) project[field] = req.body[field];
    });

    if (req.body.technologies !== undefined) {
      project.technologies = Array.isArray(req.body.technologies)
        ? req.body.technologies
        : String(req.body.technologies)
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);
    }

    project.status = 'pending';
    project.rejectionReason = '';
    await project.save();

    await logActivity({
      user: req.user._id,
      action: 'project_update',
      description: `${req.user.name} updated project "${project.title}"`,
      meta: { projectId: project._id },
    });

    const populated = await Project.findById(project._id).populate('author', 'name email role');
    res.json({ success: true, message: 'Project updated and pending re-verification', project: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (String(project.author) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this project' });
    }

    await Comment.deleteMany({ project: project._id });
    await Bookmark.deleteMany({ project: project._id });
    await project.deleteOne();

    await logActivity({
      user: req.user._id,
      action: 'project_delete',
      description: `${req.user.name} deleted project "${project.title}"`,
      meta: { title: project.title },
    });

    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
