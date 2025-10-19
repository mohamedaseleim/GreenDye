const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  submitQuiz,
  // New controller methods to implement
  getQuizAttempts,
  getQuizAnalytics,
  gradeQuizSubmission
} = require('../controllers/quizController');

// List or create quizzes
router
  .route('/')
  .get(protect, getQuizzes)
  .post(protect, authorize('trainer', 'admin'), createQuiz);

// Fetch, update or delete a specific quiz
router
  .route('/:id')
  .get(protect, getQuiz)
  .put(protect, authorize('trainer', 'admin'), updateQuiz)
  .delete(protect, authorize('trainer', 'admin'), deleteQuiz);

// Submit a quiz attempt
router.post('/:id/submit', protect, submitQuiz);

// Retrieve quiz attempts (for the current user or, for trainers/admins, all attempts)
router.get('/:id/attempts', protect, getQuizAttempts);

// View quiz analytics (e.g. average scores, completion rate) — trainers/admins only
router.get(
  '/:id/analytics',
  protect,
  authorize('trainer', 'admin'),
  getQuizAnalytics
);

// Manually grade essay or other non‑auto‑graded responses
router.post(
  '/:id/grade',
  protect,
  authorize('trainer', 'admin'),
  gradeQuizSubmission
);

module.exports = router;
