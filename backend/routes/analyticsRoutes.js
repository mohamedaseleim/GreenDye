const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Placeholder for analytics functionality
router.get('/', protect, authorize('admin', 'trainer'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Analytics routes - Coming soon',
    data: {}
  });
});

module.exports = router;
