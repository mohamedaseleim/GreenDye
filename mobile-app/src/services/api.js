import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api'; // Change to your server URL

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Token expired, clear storage and redirect to login
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
    }
    return Promise.reject(error);
  },
);

// Auth API
export const authAPI = {
  login: (email, password) => 
    api.post('/auth/login', {email, password}),
  
  register: (name, email, password, language = 'en') =>
    api.post('/auth/register', {name, email, password, language}),
  
  getMe: () => 
    api.get('/auth/me'),
};

// Courses API
export const coursesAPI = {
  getAll: (params = {}) => 
    api.get('/courses', {params}),
  
  getById: id => 
    api.get(`/courses/${id}`),
  
  search: (query, filters = {}) =>
    api.get('/search', {params: {q: query, ...filters}}),
};

// Enrollments API
export const enrollmentsAPI = {
  getMyCourses: () => 
    api.get('/enrollments/my-courses'),
  
  enroll: courseId =>
    api.post('/enrollments/enroll', {courseId}),
  
  updateProgress: (enrollmentId, progress) =>
    api.put(`/enrollments/${enrollmentId}/progress`, {progress}),
};

// Recommendations API
export const recommendationsAPI = {
  get: (limit = 10) =>
    api.get('/recommendations', {params: {limit}}),
  
  getTrending: (limit = 10) =>
    api.get('/recommendations/trending', {params: {limit}}),
  
  dismiss: id =>
    api.put(`/recommendations/${id}/dismiss`),
};

// Gamification API
export const gamificationAPI = {
  getLeaderboard: (period = 'all_time') =>
    api.get('/gamification/leaderboard', {params: {period}}),
  
  getStats: () =>
    api.get('/gamification/stats'),
  
  getAchievements: () =>
    api.get('/gamification/achievements'),
  
  checkBadges: () =>
    api.post('/gamification/check-badges'),
};

// Analytics API
export const analyticsAPI = {
  trackEvent: (eventType, metadata = {}) =>
    api.post('/analytics/track', {eventType, metadata}),
};

export default api;
