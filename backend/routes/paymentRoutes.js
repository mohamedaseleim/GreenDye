const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createCheckout,
  verifyPayment,
  getUserPayments,
  requestRefund,
  getInvoice
} = require('../controllers/paymentController');

// Payment routes
router.post('/checkout', protect, createCheckout);
router.post('/verify', verifyPayment); // Public webhook
router.get('/', protect, getUserPayments);
router.post('/:id/refund', protect, requestRefund);
router.get('/:id/invoice', protect, getInvoice);

module.exports = router;
