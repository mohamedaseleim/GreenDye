const mongoose = require('mongoose');

const AssignmentSubmissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  submissionType: {
    type: String,
    enum: ['file', 'text', 'url', 'video'],
    required: true
  },
  content: {
    text: String,
    url: String,
    files: [{
      name: String,
      url: String,
      type: String,
      size: Number,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'graded', 'returned'],
    default: 'draft'
  },
  submittedAt: {
    type: Date
  },
  gradedAt: {
    type: Date
  },
  score: {
    type: Number,
    min: 0
  },
  feedback: {
    type: Map,
    of: String
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isLate: {
    type: Boolean,
    default: false
  },
  attempt: {
    type: Number,
    default: 1
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

// Update updatedAt timestamp and set submittedAt when status changes to submitted
AssignmentSubmissionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.isModified('status') && this.status === 'submitted' && !this.submittedAt) {
    this.submittedAt = Date.now();
  }
  if (this.isModified('status') && this.status === 'graded' && !this.gradedAt) {
    this.gradedAt = Date.now();
  }
  next();
});

// Create indexes
AssignmentSubmissionSchema.index({ assignment: 1, user: 1 });
AssignmentSubmissionSchema.index({ course: 1, user: 1 });
AssignmentSubmissionSchema.index({ status: 1 });

module.exports = mongoose.model('AssignmentSubmission', AssignmentSubmissionSchema);
