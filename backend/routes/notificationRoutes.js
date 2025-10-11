const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Placeholder for notification functionality
router.get('/', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Notification routes - Coming soon',
    data: []
  });
});

module.exports = router;
