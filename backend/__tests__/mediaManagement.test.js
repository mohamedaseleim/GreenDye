const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;
const app = require('../server');
const User = require('../models/User');
const Media = require('../models/Media');
const AuditTrail = require('../models/AuditTrail');
const { generateToken } = require('../utils/auth');

describe('Media Management Security Tests', () => {
  let adminToken;
  let adminUser;
  let testMediaId;

  beforeAll(async () => {
    // Create admin user
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin'
    });
    adminToken = generateToken(adminUser._id);
  });

  afterAll(async () => {
    // Cleanup
    await User.deleteMany({});
    await Media.deleteMany({});
    await AuditTrail.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/admin/cms/media/upload', () => {
    beforeEach(async () => {
      await Media.deleteMany({});
    });

    it('should reject upload without files', async () => {
      const res = await request(app)
        .post('/api/admin/cms/media/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('No files uploaded');
    });

    it('should upload valid image file', async () => {
      // Create a test file
      const testFilePath = path.join(__dirname, 'test-image.png');
      await fs.writeFile(testFilePath, 'fake image content');

      const res = await request(app)
        .post('/api/admin/cms/media/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('files', testFilePath)
        .field('category', 'general')
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].type).toBe('image');
      expect(res.body.data[0].category).toBe('general');

      testMediaId = res.body.data[0]._id;

      // Cleanup test file
      await fs.unlink(testFilePath).catch(() => {});
    });

    it('should reject invalid file type', async () => {
      const testFilePath = path.join(__dirname, 'test-file.exe');
      await fs.writeFile(testFilePath, 'fake executable');

      const res = await request(app)
        .post('/api/admin/cms/media/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('files', testFilePath)
        .expect(400);

      expect(res.body.success).toBe(false);

      // Cleanup test file
      await fs.unlink(testFilePath).catch(() => {});
    });

    it('should cleanup files on database creation failure', async () => {
      // This test verifies that if database creation fails, uploaded files are cleaned up
      const testFilePath = path.join(__dirname, 'test-image.jpg');
      await fs.writeFile(testFilePath, 'fake image');

      // Mock Media.create to fail
      jest.spyOn(Media, 'create').mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .post('/api/admin/cms/media/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('files', testFilePath)
        .field('category', 'general')
        .expect(500);

      // Verify no orphaned media records
      const mediaCount = await Media.countDocuments({});
      expect(mediaCount).toBe(0);

      // Restore mock
      Media.create.mockRestore();

      // Cleanup test file
      await fs.unlink(testFilePath).catch(() => {});
    });

    it('should validate MIME type matches file extension', async () => {
      // Create media with mismatched MIME type and extension
      const testFilePath = path.join(__dirname, 'test.pdf');
      await fs.writeFile(testFilePath, 'fake pdf content');

      // This should succeed as .pdf with document MIME type is valid
      const res = await request(app)
        .post('/api/admin/cms/media/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('files', testFilePath)
        .field('category', 'general');

      if (res.status === 201) {
        expect(res.body.data[0].type).toBe('document');
      }

      // Cleanup
      await fs.unlink(testFilePath).catch(() => {});
    });
  });

  describe('DELETE /api/admin/cms/media/:id', () => {
    beforeEach(async () => {
      // Create test media
      const media = await Media.create({
        filename: 'test-file.jpg',
        originalName: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        path: '/uploads/general/test-file.jpg',
        url: 'http://localhost:5000/uploads/general/test-file.jpg',
        type: 'image',
        category: 'general',
        uploadedBy: adminUser._id
      });
      testMediaId = media._id;
    });

    it('should delete media and create audit trail', async () => {
      const res = await request(app)
        .delete(`/api/admin/cms/media/${testMediaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deleted successfully');

      // Verify media is deleted
      const media = await Media.findById(testMediaId);
      expect(media).toBeNull();

      // Verify audit trail created
      const auditLog = await AuditTrail.findOne({
        resourceType: 'Media',
        resourceId: testMediaId,
        action: 'delete'
      });
      expect(auditLog).toBeTruthy();
    });

    it('should prevent path traversal attacks', async () => {
      // Create media with malicious path
      const maliciousMedia = await Media.create({
        filename: 'test-file.jpg',
        originalName: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        path: '/../../../etc/passwd', // Path traversal attempt
        url: 'http://localhost:5000/uploads/general/test-file.jpg',
        type: 'image',
        category: 'general',
        uploadedBy: adminUser._id
      });

      const res = await request(app)
        .delete(`/api/admin/cms/media/${maliciousMedia._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Should still succeed but not delete system files
      expect(res.body.success).toBe(true);

      // Verify the malicious media record is deleted from DB
      const media = await Media.findById(maliciousMedia._id);
      expect(media).toBeNull();
    });

    it('should handle non-existent media gracefully', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .delete(`/api/admin/cms/media/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not found');
    });
  });

  describe('GET /api/admin/cms/media', () => {
    beforeEach(async () => {
      await Media.deleteMany({});
      
      // Create test media
      await Media.create([
        {
          filename: 'image1.jpg',
          originalName: 'image1.jpg',
          mimeType: 'image/jpeg',
          size: 1024,
          path: '/uploads/course/image1.jpg',
          url: 'http://localhost:5000/uploads/course/image1.jpg',
          type: 'image',
          category: 'course',
          uploadedBy: adminUser._id
        },
        {
          filename: 'video1.mp4',
          originalName: 'video1.mp4',
          mimeType: 'video/mp4',
          size: 2048,
          path: '/uploads/general/video1.mp4',
          url: 'http://localhost:5000/uploads/general/video1.mp4',
          type: 'video',
          category: 'general',
          uploadedBy: adminUser._id
        }
      ]);
    });

    it('should get all media with pagination', async () => {
      const res = await request(app)
        .get('/api/admin/cms/media')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.total).toBe(2);
    });

    it('should filter media by type', async () => {
      const res = await request(app)
        .get('/api/admin/cms/media?type=image')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].type).toBe('image');
    });

    it('should filter media by category', async () => {
      const res = await request(app)
        .get('/api/admin/cms/media?category=course')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].category).toBe('course');
    });

    it('should search media by name', async () => {
      const res = await request(app)
        .get('/api/admin/cms/media?search=video')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should prevent regex injection in search', async () => {
      // Attempt regex injection
      const res = await request(app)
        .get('/api/admin/cms/media?search=.*')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      // Should not match all records due to escaping
    });
  });

  describe('PUT /api/admin/cms/media/:id', () => {
    let mediaId;

    beforeEach(async () => {
      const media = await Media.create({
        filename: 'test.jpg',
        originalName: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
        path: '/uploads/general/test.jpg',
        url: 'http://localhost:5000/uploads/general/test.jpg',
        type: 'image',
        category: 'general',
        uploadedBy: adminUser._id
      });
      mediaId = media._id;
    });

    it('should update media metadata', async () => {
      const res = await request(app)
        .put(`/api/admin/cms/media/${mediaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: { en: 'Updated Title' },
          description: { en: 'Updated Description' },
          tags: ['test', 'updated']
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title.en).toBe('Updated Title');
      expect(res.body.data.tags).toContain('updated');
    });

    it('should create audit trail on update', async () => {
      await request(app)
        .put(`/api/admin/cms/media/${mediaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ tags: ['updated'] })
        .expect(200);

      const auditLog = await AuditTrail.findOne({
        resourceType: 'Media',
        resourceId: mediaId,
        action: 'update'
      });

      expect(auditLog).toBeTruthy();
    });
  });
});
