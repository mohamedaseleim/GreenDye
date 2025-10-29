const asyncHandler = require('express-async-handler');
const Progress = require('../models/Progress');
const { logLearningActivity, updateLeaderboardStreak } = require('../services/learningStreakService');

// @desc Update lesson progress
// @route PUT /api/progress
// @access Private
exports.updateLessonProgress = asyncHandler(async (req, res, next) => {
  const { courseId, lessonId, completed, completionTime, quizScore } = req.body;
  if (!courseId || !lessonId) {
    return res.status(400).json({ success: false, error: 'Course and lesson are required' });
  }

  let progress = await Progress.findOne({ user: req.user.id, course: courseId });
  const now = new Date();

  if (!progress) {
    // create new progress
    const lessonEntry = {
      lesson: lessonId,
      completed: completed || false,
      completionTime: completionTime || null,
      quizScores: quizScore ? [{ score: quizScore, date: now }] : []
    };

    progress = await Progress.create({
      user: req.user.id,
      course: courseId,
      lastCompletedLesson: completed ? lessonId : null,
      lessonProgress: [lessonEntry],
      streakCount: completed ? 1 : 0,
      lastAccessed: now
    });
  } else {
    // update existing progress
    // update streak
    if (progress.lastAccessed) {
      const diff = now - progress.lastAccessed;
      // 86400000 ms = 24 hours
      if (diff <= 86400000) {
        progress.streakCount += completed ? 1 : 0;
      } else {
        progress.streakCount = completed ? 1 : 0;
      }
    } else {
      progress.streakCount = completed ? 1 : 0;
    }
    progress.lastAccessed = now;

    // find lesson progress entry
    const lessonEntry = progress.lessonProgress.find(item => item.lesson.toString() === lessonId);
    if (lessonEntry) {
      if (completed !== undefined) lessonEntry.completed = completed;
      if (completionTime) lessonEntry.completionTime = completionTime;
      if (quizScore !== undefined && quizScore !== null) {
        lessonEntry.quizScores.push({ score: quizScore, date: now });
      }
    } else {
      progress.lessonProgress.push({
        lesson: lessonId,
        completed: completed || false,
        completionTime: completionTime || null,
        quizScores: quizScore ? [{ score: quizScore, date: now }] : []
      });
    }

    if (completed) {
      progress.lastCompletedLesson = lessonId;
    }

    await progress.save();
  }

  // Log today’s learning activity and update the user’s streak on the leaderboard.
  // Any errors during logging or streak update should not prevent the primary
  // response from being sent to the client.
  try {
    await logLearningActivity(req.user.id, ['lesson']);
    await updateLeaderboardStreak(req.user.id);
  } catch (err) {
    // Silently ignore errors in auxiliary services to avoid breaking progress updates
    console.error('Error updating learning streak:', err);
  }

  res.status(200).json({ success: true, data: progress });
});

// @desc Get progress for a course
// @route GET /api/progress/:courseId
// @access Private
exports.getProgress = asyncHandler(async (req, res, next) => {
  const courseId = req.params.courseId;
  const progress = await Progress.findOne({ user: req.user.id, course: courseId }).populate({
    path: 'lessonProgress.lesson',
    select: 'title order'
  });

  if (!progress) {
    return res.status(404).json({ success: false, error: 'Progress not found' });
  }

  res.status(200).json({ success: true, data: progress });
});
