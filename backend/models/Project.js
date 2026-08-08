const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    technologies: [{ type: String, trim: true }],
    challenges: { type: String, default: '' },
    commonErrors: { type: String, default: '' },
    debuggingTechniques: { type: String, default: '' },
    solutions: { type: String, default: '' },
    documentation: { type: String, default: '' },
    resources: { type: String, default: '' },
    category: {
      type: String,
      enum: [
        'Web Development',
        'Mobile App',
        'Machine Learning',
        'Data Science',
        'IoT',
        'Desktop Application',
        'Other',
      ],
      default: 'Other',
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: { type: String, default: '' },
    views: { type: Number, default: 0 },
    attachments: [{ type: String }],
  },
  { timestamps: true }
);

projectSchema.index({ title: 'text', description: 'text', technologies: 'text' });

module.exports = mongoose.model('Project', projectSchema);
