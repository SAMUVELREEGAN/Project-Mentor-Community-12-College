const express = require('express');
const ChatRoom = require('../models/ChatRoom');
const ChatMessage = require('../models/ChatMessage');
const Project = require('../models/Project');
const User = require('../models/User');
const { authenticateUser } = require('../middleware/auth');
const { logActivity } = require('../utils/activity');

const router = express.Router();

const USER_SELECT = 'name email role college year';
const PROJECT_SELECT = 'title description category status author technologies views createdAt';

function isMember(room, userId) {
  return room.members.some((m) => String(m._id || m) === String(userId));
}

function populateRoom(query) {
  return query
    .populate('owner', USER_SELECT)
    .populate('members', USER_SELECT)
    .populate('project', PROJECT_SELECT);
}

function toRoomPayload(room, userId) {
  const obj = room.toObject();
  obj.isMember = isMember(room, userId);
  obj.isOwner = String(room.owner._id || room.owner) === String(userId);
  return obj;
}

async function ensureProjectRoom(project, actor) {
  let room = await ChatRoom.findOne({ project: project._id });
  if (room) return room;

  room = await ChatRoom.create({
    name: project.title,
    description: `Group chat for ${project.title}`,
    project: project._id,
    owner: project.author,
    members: [project.author],
    isOpen: true,
    lastMessageAt: new Date(),
    lastMessagePreview: 'Project chat opened',
  });

  await ChatMessage.create({
    room: room._id,
    author: project.author,
    content: `Chat opened for project "${project.title}". Mentors and juniors can discuss here.`,
  });

  if (actor && String(actor._id) !== String(project.author)) {
    // room created by first visitor who isn't owner — still attribute create activity lightly
  }

  await logActivity({
    user: actor?._id || project.author,
    action: 'chat_room_create',
    description: `Project chat created for "${project.title}"`,
    meta: { roomId: room._id, projectId: project._id },
  });

  return room;
}

router.get('/directory', authenticateUser, async (req, res) => {
  try {
    const q = String(req.query.search || '').trim();
    const filter = { isActive: true, _id: { $ne: req.user._id } };
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }

    const users = await User.find(filter).select(USER_SELECT).sort({ name: 1 }).limit(40);
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/projects', authenticateUser, async (req, res) => {
  try {
    const q = String(req.query.search || '').trim();
    const filter = { status: 'approved' };
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { technologies: { $regex: q, $options: 'i' } },
      ];
    }

    const projects = await Project.find(filter)
      .populate('author', USER_SELECT)
      .sort({ updatedAt: -1 })
      .limit(100);

    const projectIds = projects.map((p) => p._id);
    const rooms = await ChatRoom.find({ project: { $in: projectIds } });
    const roomByProject = new Map(rooms.map((r) => [String(r.project), r]));

    const items = projects.map((project) => {
      const room = roomByProject.get(String(project._id));
      return {
        project: {
          _id: project._id,
          title: project.title,
          description: project.description,
          category: project.category,
          technologies: project.technologies,
          author: project.author,
          views: project.views,
          createdAt: project.createdAt,
        },
        room: room
          ? {
              _id: room._id,
              lastMessageAt: room.lastMessageAt,
              lastMessagePreview: room.lastMessagePreview,
              memberCount: room.members.length,
              isMember: isMember(room, req.user._id),
            }
          : null,
      };
    });

    items.sort((a, b) => {
      const aTime = new Date(a.room?.lastMessageAt || a.project.createdAt).getTime();
      const bTime = new Date(b.room?.lastMessageAt || b.project.createdAt).getTime();
      return bTime - aTime;
    });

    res.json({ success: true, projects: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/projects/:projectId/open', authenticateUser, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId).populate('author', USER_SELECT);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (project.status !== 'approved') {
      return res.status(403).json({ success: false, message: 'Only approved projects have group chat' });
    }

    let room = await ensureProjectRoom(project, req.user);

    if (!isMember(room, req.user._id)) {
      room.members.push(req.user._id);
      await room.save();
      await ChatMessage.create({
        room: room._id,
        author: req.user._id,
        content: `${req.user.name} joined the chat`,
      });
      room.lastMessageAt = new Date();
      room.lastMessagePreview = `${req.user.name} joined`;
      await room.save();
    }

    const populated = await populateRoom(ChatRoom.findById(room._id));
    res.json({
      success: true,
      room: toRoomPayload(populated, req.user._id),
      project: {
        _id: project._id,
        title: project.title,
        description: project.description,
        category: project.category,
        technologies: project.technologies,
        author: project.author,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/rooms/:id', authenticateUser, async (req, res) => {
  try {
    const room = await populateRoom(ChatRoom.findById(req.params.id));
    if (!room) return res.status(404).json({ success: false, message: 'Chat room not found' });

    const member = isMember(room, req.user._id);
    if (!member && !room.isOpen) {
      return res.status(403).json({ success: false, message: 'You are not a member of this chat' });
    }

    res.json({ success: true, room: toRoomPayload(room, req.user._id) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/rooms/:id/join', authenticateUser, async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Chat room not found' });

    if (!room.isOpen && String(room.owner) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'This chat is invite-only' });
    }

    if (!isMember(room, req.user._id)) {
      room.members.push(req.user._id);
      await room.save();
      await ChatMessage.create({
        room: room._id,
        author: req.user._id,
        content: `${req.user.name} joined the chat`,
      });
      room.lastMessageAt = new Date();
      room.lastMessagePreview = `${req.user.name} joined`;
      await room.save();
    }

    const populated = await populateRoom(ChatRoom.findById(room._id));
    res.json({ success: true, message: 'Joined chat', room: toRoomPayload(populated, req.user._id) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/rooms/:id/members', authenticateUser, async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Chat room not found' });

    if (String(room.owner) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Only the project owner can add members' });
    }

    const memberIds = Array.isArray(req.body.memberIds) ? req.body.memberIds.map(String) : [];
    if (memberIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Select at least one member' });
    }

    const validUsers = await User.find({ _id: { $in: memberIds }, isActive: true });
    const existing = new Set(room.members.map(String));
    const added = [];

    validUsers.forEach((u) => {
      if (!existing.has(String(u._id))) {
        room.members.push(u._id);
        added.push(u);
      }
    });

    if (added.length) {
      await room.save();
      const names = added.map((u) => u.name).join(', ');
      await ChatMessage.create({
        room: room._id,
        author: req.user._id,
        content: `${req.user.name} added ${names}`,
      });
      room.lastMessageAt = new Date();
      room.lastMessagePreview = `Added ${names}`;
      await room.save();
    }

    const populated = await populateRoom(ChatRoom.findById(room._id));
    res.json({
      success: true,
      message: added.length ? 'Members added' : 'No new members',
      room: toRoomPayload(populated, req.user._id),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/rooms/:id/messages', authenticateUser, async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Chat room not found' });

    if (!isMember(room, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Join the chat to view messages' });
    }

    const filter = { room: room._id };
    if (req.query.after) {
      filter.createdAt = { $gt: new Date(req.query.after) };
    }

    const limit = Math.min(Number(req.query.limit) || 80, 200);
    let messages;

    if (req.query.after) {
      messages = await ChatMessage.find(filter)
        .populate('author', USER_SELECT)
        .sort({ createdAt: 1 })
        .limit(limit);
    } else {
      messages = await ChatMessage.find(filter)
        .populate('author', USER_SELECT)
        .sort({ createdAt: -1 })
        .limit(limit);
      messages.reverse();
    }

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/rooms/:id/messages', authenticateUser, async (req, res) => {
  try {
    const content = String(req.body.content || '').trim();
    if (!content) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    const room = await ChatRoom.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Chat room not found' });

    if (!isMember(room, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Join the chat to send messages' });
    }

    const message = await ChatMessage.create({
      room: room._id,
      author: req.user._id,
      content,
    });

    room.lastMessageAt = message.createdAt;
    room.lastMessagePreview = content.slice(0, 160);
    await room.save();

    const populated = await ChatMessage.findById(message._id).populate('author', USER_SELECT);
    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
