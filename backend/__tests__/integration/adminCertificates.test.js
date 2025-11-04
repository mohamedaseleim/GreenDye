const request = require('supertest');
const { app } = require('../../server');
const User = require('../../models/User');
const Course = require('../../models/Course');
const Certificate = require('../../models/Certificate');

describe('Admin Certificate API Endpoints', () => {
  let adminToken;
  let studentId;
  let courseId;
  let trainerId;

  beforeEach(async () => {
    // Create a trainer/instructor user
    const trainer = await User.create({
      name: 'Trainer User',
      email: 'trainer@example.com',
      password: 'password123',
      role: 'trainer',
      language: 'en'
    });
    trainerId = trainer._id;

    // Create an admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
      language: 'en'
    });

    // Create a student user
    const student = await User.create({
      name: 'Student User',
      email: 'student@example.com',
      password: 'password123',
      role: 'student',
      language: 'en'
    });
    studentId = student._id;

    // Get admin token
    const adminResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'password123' });
    adminToken = adminResponse.body.data.token;

    // Create a course with Map structure for title
    const course = await Course.create({
      title: new Map([
        ['en', 'Test Course'],
        ['ar', 'دورة تجريبية'],
        ['fr', 'Cours de test']
      ]),
      description: new Map([
        ['en', 'Test description'],
        ['ar', 'وصف تجريبي'],
        ['fr', 'Description du test']
      ]),
      instructor: trainerId,
      category: 'Technology',
      level: 'beginner',
      price: 100,
      duration: 10,
      language: 'en',
      isPublished: true
    });
    courseId = course._id;
  });

  describe('POST /api/admin/certificates', () => {
    it('should create a certificate manually (admin)', async () => {
      const response = await request(app)
        .post('/api/admin/certificates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: studentId,
          courseId: courseId,
          userName: 'Student User',
          grade: 'A+',
          score: 98,
          instructorName: 'Test Instructor'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('certificateId');
      expect(response.body.data).toHaveProperty('userName', 'Student User');
      expect(response.body.data).toHaveProperty('grade', 'A+');
      expect(response.body.data).toHaveProperty('score', 98);
      expect(response.body.data).toHaveProperty('verificationUrl');
      expect(response.body.data).toHaveProperty('qrCode');

      // Verify courseName is properly stored as a Map
      const certificate = await Certificate.findById(response.body.data._id);
      expect(certificate.courseName).toBeInstanceOf(Map);
      expect(certificate.courseName.get('en')).toBe('Test Course');
    });

    it('should fail to create duplicate certificate', async () => {
      // First creation
      await request(app)
        .post('/api/admin/certificates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: studentId,
          courseId: courseId,
          grade: 'A',
          score: 95
        })
        .expect(201);

      // Second creation should fail
      const response = await request(app)
        .post('/api/admin/certificates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: studentId,
          courseId: courseId,
          grade: 'A',
          score: 95
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('GET /api/admin/certificates', () => {
    it('should get all certificates with filters', async () => {
      // Create a couple of certificates
      await request(app)
        .post('/api/admin/certificates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: studentId,
          courseId: courseId,
          grade: 'A',
          score: 95
        });

      const response = await request(app)
        .get('/api/admin/certificates')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('certificateId');
    });

    it('should filter certificates by validity', async () => {
      // Create and revoke a certificate
      const createResponse = await request(app)
        .post('/api/admin/certificates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: studentId,
          courseId: courseId,
          grade: 'A',
          score: 95
        });

      const certificateId = createResponse.body.data._id;

      await request(app)
        .put(`/api/admin/certificates/${certificateId}/revoke`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test' });

      // Filter for revoked certificates
      const response = await request(app)
        .get('/api/admin/certificates?isRevoked=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every(cert => cert.isRevoked)).toBe(true);
    });
  });

  describe('PUT /api/admin/certificates/:id', () => {
    it('should update certificate details', async () => {
      // Create a certificate
      const createResponse = await request(app)
        .post('/api/admin/certificates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: studentId,
          courseId: courseId,
          grade: 'A',
          score: 95
        });

      const certificateId = createResponse.body.data._id;

      // Update it
      const response = await request(app)
        .put(`/api/admin/certificates/${certificateId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          grade: 'A+',
          score: 98,
          userName: 'Updated Name'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.grade).toBe('A+');
      expect(response.body.data.score).toBe(98);
      expect(response.body.data.userName).toBe('Updated Name');
    });
  });

  describe('POST /api/admin/certificates/bulk', () => {
    it('should bulk upload certificates', async () => {
      // Create another student
      const student2 = await User.create({
        name: 'Student Two',
        email: 'student2@example.com',
        password: 'password123',
        role: 'student',
        language: 'en'
      });

      const response = await request(app)
        .post('/api/admin/certificates/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          certificates: [
            {
              userEmail: 'student@example.com',
              courseId: courseId,
              grade: 'A',
              score: 95
            },
            {
              userEmail: 'student2@example.com',
              courseId: courseId,
              grade: 'B+',
              score: 85
            }
          ]
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.success.length).toBe(2);
      expect(response.body.data.failed.length).toBe(0);

      // Verify courseName is properly stored as a Map for bulk certificates
      const certificates = await Certificate.find({ course: courseId });
      certificates.forEach(cert => {
        expect(cert.courseName).toBeInstanceOf(Map);
        expect(cert.courseName.get('en')).toBe('Test Course');
      });
    });

    it('should handle partial failures in bulk upload', async () => {
      const response = await request(app)
        .post('/api/admin/certificates/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          certificates: [
            {
              userEmail: 'student@example.com',
              courseId: courseId,
              grade: 'A',
              score: 95
            },
            {
              userEmail: 'nonexistent@example.com', // This will fail
              courseId: courseId,
              grade: 'B+',
              score: 85
            }
          ]
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.success.length).toBe(1);
      expect(response.body.data.failed.length).toBe(1);
      expect(response.body.data.failed[0].error).toContain('not found');
    });
  });

  describe('GET /api/admin/certificates/export', () => {
    it('should export certificates as JSON', async () => {
      // Create a certificate
      await request(app)
        .post('/api/admin/certificates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: studentId,
          courseId: courseId,
          grade: 'A',
          score: 95
        });

      const response = await request(app)
        .get('/api/admin/certificates/export?format=json')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('certificateId');
      expect(response.body.data[0]).toHaveProperty('userName');
      expect(response.body.data[0]).toHaveProperty('courseName');
    });

    it('should export certificates as CSV', async () => {
      // Create a certificate
      await request(app)
        .post('/api/admin/certificates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: studentId,
          courseId: courseId,
          grade: 'A',
          score: 95
        });

      const response = await request(app)
        .get('/api/admin/certificates/export?format=csv')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.text).toContain('certificateId');
      expect(response.text).toContain('userName');
    });
  });

  describe('PUT /api/admin/certificates/:id/revoke', () => {
    it('should revoke a certificate', async () => {
      // Create a certificate
      const createResponse = await request(app)
        .post('/api/admin/certificates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: studentId,
          courseId: courseId,
          grade: 'A',
          score: 95
        });

      const certificateId = createResponse.body.data._id;

      const response = await request(app)
        .put(`/api/admin/certificates/${certificateId}/revoke`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Policy violation'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isRevoked).toBe(true);
      expect(response.body.data.isValid).toBe(false);
      expect(response.body.data.revokedReason).toBe('Policy violation');
    });
  });

  describe('PUT /api/admin/certificates/:id/restore', () => {
    it('should restore a revoked certificate', async () => {
      // Create and revoke a certificate
      const createResponse = await request(app)
        .post('/api/admin/certificates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: studentId,
          courseId: courseId,
          grade: 'A',
          score: 95
        });

      const certificateId = createResponse.body.data._id;

      await request(app)
        .put(`/api/admin/certificates/${certificateId}/revoke`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test' });

      // Restore it
      const response = await request(app)
        .put(`/api/admin/certificates/${certificateId}/restore`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isRevoked).toBe(false);
      expect(response.body.data.isValid).toBe(true);
    });
  });

  describe('POST /api/admin/certificates/:id/regenerate', () => {
    it('should regenerate certificate verification token', async () => {
      // Create a certificate
      const createResponse = await request(app)
        .post('/api/admin/certificates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: studentId,
          courseId: courseId,
          grade: 'A',
          score: 95
        });

      const certificateId = createResponse.body.data._id;
      const oldToken = createResponse.body.data.verificationToken;
      const oldUrl = createResponse.body.data.verificationUrl;

      const response = await request(app)
        .post(`/api/admin/certificates/${certificateId}/regenerate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.verificationToken).not.toBe(oldToken);
      expect(response.body.data.verificationUrl).not.toBe(oldUrl);
      expect(response.body.data.qrCode).toBeDefined();
    });
  });

  describe('DELETE /api/admin/certificates/:id', () => {
    it('should delete a certificate', async () => {
      // Create a certificate
      const createResponse = await request(app)
        .post('/api/admin/certificates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: studentId,
          courseId: courseId,
          grade: 'A',
          score: 95
        });

      const certificateId = createResponse.body.data._id;

      const response = await request(app)
        .delete(`/api/admin/certificates/${certificateId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify it's deleted
      const certificate = await Certificate.findById(certificateId);
      expect(certificate).toBeNull();
    });
  });
});
