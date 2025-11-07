const ContentSettings = require('../models/ContentSettings');

/**
 * Get or create content settings
 * Implements singleton pattern - ensures only one ContentSettings document exists
 * @returns {Promise<ContentSettings>} The content settings document
 */
const getOrCreateSettings = async () => {
  let settings = await ContentSettings.findOne();
  
  if (!settings) {
    settings = await ContentSettings.create({});
  }
  
  return settings;
};

module.exports = {
  getOrCreateSettings,
};
