import axios from 'axios';

const API_BASE_URL = '/api/analytics';

export const trackEvent = async (eventType, data = {}) => {
  // Only track events if user is authenticated
  const token = localStorage.getItem('token');
  if (!token) {
    return; // Silently skip tracking for unauthenticated users
  }

  try {
    await axios.post(`${API_BASE_URL}/track`, {
      eventType,
      ...data,
    });
  } catch (error) {
    console.error('Error tracking event:', error);
  }
};

export const trackPageView = async (page, userId, courseId, additional = {}) => {
  return trackEvent('page_view', { page, userId, courseId, ...additional });
};

export const trackVideoProgress = async (courseId, lessonId, userId, progressPercentage) => {
  return trackEvent('video_progress', {
    courseId,
    lessonId,
    userId,
    metadata: { progressPercentage },
  });
};

export const trackQuizEvent = async (eventType, courseId, lessonId, userId, metadata = {}) => {
  return trackEvent(eventType, {
    courseId,
    lessonId,
    userId,
    metadata,
  });
};
