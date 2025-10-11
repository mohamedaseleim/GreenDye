const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const TrainerSchema = new mongoose.Schema({
  trainerId: {
    type: String,
    unique: true,
    default: () => `TR-${uuidv4().split('-')[0].toUpperCase()}`
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  fullName: {
    type: String,
    required: [true, 'Please provide trainer full name']
  },
  title: {
    type: Map,
    of: String
  },
  expertise: [{
    type: String
  }],
  bio: {
    type: Map,
    of: String
  },
  qualifications: [{
    degree: String,
    institution: String,
    year: Number,
    field: String
  }],
  certifications: [{
    name: String,
    organization: String,
    year: Number,
    expiryDate: Date,
    certificateUrl: String
  }],
  experience: {
    type: Number, // in years
    default: 0
  },
  experienceDetails: [{
    position: String,
    company: String,
    startDate: Date,
    endDate: Date,
    description: String
  }],
  specializations: [{
    type: String
  }],
  languages: [{
    language: {
      type: String,
      enum: ['en', 'ar', 'fr', 'es', 'de']
    },
    proficiency: {
      type: String,
      enum: ['basic', 'intermediate', 'advanced', 'native']
    }
  }],
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
  coursesCount: {
    type: Number,
    default: 0
  },
  studentsCount: {
    type: Number,
    default: 0
  },
  socialLinks: {
    linkedin: String,
    twitter: String,
    facebook: String,
    website: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  verificationDate: {
    type: Date
  },
  verificationDocuments: [{
    type: String,
    url: String,
    uploadDate: Date
  }],
  accreditations: [{
    organization: String,
    accreditationNumber: String,
    issueDate: Date,
    expiryDate: Date,
    document: String
  }],
  availability: {
    type: String,
    enum: ['available', 'busy', 'unavailable'],
    default: 'available'
  },
  hourlyRate: {
    type: Number,
    min: 0
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
TrainerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes
TrainerSchema.index({ trainerId: 1 });
TrainerSchema.index({ user: 1 });
TrainerSchema.index({ isVerified: 1, isActive: 1 });

module.exports = mongoose.model('Trainer', TrainerSchema);
