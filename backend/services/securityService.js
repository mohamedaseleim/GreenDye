const ActivityLog = require('../models/ActivityLog');
const FailedLoginAttempt = require('../models/FailedLoginAttempt');
const SecurityAlert = require('../models/SecurityAlert');
const IPBlacklist = require('../models/IPBlacklist');
const logger = require('../utils/logger');

/**
 * Log an activity
 */
const logActivity = async (options) => {
  try {
    const {
      user,
      email,
      action,
      actionType = 'other',
      resourceType,
      resourceId,
      ipAddress,
      userAgent,
      status = 'success',
      metadata = {}
    } = options;

    await ActivityLog.create({
      user,
      email,
      action,
      actionType,
      resourceType,
      resourceId,
      ipAddress,
      userAgent,
      status,
      metadata
    });
  } catch (error) {
    logger.error('Failed to log activity:', error);
  }
};

/**
 * Log a failed login attempt
 */
const logFailedLogin = async (email, ipAddress, userAgent, reason = 'invalid_credentials') => {
  try {
    // Create failed login record
    await FailedLoginAttempt.create({
      email,
      ipAddress,
      userAgent,
      reason
    });

    // Check if this IP has too many failed attempts in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const failedAttempts = await FailedLoginAttempt.countDocuments({
      ipAddress,
      attemptedAt: { $gte: oneHourAgo }
    });

    // Create security alert if threshold exceeded
    if (failedAttempts >= 5) {
      await SecurityAlert.create({
        type: 'multiple_failed_logins',
        severity: failedAttempts >= 10 ? 'high' : 'medium',
        email,
        ipAddress,
        userAgent,
        description: `${failedAttempts} failed login attempts from IP ${ipAddress} in the last hour`,
        metadata: {
          failedAttempts,
          email,
          timeWindow: '1 hour'
        }
      });

      // Auto-blacklist if more than 10 attempts
      if (failedAttempts >= 10) {
        const existingBlacklist = await IPBlacklist.findOne({ ipAddress });
        
        if (!existingBlacklist) {
          await IPBlacklist.create({
            ipAddress,
            reason: 'multiple_failed_logins',
            description: `Auto-blacklisted after ${failedAttempts} failed login attempts`,
            addedBy: null, // System-generated
            isActive: true,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            metadata: {
              failedAttempts,
              affectedUsers: [email]
            }
          });
          
          logger.warn(`IP ${ipAddress} auto-blacklisted after ${failedAttempts} failed login attempts`);
        }
      }
    }
  } catch (error) {
    logger.error('Failed to log failed login attempt:', error);
  }
};

/**
 * Get real-time activity stream
 */
const getRecentActivity = async (limit = 50, filters = {}) => {
  try {
    const query = {};
    
    if (filters.user) query.user = filters.user;
    if (filters.actionType) query.actionType = filters.actionType;
    if (filters.status) query.status = filters.status;
    if (filters.ipAddress) query.ipAddress = filters.ipAddress;
    
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
      if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
    }

    const activities = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('user', 'name email role')
      .lean();

    return activities;
  } catch (error) {
    logger.error('Failed to get recent activity:', error);
    return [];
  }
};

/**
 * Get security alerts
 */
const getSecurityAlerts = async (filters = {}) => {
  try {
    const query = {};
    
    if (filters.status) query.status = filters.status;
    if (filters.severity) query.severity = filters.severity;
    if (filters.type) query.type = filters.type;
    
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }

    const alerts = await SecurityAlert.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'name email role')
      .populate('resolvedBy', 'name email')
      .lean();

    return alerts;
  } catch (error) {
    logger.error('Failed to get security alerts:', error);
    return [];
  }
};

/**
 * Get failed login attempts
 */
const getFailedLoginAttempts = async (filters = {}) => {
  try {
    const query = {};
    
    if (filters.email) query.email = filters.email;
    if (filters.ipAddress) query.ipAddress = filters.ipAddress;
    
    if (filters.startDate || filters.endDate) {
      query.attemptedAt = {};
      if (filters.startDate) query.attemptedAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.attemptedAt.$lte = new Date(filters.endDate);
    }

    const attempts = await FailedLoginAttempt.find(query)
      .sort({ attemptedAt: -1 })
      .lean();

    return attempts;
  } catch (error) {
    logger.error('Failed to get failed login attempts:', error);
    return [];
  }
};

/**
 * Analyze security patterns
 */
const analyzeSecurityPatterns = async () => {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Failed logins in last 24 hours
    const failedLogins24h = await FailedLoginAttempt.countDocuments({
      attemptedAt: { $gte: last24Hours }
    });

    // Security alerts by severity
    const alertsBySeverity = await SecurityAlert.aggregate([
      { $match: { status: 'open' } },
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);

    // Most targeted IPs
    const topTargetedIPs = await FailedLoginAttempt.aggregate([
      { $match: { attemptedAt: { $gte: last7Days } } },
      { $group: { _id: '$ipAddress', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Active blacklisted IPs
    const activeBlacklists = await IPBlacklist.countDocuments({
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    });

    return {
      failedLogins24h,
      alertsBySeverity: alertsBySeverity.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      topTargetedIPs,
      activeBlacklists
    };
  } catch (error) {
    logger.error('Failed to analyze security patterns:', error);
    return null;
  }
};

module.exports = {
  logActivity,
  logFailedLogin,
  getRecentActivity,
  getSecurityAlerts,
  getFailedLoginAttempts,
  analyzeSecurityPatterns
};
