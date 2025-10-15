const mongoose = require('mongoose');

const SectionSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  title: {
    type: Map,
    of: String,
    required: [true, 'Please provide section title']
  },
  description: {
    type: Map,
    of: String
  },
  order: {
    type: Number,
    required: true
  },
  lessons: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  }],
  attachments: [{
    name: String,
    url: String,
    type: String
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

SectionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Section', SectionSchema);
