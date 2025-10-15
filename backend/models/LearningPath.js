const mongoose = require('mongoose');

const LearningPathSchema = new mongoose.Schema({
  title: {
    type: Map,
    of: String,
    required: [true, 'Please provide learning path title']
  },
  description: {
    type: Map,
    of: String
  },
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  weights: [{
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    weight: Number
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

LearningPathSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('LearningPath', LearningPathSchema);
