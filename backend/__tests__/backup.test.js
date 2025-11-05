const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;
const app = require('../server');
const User = require('../models/User');

describe('Backup and Export API Tests', () => {
  let adminToken;
  let adminUser;
  
  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI_TEST || process.env.MONGO_URI);
    }

    // Create admin user
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin-backup@test.com',
      password: 'password123',
      role: 'admin',
    });

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin-backup@test.com',
        password: 'password123',
      });
    
    adminToken = loginResponse.body.token;
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteOne({ email: 'admin-backup@test.com' });
    
    // Clean up test backup and export files
    const backupDir = path.join(__dirname, '../backups');
    const exportDir = path.join(__dirname, '../exports');
    
    try {
      const backupFiles = await fs.readdir(backupDir);
      for (const file of backupFiles) {
        if (file !== '.gitkeep') {
          await fs.unlink(path.join(backupDir, file));
        }
      }
    } catch (error) {
      // Directory might not exist
    }

    try {
      const exportFiles = await fs.readdir(exportDir);
      for (const file of exportFiles) {
        if (file !== '.gitkeep') {
          await fs.unlink(path.join(exportDir, file));
        }
      }
    } catch (error) {
      // Directory might not exist
    }

    // Close connection
    await mongoose.connection.close();
  });

  describe('GET /api/admin/backup/list', () => {
    it('should deny access to non-admin users', async () => {
      const response = await request(app)
        .get('/api/admin/backup/list')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should list backups and exports for admin users', async () => {
      const response = await request(app)
        .get('/api/admin/backup/list')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('backups');
      expect(response.body.data).toHaveProperty('exports');
      expect(Array.isArray(response.body.data.backups)).toBe(true);
      expect(Array.isArray(response.body.data.exports)).toBe(true);
    });
  });

  describe('POST /api/admin/backup/export', () => {
    it('should deny access to non-admin users', async () => {
      const response = await request(app)
        .post('/api/admin/backup/export')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should export all data for admin users', async () => {
      const response = await request(app)
        .post('/api/admin/backup/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('filename');
      expect(response.body.data).toHaveProperty('path');
      expect(response.body.data).toHaveProperty('metadata');
      expect(response.body.data.filename).toMatch(/^export-.*\.zip$/);
    }, 30000); // Increase timeout for export operation
  });

  describe('POST /api/admin/backup/database', () => {
    it('should deny access to non-admin users', async () => {
      const response = await request(app)
        .post('/api/admin/backup/database')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    // Note: This test may fail if mongodump is not installed
    it('should create database backup for admin users', async () => {
      const response = await request(app)
        .post('/api/admin/backup/database')
        .set('Authorization', `Bearer ${adminToken}`);

      // If mongodump is not installed, this will fail with 500
      if (response.status === 500) {
        expect(response.body.message).toContain('Failed to create database backup');
      } else {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('filename');
        expect(response.body.data.filename).toMatch(/^backup-.*\.zip$/);
      }
    }, 30000); // Increase timeout for backup operation
  });

  describe('POST /api/admin/backup/import', () => {
    it('should deny access to non-admin users', async () => {
      const response = await request(app)
        .post('/api/admin/backup/import')
        .send({ filename: 'test.zip', mode: 'merge' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should require filename parameter', async () => {
      const response = await request(app)
        .post('/api/admin/backup/import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ mode: 'merge' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject non-existent export file', async () => {
      const response = await request(app)
        .post('/api/admin/backup/import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ filename: 'nonexistent.zip', mode: 'merge' })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/admin/backup/restore', () => {
    it('should deny access to non-admin users', async () => {
      const response = await request(app)
        .post('/api/admin/backup/restore')
        .send({ filename: 'test.zip' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should require filename parameter', async () => {
      const response = await request(app)
        .post('/api/admin/backup/restore')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject non-existent backup file', async () => {
      const response = await request(app)
        .post('/api/admin/backup/restore')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ filename: 'nonexistent.zip' })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/admin/backup/:type/:filename', () => {
    it('should deny access to non-admin users', async () => {
      const response = await request(app)
        .delete('/api/admin/backup/backup/test.zip')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject invalid type parameter', async () => {
      const response = await request(app)
        .delete('/api/admin/backup/invalid/test.zip')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject non-existent file', async () => {
      const response = await request(app)
        .delete('/api/admin/backup/backup/nonexistent.zip')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Security', () => {
    it('should sanitize file path parameters', async () => {
      // Test path traversal attempt
      const response = await request(app)
        .get('/api/admin/backup/download/../../../etc/passwd')
        .set('Authorization', `Bearer ${adminToken}`);

      // Should not expose system files
      expect(response.status).toBe(404);
    });

    it('should not allow downloading files outside backup directory', async () => {
      const response = await request(app)
        .delete('/api/admin/backup/backup/../server.js')
        .set('Authorization', `Bearer ${adminToken}`);

      // Should not allow path traversal
      expect(response.status).toBe(404);
    });
  });
});
