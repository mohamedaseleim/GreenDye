const express = require('express');
const router = express.Router();
const {
  verifyCertificate,
  verifyTrainer
} = require('../controllers/verifyController');

router.get('/certificate/:certificateId', verifyCertificate);
router.get('/trainer/:trainerId', verifyTrainer);

module.exports = router;
