const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  title: {
    type: Map,
    of: String,
    required: [true, 'Please provide lesson title']
  },
  description: {
    type: Map,
    of: String
  },
  order: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['video', 'text', 'quiz', 'assignment', 'live', 'document'],
    default: 'video'
  },
  content: {
    video: {
      url: String,
      duration: Number, // in seconds
      thumbnail: String
    },
    text: {
      type: Map,
      of: String
    },
    document: {
      url: String,
      type: String, // pdf, doc, ppt
      name: String
    }
  },
  resources: [{
    name: String,
    url: String,
    type: String,
    size: Number,
    description: String
  }],
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz'
  },
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment'
  },
  isFree: {
    type: Boolean,
    default: false
  },
  duration: {
    type: Number, // in minutes
    default: 0
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
LessonSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes
LessonSchema.index({ course: 1, order: 1 });

module.exports = mongoose.model('Lesson', LessonSchema);
