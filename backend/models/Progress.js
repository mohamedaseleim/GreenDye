const mongoose = require('mongoose');

const LessonProgressSchema = new mongoose.Schema({
  lesson: {
    type: mongoose.Schema.ObjectId,
    ref: 'Lesson',
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completionTime: {
    type: Date
  },
  quizScores: [{
    score: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  }]
}, { _id: false });

const ProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: true
  },
  lastCompletedLesson: {
    type: mongoose.Schema.ObjectId,
    ref: 'Lesson'
  },
  lessonProgress: [LessonProgressSchema],
  streakCount: {
    type: Number,
    default: 0
  },
  lastAccessed: {
    type: Date,
    default: Date.now
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

ProgressSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Progress', ProgressSchema);
