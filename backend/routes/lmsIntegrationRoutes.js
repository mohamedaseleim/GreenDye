const express = require('express');
const router = express.Router();
const {
  createIntegration,
  getAllIntegrations,
  getIntegration,
  updateIntegration,
  testConnection,
  syncData,
  getSyncLogs,
  uploadSCORMPackage,
  getSCORMPackage,
  exportCourse
} = require('../controllers/lmsIntegrationController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Integration management (Admin only)
router.post('/', authorize('admin'), createIntegration);
router.get('/', authorize('admin'), getAllIntegrations);
router.get('/:id', authorize('admin'), getIntegration);
router.put('/:id', authorize('admin'), updateIntegration);
router.post('/:id/test', authorize('admin'), testConnection);
router.post('/:id/sync', authorize('admin'), syncData);
router.get('/:id/logs', authorize('admin'), getSyncLogs);

// SCORM package management
router.post('/scorm', authorize('trainer', 'admin'), uploadSCORMPackage);
router.get('/scorm/:courseId', getSCORMPackage);

// Data export
router.get('/export/course/:id', authorize('admin'), exportCourse);

module.exports = router;
