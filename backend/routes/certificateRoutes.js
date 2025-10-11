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

router.use(protect);

router.route('/')
  .get(getCertificates);

router.route('/:id')
  .get(getCertificate);

router.post('/generate', authorize('admin', 'trainer'), generateCertificate);
router.put('/:id/revoke', authorize('admin'), revokeCertificate);
router.get('/:id/download', downloadCertificate);

module.exports = router;
