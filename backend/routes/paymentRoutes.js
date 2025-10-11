const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Placeholder for payment functionality
router.post('/checkout', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Payment routes - Coming soon',
    data: {}
  });
});

module.exports = router;
