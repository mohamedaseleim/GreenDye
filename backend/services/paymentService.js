const Payment = require('../models/Payment');

/**
 * Abstract base class for payment services. Each concrete payment service
 * should implement the methods defined here. Using a common interface
 * allows the controller to work with any payment provider without
 * knowing the underlying API details.  Concrete classes should at
 * minimum implement `createCheckout` to initiate a payment and
 * optionally override `verifyPayment`, `refundPayment` and
 * `getInvoice` if the provider supports those operations.
 */
class PaymentService {
  /**
   * Initialise a new instance of the payment service.  Concrete classes
   * may accept credentials or configuration through their constructors.
   */
  constructor() {}

  /**
   * Create a checkout session or payment intent for the given Payment
   * document.  Must return an object containing at least a
   * `checkoutUrl` where the user can complete the payment.  It may
   * also include any provider‑specific identifiers (e.g. reference
   * numbers or tokens) that need to be persisted on the Payment
   * document.
   *
   * @param {import('../models/Payment')} payment  Mongoose Payment document
   * @returns {Promise<Object>}  provider details including checkoutUrl
   */
  async createCheckout(payment) {
    throw new Error('createCheckout() must be implemented in subclass');
  }

  /**
   * Verify a payment using data returned by the payment provider (e.g.
   * webhooks).  Concrete implementations should update the Payment
   * document status and record any metadata returned by the provider.
   *
   * @param {Object} payload  The body of the webhook or verification request
   * @returns {Promise<void>}
   */
  async verifyPayment(payload) {
    // optional – providers that offer webhooks should implement
    return;
  }

  /**
   * Attempt to refund a previously completed payment.  Should update
   * the Payment document status and record any refund identifiers.
   *
   * @param {import('../models/Payment')} payment  Payment document
   * @param {Number} amount  Amount to refund
   * @returns {Promise<void>}
   */
  async refundPayment(payment, amount) {
    // optional – providers supporting refunds should implement
    throw new Error('refundPayment() not implemented for this provider');
  }

  /**
   * Generate or retrieve an invoice for the payment.  Providers that
   * support invoice generation should override this method.
   *
   * @param {import('../models/Payment')} payment  Payment document
   * @returns {Promise<Buffer|String>} invoice data or URL
   */
  async getInvoice(payment) {
    throw new Error('getInvoice() not implemented for this provider');
  }
}

module.exports = PaymentService;
