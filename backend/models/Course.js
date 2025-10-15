const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  title: {
    type: Map,
    of: String,
    required: [true, 'Please provide course title'],
    // Example: { en: 'Course Title', ar: 'عنوان الدورة', fr: 'Titre du cours' }
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: Map,
    of: String,
    required: [true, 'Please provide course description']
  },
  shortDescription: {
    type: Map,
    of: String
  },
  category: {
    type: String,
    required: [true, 'Please provide course category'],
    enum: ['technology', 'business', 'health', 'language', 'arts', 'science', 'other']
  },
  level: {
    type: String,
    required: [true, 'Please provide course level'],
    enum: ['beginner', 'intermediate', 'advanced', 'all']
  },
  language: {
    type: [String],
    default: ['en']
  },
  thumbnail: {
    type: String,
    default: '/uploads/courses/default-thumbnail.jpg'
  },
  videoPreview: {
    type: String
  },
  price: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'EGP']
  },
  duration: {
    type: Number, // in hours
    required: [true, 'Please provide course duration']
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide course instructor']
  },
  lessons: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  }],
  
    sections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section'
  }],
requirements: {
    type: Map,
    of: [String]
  },
  whatYouWillLearn: {
    type: Map,
    of: [String]
  },
  enrolled: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewsCount: {
    type: Number,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishDate: {
    type: Date
  },
  certificate: {
    enabled: {
      type: Boolean,
      default: true
    },
    template: {
      type: String,
      default: 'default'
    }
  },
  deliveryMode: {
    type: String,
    enum: ['synchronous', 'asynchronous', 'hybrid'],
    default: 'asynchronous'
  },
  liveSessions: [{
    title: String,
    date: Date,
    duration: Number, // in minutes
    meetingLink: String,
recording: String,

          participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    platform: {
      type: String,
      enum: ['zoom', 'jitsi', 'github-classroom', 'agora', 'other'],
      default: 'zoom'
    },

  }],
  tags: [String],
  metadata: {
    views: {
      type: Number,
      default: 0
    },
    completions: {
      type: Number,
      default: 0
    }
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

// Create slug before saving
CourseSchema.pre('save', function(next) {
  if (!this.slug && this.title) {
    const titleEn = this.title.get('en') || this.title.get('ar') || this.title.get('fr');
    this.slug = titleEn
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
  }
  this.updatedAt = Date.now();
  next();
});

// Create indexes
CourseSchema.index({ slug: 1 });
CourseSchema.index({ category: 1 });
CourseSchema.index({ instructor: 1 });
CourseSchema.index({ isPublished: 1 });

module.exports = mongoose.model('Course', CourseSchema);
