const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const CertificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    unique: true,
    index: true,
    default: () => `CERT-${uuidv4().split('-')[0].toUpperCase()}`
  },

  // Holder & course linkage
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },

  // Display fields
  userName: {
    type: String,
    required: true
  },
  courseName: {
    type: Map,
    of: String,
    required: true
  },

  // Dates
  completionDate: {
    type: Date,
    default: Date.now
  },
  issueDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiryDate: {
    type: Date
  },

  // Result
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

  // Verification artifacts
  verificationToken: {
    type: String,
    unique: true,
    index: true
  },
  verificationUrl: {
    type: String
  },
  qrCode: {
    type: String // data URL (PNG) optional cache
  },
  pdfUrl: {
    type: String
  },

  // Lifecycle
  isValid: {
    type: Boolean,
    default: true,
    index: true
  },
  isRevoked: {
    type: Boolean,
    default: false,
    index: true
  },
  revokedDate: {
    type: Date
  },
  revokedReason: {
    type: String
  },

  // Extras
  metadata: {
    duration: Number, // hours
    instructor: String,
    language: String
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Build verification token + URL before saving (idempotent)
CertificateSchema.pre('save', function (next) {
  // Ensure token exists
  if (!this.verificationToken) {
    // short, URL-safe token
    this.verificationToken = uuidv4().replace(/-/g, '');
  }
  // Ensure URL exists and includes token for public verification
  if (!this.verificationUrl) {
    const base = process.env.FRONTEND_URL || process.env.PUBLIC_BASE_URL || '';
    // Keep your existing front-end route; token appended as query for security
    this.verificationUrl = `${base}/verify/certificate/${this.certificateId}?t=${this.verificationToken}`;
  }
  return next();
});

// Indexes for fast lookups
CertificateSchema.index({ certificateId: 1 });
CertificateSchema.index({ user: 1 });
CertificateSchema.index({ course: 1 });
CertificateSchema.index({ isValid: 1, isRevoked: 1 });
// Compound index to verify quickly by cert+token
CertificateSchema.index({ certificateId: 1, verificationToken: 1 }, { unique: true });

module.exports = mongoose.model('Certificate', CertificateSchema);
