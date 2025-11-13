const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getAssignmentSubmissions,
  getMySubmission,
  gradeSubmission,
  getAssignmentAnalytics
} = require('../controllers/assignmentController');

// List or create assignments
router
  .route('/')
  .get(protect, getAssignments)
  .post(protect, authorize('trainer', 'admin'), createAssignment);

// Fetch, update or delete a specific assignment
router
  .route('/:id')
  .get(protect, getAssignment)
  .put(protect, authorize('trainer', 'admin'), updateAssignment)
  .delete(protect, authorize('trainer', 'admin'), deleteAssignment);

// Submit an assignment
router.post('/:id/submit', protect, submitAssignment);

// Get user's submission for an assignment
router.get('/:id/my-submission', protect, getMySubmission);

// Get all submissions for an assignment
router.get(
  '/:id/submissions',
  protect,
  authorize('trainer', 'admin'),
  getAssignmentSubmissions
);

// Grade a submission
router.put(
  '/submissions/:id/grade',
  protect,
  authorize('trainer', 'admin'),
  gradeSubmission
);

// Get assignment analytics
router.get(
  '/:id/analytics',
  protect,
  authorize('trainer', 'admin'),
  getAssignmentAnalytics
);

module.exports = router;
