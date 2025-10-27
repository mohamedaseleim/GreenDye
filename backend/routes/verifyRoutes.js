const express = require('express');
const router = express.Router();
const {
  verifyCertificate,
  verifyTrainer
} = require('../controllers/verifyController');

// Public verification routes
// Certificate verification (supports optional ?t=token)
router.get('/certificate/:certificateId', verifyCertificate);

// Trainer verification
router.get('/trainer/:trainerId', verifyTrainer);

module.exports = router;
