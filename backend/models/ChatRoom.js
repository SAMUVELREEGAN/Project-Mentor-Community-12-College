const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, default: '', trim: true, maxlength: 300 },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isOpen: { type: Boolean, default: true },
    lastMessageAt: { type: Date, default: Date.now },
    lastMessagePreview: { type: String, default: '', maxlength: 160 },
  },
  { timestamps: true }
);

chatRoomSchema.index({ members: 1, lastMessageAt: -1 });
chatRoomSchema.index(
  { project: 1 },
  { unique: true, partialFilterExpression: { project: { $type: 'objectId' } } }
);

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
