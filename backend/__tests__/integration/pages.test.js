const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../../server');
const Page = require('../../models/Page');
const User = require('../../models/User');

describe('Public Page API', () => {
  let testUser;
  let publishedPage;
  let draftPage;

  beforeAll(async () => {
    // Create a test user
    testUser = await User.create({
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'password123',
      role: 'admin'
    });

    // Create a published page
    publishedPage = await Page.create({
      slug: 'test-published-page',
      title: {
        en: 'Test Published Page',
        ar: 'صفحة اختبار منشورة',
        fr: 'Page de test publiée'
      },
      content: {
        en: '<p>This is test content</p>',
        ar: '<p>هذا محتوى اختبار</p>',
        fr: '<p>Ceci est un contenu de test</p>'
      },
      metaDescription: {
        en: 'Test page description',
        ar: 'وصف صفحة الاختبار',
        fr: 'Description de la page de test'
      },
      template: 'default',
      status: 'published',
      isActive: true,
      author: testUser._id
    });

    // Create a draft page (should not be accessible)
    draftPage = await Page.create({
      slug: 'test-draft-page',
      title: {
        en: 'Test Draft Page'
      },
      content: {
        en: '<p>This is draft content</p>'
      },
      template: 'default',
      status: 'draft',
      isActive: true,
      author: testUser._id
    });
  });

  afterAll(async () => {
    // Clean up test data
    await Page.deleteMany({ author: testUser._id });
    await User.findByIdAndDelete(testUser._id);
  });

  describe('GET /api/pages/:slug', () => {
    it('should return a published page by slug', async () => {
      const response = await request(app)
        .get('/api/pages/test-published-page')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.slug).toBe('test-published-page');
      expect(response.body.data.title.en).toBe('Test Published Page');
      expect(response.body.data.status).toBe('published');
      
      // Ensure sensitive fields are not included
      expect(response.body.data.author).toBeUndefined();
      expect(response.body.data.lastEditedBy).toBeUndefined();
    });

    it('should return 404 for a draft page', async () => {
      const response = await request(app)
        .get('/api/pages/test-draft-page')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Page not found');
    });

    it('should return 404 for a non-existent page', async () => {
      const response = await request(app)
        .get('/api/pages/non-existent-page')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Page not found');
    });

    it('should handle multilingual content', async () => {
      const response = await request(app)
        .get('/api/pages/test-published-page')
        .expect(200);

      expect(response.body.data.title.en).toBeDefined();
      expect(response.body.data.title.ar).toBeDefined();
      expect(response.body.data.title.fr).toBeDefined();
      expect(response.body.data.content.en).toBeDefined();
      expect(response.body.data.content.ar).toBeDefined();
      expect(response.body.data.content.fr).toBeDefined();
    });
  });
});
