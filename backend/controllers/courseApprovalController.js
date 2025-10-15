const asyncHandler = require('express-async-handler');
const ErrorResponse = require('../utils/errorResponse');
const Course = require('../models/Course');
const User = require('../models/User');

exports.submitCourseForApproval = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    return next(new ErrorResponse('Course not found', 404));
  }
  // Only the instructor, existing authors, or an admin can submit the course for approval
  const isInstructor = course.instructor.toString() === req.user.id;
  const isAuthor = course.authors && course.authors.map(id => id.toString()).includes(req.user.id);
  const isAdmin = req.user.role === 'admin';
  if (!isInstructor && !isAuthor && !isAdmin) {
    return next(new ErrorResponse('Not authorized to submit this course', 403));
  }
  course.approvalStatus = 'pending';
  course.isPublished = false;
  // Increment version when re-submitting
  course.version = (course.version || 1) + 1;
  await course.save();
  res.status(200).json({ success: true, data: course });
});

exports.approveCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    return next(new ErrorResponse('Course not found', 404));
  }
  course.approvalStatus = 'approved';
  course.isPublished = true;
  course.publishDate = Date.now();
  await course.save();
  res.status(200).json({ success: true, data: course });
});

exports.rejectCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    return next(new ErrorResponse('Course not found', 404));
  }
  course.approvalStatus = 'rejected';
  course.isPublished = false;
  await course.save();
  res.status(200).json({ success: true, data: course });
});

exports.addAuthor = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    return next(new ErrorResponse('Course not found', 404));
  }
  // Only the instructor or an admin can add authors
  const isInstructor = course.instructor.toString() === req.user.id;
  const isAdmin = req.user.role === 'admin';
  if (!isInstructor && !isAdmin) {
    return next(new ErrorResponse('Not authorized to add authors', 403));
  }
  const { authorId } = req.body;
  const user = await User.findById(authorId);
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }
  // Initialize authors array if undefined
  if (!course.authors) {
    course.authors = [];
  }
  // Add author only if not already present
  if (!course.authors.map(id => id.toString()).includes(authorId)) {
    course.authors.push(authorId);
  }
  await course.save();
  res.status(200).json({ success: true, data: course });
});
