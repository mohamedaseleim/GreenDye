const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getCertificates,
  getCertificate,
  generateCertificate,
  revokeCertificate,
  downloadCertificate
} = require('../controllers/certificateController');

// Protect all routes
router.use(protect);

// Get all certificates for current user
router.get('/', getCertificates);

// Get single certificate
router.get('/:id', getCertificate);

// Generate a new certificate (admin or trainer only)
router.post('/generate', authorize('admin', 'trainer'), generateCertificate);

// Revoke a certificate (admin only)
router.put('/:id/revoke', authorize('admin'), revokeCertificate);

// Download certificate as PDF (user or admin)
router.get('/:id/download', downloadCertificate);

module.exports = router;
