const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const CertificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    unique: true,
    default: () => `CERT-${uuidv4().split('-')[0].toUpperCase()}`
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
  userName: {
    type: String,
    required: true
  },
  courseName: {
    type: Map,
    of: String,
    required: true
  },
  completionDate: {
    type: Date,
    default: Date.now
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'Pass', 'Distinction'],
    default: 'Pass'
  },
  score: {
    type: Number,
    min: 0,
    max: 100
  },
  qrCode: {
    type: String
  },
  pdfUrl: {
    type: String
  },
  verificationUrl: {
    type: String
  },
  isValid: {
    type: Boolean,
    default: true
  },
  isRevoked: {
    type: Boolean,
    default: false
  },
  revokedDate: {
    type: Date
  },
  revokedReason: {
    type: String
  },
  metadata: {
    duration: Number, // course duration in hours
    instructor: String,
    language: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create verification URL before saving
CertificateSchema.pre('save', function(next) {
  if (!this.verificationUrl) {
    this.verificationUrl = `${process.env.FRONTEND_URL}/verify/certificate/${this.certificateId}`;
  }
  next();
});

// Create indexes for fast verification
CertificateSchema.index({ certificateId: 1 });
CertificateSchema.index({ user: 1 });
CertificateSchema.index({ course: 1 });
CertificateSchema.index({ isValid: 1, isRevoked: 1 });

module.exports = mongoose.model('Certificate', CertificateSchema);
