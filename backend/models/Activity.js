const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    action: {
      type: String,
      required: true,
      enum: [
        'register',
        'login',
        'project_create',
        'project_update',
        'project_delete',
        'comment_create',
        'comment_delete',
        'question_create',
        'answer_create',
        'bookmark_add',
        'bookmark_remove',
        'profile_update',
        'admin_verify_project',
        'admin_moderate',
        'admin_user_action',
        'admin_create',
      ],
    },
    description: { type: String, required: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Activity', activitySchema);
