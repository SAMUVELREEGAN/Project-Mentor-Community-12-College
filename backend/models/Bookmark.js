const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    note: { type: String, default: '', maxlength: 500 },
  },
  { timestamps: true }
);

bookmarkSchema.index({ user: 1, project: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
