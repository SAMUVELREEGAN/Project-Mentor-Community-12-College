const User = require('./models/User');
const Admin = require('./models/Admin');
const Project = require('./models/Project');
const ChatRoom = require('./models/ChatRoom');
const ChatMessage = require('./models/ChatMessage');

async function seedDatabase() {
  const adminEmail = 'test@gamil.com';
  const userEmail = 'user@example.com';

  let admin = await Admin.findOne({ email: adminEmail });
  if (!admin) {
    admin = await Admin.create({
      name: 'System Admin',
      email: adminEmail,
      password: '123',
    });
    console.log(`Seeded admin: ${adminEmail} / 123`);
  } else {
    console.log(`Admin already exists: ${adminEmail}`);
  }

  let user = await User.findOne({ email: userEmail });
  if (!user) {
    user = await User.create({
      name: 'Demo Mentor',
      email: userEmail,
      password: '123',
      role: 'both',
      college: 'Demo College',
      year: '4th Year',
      bio: 'Default mentor account for exploring the Project Mentor Community.',
      skills: ['React', 'Node.js', 'MongoDB'],
    });
    console.log(`Seeded user: ${userEmail} / 123`);
  } else {
    console.log(`User already exists: ${userEmail}`);
  }

  let junior = await User.findOne({ email: 'junior@example.com' });
  if (!junior) {
    junior = await User.create({
      name: 'Demo Junior',
      email: 'junior@example.com',
      password: '123',
      role: 'junior',
      college: 'Demo College',
      year: '2nd Year',
      bio: 'Default junior student account for browsing and asking questions.',
      skills: ['HTML', 'CSS', 'JavaScript'],
    });
    console.log('Seeded junior: junior@example.com / 123');
  } else {
    console.log('Junior already exists: junior@example.com');
  }

  let project = await Project.findOne({ title: 'Campus Event Portal', author: user._id });
  if (!project) {
    project = await Project.create({
      title: 'Campus Event Portal',
      description:
        'A full-stack portal for college clubs to publish events, manage RSVPs, and share debugging notes from production issues.',
      technologies: ['React', 'Node.js', 'MongoDB'],
      challenges: 'Handling concurrent RSVP updates and timezone display bugs.',
      commonErrors: 'Duplicate bookings when double-clicking RSVP.',
      debuggingTechniques: 'Added request idempotency keys and Mongo unique indexes.',
      solutions: 'Optimistic UI with server-side conflict checks.',
      documentation: 'README covers setup, env vars, and deployment.',
      resources: 'Express docs, Mongoose transactions guide',
      category: 'Web Development',
      author: user._id,
      status: 'approved',
    });
    console.log('Seeded approved project: Campus Event Portal');
  } else if (project.status !== 'approved') {
    project.status = 'approved';
    project.rejectionReason = '';
    await project.save();
    console.log('Approved seeded project: Campus Event Portal');
  }

  let room = await ChatRoom.findOne({ project: project._id });
  if (!room) {
    room = await ChatRoom.create({
      name: project.title,
      description: `Group chat for ${project.title}`,
      project: project._id,
      owner: user._id,
      members: [user._id, junior._id],
      isOpen: true,
      lastMessageAt: new Date(),
      lastMessagePreview: 'Welcome to the project chat',
    });

    await ChatMessage.create({
      room: room._id,
      author: user._id,
      content: `Welcome to the "${project.title}" group chat. Ask questions and share what you learn.`,
    });

    await ChatMessage.create({
      room: room._id,
      author: junior._id,
      content: 'Thanks! I want to understand how you fixed the RSVP race condition.',
    });

    console.log('Seeded project chat for Campus Event Portal');
  } else {
    const memberIds = room.members.map(String);
    let changed = false;
    if (!memberIds.includes(String(user._id))) {
      room.members.push(user._id);
      changed = true;
    }
    if (!memberIds.includes(String(junior._id))) {
      room.members.push(junior._id);
      changed = true;
    }
    if (!room.project) {
      room.project = project._id;
      changed = true;
    }
    if (changed) {
      await room.save();
      console.log('Updated project chat members');
    } else {
      console.log('Project chat already exists');
    }
  }

  return { admin, user, junior, project, room };
}

module.exports = seedDatabase;
