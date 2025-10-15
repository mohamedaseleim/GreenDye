const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getTrainers,
  getTrainer,
  createTrainer,
  updateTrainer,
  deleteTrainer,
  verifyTrainer,
  getTrainerCourses
} = require('../controllers/trainerController');

router.route('/')
  .get(getTrainers)
  .post(protect, createTrainer);

router.route('/:id')
  .get(getTrainer)
  .put(protect, updateTrainer)
  .delete(protect, authorize('admin'), deleteTrainer);

router.put('/:id/verify', protect, authorize('admin'), verifyTrainer);
router.get('/:id/courses', getTrainerCourses);

// Apply for trainer verification
router.put(
  '/:id/apply-verification',
  protect,
  require('../controllers/trainerVerificationController').applyForVerification
);

// Admin-only: view all pending verifications
router.get(
  '/pending-verifications',
  protect,
  authorize('admin'),
  require('../controllers/trainerVerificationController').getPendingVerifications
);

module.exports = router;
