const Certificate = require('../models/Certificate');
const Trainer = require('../models/Trainer');

// @desc    Verify certificate
// @route   GET /api/verify/certificate/:certificateId
// @access  Public
exports.verifyCertificate = async (req, res, next) => {
  try {
    const certificate = await Certificate.findOne({
      certificateId: req.params.certificateId
    })
      .populate('user', 'name email')
      .populate('course', 'title');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found',
        verified: false
      });
    }

    if (!certificate.isValid || certificate.isRevoked) {
      return res.status(200).json({
        success: true,
        verified: false,
        message: certificate.isRevoked 
          ? `Certificate has been revoked. Reason: ${certificate.revokedReason}`
          : 'Certificate is not valid',
        data: {
          certificateId: certificate.certificateId,
          isRevoked: certificate.isRevoked,
          revokedDate: certificate.revokedDate
        }
      });
    }

    res.status(200).json({
      success: true,
      verified: true,
      message: 'Certificate is valid',
      data: {
        certificateId: certificate.certificateId,
        userName: certificate.userName,
        courseName: certificate.courseName,
        completionDate: certificate.completionDate,
        issueDate: certificate.issueDate,
        grade: certificate.grade,
        score: certificate.score,
        qrCode: certificate.qrCode
      }
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

    res.status(200).json({
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
