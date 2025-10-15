const AuditTrail = require('../models/AuditTrail');

/**
 * Log an audit entry for admin or user actions.
 * @param {String|mongoose.Types.ObjectId} userId - ID of the user performing the action.
 * @param {String} action - Description of the action performed.
 * @param {String} targetType - Type of the target resource (e.g., 'Course', 'User').
 * @param {String|mongoose.Types.ObjectId} targetId - ID of the target resource.
 * @param {Object} metadata - Additional data related to the action.
 */
const logAudit = async (userId, action, targetType = null, targetId = null, metadata = {}) => {
  try {
    await AuditTrail.create({
      user: userId,
      action,
      targetType,
      targetId,
      metadata
    });
  } catch (err) {
    console.error('Failed to log audit trail:', err);
  }
};

module.exports = { logAudit };
