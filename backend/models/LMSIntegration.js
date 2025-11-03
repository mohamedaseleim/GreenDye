const mongoose = require('mongoose');

const ExternalLMSSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['moodle', 'canvas', 'blackboard', 'scorm', 'xapi', 'custom'],
    required: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization'
  },
  credentials: {
    apiKey: String,
    apiSecret: String,
    baseUrl: String,
    token: String,
    clientId: String,
    clientSecret: String
  },
  settings: {
    syncInterval: {
      type: Number,
      default: 3600 // seconds
    },
    syncDirection: {
      type: String,
      enum: ['import', 'export', 'bidirectional'],
      default: 'bidirectional'
    },
    autoEnroll: {
      type: Boolean,
      default: false
    },
    syncGrades: {
      type: Boolean,
      default: true
    },
    syncProgress: {
      type: Boolean,
      default: true
    }
  },
  mappings: {
    courseFields: {
      type: Map,
      of: String
    },
    userFields: {
      type: Map,
      of: String
    }
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'error', 'disconnected'],
    default: 'active'
  },
  lastSync: {
    timestamp: Date,
    status: String,
    recordsSynced: Number,
    syncErrors: [String]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const DataSyncLogSchema = new mongoose.Schema({
  integration: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExternalLMS',
    required: true
  },
  operation: {
    type: String,
    enum: ['import', 'export', 'update', 'delete'],
    required: true
  },
  entityType: {
    type: String,
    enum: ['course', 'user', 'enrollment', 'grade', 'progress'],
    required: true
  },
  entityId: mongoose.Schema.Types.ObjectId,
  externalId: String,
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'partial'],
    default: 'pending'
  },
  details: {
    recordsProcessed: Number,
    recordsSucceeded: Number,
    recordsFailed: Number,
    duration: Number // milliseconds
  },
  syncErrors: [{
    message: String,
    code: String,
    field: String
  }],
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const SCORMPackageSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  version: {
    type: String,
    enum: ['1.2', '2004'],
    default: '2004'
  },
  manifest: {
    type: String,
    required: true
  },
  resources: [{
    identifier: String,
    type: String,
    href: String,
    metadata: mongoose.Schema.Types.Mixed
  }],
  packageUrl: {
    type: String,
    required: true
  },
  size: Number,
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
ExternalLMSSchema.index({ organization: 1 });
ExternalLMSSchema.index({ type: 1, status: 1 });
DataSyncLogSchema.index({ integration: 1, timestamp: -1 });
DataSyncLogSchema.index({ status: 1, timestamp: -1 });
SCORMPackageSchema.index({ course: 1 });

const ExternalLMS = mongoose.model('ExternalLMS', ExternalLMSSchema);
const DataSyncLog = mongoose.model('DataSyncLog', DataSyncLogSchema);
const SCORMPackage = mongoose.model('SCORMPackage', SCORMPackageSchema);

module.exports = { ExternalLMS, DataSyncLog, SCORMPackage };
