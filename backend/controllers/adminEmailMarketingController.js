const EmailCampaign = require('../models/EmailCampaign');
const EmailNewsletter = require('../models/EmailNewsletter');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const ErrorResponse = require('../utils/errorResponse');
const { sendBulkEmails, sendNewsletter, createEmailTemplate } = require('../services/emailService');
const logger = require('../utils/logger');

// @desc    Get all email campaigns
// @route   GET /api/admin/email-marketing/campaigns
// @access  Private/Admin
exports.getAllCampaigns = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  
  const query = {};
  if (status) query.status = status;
  
  const campaigns = await EmailCampaign.find(query)
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));
  
  const total = await EmailCampaign.countDocuments(query);
  
  res.status(200).json({
    success: true,
    count: campaigns.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: campaigns
  });
});

// @desc    Get single campaign
// @route   GET /api/admin/email-marketing/campaigns/:id
// @access  Private/Admin
exports.getCampaign = asyncHandler(async (req, res) => {
  const campaign = await EmailCampaign.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('customRecipients', 'name email');
  
  if (!campaign) {
    throw new ErrorResponse('Campaign not found', 404);
  }
  
  res.status(200).json({
    success: true,
    data: campaign
  });
});

// @desc    Create new campaign
// @route   POST /api/admin/email-marketing/campaigns
// @access  Private/Admin
exports.createCampaign = asyncHandler(async (req, res) => {
  req.body.createdBy = req.user.id;
  
  const campaign = await EmailCampaign.create(req.body);
  
  res.status(201).json({
    success: true,
    data: campaign
  });
});

// @desc    Update campaign
// @route   PUT /api/admin/email-marketing/campaigns/:id
// @access  Private/Admin
exports.updateCampaign = asyncHandler(async (req, res) => {
  let campaign = await EmailCampaign.findById(req.params.id);
  
  if (!campaign) {
    throw new ErrorResponse('Campaign not found', 404);
  }
  
  // Don't allow updating campaigns that are already sent
  if (campaign.status === 'sent') {
    throw new ErrorResponse('Cannot update a sent campaign', 400);
  }
  
  campaign = await EmailCampaign.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  
  res.status(200).json({
    success: true,
    data: campaign
  });
});

// @desc    Delete campaign
// @route   DELETE /api/admin/email-marketing/campaigns/:id
// @access  Private/Admin
exports.deleteCampaign = asyncHandler(async (req, res) => {
  const campaign = await EmailCampaign.findById(req.params.id);
  
  if (!campaign) {
    throw new ErrorResponse('Campaign not found', 404);
  }
  
  // Don't allow deleting campaigns that are being sent
  if (campaign.status === 'sending') {
    throw new ErrorResponse('Cannot delete a campaign that is currently being sent', 400);
  }
  
  await campaign.deleteOne();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Send campaign
// @route   POST /api/admin/email-marketing/campaigns/:id/send
// @access  Private/Admin
exports.sendCampaign = asyncHandler(async (req, res) => {
  const campaign = await EmailCampaign.findById(req.params.id);
  
  if (!campaign) {
    throw new ErrorResponse('Campaign not found', 404);
  }
  
  if (campaign.status === 'sent') {
    throw new ErrorResponse('Campaign has already been sent', 400);
  }
  
  // Update campaign status to sending
  campaign.status = 'sending';
  await campaign.save();
  
  try {
    // Get recipients based on recipientType
    let recipients = [];
    
    if (campaign.recipientType === 'all') {
      recipients = await User.find({ isActive: true }).select('name email');
    } else if (campaign.recipientType === 'custom') {
      recipients = await User.find({
        _id: { $in: campaign.customRecipients },
        isActive: true
      }).select('name email');
    } else {
      // Filter by role (students, trainers, admins)
      recipients = await User.find({
        role: campaign.recipientType === 'students' ? 'student' : campaign.recipientType.slice(0, -1),
        isActive: true
      }).select('name email');
    }
    
    // Prepare email content with template
    const emailContent = createEmailTemplate(campaign.content, {
      title: campaign.subject
    });
    
    // Send bulk emails
    const results = await sendBulkEmails(
      recipients.map(r => ({ name: r.name, email: r.email })),
      campaign.subject,
      emailContent
    );
    
    // Update campaign with results
    campaign.status = results.failed === results.total ? 'failed' : 'sent';
    campaign.sentAt = new Date();
    campaign.totalRecipients = results.total;
    campaign.successfulSends = results.successful;
    campaign.failedSends = results.failed;
    await campaign.save();
    
    res.status(200).json({
      success: true,
      data: {
        campaign,
        results
      }
    });
  } catch (error) {
    campaign.status = 'failed';
    await campaign.save();
    logger.error('Error sending campaign:', error);
    throw new ErrorResponse('Failed to send campaign', 500);
  }
});

// @desc    Get campaign statistics
// @route   GET /api/admin/email-marketing/campaigns/:id/stats
// @access  Private/Admin
exports.getCampaignStats = asyncHandler(async (req, res) => {
  const campaign = await EmailCampaign.findById(req.params.id);
  
  if (!campaign) {
    throw new ErrorResponse('Campaign not found', 404);
  }
  
  const stats = {
    totalRecipients: campaign.totalRecipients,
    successfulSends: campaign.successfulSends,
    failedSends: campaign.failedSends,
    successRate: campaign.totalRecipients > 0 
      ? ((campaign.successfulSends / campaign.totalRecipients) * 100).toFixed(2)
      : 0,
    openRate: campaign.openRate,
    clickRate: campaign.clickRate,
    status: campaign.status,
    sentAt: campaign.sentAt
  };
  
  res.status(200).json({
    success: true,
    data: stats
  });
});

// @desc    Get all newsletters
// @route   GET /api/admin/email-marketing/newsletters
// @access  Private/Admin
exports.getAllNewsletters = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  
  const query = {};
  if (status) query.status = status;
  
  const newsletters = await EmailNewsletter.find(query)
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));
  
  const total = await EmailNewsletter.countDocuments(query);
  
  res.status(200).json({
    success: true,
    count: newsletters.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: newsletters
  });
});

// @desc    Get single newsletter
// @route   GET /api/admin/email-marketing/newsletters/:id
// @access  Private/Admin
exports.getNewsletter = asyncHandler(async (req, res) => {
  const newsletter = await EmailNewsletter.findById(req.params.id)
    .populate('createdBy', 'name email');
  
  if (!newsletter) {
    throw new ErrorResponse('Newsletter not found', 404);
  }
  
  res.status(200).json({
    success: true,
    data: newsletter
  });
});

// @desc    Create newsletter
// @route   POST /api/admin/email-marketing/newsletters
// @access  Private/Admin
exports.createNewsletter = asyncHandler(async (req, res) => {
  req.body.createdBy = req.user.id;
  
  const newsletter = await EmailNewsletter.create(req.body);
  
  res.status(201).json({
    success: true,
    data: newsletter
  });
});

// @desc    Update newsletter
// @route   PUT /api/admin/email-marketing/newsletters/:id
// @access  Private/Admin
exports.updateNewsletter = asyncHandler(async (req, res) => {
  let newsletter = await EmailNewsletter.findById(req.params.id);
  
  if (!newsletter) {
    throw new ErrorResponse('Newsletter not found', 404);
  }
  
  newsletter = await EmailNewsletter.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  
  res.status(200).json({
    success: true,
    data: newsletter
  });
});

// @desc    Delete newsletter
// @route   DELETE /api/admin/email-marketing/newsletters/:id
// @access  Private/Admin
exports.deleteNewsletter = asyncHandler(async (req, res) => {
  const newsletter = await EmailNewsletter.findById(req.params.id);
  
  if (!newsletter) {
    throw new ErrorResponse('Newsletter not found', 404);
  }
  
  await newsletter.deleteOne();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Publish newsletter
// @route   POST /api/admin/email-marketing/newsletters/:id/publish
// @access  Private/Admin
exports.publishNewsletter = asyncHandler(async (req, res) => {
  const newsletter = await EmailNewsletter.findById(req.params.id);
  
  if (!newsletter) {
    throw new ErrorResponse('Newsletter not found', 404);
  }
  
  if (newsletter.status === 'published') {
    throw new ErrorResponse('Newsletter has already been published', 400);
  }
  
  try {
    // Get all active users as subscribers
    const subscribers = await User.find({ isActive: true }).select('name email');
    
    // Prepare email content with template
    const emailContent = createEmailTemplate(newsletter.content, {
      title: newsletter.title
    });
    
    // Send newsletter
    const results = await sendNewsletter(
      subscribers.map(s => ({ name: s.name, email: s.email })),
      { subject: newsletter.subject, content: emailContent }
    );
    
    // Update newsletter with results
    newsletter.status = 'published';
    newsletter.publishedAt = new Date();
    newsletter.totalSubscribers = results.total;
    newsletter.sentCount = results.successful;
    await newsletter.save();
    
    res.status(200).json({
      success: true,
      data: {
        newsletter,
        results
      }
    });
  } catch (error) {
    logger.error('Error publishing newsletter:', error);
    throw new ErrorResponse('Failed to publish newsletter', 500);
  }
});

// @desc    Get email marketing dashboard stats
// @route   GET /api/admin/email-marketing/stats
// @access  Private/Admin
exports.getEmailMarketingStats = asyncHandler(async (req, res) => {
  const totalCampaigns = await EmailCampaign.countDocuments();
  const sentCampaigns = await EmailCampaign.countDocuments({ status: 'sent' });
  const draftCampaigns = await EmailCampaign.countDocuments({ status: 'draft' });
  const failedCampaigns = await EmailCampaign.countDocuments({ status: 'failed' });
  
  const totalNewsletters = await EmailNewsletter.countDocuments();
  const publishedNewsletters = await EmailNewsletter.countDocuments({ status: 'published' });
  const draftNewsletters = await EmailNewsletter.countDocuments({ status: 'draft' });
  
  // Get total emails sent
  const campaignStats = await EmailCampaign.aggregate([
    { $match: { status: 'sent' } },
    {
      $group: {
        _id: null,
        totalSent: { $sum: '$successfulSends' },
        totalFailed: { $sum: '$failedSends' }
      }
    }
  ]);
  
  const newsletterStats = await EmailNewsletter.aggregate([
    { $match: { status: 'published' } },
    {
      $group: {
        _id: null,
        totalSent: { $sum: '$sentCount' }
      }
    }
  ]);
  
  const stats = {
    campaigns: {
      total: totalCampaigns,
      sent: sentCampaigns,
      draft: draftCampaigns,
      failed: failedCampaigns
    },
    newsletters: {
      total: totalNewsletters,
      published: publishedNewsletters,
      draft: draftNewsletters
    },
    emailsSent: {
      campaigns: campaignStats[0]?.totalSent || 0,
      newsletters: newsletterStats[0]?.totalSent || 0,
      total: (campaignStats[0]?.totalSent || 0) + (newsletterStats[0]?.totalSent || 0)
    },
    failedEmails: campaignStats[0]?.totalFailed || 0
  };
  
  res.status(200).json({
    success: true,
    data: stats
  });
});
