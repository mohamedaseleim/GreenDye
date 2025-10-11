const Certificate = require('../models/Certificate');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// @desc    Get all certificates for current user
// @route   GET /api/certificates
// @access  Private
exports.getCertificates = async (req, res, next) => {
  try {
    const certificates = await Certificate.find({ user: req.user.id })
      .populate('course', 'title thumbnail')
      .sort({ issueDate: -1 });

    res.status(200).json({
      success: true,
      count: certificates.length,
      data: certificates
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single certificate
// @route   GET /api/certificates/:id
// @access  Private
exports.getCertificate = async (req, res, next) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('user', 'name email')
      .populate('course', 'title');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Check if user owns this certificate or is admin
    if (certificate.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to view this certificate'
      });
    }

    res.status(200).json({
      success: true,
      data: certificate
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate certificate
// @route   POST /api/certificates/generate
// @access  Private/Trainer/Admin
exports.generateCertificate = async (req, res, next) => {
  try {
    const { userId, courseId, grade, score } = req.body;

    // Check if enrollment exists and is completed
    const enrollment = await Enrollment.findOne({
      user: userId,
      course: courseId,
      status: 'completed'
    });

    if (!enrollment) {
      return res.status(400).json({
        success: false,
        message: 'User has not completed this course'
      });
    }

    // Check if certificate already exists
    const existingCertificate = await Certificate.findOne({
      user: userId,
      course: courseId
    });

    if (existingCertificate) {
      return res.status(400).json({
        success: false,
        message: 'Certificate already exists for this course'
      });
    }

    // Get course and user info
    const course = await Course.findById(courseId).populate('instructor', 'name');
    const User = require('../models/User');
    const user = await User.findById(userId);

    // Generate QR code
    const verificationUrl = `${process.env.FRONTEND_URL}/verify/certificate/`;
    const qrCodeData = await QRCode.toDataURL(verificationUrl);

    // Create certificate
    const certificate = await Certificate.create({
      user: userId,
      course: courseId,
      userName: user.name,
      courseName: course.title,
      grade: grade || 'Pass',
      score: score || 100,
      qrCode: qrCodeData,
      metadata: {
        duration: course.duration,
        instructor: course.instructor.name,
        language: user.language
      }
    });

    // Update enrollment with certificate reference
    enrollment.certificate = certificate._id;
    await enrollment.save();

    res.status(201).json({
      success: true,
      message: 'Certificate generated successfully',
      data: certificate
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Revoke certificate
// @route   PUT /api/certificates/:id/revoke
// @access  Private/Admin
exports.revokeCertificate = async (req, res, next) => {
  try {
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    certificate.isValid = false;
    certificate.isRevoked = true;
    certificate.revokedDate = Date.now();
    certificate.revokedReason = req.body.reason || 'Administrative decision';

    await certificate.save();

    res.status(200).json({
      success: true,
      message: 'Certificate revoked successfully',
      data: certificate
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download certificate
// @route   GET /api/certificates/:id/download
// @access  Private
exports.downloadCertificate = async (req, res, next) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('user', 'name')
      .populate('course', 'title');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Check authorization
    if (certificate.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to download this certificate'
      });
    }

    // For now, return certificate data
    // TODO: Generate actual PDF certificate
    res.status(200).json({
      success: true,
      message: 'Certificate download - PDF generation coming soon',
      data: certificate
    });
  } catch (error) {
    next(error);
  }
};
