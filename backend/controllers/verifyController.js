const Certificate = require('../models/Certificate');
const Trainer = require('../models/Trainer');
const { DEFAULT_CERTIFICATE_ISSUER, DEFAULT_COURSE_TITLE } = require('../utils/constants');

// Helper function to map applicationStatus to verificationStatus
function getVerificationStatus(applicationStatus) {
  switch (applicationStatus) {
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'under_review':
      return 'Under Review';
    default:
      return 'Pending';
  }
}

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
  return cert.course?.title || DEFAULT_COURSE_TITLE;
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

    // Build payload with only non-null/non-undefined fields
    const basePayload = {
      certificateId: certificate.certificateId,
      status,
      isRevoked: !!certificate.isRevoked,
      verificationDate: new Date()
    };

    // Add trainee name (with fallback chain)
    const traineeName = certificate.traineeName || certificate.userName || certificate.user?.name;
    if (traineeName) basePayload.traineeName = traineeName;

    // Add course title (with fallback chain)
    const courseTitle = certificate.courseTitle || resolveCourseTitle(certificate);
    if (courseTitle && courseTitle !== DEFAULT_COURSE_TITLE) basePayload.courseTitle = courseTitle;

    // Add certificate level
    if (certificate.certificateLevel) basePayload.certificateLevel = certificate.certificateLevel;

    // Add grade (separate field)
    if (certificate.grade) basePayload.grade = certificate.grade;

    // Add score
    if (typeof certificate.score === 'number') basePayload.score = certificate.score;

    // Add tutor name
    if (certificate.metadata?.instructor) basePayload.tutorName = certificate.metadata.instructor;

    // Add scheme
    if (certificate.metadata?.scheme) basePayload.scheme = certificate.metadata.scheme;

    // Add held on date
    if (certificate.metadata?.heldOn) basePayload.heldOn = certificate.metadata.heldOn;

    // Add held in location
    if (certificate.metadata?.heldIn) basePayload.heldIn = certificate.metadata.heldIn;

    // Add duration
    if (certificate.metadata?.duration) basePayload.duration = certificate.metadata.duration;

    // Add issued by
    if (certificate.metadata?.issuedBy) {
      basePayload.issuedBy = certificate.metadata.issuedBy;
    } else {
      basePayload.issuedBy = DEFAULT_CERTIFICATE_ISSUER;
    }

    // Add dates
    if (certificate.completionDate) basePayload.completionDate = certificate.completionDate;
    if (certificate.issueDate) basePayload.issueDate = certificate.issueDate;
    if (certificate.expiryDate) basePayload.expiryDate = certificate.expiryDate;

    // Add revocation info if applicable
    if (certificate.revokedDate) basePayload.revokedDate = certificate.revokedDate;
    if (certificate.revokedReason) basePayload.revokedReason = certificate.revokedReason;

    // Add verification URL and QR code
    if (certificate.verificationUrl) basePayload.verificationUrl = certificate.verificationUrl;
    if (certificate.qrCode) basePayload.qrCode = certificate.qrCode;

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

    // Check if trainer is active first
    if (!trainer.isActive) {
      return res.status(200).json({
        success: true,
        verified: false,
        message: 'Trainer account is not active',
        data: {
          trainerId: trainer.trainerId,
          fullName: trainer.fullName,
          verificationStatus: getVerificationStatus(trainer.applicationStatus),
          isVerified: trainer.isVerified,
          isActive: trainer.isActive
        }
      });
    }

    // Check if trainer is approved (primary verification condition)
    if (trainer.applicationStatus !== 'approved') {
      return res.status(200).json({
        success: true,
        verified: false,
        message: 'Trainer is not verified',
        data: {
          trainerId: trainer.trainerId,
          fullName: trainer.fullName,
          verificationStatus: getVerificationStatus(trainer.applicationStatus),
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
        verificationStatus: getVerificationStatus(trainer.applicationStatus),
        title: trainer.title,
        bio: trainer.bio,
        expertise: trainer.expertise,
        experience: trainer.experience,
        qualifications: trainer.qualifications,
        certifications: trainer.certifications,
        languages: trainer.languages,
        verificationDate: trainer.verificationDate
        // Excluded admin-only fields: rating, coursesCount, studentsCount, accreditations, commissionRate
      }
    });
  } catch (error) {
    next(error);
  }
};
