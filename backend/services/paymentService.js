const crypto = require('crypto');

constt PaymentService = {
  verifyFawrySignature(payload) {
    const { invoiceNumber, fawryRefNumber, paymentAmount, statusCode, messageSignature } = payload;
    const signatureString = `${process.env.FAWRY_MERCHANT_CODE}|${invoiceNumber}|${fawryRefNumber}|${paymentAmount}|${statusCode}`;
    const expected = crypto.createHmac('sha256', process.env.FAWRY_SECURITY_KEY).update(signatureString).digest('hex');
    return expected === messageSignature;
  },
  verifyPaymobSignature(payload) {
    const { order, hmac } = payload;
    if (!order || !hmac) return false;
    const signatureString = `${order.id}${order.amount_cents}${order.currency}`;
    const expected = crypto.createHmac('sha512', process.env.PAYMOB_API_KEY).update(signatureString).digest('hex');
    return expected === hmac;
  },
};

module.exports = PaymentService;
