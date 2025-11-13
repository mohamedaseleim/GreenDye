const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../../server');
const User = require('../../models/User');
const Course = require('../../models/Course');
const Section = require('../../models/Section');
const Lesson = require('../../models/Lesson');

describe('Section Management', () => {
  let adminToken;
  let adminUser;
  let course;
  let lesson;

  beforeAll(async () => {
    // Create admin user
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin-section@test.com',
      password: 'password123',
      role: 'admin',
    });

    // Login to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin-section@test.com',
        password: 'password123',
      });

    adminToken = loginRes.body.token;

    // Create a test course
    course = await Course.create({
      title: { en: 'Test Course for Sections' },
      description: { en: 'Test Description' },
      instructor: adminUser._id,
      category: 'technology',
      level: 'beginner',
      price: 99,
      duration: 10,
    });

    // Create a test lesson
    lesson = await Lesson.create({
      course: course._id,
      title: { en: 'Test Lesson' },
      description: { en: 'Test Lesson Description' },
      type: 'video',
      order: 1,
    });
  });

  afterAll(async () => {
    await User.deleteMany({ email: 'admin-section@test.com' });
    await Course.deleteMany({ title: { en: 'Test Course for Sections' } });
    await Section.deleteMany({});
    await Lesson.deleteMany({ title: { en: 'Test Lesson' } });
    await mongoose.connection.close();
  });

  describe('POST /api/sections', () => {
    it('should create a new section', async () => {
      const res = await request(app)
        .post('/api/sections')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          course: course._id,
          title: { en: 'Introduction Section' },
          description: { en: 'Introduction to the course' },
          order: 1,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.title.en).toBe('Introduction Section');
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .post('/api/sections')
        .send({
          course: course._id,
          title: { en: 'Unauthorized Section' },
          order: 1,
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/sections', () => {
    it('should get all sections for a course', async () => {
      const res = await request(app)
        .get('/api/sections')
        .query({ courseId: course._id });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should fail without courseId', async () => {
      const res = await request(app).get('/api/sections');

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/sections/:id', () => {
    let sectionId;

    beforeAll(async () => {
      const section = await Section.create({
        course: course._id,
        title: { en: 'Section to Update' },
        order: 2,
      });
      sectionId = section._id;
    });

    it('should update a section', async () => {
      const res = await request(app)
        .put(`/api/sections/${sectionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: { en: 'Updated Section Title' },
          description: { en: 'Updated description' },
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title.en).toBe('Updated Section Title');
    });
  });

  describe('PUT /api/sections/:id/lessons/:lessonId', () => {
    let sectionId;

    beforeAll(async () => {
      const section = await Section.create({
        course: course._id,
        title: { en: 'Section for Lessons' },
        order: 3,
        lessons: [],
      });
      sectionId = section._id;
    });

    it('should add a lesson to section', async () => {
      const res = await request(app)
        .put(`/api/sections/${sectionId}/lessons/${lesson._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.lessons).toContain(lesson._id.toString());
    });

    it('should remove a lesson from section', async () => {
      const res = await request(app)
        .delete(`/api/sections/${sectionId}/lessons/${lesson._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.lessons).not.toContain(lesson._id.toString());
    });
  });

  describe('DELETE /api/sections/:id', () => {
    let sectionId;

    beforeAll(async () => {
      const section = await Section.create({
        course: course._id,
        title: { en: 'Section to Delete' },
        order: 4,
      });
      sectionId = section._id;
    });

    it('should delete a section', async () => {
      const res = await request(app)
        .delete(`/api/sections/${sectionId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify section is deleted
      const deletedSection = await Section.findById(sectionId);
      expect(deletedSection).toBeNull();
    });
  });
});
