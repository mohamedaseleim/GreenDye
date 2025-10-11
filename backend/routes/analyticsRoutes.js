const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  trackEvent,
  getPlatformStats,
  getCourseAnalytics,
  getUserAnalytics
} = require('../controllers/analyticsController');

// Analytics routes
router.post('/track', protect, trackEvent);
router.get('/platform', protect, authorize('admin'), getPlatformStats);
router.get('/course/:courseId', protect, authorize('admin', 'trainer'), getCourseAnalytics);
router.get('/user', protect, getUserAnalytics);

module.exports = router;
