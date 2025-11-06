const Page = require('../models/Page');
const mongoSanitize = require('mongo-sanitize');

// @desc    Get public page by slug
// @route   GET /api/pages/:slug
// @access  Public
exports.getPublicPage = async (req, res, next) => {
  try {
    const slug = mongoSanitize(req.params.slug);
    
    const page = await Page.findOne({ 
      slug: slug, 
      status: 'published',
      isActive: true
    }).select('-__v -author -lastEditedBy -version -createdAt -updatedAt');

    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    res.status(200).json({
      success: true,
      data: page
    });
  } catch (error) {
    next(error);
  }
};
