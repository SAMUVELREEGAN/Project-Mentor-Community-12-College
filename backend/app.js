const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const config = require('./config');
const seedDatabase = require('./seed');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const commentRoutes = require('./routes/comments');
const questionRoutes = require('./routes/questions');
const bookmarkRoutes = require('./routes/bookmarks');
const chatRoutes = require('./routes/chat');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, config.UPLOAD_DIR)));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Project Mentor Community API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err instanceof multer.MulterError || err.message === 'File type not allowed') {
    return res.status(400).json({ success: false, message: err.message });
  }
  res.status(500).json({ success: false, message: err.message || 'Server error' });
});

async function start() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('Connected to MongoDB');

    await seedDatabase();

    app.listen(config.PORT, () => {
      console.log(`Server running on http://localhost:${config.PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

module.exports = app;
