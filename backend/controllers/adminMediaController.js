const Media = require('../models/Media');
const AuditTrail = require('../models/AuditTrail');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

// Configure multer storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const category = req.body.category || 'general';
    const uploadPath = path.join(__dirname, '..', 'uploads', category);
    
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedImageTypes = /jpeg|jpg|png|gif|webp|svg/;
  const allowedVideoTypes = /mp4|webm|ogg|avi|mov/;
  const allowedDocTypes = /pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv/;
  
  const extname = path.extname(file.originalname).toLowerCase().replace('.', '');
  
  // Check if file type is allowed
  if (
    allowedImageTypes.test(extname) ||
    allowedVideoTypes.test(extname) ||
    allowedDocTypes.test(extname)
  ) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, videos, and documents are allowed.'));
  }
};

// Multer upload configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: fileFilter
});

// Helper to determine media type
const getMediaType = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('application/') || mimetype.startsWith('text/')) return 'document';
  return 'other';
};

// @desc    Upload media file(s)
// @route   POST /api/admin/cms/media/upload
// @access  Private/Admin
exports.uploadMedia = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const uploadedMedia = [];

    for (const file of req.files) {
      const category = req.body.category || 'general';
      const mediaType = getMediaType(file.mimetype);
      
      const mediaData = {
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: `/uploads/${category}/${file.filename}`,
        url: `${req.protocol}://${req.get('host')}/uploads/${category}/${file.filename}`,
        type: mediaType,
        category: category,
        uploadedBy: req.user.id,
        metadata: {
          format: path.extname(file.originalname).toLowerCase().replace('.', '')
        }
      };

      const media = await Media.create(mediaData);
      uploadedMedia.push(media);

      // Audit log
      await AuditTrail.create({
        user: req.user.id,
        action: 'upload',
        resourceType: 'Media',
        resourceId: media._id,
        details: `Uploaded media: ${media.originalName}`,
        ipAddress: req.ip
      });
    }

    res.status(201).json({
      success: true,
      message: 'Media uploaded successfully',
      count: uploadedMedia.length,
      data: uploadedMedia
    });
  } catch (error) {
    next(error);
  }
};

// Export multer upload middleware
exports.upload = upload;
