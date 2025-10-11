const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['active', 'completed', 'dropped', 'suspended'],
    default: 'active'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  completedLessons: [{
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson'
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  }],
  startDate: {
    type: Date,
    default: Date.now
  },
  completionDate: {
    type: Date
  },
  lastAccessDate: {
    type: Date,
    default: Date.now
  },
  totalTimeSpent: {
    type: Number, // in minutes
    default: 0
  },
  quizScores: [{
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz'
    },
    score: Number,
    maxScore: Number,
    attempt: Number,
    completedAt: Date
  }],
  certificate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate'
  },
  rating: {
    type: Number,
    min: 0,
    max: 5
  },
  review: {
    text: String,
    date: Date
  },
  notes: [{
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson'
    },
    content: String,
    timestamp: Number, // video timestamp if applicable
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate enrollments
EnrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

// Update updatedAt and lastAccessDate
EnrollmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.lastAccessDate = Date.now();
  next();
});

module.exports = mongoose.model('Enrollment', EnrollmentSchema);
