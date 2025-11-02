const request = require('supertest');
const { app } = require('../../server');
const User = require('../../models/User');

describe('Auth API Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        language: 'en'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toHaveProperty('name', userData.name);
      expect(response.body.data.user).toHaveProperty('email', userData.email);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should fail with duplicate email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'duplicate@example.com',
        password: 'password123'
      };

      await User.create(userData);

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail with missing required fields', async () => {
      const userData = {
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Test User',
        email: 'login@example.com',
        password: 'password123',
        isVerified: true,
        isActive: true
      });
    });

    it('should login with valid credentials', async () => {
      const credentials = {
        email: 'login@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toHaveProperty('email', credentials.email);
    });

    it('should fail with invalid email', async () => {
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid password', async () => {
      const credentials = {
        email: 'login@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user with valid token', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'me@example.com',
        password: 'password123'
      });

      const token = user.generateAuthToken();

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('email', user.email);
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update user profile', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'update@example.com',
        password: 'password123'
      });

      const token = user.generateAuthToken();
      const updates = {
        name: 'Updated Name',
        phone: '+1234567890'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('name', updates.name);
      expect(response.body.data).toHaveProperty('phone', updates.phone);
    });

    it('should fail without authentication', async () => {
      const updates = {
        name: 'Updated Name'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .send(updates)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/password', () => {
    it('should change password with correct current password', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'password@example.com',
        password: 'oldpassword'
      });

      const token = user.generateAuthToken();
      const passwordData = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123'
      };

      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should fail with incorrect current password', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'password2@example.com',
        password: 'oldpassword'
      });

      const token = user.generateAuthToken();
      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123'
      };

      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
