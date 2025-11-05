const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Analytics = require('../models/Analytics');
const jwt = require('jsonwebtoken');

describe('Admin Course Management API Tests', () => {
  let adminToken;
  let adminUser;
  let testCourse;
  let trainerUser;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI_TEST || process.env.MONGO_URI);
    }

    // Create admin user
    adminUser = await User.create({
      name: 'Admin Test User',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin'
    });

    // Generate admin token
    adminToken = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET, {
      expiresIn: '1d'
    });

    // Create trainer user
    trainerUser = await User.create({
      name: 'Trainer Test User',
      email: 'trainer@test.com',
      password: 'password123',
      role: 'trainer'
    });

    // Create test course
    testCourse = await Course.create({
      title: { en: 'Test Course', ar: 'دورة اختبار', fr: 'Cours de test' },
      description: { en: 'Test Description', ar: 'وصف الاختبار', fr: 'Description du test' },
      category: 'technology',
      level: 'beginner',
      duration: 10,
      price: 99.99,
      currency: 'USD',
      instructor: trainerUser._id,
      approvalStatus: 'pending'
    });
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ email: { $in: ['admin@test.com', 'trainer@test.com'] } });
    await Course.deleteMany({ 'title.en': /Test Course/ });
    await Enrollment.deleteMany({});
    await Analytics.deleteMany({});
    await mongoose.connection.close();
  });

  describe('GET /api/admin/courses', () => {
    it('should get all courses with admin token', async () => {
      const response = await request(app)
        .get('/api/admin/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter courses by approval status', async () => {
      const response = await request(app)
        .get('/api/admin/courses?approvalStatus=pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should deny access without admin token', async () => {
      const response = await request(app)
        .get('/api/admin/courses')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/courses/pending', () => {
    it('should get pending courses', async () => {
      const response = await request(app)
        .get('/api/admin/courses/pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('PUT /api/admin/courses/:id/pricing', () => {
    it('should update course pricing', async () => {
      const response = await request(app)
        .put(`/api/admin/courses/${testCourse._id}/pricing`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          price: 149.99,
          currency: 'USD',
          discount: {
            percentage: 20,
            isActive: true
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.price).toBe(149.99);
    });

    it('should return 404 for non-existent course', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/admin/courses/${fakeId}/pricing`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 100 })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/courses/:id/analytics', () => {
    it('should get course analytics', async () => {
      // Create test enrollment
      await Enrollment.create({
        user: adminUser._id,
        course: testCourse._id,
        status: 'active',
        progress: 50
      });

      const response = await request(app)
        .get(`/api/admin/courses/${testCourse._id}/analytics`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.enrollments).toBeDefined();
      expect(response.body.data.completionRate).toBeDefined();
    });

    it('should return 404 for non-existent course', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/admin/courses/${fakeId}/analytics`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/courses/categories', () => {
    it('should get all course categories', async () => {
      const response = await request(app)
        .get('/api/admin/courses/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('PUT /api/admin/courses/:id/category', () => {
    it('should update course category', async () => {
      const response = await request(app)
        .put(`/api/admin/courses/${testCourse._id}/category`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ category: 'business' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.category).toBe('business');
    });
  });

  describe('GET /api/admin/courses/tags', () => {
    it('should get all course tags', async () => {
      // Add tags to test course
      testCourse.tags = ['programming', 'web-development'];
      await testCourse.save();

      const response = await request(app)
        .get('/api/admin/courses/tags')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('PUT /api/admin/courses/:id/tags', () => {
    it('should update course tags', async () => {
      const response = await request(app)
        .put(`/api/admin/courses/${testCourse._id}/tags`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ tags: ['javascript', 'nodejs', 'express'] })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tags).toEqual(['javascript', 'nodejs', 'express']);
    });

    it('should return 400 if tags is not an array', async () => {
      const response = await request(app)
        .put(`/api/admin/courses/${testCourse._id}/tags`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ tags: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/admin/courses/bulk-update', () => {
    it('should bulk update courses', async () => {
      const response = await request(app)
        .put('/api/admin/courses/bulk-update')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          courseIds: [testCourse._id],
          updates: { isFeatured: true }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 400 if courseIds is not provided', async () => {
      const response = await request(app)
        .put('/api/admin/courses/bulk-update')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ updates: { isFeatured: true } })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/courses/statistics', () => {
    it('should get course statistics', async () => {
      const response = await request(app)
        .get('/api/admin/courses/statistics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.overview).toBeDefined();
      expect(response.body.data.categoryBreakdown).toBeDefined();
      expect(response.body.data.levelBreakdown).toBeDefined();
    });
  });

  describe('PUT /api/admin/courses/:id/approve', () => {
    it('should approve a course', async () => {
      const response = await request(app)
        .put(`/api/admin/courses/${testCourse._id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.approvalStatus).toBe('approved');
    });
  });

  describe('PUT /api/admin/courses/:id/reject', () => {
    it('should reject a course', async () => {
      // Reset course to pending first
      testCourse.approvalStatus = 'pending';
      await testCourse.save();

      const response = await request(app)
        .put(`/api/admin/courses/${testCourse._id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.approvalStatus).toBe('rejected');
    });
  });
});
