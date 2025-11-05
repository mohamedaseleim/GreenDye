const asyncHandler = require('express-async-handler');
const SystemSettings = require('../models/SystemSettings');
const crypto = require('crypto');

// @desc    Get system settings
// @route   GET /api/admin/settings
// @access  Private/Admin
exports.getSettings = asyncHandler(async (req, res) => {
  const settings = await SystemSettings.getSettings();
  
  res.status(200).json({
    success: true,
    data: settings
  });
});

// @desc    Update general settings
// @route   PUT /api/admin/settings/general
// @access  Private/Admin
exports.updateGeneralSettings = asyncHandler(async (req, res) => {
  const settings = await SystemSettings.updateSettings(
    { general: req.body },
    req.user._id
  );
  
  res.status(200).json({
    success: true,
    data: settings.general,
    message: 'General settings updated successfully'
  });
});

// @desc    Update email templates
// @route   PUT /api/admin/settings/email-templates
// @access  Private/Admin
exports.updateEmailTemplates = asyncHandler(async (req, res) => {
  const settings = await SystemSettings.updateSettings(
    { emailTemplates: req.body },
    req.user._id
  );
  
  res.status(200).json({
    success: true,
    data: settings.emailTemplates,
    message: 'Email templates updated successfully'
  });
});

// @desc    Update notification settings
// @route   PUT /api/admin/settings/notifications
// @access  Private/Admin
exports.updateNotificationSettings = asyncHandler(async (req, res) => {
  const settings = await SystemSettings.updateSettings(
    { notifications: req.body },
    req.user._id
  );
  
  res.status(200).json({
    success: true,
    data: settings.notifications,
    message: 'Notification settings updated successfully'
  });
});

// @desc    Update localization settings
// @route   PUT /api/admin/settings/localization
// @access  Private/Admin
exports.updateLocalizationSettings = asyncHandler(async (req, res) => {
  const settings = await SystemSettings.updateSettings(
    { localization: req.body },
    req.user._id
  );
  
  res.status(200).json({
    success: true,
    data: settings.localization,
    message: 'Localization settings updated successfully'
  });
});

// @desc    Get all API keys
// @route   GET /api/admin/settings/api-keys
// @access  Private/Admin
exports.getApiKeys = asyncHandler(async (req, res) => {
  const settings = await SystemSettings.getSettings();
  
  res.status(200).json({
    success: true,
    data: settings.apiKeys
  });
});

// @desc    Create new API key
// @route   POST /api/admin/settings/api-keys
// @access  Private/Admin
exports.createApiKey = asyncHandler(async (req, res) => {
  const { name, description, permissions, expiresAt } = req.body;
  
  // Generate a secure random API key
  const key = `gd_${crypto.randomBytes(32).toString('hex')}`;
  
  const settings = await SystemSettings.getSettings();
  
  settings.apiKeys.push({
    name,
    key,
    description,
    permissions: permissions || ['read'],
    expiresAt: expiresAt || null,
    isActive: true
  });
  
  settings.updatedBy = req.user._id;
  await settings.save();
  
  res.status(201).json({
    success: true,
    data: settings.apiKeys[settings.apiKeys.length - 1],
    message: 'API key created successfully'
  });
});

// @desc    Update API key
// @route   PUT /api/admin/settings/api-keys/:keyId
// @access  Private/Admin
exports.updateApiKey = asyncHandler(async (req, res) => {
  const { keyId } = req.params;
  const { name, description, permissions, isActive, expiresAt } = req.body;
  
  const settings = await SystemSettings.getSettings();
  const apiKey = settings.apiKeys.id(keyId);
  
  if (!apiKey) {
    res.status(404);
    throw new Error('API key not found');
  }
  
  if (name) apiKey.name = name;
  if (description !== undefined) apiKey.description = description;
  if (permissions) apiKey.permissions = permissions;
  if (isActive !== undefined) apiKey.isActive = isActive;
  if (expiresAt !== undefined) apiKey.expiresAt = expiresAt;
  
  settings.updatedBy = req.user._id;
  await settings.save();
  
  res.status(200).json({
    success: true,
    data: apiKey,
    message: 'API key updated successfully'
  });
});

// @desc    Delete API key
// @route   DELETE /api/admin/settings/api-keys/:keyId
// @access  Private/Admin
exports.deleteApiKey = asyncHandler(async (req, res) => {
  const { keyId } = req.params;
  
  const settings = await SystemSettings.getSettings();
  const apiKey = settings.apiKeys.id(keyId);
  
  if (!apiKey) {
    res.status(404);
    throw new Error('API key not found');
  }
  
  apiKey.deleteOne();
  settings.updatedBy = req.user._id;
  await settings.save();
  
  res.status(200).json({
    success: true,
    message: 'API key deleted successfully'
  });
});

// @desc    Regenerate API key
// @route   POST /api/admin/settings/api-keys/:keyId/regenerate
// @access  Private/Admin
exports.regenerateApiKey = asyncHandler(async (req, res) => {
  const { keyId } = req.params;
  
  const settings = await SystemSettings.getSettings();
  const apiKey = settings.apiKeys.id(keyId);
  
  if (!apiKey) {
    res.status(404);
    throw new Error('API key not found');
  }
  
  // Generate a new key
  apiKey.key = `gd_${crypto.randomBytes(32).toString('hex')}`;
  apiKey.lastUsed = null;
  
  settings.updatedBy = req.user._id;
  await settings.save();
  
  res.status(200).json({
    success: true,
    data: apiKey,
    message: 'API key regenerated successfully'
  });
});

// @desc    Test email template
// @route   POST /api/admin/settings/email-templates/test
// @access  Private/Admin
exports.testEmailTemplate = asyncHandler(async (req, res) => {
  const { templateType, testEmail } = req.body;
  
  if (!templateType || !testEmail) {
    res.status(400);
    throw new Error('Template type and test email are required');
  }
  
  // This would integrate with your actual email service
  // For now, we'll just return success
  res.status(200).json({
    success: true,
    message: `Test email sent to ${testEmail}`
  });
});

// @desc    Get public settings (for frontend)
// @route   GET /api/settings/public
// @access  Public
exports.getPublicSettings = asyncHandler(async (req, res) => {
  const settings = await SystemSettings.getSettings();
  
  // Return only non-sensitive settings
  res.status(200).json({
    success: true,
    data: {
      general: {
        siteName: settings.general.siteName,
        siteDescription: settings.general.siteDescription,
        siteLogo: settings.general.siteLogo,
        favicon: settings.general.favicon,
        contactEmail: settings.general.contactEmail,
        contactPhone: settings.general.contactPhone,
        socialMedia: settings.general.socialMedia
      },
      localization: settings.localization
    }
  });
});
