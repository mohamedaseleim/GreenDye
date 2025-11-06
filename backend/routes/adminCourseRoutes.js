const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getCourse,
  updateCourse,
  deleteCourse
} = require('../controllers/courseController');
const {
  getAdminCourses,
  getPendingCourses,
  createAdminCourse,
  setCoursePricing,
  getCourseAnalytics,
  getCourseCategories,
  updateCourseCategory,
  getCourseTags,
  updateCourseTags,
  bulkUpdateCourses,
  getCourseStatistics
} = require('../controllers/adminCourseController');
const {
  approveCourse,
  rejectCourse
} = require('../controllers/courseApprovalController');

// Protect all routes and authorize only admin
router.use(protect);
router.use(authorize('admin'));

// Course statistics and overview
router.get('/statistics', getCourseStatistics);

// Category management
router.get('/categories', getCourseCategories);
router.put('/:id/category', updateCourseCategory);

// Tag management
router.get('/tags', getCourseTags);
router.put('/:id/tags', updateCourseTags);

// Pending courses for approval
router.get('/pending', getPendingCourses);

// Bulk operations
router.put('/bulk-update', bulkUpdateCourses);

// Admin course management routes
router.route('/')
  .get(getAdminCourses)
  .post(createAdminCourse);

// Course-specific routes
router.route('/:id')
  .get(getCourse)
  .put(updateCourse)
  .delete(deleteCourse);

// Pricing and discounts
router.put('/:id/pricing', setCoursePricing);

// Course analytics
router.get('/:id/analytics', getCourseAnalytics);

// Approval/Rejection
router.put('/:id/approve', approveCourse);
router.put('/:id/reject', rejectCourse);

module.exports = router;
