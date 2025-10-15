const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { updateLessonProgress, getProgress } = require('../controllers/progressController');

// @route   PUT /api/progress
// @desc    Update progress for a lesson
// @access  Private
router.put('/', protect, updateLessonProgress);

// @route   GET /api/progress/:courseId
// @desc    Get progress for a course
// @access  Private
router.get('/:courseId', protect, getProgress);

module.exports = router;
