const mongoose = require('mongoose');

const AuditTrailSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true
  },
  resourceType: {
    type: String
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  targetType: {
    type: String
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId
  },
  details: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  ipAddress: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AuditTrail', AuditTrailSchema);
