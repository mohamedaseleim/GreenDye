const Certificate = require('../models/Certificate');
const Trainer = require('../models/Trainer');

// Helper to read Map<string,string> courseName or populated course title
function resolveCourseTitle(cert) {
  if (cert.courseName) {
    // Mongoose Map supports get(); when serialized it may appear as plain object
    if (typeof cert.courseName.get === 'function') {
      return cert.courseName.get('default') || cert.courseName.get('en') || Array.from(cert.courseName.values())[0];
    }
    // plain object fallback
    return cert.courseName.default || cert.courseName.en || cert.courseName.title || Object.values(cert.courseName)[0];
  }
  return cert.course?.title || 'Course';
}

// @desc    Verify certificate (token-aware, revocation/expiry-aware)
// @route   GET /api/verify/certificate/:certificateId?t=<verificationToken>
// @access  Public
exports.verifyCertificate = async (req, res, next) => {
  try {
    const { certificateId } = req.params;
    const token = req.query.t;

    // If a token is present, require it. Otherwise, fall back to id-only lookup.
    const query = token
      ? { certificateId, verificationToken: token }
      : { certificateId };

    const certificate = await Certificate.findOne(query)
      .populate('user', 'name email')
      .populate('course', 'title');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found',
        verified: false
      });
    }

    // Compute status
    const now = new Date();
    const isExpired = certificate.expiryDate ? now > new Date(certificate.expiryDate) : false;

    let status;
    if (certificate.isRevoked) status = 'Revoked';
    else if (!certificate.isValid) status = 'Invalid';
    else if (isExpired) status = 'Expired';
    else status = 'Valid';

    const basePayload = {
      certificateId: certificate.certificateId,
      traineeName: certificate.userName || certificate.user?.name,
      courseTitle: resolveCourseTitle(certificate),
      certificateLevel: certificate.grade,
      duration: certificate.metadata?.duration,
      tutorName: certificate.metadata?.instructor,
      issuedBy: 'GreenDye Academy',
      verificationDate: new Date(),
      status,
      isRevoked: !!certificate.isRevoked,
      revokedDate: certificate.revokedDate || null,
      revokedReason: certificate.revokedReason || null,
      completionDate: certificate.completionDate || null,
      issueDate: certificate.issueDate || null,
      expiryDate: certificate.expiryDate || null,
      score: typeof certificate.score === 'number' ? certificate.score : null,
      verificationUrl: certificate.verificationUrl || null,
      qrCode: certificate.qrCode || null
    };

    // If not valid (revoked/invalid/expired) return verified:false but success:true
    if (certificate.isRevoked || !certificate.isValid || isExpired) {
      const message = certificate.isRevoked
        ? `Certificate has been revoked.${certificate.revokedReason ? ' Reason: ' + certificate.revokedReason : ''}`
        : isExpired
          ? 'Certificate has expired'
          : 'Certificate is not valid';

      return res.status(200).json({
        success: true,
        verified: false,
        message,
        data: basePayload
      });
    }

    // When token was provided but does not match, treat as not verified (defense-in-depth)
    if (token && certificate.verificationToken && token !== certificate.verificationToken) {
      return res.status(200).json({
        success: true,
        verified: false,
        message: 'Verification token mismatch',
        data: basePayload
      });
    }

    // Valid certificate
    return res.status(200).json({
      success: true,
      verified: true,
      message: 'Certificate is valid',
      data: basePayload
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify trainer
// @route   GET /api/verify/trainer/:trainerId
// @access  Public
exports.verifyTrainer = async (req, res, next) => {
  try {
    const trainer = await Trainer.findOne({
      trainerId: req.params.trainerId
    }).populate('user', 'name email avatar');

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found',
        verified: false
      });
    }

    if (!trainer.isVerified || !trainer.isActive) {
      return res.status(200).json({
        success: true,
        verified: false,
        message: !trainer.isActive
          ? 'Trainer account is not active'
          : 'Trainer is not verified',
        data: {
          trainerId: trainer.trainerId,
          fullName: trainer.fullName,
          isVerified: trainer.isVerified,
          isActive: trainer.isActive
        }
      });
    }

    return res.status(200).json({
      success: true,
      verified: true,
      message: 'Trainer is verified and active',
      data: {
        trainerId: trainer.trainerId,
        fullName: trainer.fullName,
        title: trainer.title,
        expertise: trainer.expertise,
        experience: trainer.experience,
        qualifications: trainer.qualifications,
        certifications: trainer.certifications,
        rating: trainer.rating,
        coursesCount: trainer.coursesCount,
        studentsCount: trainer.studentsCount,
        verificationDate: trainer.verificationDate,
        accreditations: trainer.accreditations
      }
    });
  } catch (error) {
    next(error);
  }
};
