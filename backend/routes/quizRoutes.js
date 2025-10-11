const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  submitQuiz
} = require('../controllers/quizController');

router.route('/')
  .get(protect, getQuizzes)
  .post(protect, authorize('trainer', 'admin'), createQuiz);

router.route('/:id')
  .get(protect, getQuiz)
  .put(protect, authorize('trainer', 'admin'), updateQuiz)
  .delete(protect, authorize('trainer', 'admin'), deleteQuiz);

router.post('/:id/submit', protect, submitQuiz);

module.exports = router;
