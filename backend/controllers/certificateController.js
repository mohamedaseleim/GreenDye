const Certificate = require('../models/Certificate');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');

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

    // Create certificate (verificationToken & verificationUrl are set by pre-save hook in the model)
    const certificate = await Certificate.create({
      user: userId,
      course: courseId,
      userName: user.name,
      courseName: course.title, // Map<string,string> from course.title
      grade: grade || 'Pass',
      score: typeof score === 'number' ? score : 100,
      metadata: {
        duration: course.duration,
        instructor: course.instructor?.name || '',
        language: user.language || 'en'
      }
    });

    // Generate unique QR code using the certificate's verification URL (created by pre-save hook)
    const uniqueQrCodeData = await QRCode.toDataURL(certificate.verificationUrl);
    certificate.qrCode = uniqueQrCodeData;
    await certificate.save();

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

// @desc    Download certificate (PDF)
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

    if (certificate.isRevoked) {
      return res.status(410).json({
        success: false,
        message: 'Certificate revoked'
      });
    }

    // Ensure we have a QR (regenerate if missing)
    let qrDataUrl = certificate.qrCode;
    if (!qrDataUrl) {
      qrDataUrl = await QRCode.toDataURL(certificate.verificationUrl);
      certificate.qrCode = qrDataUrl;
      await certificate.save();
    }
    const qrBase64 = qrDataUrl.replace(/^data:image\/\w+;base64,/, '');
    const qrBuffer = Buffer.from(qrBase64, 'base64');

    // Generate PDF on the fly
    const doc = new PDFDocument({ size: 'A4', margin: 54 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=certificate-${certificate.certificateId}.pdf`
    );

    doc.pipe(res);

    // Title & body
    doc.fontSize(24).text('Certificate of Completion', { align: 'center' }).moveDown();
    doc
      .fontSize(16)
      .text(
        `This certifies that ${certificate.userName || certificate.user.name}`,
        { align: 'center' }
      );
    doc.fontSize(16).text('has successfully completed the course', { align: 'center' }).moveDown(0.5);

    const courseTitle =
      (certificate.courseName && certificate.courseName.get && (certificate.courseName.get('default') || certificate.courseName.get('en'))) ||
      certificate.course?.title ||
      'Course';

    doc.fontSize(20).text(courseTitle, { align: 'center' }).moveDown();

    doc.fontSize(12).text(`Grade: ${certificate.grade}`, { align: 'center' });
    if (typeof certificate.score === 'number')
      doc.fontSize(12).text(`Score: ${certificate.score}`, { align: 'center' });

    const issued = certificate.issueDate ? new Date(certificate.issueDate) : new Date();
    doc.fontSize(12).text(`Issued on: ${issued.toDateString()}`, { align: 'center' });
    doc.fontSize(10).text(`Certificate ID: ${certificate.certificateId}`, { align: 'center' }).moveDown();

    // QR bottom-right + verification URL
    const qrSize = 110;
    const x = doc.page.width - qrSize - 54;
    const y = doc.page.height - qrSize - 54;
    doc.image(qrBuffer, x, y, { width: qrSize, height: qrSize });
    doc.fontSize(8).text('Verify:', x, y - 20);
    doc.fontSize(8).text(certificate.verificationUrl, { width: qrSize, align: 'right' });

    doc.end();
  } catch (error) {
    next(error);
  }
};
