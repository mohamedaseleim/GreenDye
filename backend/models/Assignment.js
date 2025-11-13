const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true
  },
  title: {
    type: Map,
    of: String,
    required: [true, 'Please provide assignment title']
  },
  description: {
    type: Map,
    of: String,
    required: [true, 'Please provide assignment description']
  },
  instructions: {
    type: Map,
    of: String
  },
  dueDate: {
    type: Date
  },
  maxPoints: {
    type: Number,
    default: 100,
    min: 0
  },
  submissionType: {
    type: [String],
    enum: ['file', 'text', 'url', 'video'],
    default: ['file']
  },
  allowedFileTypes: {
    type: [String],
    default: ['pdf', 'doc', 'docx', 'txt', 'zip']
  },
  maxFileSize: {
    type: Number,
    default: 10485760 // 10MB in bytes
  },
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number
  }],
  isRequired: {
    type: Boolean,
    default: true
  },
  allowLateSubmission: {
    type: Boolean,
    default: false
  },
  latePenalty: {
    type: Number,
    default: 0,
    min: 0,
    max: 100 // percentage deduction
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt timestamp
AssignmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes
AssignmentSchema.index({ course: 1, lesson: 1 });
AssignmentSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Assignment', AssignmentSchema);
