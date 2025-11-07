const logger = require('../utils/logger');
const { getOrCreateSettings } = require('../utils/contentSettingsHelper');

/**
 * Sanitize text input to prevent XSS attacks
 * Uses a more robust approach to remove all HTML tags and dangerous content
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
const sanitizeText = (text) => {
  if (typeof text !== 'string') return text;
  
  // Strip all HTML tags completely for security
  // This removes all angle brackets and their content
  let sanitized = text.replace(/<[^>]*>/g, '');
  
  // Remove any remaining HTML entities that could be dangerous
  sanitized = sanitized
    .replace(/&lt;/g, '')
    .replace(/&gt;/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&');
  
  // Remove any JavaScript event handlers
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  return sanitized.trim();
};

/**
 * Sanitize multilingual object
 * @param {Object} obj - Object with language keys
 * @returns {Object} Sanitized object
 */
const sanitizeMultilingual = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeText(value);
  }
  return sanitized;
};

/**
 * Sanitize features array
 * @param {Array} features - Array of feature objects
 * @returns {Array} Sanitized features array
 */
const sanitizeFeatures = (features) => {
  if (!Array.isArray(features)) return features;
  return features.map((feature) => ({
    icon: sanitizeText(feature.icon),
    title: sanitizeText(feature.title),
    description: sanitizeText(feature.description),
  }));
};

// @desc    Get all content settings
// @route   GET /api/admin/content-settings
// @access  Private/Admin
exports.getContentSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    logger.error('Error fetching content settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content settings',
      error: error.message,
    });
  }
};

// @desc    Update home page content
// @route   PUT /api/admin/content-settings/home
// @access  Private/Admin
exports.updateHomeContent = async (req, res) => {
  try {
    const { heroTitle, heroSubtitle, features } = req.body;

    const settings = await getOrCreateSettings();

    // Update home page content with sanitization
    if (heroTitle) {
      settings.homePage.heroTitle = {
        ...settings.homePage.heroTitle,
        ...sanitizeMultilingual(heroTitle),
      };
    }

    if (heroSubtitle) {
      settings.homePage.heroSubtitle = {
        ...settings.homePage.heroSubtitle,
        ...sanitizeMultilingual(heroSubtitle),
      };
    }

    if (features) {
      settings.homePage.features = sanitizeFeatures(features);
    }

    await settings.save();

    logger.info(`Home page content updated by admin ${req.user.id}`);

    res.status(200).json({
      success: true,
      data: settings.homePage,
      message: 'Home page content updated successfully',
    });
  } catch (error) {
    logger.error('Error updating home page content:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating home page content',
      error: error.message,
    });
  }
};

// @desc    Update about page content
// @route   PUT /api/admin/content-settings/about
// @access  Private/Admin
exports.updateAboutContent = async (req, res) => {
  try {
    const { mission, vision, features } = req.body;

    const settings = await getOrCreateSettings();

    // Update about page content with sanitization
    if (mission) {
      settings.aboutPage.mission = {
        ...settings.aboutPage.mission,
        ...sanitizeMultilingual(mission),
      };
    }

    if (vision) {
      settings.aboutPage.vision = {
        ...settings.aboutPage.vision,
        ...sanitizeMultilingual(vision),
      };
    }

    if (features) {
      settings.aboutPage.features = sanitizeFeatures(features);
    }

    await settings.save();

    logger.info(`About page content updated by admin ${req.user.id}`);

    res.status(200).json({
      success: true,
      data: settings.aboutPage,
      message: 'About page content updated successfully',
    });
  } catch (error) {
    logger.error('Error updating about page content:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating about page content',
      error: error.message,
    });
  }
};

// @desc    Update contact page content
// @route   PUT /api/admin/content-settings/contact
// @access  Private/Admin
exports.updateContactContent = async (req, res) => {
  try {
    const { email, phone, address, officeHours, socialMedia } = req.body;

    const settings = await getOrCreateSettings();

    // Update contact page content with sanitization
    if (email) settings.contactPage.email = sanitizeText(email);
    if (phone) settings.contactPage.phone = sanitizeText(phone);
    if (address) settings.contactPage.address = sanitizeText(address);

    if (officeHours) {
      settings.contactPage.officeHours = {
        ...settings.contactPage.officeHours,
        ...sanitizeMultilingual(officeHours),
      };
    }

    if (socialMedia) {
      // Sanitize social media URLs
      const sanitizedSocial = {};
      for (const [key, value] of Object.entries(socialMedia)) {
        sanitizedSocial[key] = sanitizeText(value);
      }
      settings.socialMedia = {
        ...settings.socialMedia,
        ...sanitizedSocial,
      };
    }

    await settings.save();

    logger.info(`Contact page content updated by admin ${req.user.id}`);

    res.status(200).json({
      success: true,
      data: {
        contactPage: settings.contactPage,
        socialMedia: settings.socialMedia,
      },
      message: 'Contact page content updated successfully',
    });
  } catch (error) {
    logger.error('Error updating contact page content:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating contact page content',
      error: error.message,
    });
  }
};
