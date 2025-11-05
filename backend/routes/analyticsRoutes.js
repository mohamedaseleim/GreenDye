const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  trackEvent,
  getPlatformStats,
  getCourseAnalytics,
  getUserAnalytics,
  getUserGrowthTrends,
  getRevenueTrends,
  getCoursePopularityMetrics,
  getGeographicDistribution,
  getPeakUsageTimes,
  getConversionFunnel
} = require('../controllers/analyticsController');

// Analytics routes
router.post('/track', protect, trackEvent);
router.get('/platform', protect, authorize('admin'), getPlatformStats);
router.get('/course/:courseId', protect, authorize('admin', 'trainer'), getCourseAnalytics);
router.get('/user', protect, getUserAnalytics);

// Advanced analytics routes (Admin only)
router.get('/user-growth', protect, authorize('admin'), getUserGrowthTrends);
router.get('/revenue-trends', protect, authorize('admin'), getRevenueTrends);
router.get('/course-popularity', protect, authorize('admin'), getCoursePopularityMetrics);
router.get('/geographic-distribution', protect, authorize('admin'), getGeographicDistribution);
router.get('/peak-usage-times', protect, authorize('admin'), getPeakUsageTimes);
router.get('/conversion-funnel', protect, authorize('admin'), getConversionFunnel);

module.exports = router;
