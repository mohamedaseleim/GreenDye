const Payment = require('../models/Payment');
const Enrollment = require('../models/Enrollment');
const PaymentService = require('../services/paymentService');
const asyncHandler = require('express-async-handler');

// POST /api/payments/webhook
exports.verifyWebhook = asyncHandler(async (req, res) => {
  const { paymentId, status, transactionId, gatewayResponse } = req.body;
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    return res.status(404).json({ success: false, message: 'Payment not found' });
  }

  // Validate HMAC signature based on payment method
  let isValid = true;
  if (payment.paymentMethod === 'fawry') {
    isValid = PaymentService.verifyFawrySignature(req.body);
  } else if (payment.paymentMethod === 'paymob') {
    isValid = PaymentService.verifyPaymobSignature(req.body);
  }
  if (!isValid) {
    return res.status(400).json({ success: false, message: 'Invalid signature' });
  }

  // Update payment fields
  payment.status = status;
  if (transactionId) payment.transactionId = transactionId;
  if (gatewayResponse) {
    payment.metadata = payment.metadata || {};
    payment.metadata.gatewayResponse = gatewayResponse;
  }

  // If success, enroll the user in the course
  if (status === 'success' || status === 'completed') {
    const existingEnrollment = await Enrollment.findOne({
      user: payment.user,
      course: payment.course,
    });
    if (!existingEnrollment) {
      await Enrollment.create({ user: payment.user, course: payment.course });
    }
  }

  await payment.save();
  res.json({ success: true });
});
