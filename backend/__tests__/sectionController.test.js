const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const sectionRoutes = require('../routes/sectionRoutes');
const Section = require('../models/Section');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');

// Mock authentication middleware
jest.mock('../middleware/auth', () => ({
  protect: (req, res, next) => {
    req.user = { id: 'mock-user-id', role: 'admin' };
    next();
  },
  authorize: (...roles) => (req, res, next) => next()
}));

describe('Section Controller Tests', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/sections', sectionRoutes);
  });

  describe('Section Model Validation', () => {
    it('should require course reference', () => {
      const section = new Section({
        title: { en: 'Test Section' },
        order: 0
      });

      const validationError = section.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.course).toBeDefined();
    });

    it('should require title', () => {
      const section = new Section({
        course: new mongoose.Types.ObjectId(),
        order: 0
      });

      const validationError = section.validateSync();
      expect(validationError).toBeDefined();
      expect(validationError.errors.title).toBeDefined();
    });

    it('should create valid section with required fields', () => {
      const section = new Section({
        course: new mongoose.Types.ObjectId(),
        title: { en: 'Test Section' },
        order: 0
      });

      const validationError = section.validateSync();
      expect(validationError).toBeUndefined();
    });

    it('should support multilingual titles', () => {
      const section = new Section({
        course: new mongoose.Types.ObjectId(),
        title: { en: 'Test Section', ar: 'قسم الاختبار', fr: 'Section de test' },
        order: 0
      });

      const validationError = section.validateSync();
      expect(validationError).toBeUndefined();
      expect(section.title.get('en')).toBe('Test Section');
      expect(section.title.get('ar')).toBe('قسم الاختبار');
      expect(section.title.get('fr')).toBe('Section de test');
    });

    it('should have lessons array', () => {
      const section = new Section({
        course: new mongoose.Types.ObjectId(),
        title: { en: 'Test Section' },
        order: 0,
        lessons: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()]
      });

      expect(section.lessons).toHaveLength(2);
    });
  });

  describe('Section Order Management', () => {
    it('should support order field', () => {
      const section1 = new Section({
        course: new mongoose.Types.ObjectId(),
        title: { en: 'First Section' },
        order: 0
      });

      const section2 = new Section({
        course: new mongoose.Types.ObjectId(),
        title: { en: 'Second Section' },
        order: 1
      });

      expect(section1.order).toBe(0);
      expect(section2.order).toBe(1);
    });
  });

  describe('Section Attachments', () => {
    it('should support attachments array', () => {
      const section = new Section({
        course: new mongoose.Types.ObjectId(),
        title: { en: 'Test Section' },
        order: 0,
        attachments: [
          { name: 'file1.pdf', url: '/uploads/file1.pdf', type: 'pdf' },
          { name: 'file2.doc', url: '/uploads/file2.doc', type: 'doc' }
        ]
      });

      expect(section.attachments).toHaveLength(2);
      expect(section.attachments[0].name).toBe('file1.pdf');
    });
  });
});
