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
  
  // Moderation
  getPendingForumPosts,
  moderateForumPost,
};

export default adminService;
