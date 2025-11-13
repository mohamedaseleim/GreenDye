const express = require('express');
const router = express.Router();
const {
  getSections,
  getSection,
  createSection,
  updateSection,
  deleteSection,
  reorderSections
} = require('../controllers/sectionController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getSections);
router.get('/:id', getSection);

// Protected routes - Trainer/Admin only
router.use(protect);
router.use(authorize('trainer', 'admin'));

router.post('/', createSection);
router.put('/reorder', reorderSections);
router.put('/:id', updateSection);
router.delete('/:id', deleteSection);

module.exports = router;
