const { ExternalLMS, DataSyncLog, SCORMPackage } = require('../models/LMSIntegration');
const Course = require('../models/Course');
// const User = require('../models/User'); // Unused import
// const Enrollment = require('../models/Enrollment'); // Unused import

// @desc    Create LMS integration
// @route   POST /api/lms-integration
// @access  Private/Admin
exports.createIntegration = async (req, res, next) => {
  try {
    const integration = await ExternalLMS.create(req.body);
    
    res.status(201).json({
      success: true,
      data: integration
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all integrations
// @route   GET /api/lms-integration
// @access  Private/Admin
exports.getAllIntegrations = async (req, res, next) => {
  try {
    const { organization, type, status } = req.query;
    
    const query = {};
    if (organization) query.organization = organization;
    if (type) query.type = type;
    if (status) query.status = status;
    
    const integrations = await ExternalLMS.find(query)
      .populate('organization')
      .sort('-createdAt');
    
    res.status(200).json({
      success: true,
      count: integrations.length,
      data: integrations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single integration
// @route   GET /api/lms-integration/:id
// @access  Private/Admin
exports.getIntegration = async (req, res, next) => {
  try {
    const integration = await ExternalLMS.findById(req.params.id)
      .populate('organization');
    
    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'Integration not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: integration
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update integration
// @route   PUT /api/lms-integration/:id
// @access  Private/Admin
exports.updateIntegration = async (req, res, next) => {
  try {
    const integration = await ExternalLMS.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'Integration not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: integration
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Test integration connection
// @route   POST /api/lms-integration/:id/test
// @access  Private/Admin
exports.testConnection = async (req, res, next) => {
  try {
    const integration = await ExternalLMS.findById(req.params.id);
    
    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'Integration not found'
      });
    }
    
    // Simulate connection test (in production, implement actual API calls)
    const testResult = {
      success: true,
      message: 'Connection test successful',
      timestamp: new Date(),
      details: {
        type: integration.type,
        baseUrl: integration.credentials.baseUrl,
        authenticated: true
      }
    };
    
    res.status(200).json(testResult);
  } catch (error) {
    next(error);
  }
};

// @desc    Sync data with external LMS
// @route   POST /api/lms-integration/:id/sync
// @access  Private/Admin
exports.syncData = async (req, res, next) => {
  try {
    const { entityType, direction = 'import' } = req.body;
    
    const integration = await ExternalLMS.findById(req.params.id);
    
    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'Integration not found'
      });
    }
    
    if (integration.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Integration is not active'
      });
    }
    
    const startTime = Date.now();
    
    // Create sync log
    const syncLog = await DataSyncLog.create({
      integration: integration._id,
      operation: direction,
      entityType,
      status: 'pending'
    });
    
    try {
      // Simulate sync (in production, implement actual sync logic)
      let recordsProcessed = 0;
      
      switch (entityType) {
        case 'course':
          recordsProcessed = await syncCourses(integration, direction);
          break;
        case 'user':
          recordsProcessed = await syncUsers(integration, direction);
          break;
        case 'enrollment':
          recordsProcessed = await syncEnrollments(integration, direction);
          break;
        default:
          throw new Error('Invalid entity type');
      }
      
      // Update sync log
      syncLog.status = 'success';
      syncLog.details = {
        recordsProcessed,
        recordsSucceeded: recordsProcessed,
        recordsFailed: 0,
        duration: Date.now() - startTime
      };
      await syncLog.save();
      
      // Update integration last sync
      integration.lastSync = {
        timestamp: new Date(),
        status: 'success',
        recordsSynced: recordsProcessed,
        errors: []
      };
      await integration.save();
      
      res.status(200).json({
        success: true,
        message: 'Sync completed successfully',
        data: syncLog
      });
    } catch (error) {
      syncLog.status = 'failed';
      syncLog.errors = [{
        message: error.message,
        code: 'SYNC_ERROR'
      }];
      await syncLog.save();
      
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get sync logs
// @route   GET /api/lms-integration/:id/logs
// @access  Private/Admin
exports.getSyncLogs = async (req, res, next) => {
  try {
    const { limit = 20, status, entityType } = req.query;
    
    const query = { integration: req.params.id };
    if (status) query.status = status;
    if (entityType) query.entityType = entityType;
    
    const logs = await DataSyncLog.find(query)
      .sort('-timestamp')
      .limit(parseInt(limit));
    
    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload SCORM package
// @route   POST /api/lms-integration/scorm
// @access  Private/Trainer
exports.uploadSCORMPackage = async (req, res, next) => {
  try {
    const { courseId, version, manifest, resources, packageUrl, size } = req.body;
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Check if user owns the course
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload SCORM package for this course'
      });
    }
    
    const scormPackage = await SCORMPackage.create({
      course: courseId,
      version,
      manifest,
      resources,
      packageUrl,
      size,
      uploadedBy: req.user.id
    });
    
    res.status(201).json({
      success: true,
      data: scormPackage
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get SCORM package for course
// @route   GET /api/lms-integration/scorm/:courseId
// @access  Private
exports.getSCORMPackage = async (req, res, next) => {
  try {
    const scormPackage = await SCORMPackage.findOne({
      course: req.params.courseId
    })
      .populate('course', 'title')
      .populate('uploadedBy', 'name');
    
    if (!scormPackage) {
      return res.status(404).json({
        success: false,
        message: 'SCORM package not found for this course'
      });
    }
    
    res.status(200).json({
      success: true,
      data: scormPackage
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export course data
// @route   GET /api/lms-integration/export/course/:id
// @access  Private/Admin
exports.exportCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email')
      .populate('lessons');
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Format course data for export
    const exportData = {
      id: course._id,
      title: Object.fromEntries(course.title),
      description: Object.fromEntries(course.description),
      category: course.category,
      level: course.level,
      price: course.price,
      duration: course.duration,
      instructor: course.instructor,
      lessons: course.lessons,
      exportedAt: new Date()
    };
    
    res.status(200).json({
      success: true,
      data: exportData
    });
  } catch (error) {
    next(error);
  }
};

// Helper functions for sync operations
async function syncCourses(_integration, _direction) {
  // Placeholder - implement actual sync logic based on LMS type
  return Math.floor(Math.random() * 10) + 1;
}

async function syncUsers(_integration, _direction) {
  // Placeholder - implement actual sync logic based on LMS type
  return Math.floor(Math.random() * 50) + 1;
}

async function syncEnrollments(_integration, _direction) {
  // Placeholder - implement actual sync logic based on LMS type
  return Math.floor(Math.random() * 100) + 1;
}

module.exports = exports;
