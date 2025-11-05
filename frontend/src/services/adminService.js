import axios from 'axios';

const API_URL = '/api/admin';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// ========== DASHBOARD ==========
const getDashboardStats = async () => {
  const response = await axios.get(`${API_URL}/cms/stats`, getAuthHeader());
  return response.data;
};

// ========== CERTIFICATE MANAGEMENT ==========
const getAllCertificates = async (params = {}) => {
  const response = await axios.get(`${API_URL}/certificates`, {
    ...getAuthHeader(),
    params,
  });
  return response.data;
};

const createCertificate = async (data) => {
  const response = await axios.post(`${API_URL}/certificates`, data, getAuthHeader());
  return response.data;
};

const updateCertificate = async (id, data) => {
  const response = await axios.put(`${API_URL}/certificates/${id}`, data, getAuthHeader());
  return response.data;
};

const deleteCertificate = async (id) => {
  const response = await axios.delete(`${API_URL}/certificates/${id}`, getAuthHeader());
  return response.data;
};

const regenerateCertificate = async (id) => {
  const response = await axios.post(`${API_URL}/certificates/${id}/regenerate`, {}, getAuthHeader());
  return response.data;
};

const bulkUploadCertificates = async (certificates) => {
  const response = await axios.post(`${API_URL}/certificates/bulk`, { certificates }, getAuthHeader());
  return response.data;
};

const revokeCertificate = async (id, reason) => {
  const response = await axios.put(`${API_URL}/certificates/${id}/revoke`, { reason }, getAuthHeader());
  return response.data;
};

const restoreCertificate = async (id) => {
  const response = await axios.put(`${API_URL}/certificates/${id}/restore`, {}, getAuthHeader());
  return response.data;
};

const getCertificateHistory = async (id) => {
  const response = await axios.get(`${API_URL}/certificates/${id}/history`, getAuthHeader());
  return response.data;
};

const exportCertificates = async (params = {}) => {
  const response = await axios.get(`${API_URL}/certificates/export`, {
    ...getAuthHeader(),
    params,
  });
  return response.data;
};

// ========== PAGE MANAGEMENT ==========
const getAllPages = async (params = {}) => {
  const response = await axios.get(`${API_URL}/cms/pages`, {
    ...getAuthHeader(),
    params,
  });
  return response.data;
};

const getPage = async (id) => {
  const response = await axios.get(`${API_URL}/cms/pages/${id}`, getAuthHeader());
  return response.data;
};

const createPage = async (data) => {
  const response = await axios.post(`${API_URL}/cms/pages`, data, getAuthHeader());
  return response.data;
};

const updatePage = async (id, data) => {
  const response = await axios.put(`${API_URL}/cms/pages/${id}`, data, getAuthHeader());
  return response.data;
};

const deletePage = async (id) => {
  const response = await axios.delete(`${API_URL}/cms/pages/${id}`, getAuthHeader());
  return response.data;
};

const publishPage = async (id) => {
  const response = await axios.put(`${API_URL}/cms/pages/${id}/publish`, {}, getAuthHeader());
  return response.data;
};

// ========== MEDIA MANAGEMENT ==========
const getAllMedia = async (params = {}) => {
  const response = await axios.get(`${API_URL}/cms/media`, {
    ...getAuthHeader(),
    params,
  });
  return response.data;
};

const getMedia = async (id) => {
  const response = await axios.get(`${API_URL}/cms/media/${id}`, getAuthHeader());
  return response.data;
};

const uploadMedia = async (formData) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_URL}/cms/media/upload`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

const updateMedia = async (id, data) => {
  const response = await axios.put(`${API_URL}/cms/media/${id}`, data, getAuthHeader());
  return response.data;
};

const deleteMedia = async (id) => {
  const response = await axios.delete(`${API_URL}/cms/media/${id}`, getAuthHeader());
  return response.data;
};

// ========== ANNOUNCEMENT MANAGEMENT ==========
const getAllAnnouncements = async (params = {}) => {
  const response = await axios.get(`${API_URL}/cms/announcements`, {
    ...getAuthHeader(),
    params,
  });
  return response.data;
};

const createAnnouncement = async (data) => {
  const response = await axios.post(`${API_URL}/cms/announcements`, data, getAuthHeader());
  return response.data;
};

const updateAnnouncement = async (id, data) => {
  const response = await axios.put(`${API_URL}/cms/announcements/${id}`, data, getAuthHeader());
  return response.data;
};

const deleteAnnouncement = async (id) => {
  const response = await axios.delete(`${API_URL}/cms/announcements/${id}`, getAuthHeader());
  return response.data;
};

// ========== COURSE MANAGEMENT ==========
const getAdminCourses = async (params = {}) => {
  const response = await axios.get(`${API_URL}/courses`, {
    ...getAuthHeader(),
    params,
  });
  return response.data;
};

const getAdminCourse = async (id) => {
  const response = await axios.get(`${API_URL}/courses/${id}`, getAuthHeader());
  return response.data;
};

const createAdminCourse = async (data) => {
  const response = await axios.post(`${API_URL}/courses`, data, getAuthHeader());
  return response.data;
};

const updateAdminCourse = async (id, data) => {
  const response = await axios.put(`${API_URL}/courses/${id}`, data, getAuthHeader());
  return response.data;
};

const deleteAdminCourse = async (id) => {
  const response = await axios.delete(`${API_URL}/courses/${id}`, getAuthHeader());
  return response.data;
};

const getPendingCourses = async (params = {}) => {
  const response = await axios.get(`${API_URL}/courses/pending`, {
    ...getAuthHeader(),
    params,
  });
  return response.data;
};

const approveCourse = async (id) => {
  const response = await axios.put(`${API_URL}/courses/${id}/approve`, {}, getAuthHeader());
  return response.data;
};

const rejectCourse = async (id) => {
  const response = await axios.put(`${API_URL}/courses/${id}/reject`, {}, getAuthHeader());
  return response.data;
};

const setCoursePricing = async (id, pricingData) => {
  const response = await axios.put(`${API_URL}/courses/${id}/pricing`, pricingData, getAuthHeader());
  return response.data;
};

const getCourseAnalytics = async (id) => {
  const response = await axios.get(`${API_URL}/courses/${id}/analytics`, getAuthHeader());
  return response.data;
};

const getCourseCategories = async () => {
  const response = await axios.get(`${API_URL}/courses/categories`, getAuthHeader());
  return response.data;
};

const updateCourseCategory = async (id, category) => {
  const response = await axios.put(`${API_URL}/courses/${id}/category`, { category }, getAuthHeader());
  return response.data;
};

const getCourseTags = async () => {
  const response = await axios.get(`${API_URL}/courses/tags`, getAuthHeader());
  return response.data;
};

const updateCourseTags = async (id, tags) => {
  const response = await axios.put(`${API_URL}/courses/${id}/tags`, { tags }, getAuthHeader());
  return response.data;
};

const bulkUpdateCourses = async (courseIds, updates) => {
  const response = await axios.put(`${API_URL}/courses/bulk-update`, { courseIds, updates }, getAuthHeader());
  return response.data;
};

const getCourseStatistics = async () => {
  const response = await axios.get(`${API_URL}/courses/statistics`, getAuthHeader());
  return response.data;
};

// ========== MODERATION ==========
const getPendingForumPosts = async (params = {}) => {
  const response = await axios.get(`${API_URL}/cms/moderation/forums`, {
    ...getAuthHeader(),
    params,
  });
  return response.data;
};

const moderateForumPost = async (id, status, reason = '') => {
  const response = await axios.put(`${API_URL}/cms/moderation/forums/${id}`, { status, reason }, getAuthHeader());
  return response.data;
};

// ========== TRAINER MANAGEMENT ==========
const getAllTrainers = async (params = {}) => {
  const response = await axios.get(`${API_URL}/trainers`, {
    ...getAuthHeader(),
    params,
  });
  return response.data;
};

const getTrainerById = async (id) => {
  const response = await axios.get(`${API_URL}/trainers/${id}`, getAuthHeader());
  return response.data;
};

const createTrainer = async (data) => {
  const response = await axios.post(`${API_URL}/trainers`, data, getAuthHeader());
  return response.data;
};

const updateTrainer = async (id, data) => {
  const response = await axios.put(`${API_URL}/trainers/${id}`, data, getAuthHeader());
  return response.data;
};

const deleteTrainer = async (id) => {
  const response = await axios.delete(`${API_URL}/trainers/${id}`, getAuthHeader());
  return response.data;
};

const approveTrainer = async (id, notes = '') => {
  const response = await axios.put(`${API_URL}/trainers/${id}/approve`, { notes }, getAuthHeader());
  return response.data;
};

const rejectTrainer = async (id, notes = '') => {
  const response = await axios.put(`${API_URL}/trainers/${id}/reject`, { notes }, getAuthHeader());
  return response.data;
};

const getPendingApplications = async (params = {}) => {
  const response = await axios.get(`${API_URL}/trainers/applications/pending`, {
    ...getAuthHeader(),
    params,
  });
  return response.data;
};

const updateVerificationStatus = async (id, isVerified, notes = '') => {
  const response = await axios.put(`${API_URL}/trainers/${id}/verification`, { isVerified, notes }, getAuthHeader());
  return response.data;
};

const getTrainerMetrics = async (id) => {
  const response = await axios.get(`${API_URL}/trainers/${id}/metrics`, getAuthHeader());
  return response.data;
};

const getTrainerPayouts = async (id, params = {}) => {
  const response = await axios.get(`${API_URL}/trainers/${id}/payouts`, {
    ...getAuthHeader(),
    params,
  });
  return response.data;
};

const createPayout = async (id, data) => {
  const response = await axios.post(`${API_URL}/trainers/${id}/payouts`, data, getAuthHeader());
  return response.data;
};

const getAllPayouts = async (params = {}) => {
  const response = await axios.get(`${API_URL}/trainers/payouts`, {
    ...getAuthHeader(),
    params,
  });
  return response.data;
};

const updatePayoutStatus = async (payoutId, data) => {
  const response = await axios.put(`${API_URL}/trainers/payouts/${payoutId}`, data, getAuthHeader());
  return response.data;
};

// ========== USER MANAGEMENT ==========
const USER_API_URL = '/api/users';

const getUsers = async (params = {}) => {
  const response = await axios.get(USER_API_URL, {
    ...getAuthHeader(),
    params,
  });
  return response.data;
};

const getUser = async (id) => {
  const response = await axios.get(`${USER_API_URL}/${id}`, getAuthHeader());
  return response.data;
};

const createUser = async (data) => {
  const response = await axios.post(USER_API_URL, data, getAuthHeader());
  return response.data;
};

const updateUser = async (id, data) => {
  const response = await axios.put(`${USER_API_URL}/${id}`, data, getAuthHeader());
  return response.data;
};

const deleteUser = async (id) => {
  const response = await axios.delete(`${USER_API_URL}/${id}`, getAuthHeader());
  return response.data;
};

const suspendUser = async (id, reason = '') => {
  const response = await axios.put(`${USER_API_URL}/${id}/suspend`, { reason }, getAuthHeader());
  return response.data;
};

const activateUser = async (id) => {
  const response = await axios.put(`${USER_API_URL}/${id}/activate`, {}, getAuthHeader());
  return response.data;
};

const getUserActivity = async (id, params = {}) => {
  const response = await axios.get(`${USER_API_URL}/${id}/activity`, {
    ...getAuthHeader(),
    params,
  });
  return response.data;
};

const resetUserPassword = async (id, newPassword) => {
  const response = await axios.post(`${USER_API_URL}/${id}/reset-password`, { newPassword }, getAuthHeader());
  return response.data;
};

const bulkUpdateUsers = async (userIds, updates) => {
  const response = await axios.post(`${USER_API_URL}/bulk-update`, { userIds, updates }, getAuthHeader());
  return response.data;
};

const bulkDeleteUsers = async (userIds) => {
  const response = await axios.post(`${USER_API_URL}/bulk-delete`, { userIds }, getAuthHeader());
  return response.data;
};

const adminService = {
  // Dashboard
  getDashboardStats,
  
  // Certificates
  getAllCertificates,
  createCertificate,
  updateCertificate,
  deleteCertificate,
  regenerateCertificate,
  bulkUploadCertificates,
  revokeCertificate,
  restoreCertificate,
  getCertificateHistory,
  exportCertificates,
  
  // Pages
  getAllPages,
  getPage,
  createPage,
  updatePage,
  deletePage,
  publishPage,
  
  // Media
  getAllMedia,
  getMedia,
  uploadMedia,
  updateMedia,
  deleteMedia,
  
  // Announcements
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  
  // Courses
  getAdminCourses,
  getAdminCourse,
  createAdminCourse,
  updateAdminCourse,
  deleteAdminCourse,
  getPendingCourses,
  approveCourse,
  rejectCourse,
  setCoursePricing,
  getCourseAnalytics,
  getCourseCategories,
  updateCourseCategory,
  getCourseTags,
  updateCourseTags,
  bulkUpdateCourses,
  getCourseStatistics,
  
  // Moderation
  getPendingForumPosts,
  moderateForumPost,
  
  // Trainers
  getAllTrainers,
  getTrainerById,
  createTrainer,
  updateTrainer,
  deleteTrainer,
  approveTrainer,
  rejectTrainer,
  getPendingApplications,
  updateVerificationStatus,
  getTrainerMetrics,
  getTrainerPayouts,
  createPayout,
  getAllPayouts,
  updatePayoutStatus,

  // User Management
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  suspendUser,
  activateUser,
  getUserActivity,
  resetUserPassword,
  bulkUpdateUsers,
  bulkDeleteUsers,
};

export default adminService;
