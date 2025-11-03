const Certificate = require('../models/Certificate');
const Course = require('../models/Course');
const User = require('../models/User');
const AuditTrail = require('../models/AuditTrail');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

// @desc    Get all certificates with filters and pagination (admin)
// @route   GET /api/admin/certificates
// @access  Private/Admin
exports.getAllCertificates = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      isValid,
      isRevoked,
      courseId,
      startDate,
      endDate,
      sortBy = 'issueDate',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Filter by search (name, certificateId)
    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { certificateId: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by validity
    if (isValid !== undefined) {
      query.isValid = isValid === 'true';
    }

    if (isRevoked !== undefined) {
      query.isRevoked = isRevoked === 'true';
    }

    // Filter by course
    if (courseId) {
      query.course = courseId;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.issueDate = {};
      if (startDate) query.issueDate.$gte = new Date(startDate);
      if (endDate) query.issueDate.$lte = new Date(endDate);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const certificates = await Certificate.find(query)
      .populate('user', 'name email')
      .populate('course', 'title')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Certificate.countDocuments(query);

    res.status(200).json({
      success: true,
      count: certificates.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: certificates
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create/Add new certificate manually
// @route   POST /api/admin/certificates
// @access  Private/Admin
exports.createCertificate = async (req, res, next) => {
  try {
    const {
      userId,
      courseId,
      userName,
      grade,
      score,
      issueDate,
      expiryDate,
      instructorName,
      certificateId
    } = req.body;

    // Validate user and course exist
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check for duplicate
    const existing = await Certificate.findOne({
      user: userId,
      course: courseId
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Certificate already exists for this user and course'
      });
    }

    // Create certificate data
    const certificateData = {
      user: userId,
      course: courseId,
      userName: userName || user.name,
      courseName: course.title,
      grade: grade || 'Pass',
      score,
      issueDate: issueDate || Date.now(),
      expiryDate,
      metadata: {
        duration: course.duration,
        instructor: instructorName || course.instructor?.name,
        language: user.language || 'en'
      }
    };

    // Override certificateId if provided
    if (certificateId) {
      certificateData.certificateId = certificateId;
    }

    const certificate = await Certificate.create(certificateData);

    // Generate QR code
    const qrCodeData = await QRCode.toDataURL(certificate.verificationUrl);
    certificate.qrCode = qrCodeData;
    await certificate.save();

    // Audit log
    await AuditTrail.create({
      user: req.user.id,
      action: 'create',
      resourceType: 'Certificate',
      resourceId: certificate._id,
      details: `Created certificate ${certificate.certificateId} for user ${user.name}`,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Certificate created successfully',
      data: certificate
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update certificate details
// @route   PUT /api/admin/certificates/:id
// @access  Private/Admin
exports.updateCertificate = async (req, res, next) => {
  try {
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    const {
      userName,
      grade,
      score,
      issueDate,
      expiryDate,
      instructorName
    } = req.body;

    // Update allowed fields
    if (userName) certificate.userName = userName;
    if (grade) certificate.grade = grade;
    if (score !== undefined) certificate.score = score;
    if (issueDate) certificate.issueDate = issueDate;
    if (expiryDate !== undefined) certificate.expiryDate = expiryDate;
    if (instructorName) {
      certificate.metadata = certificate.metadata || {};
      certificate.metadata.instructor = instructorName;
    }

    await certificate.save();

    // Audit log
    await AuditTrail.create({
      user: req.user.id,
      action: 'update',
      resourceType: 'Certificate',
      resourceId: certificate._id,
      details: `Updated certificate ${certificate.certificateId}`,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Certificate updated successfully',
      data: certificate
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Regenerate certificate PDF/QR
// @route   POST /api/admin/certificates/:id/regenerate
// @access  Private/Admin
exports.regenerateCertificate = async (req, res, next) => {
  try {
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Regenerate verification token and URL
    certificate.verificationToken = uuidv4().replace(/-/g, '');
    const base = process.env.FRONTEND_URL || process.env.PUBLIC_BASE_URL || '';
    certificate.verificationUrl = `${base}/verify/certificate/${certificate.certificateId}?t=${certificate.verificationToken}`;

    // Regenerate QR code
    const qrCodeData = await QRCode.toDataURL(certificate.verificationUrl);
    certificate.qrCode = qrCodeData;

    await certificate.save();

    // Audit log
    await AuditTrail.create({
      user: req.user.id,
      action: 'regenerate',
      resourceType: 'Certificate',
      resourceId: certificate._id,
      details: `Regenerated certificate ${certificate.certificateId}`,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Certificate regenerated successfully',
      data: certificate
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk upload certificates
// @route   POST /api/admin/certificates/bulk
// @access  Private/Admin
exports.bulkUploadCertificates = async (req, res, next) => {
  try {
    const { certificates } = req.body;

    if (!Array.isArray(certificates) || certificates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid certificates data'
      });
    }

    const results = {
      success: [],
      failed: []
    };

    for (const certData of certificates) {
      try {
        const { userEmail, courseId, grade, score, issueDate } = certData;

        // Find user by email
        const user = await User.findOne({ email: userEmail });
        if (!user) {
          results.failed.push({
            data: certData,
            error: 'User not found'
          });
          continue;
        }

        // Find course
        const course = await Course.findById(courseId);
        if (!course) {
          results.failed.push({
            data: certData,
            error: 'Course not found'
          });
          continue;
        }

        // Check for duplicate
        const existing = await Certificate.findOne({
          user: user._id,
          course: courseId
        });

        if (existing) {
          results.failed.push({
            data: certData,
            error: 'Certificate already exists'
          });
          continue;
        }

        // Create certificate
        const certificate = await Certificate.create({
          user: user._id,
          course: courseId,
          userName: user.name,
          courseName: course.title,
          grade: grade || 'Pass',
          score,
          issueDate: issueDate || Date.now(),
          metadata: {
            duration: course.duration,
            instructor: course.instructor?.name,
            language: user.language || 'en'
          }
        });

        // Generate QR code
        const qrCodeData = await QRCode.toDataURL(certificate.verificationUrl);
        certificate.qrCode = qrCodeData;
        await certificate.save();

        results.success.push({
          certificateId: certificate.certificateId,
          userName: user.name,
          courseName: (course.title && course.title.get) ? (course.title.get('en') || course.title.get('default')) : 'N/A'
        });
      } catch (error) {
        results.failed.push({
          data: certData,
          error: error.message
        });
      }
    }

    // Audit log
    await AuditTrail.create({
      user: req.user.id,
      action: 'bulk_upload',
      resourceType: 'Certificate',
      details: `Bulk uploaded ${results.success.length} certificates, ${results.failed.length} failed`,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Bulk upload completed',
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Revoke/Suspend certificates
// @route   PUT /api/admin/certificates/:id/revoke
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

    const { reason } = req.body;

    certificate.isValid = false;
    certificate.isRevoked = true;
    certificate.revokedDate = Date.now();
    certificate.revokedReason = reason || 'Administrative action';

    await certificate.save();

    // Audit log
    await AuditTrail.create({
      user: req.user.id,
      action: 'revoke',
      resourceType: 'Certificate',
      resourceId: certificate._id,
      details: `Revoked certificate ${certificate.certificateId}: ${reason}`,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Certificate revoked successfully',
      data: certificate
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Restore revoked certificate
// @route   PUT /api/admin/certificates/:id/restore
// @access  Private/Admin
exports.restoreCertificate = async (req, res, next) => {
  try {
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    certificate.isValid = true;
    certificate.isRevoked = false;
    certificate.revokedDate = null;
    certificate.revokedReason = null;

    await certificate.save();

    // Audit log
    await AuditTrail.create({
      user: req.user.id,
      action: 'restore',
      resourceType: 'Certificate',
      resourceId: certificate._id,
      details: `Restored certificate ${certificate.certificateId}`,
      ipAddress: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Certificate restored successfully',
      data: certificate
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get certificate verification history
// @route   GET /api/admin/certificates/:id/history
// @access  Private/Admin
exports.getCertificateHistory = async (req, res, next) => {
  try {
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Get audit trail for this certificate
    const history = await AuditTrail.find({
      resourceType: 'Certificate',
      resourceId: certificate._id
    })
      .populate('user', 'name email')
      .sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export certificates data
// @route   GET /api/admin/certificates/export
// @access  Private/Admin
exports.exportCertificates = async (req, res, next) => {
  try {
    const {
      format = 'json',
      isValid,
      isRevoked,
      courseId,
      startDate,
      endDate
    } = req.query;

    const query = {};

    if (isValid !== undefined) {
      query.isValid = isValid === 'true';
    }

    if (isRevoked !== undefined) {
      query.isRevoked = isRevoked === 'true';
    }

    if (courseId) {
      query.course = courseId;
    }

    if (startDate || endDate) {
      query.issueDate = {};
      if (startDate) query.issueDate.$gte = new Date(startDate);
      if (endDate) query.issueDate.$lte = new Date(endDate);
    }

    const certificates = await Certificate.find(query)
      .populate('user', 'name email')
      .populate('course', 'title')
      .sort({ issueDate: -1 });

    // Format data for export
    const exportData = certificates.map(cert => ({
      certificateId: cert.certificateId,
      userName: cert.userName,
      userEmail: cert.user?.email,
      courseName: (cert.courseName && cert.courseName.get) ? (cert.courseName.get('en') || cert.courseName.get('default')) : 'N/A',
      grade: cert.grade,
      score: cert.score,
      issueDate: cert.issueDate,
      expiryDate: cert.expiryDate,
      isValid: cert.isValid,
      isRevoked: cert.isRevoked,
      verificationUrl: cert.verificationUrl
    }));

    // Audit log
    await AuditTrail.create({
      user: req.user.id,
      action: 'export',
      resourceType: 'Certificate',
      details: `Exported ${exportData.length} certificates`,
      ipAddress: req.ip
    });

    if (format === 'csv') {
      // Convert to CSV
      const csv = [
        Object.keys(exportData[0] || {}).join(','),
        ...exportData.map(row => Object.values(row).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=certificates.csv');
      return res.send(csv);
    }

    res.status(200).json({
      success: true,
      count: exportData.length,
      data: exportData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete certificate (permanent)
// @route   DELETE /api/admin/certificates/:id
// @access  Private/Admin
exports.deleteCertificate = async (req, res, next) => {
  try {
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Audit log before deletion
    await AuditTrail.create({
      user: req.user.id,
      action: 'delete',
      resourceType: 'Certificate',
      resourceId: certificate._id,
      details: `Deleted certificate ${certificate.certificateId}`,
      ipAddress: req.ip
    });

    await certificate.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Certificate deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
