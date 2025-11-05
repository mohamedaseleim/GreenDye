const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAllEnrollments,
  getEnrollmentAnalytics,
  manualEnrollment,
  manualUnenrollment,
  updateEnrollmentStatus,
  getEnrollmentDetails
} = require('../controllers/adminEnrollmentController');

// All routes require admin authentication
router.use(protect);
router.use(authorize('admin'));

// Analytics route (before /:id to avoid conflict)
router.get('/analytics', getEnrollmentAnalytics);

// CRUD operations
router.route('/')
  .get(getAllEnrollments)
  .post(manualEnrollment);

router.route('/:id')
  .get(getEnrollmentDetails)
  .delete(manualUnenrollment);

router.put('/:id/status', updateEnrollmentStatus);

module.exports = router;
