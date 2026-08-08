const express = require('express');
const Question = require('../models/Question');
const Project = require('../models/Project');
const { authenticateUser } = require('../middleware/auth');
const { logActivity } = require('../utils/activity');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { projectId, status, search, page = 1, limit = 20 } = req.query;
    const filter = { isHidden: false };
    if (projectId) filter.project = projectId;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [questions, total] = await Promise.all([
      Question.find(filter)
        .populate('author', 'name email role')
        .populate('project', 'title')
        .populate('answers.author', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Question.countDocuments(filter),
    ]);

    res.json({
      success: true,
      questions,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)) || 1,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('author', 'name email role college')
      .populate('project', 'title status')
      .populate('answers.author', 'name email role');

    if (!question || question.isHidden) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    const visible = question.toObject();
    visible.answers = visible.answers.filter((a) => !a.isHidden);

    res.json({ success: true, question: visible });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', authenticateUser, async (req, res) => {
  try {
    const { title, content, projectId } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    if (projectId) {
      const project = await Project.findById(projectId);
      if (!project || project.status !== 'approved') {
        return res.status(400).json({ success: false, message: 'Invalid project reference' });
      }
    }

    const question = await Question.create({
      title: title.trim(),
      content,
      author: req.user._id,
      project: projectId || null,
    });

    await logActivity({
      user: req.user._id,
      action: 'question_create',
      description: `${req.user.name} asked: "${question.title}"`,
      meta: { questionId: question._id },
    });

    const populated = await Question.findById(question._id)
      .populate('author', 'name email role')
      .populate('project', 'title');

    res.status(201).json({ success: true, message: 'Question posted', question: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/answers', authenticateUser, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: 'Answer content is required' });
    }

    const question = await Question.findById(req.params.id);
    if (!question || question.isHidden) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    question.answers.push({
      content: content.trim(),
      author: req.user._id,
    });
    if (question.status === 'open') question.status = 'answered';
    await question.save();

    await logActivity({
      user: req.user._id,
      action: 'answer_create',
      description: `${req.user.name} answered "${question.title}"`,
      meta: { questionId: question._id },
    });

    const populated = await Question.findById(question._id)
      .populate('author', 'name email role')
      .populate('project', 'title')
      .populate('answers.author', 'name email role');

    res.status(201).json({ success: true, message: 'Answer posted', question: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
