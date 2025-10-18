const Payment = require('../models/Payment');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const FawryService = require('../services/fawryService');
const PaymobService = require('../services/paymobService');


// @desc    Create payment intent/checkout session
// @route   POST /api/payments/checkout
// @access  Private
exports.createCheckout = async (req, res, next) => {
  try {
    const { courseId, paymentMethod, currency = 'USD' } = req.body;

    // Validate course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is already enrolled
    const existingEnrollment = await Enrollment.findOne({
      user: req.user.id,
      course: courseId
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course'
      });
    }

    // Get course price in requested currency
    const amount = course.price[currency] || course.price.USD;

    // Create payment record
    const payment = await Payment.create({
      user: req.user.id,
      course: courseId,
      amount,
      currency,
      paymentMethod,
      status: 'pending',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        country: req.body.country || 'Unknown',
        region: req.body.region || 'Unknown'
      }
    });

    // Generate checkout URL based on payment method
    let checkoutData = {};

    switch (paymentMethod) {
      case 'stripe':
        checkoutData = await createStripeCheckout(payment, course);
        break;
      case 'paypal':
        checkoutData = await createPayPalCheckout(payment, course);
        break;
      case 'fawry':
        checkoutData = await createFawryCheckout(payment, course);
        break;
      case 'paymob':
        checkoutData = await createPaymobCheckout(payment, course);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid payment method'
        });
    }

    res.status(200).json({
      success: true,
      data: {
        paymentId: payment._id,
        ...checkoutData
      }
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating checkout session',
      error: error.message
    });
  }
};

// @desc    Verify payment callback
// @route   POST /api/payments/verify
// @access  Public (webhook)
exports.verifyPayment = async (req, res, next) => {
  try {
    const { paymentId, transactionId, status, gatewayResponse } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Update payment status
    payment.status = status === 'success' ? 'completed' : 'failed';
    payment.transactionId = transactionId;
    payment.paymentGatewayResponse = gatewayResponse;
    
    if (status === 'success') {
      payment.completedAt = Date.now();
      
      // Create enrollment if payment is successful
      await Enrollment.create({
        user: payment.user,
        course: payment.course,
        enrollmentDate: Date.now(),
        status: 'active'
      });
    }

    await payment.save();

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      error: error.message
    });
  }
};

// @desc    Get user payment history
// @route   GET /api/payments
// @access  Private
exports.getUserPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .populate('course', 'title thumbnail')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payments',
      error: error.message
    });
  }
};

// @desc    Request refund
// @route   POST /api/payments/:id/refund
// @access  Private
exports.requestRefund = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Verify payment belongs to user
    if (payment.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to refund this payment'
      });
    }

    // Check if payment can be refunded
    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Only completed payments can be refunded'
      });
    }

    // Check refund window (e.g., 30 days)
    const daysSincePayment = (Date.now() - payment.completedAt) / (1000 * 60 * 60 * 24);
    if (daysSincePayment > 30) {
      return res.status(400).json({
        success: false,
        message: 'Refund window has expired (30 days)'
      });
    }

    // Process refund based on payment method
    payment.status = 'refunded';
    payment.refundReason = reason;
    payment.refundedAmount = payment.amount;
    payment.refundedAt = Date.now();
    await payment.save();

    // Remove enrollment
    await Enrollment.deleteOne({
      user: payment.user,
      course: payment.course
    });

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: payment
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing refund',
      error: error.message
    });
  }
};

// @desc    Get payment invoice
// @route   GET /api/payments/:id/invoice
// @access  Private
exports.getInvoice = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('user', 'name email')
      .populate('course', 'title');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Verify payment belongs to user or user is admin
    if (payment.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this invoice'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        invoiceNumber: payment.invoice.invoiceNumber,
        date: payment.completedAt,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        user: {
          name: payment.user.name,
          email: payment.user.email
        },
        course: {
          title: payment.course.title
        },
        transactionId: payment.transactionId
      }
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invoice',
      error: error.message
    });
  }
};

// Helper functions for different payment gateways
async function createStripeCheckout(payment, course) {
  // TODO: Integrate with Stripe API
  // For now, return mock data
  return {
    checkoutUrl: `${process.env.FRONTEND_URL}/checkout/stripe/${payment._id}`,
    sessionId: `stripe_session_${payment._id}`,
    publicKey: process.env.STRIPE_PUBLIC_KEY || 'pk_test_mock'
  };
}

async function createPayPalCheckout(payment, course) {
  // TODO: Integrate with PayPal API
  return {
    checkoutUrl: `${process.env.FRONTEND_URL}/checkout/paypal/${payment._id}`,
    orderId: `paypal_order_${payment._id}`,
    clientId: process.env.PAYPAL_CLIENT_ID || 'paypal_mock'
  };
}

aasync function createFawryCheckout(payment, course) {
  const fawryService = new FawryService();
  return await fawryService.createCheckout(payment);
}

async function createPaymobCheckout(payment, course) {
  const paymobService = new PaymobService();
  return await paymobService.createCheckout(payment);
}

