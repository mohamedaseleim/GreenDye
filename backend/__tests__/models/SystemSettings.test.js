const mongoose = require('mongoose');
const SystemSettings = require('../../models/SystemSettings');

describe('SystemSettings Model', () => {
  
  describe('getSettings', () => {
    it('should create default settings if none exist', async () => {
      const settings = await SystemSettings.getSettings();
      
      expect(settings).toBeDefined();
      expect(settings.general.siteName).toBe('GreenDye Academy');
      expect(settings.localization.defaultLanguage).toBe('en');
      expect(settings.localization.defaultCurrency).toBe('USD');
    });

    it('should return existing settings if they exist', async () => {
      // Create settings first
      const firstSettings = await SystemSettings.getSettings();
      firstSettings.general.siteName = 'Updated Name';
      await firstSettings.save();
      
      // Get settings again
      const secondSettings = await SystemSettings.getSettings();
      
      expect(secondSettings.general.siteName).toBe('Updated Name');
      expect(secondSettings._id.toString()).toBe(firstSettings._id.toString());
    });
  });

  describe('updateSettings', () => {
    it('should update general settings', async () => {
      const userId = new mongoose.Types.ObjectId();
      const updates = {
        general: {
          siteName: 'New Site Name',
          contactEmail: 'test@example.com'
        }
      };
      
      const settings = await SystemSettings.updateSettings(updates, userId);
      
      expect(settings.general.siteName).toBe('New Site Name');
      expect(settings.general.contactEmail).toBe('test@example.com');
      expect(settings.updatedBy.toString()).toBe(userId.toString());
    });

    it('should update email templates', async () => {
      const userId = new mongoose.Types.ObjectId();
      const updates = {
        emailTemplates: {
          welcome: {
            subject: 'Custom Welcome',
            body: 'Welcome {{userName}}'
          }
        }
      };
      
      const settings = await SystemSettings.updateSettings(updates, userId);
      
      expect(settings.emailTemplates.welcome.subject).toBe('Custom Welcome');
      expect(settings.emailTemplates.welcome.body).toBe('Welcome {{userName}}');
    });

    it('should update notification settings', async () => {
      const userId = new mongoose.Types.ObjectId();
      const updates = {
        notifications: {
          emailEnabled: false,
          pushEnabled: false
        }
      };
      
      const settings = await SystemSettings.updateSettings(updates, userId);
      
      expect(settings.notifications.emailEnabled).toBe(false);
      expect(settings.notifications.pushEnabled).toBe(false);
    });

    it('should update localization settings', async () => {
      const userId = new mongoose.Types.ObjectId();
      const updates = {
        localization: {
          defaultLanguage: 'ar',
          defaultCurrency: 'EGP'
        }
      };
      
      const settings = await SystemSettings.updateSettings(updates, userId);
      
      expect(settings.localization.defaultLanguage).toBe('ar');
      expect(settings.localization.defaultCurrency).toBe('EGP');
    });
  });

  describe('API Keys', () => {
    it('should add API key to settings', async () => {
      const settings = await SystemSettings.getSettings();
      
      settings.apiKeys.push({
        name: 'Test API Key',
        key: 'test_key_123',
        description: 'Test key',
        permissions: ['read', 'write']
      });
      
      await settings.save();
      
      const updatedSettings = await SystemSettings.findById(settings._id);
      expect(updatedSettings.apiKeys).toHaveLength(1);
      expect(updatedSettings.apiKeys[0].name).toBe('Test API Key');
      expect(updatedSettings.apiKeys[0].key).toBe('test_key_123');
    });

    it('should have default isActive as true', async () => {
      const settings = await SystemSettings.getSettings();
      
      settings.apiKeys.push({
        name: 'Test Key',
        key: 'test_key_456'
      });
      
      await settings.save();
      
      expect(settings.apiKeys[0].isActive).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should enforce valid language enum', async () => {
      const settings = await SystemSettings.getSettings();
      
      settings.localization.defaultLanguage = 'invalid';
      
      await expect(settings.save()).rejects.toThrow();
    });

    it('should enforce valid currency enum', async () => {
      const settings = await SystemSettings.getSettings();
      
      settings.localization.defaultCurrency = 'INVALID';
      
      await expect(settings.save()).rejects.toThrow();
    });
  });
});
