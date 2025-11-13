import axios from 'axios';

const API_URL = '/api/sections';

// Get all sections for a course
const getCourseSections = async (courseId) => {
  const response = await axios.get(`${API_URL}/course/${courseId}`);
  return response.data;
};

// Get single section
const getSection = async (sectionId) => {
  const response = await axios.get(`${API_URL}/${sectionId}`);
  return response.data;
};

// Create new section
const createSection = async (sectionData) => {
  const response = await axios.post(API_URL, sectionData);
  return response.data;
};

// Update section
const updateSection = async (sectionId, sectionData) => {
  const response = await axios.put(`${API_URL}/${sectionId}`, sectionData);
  return response.data;
};

// Delete section
const deleteSection = async (sectionId) => {
  const response = await axios.delete(`${API_URL}/${sectionId}`);
  return response.data;
};

// Reorder sections in a course
const reorderSections = async (courseId, sectionOrders) => {
  const response = await axios.put(`${API_URL}/course/${courseId}/reorder`, {
    sectionOrders
  });
  return response.data;
};

// Add lesson to section
const addLessonToSection = async (sectionId, lessonId) => {
  const response = await axios.put(`${API_URL}/${sectionId}/lessons/${lessonId}`);
  return response.data;
};

// Remove lesson from section
const removeLessonFromSection = async (sectionId, lessonId) => {
  const response = await axios.delete(`${API_URL}/${sectionId}/lessons/${lessonId}`);
  return response.data;
};

// Reorder lessons within a section
const reorderLessons = async (sectionId, lessonOrders) => {
  const response = await axios.put(`${API_URL}/${sectionId}/lessons/reorder`, {
    lessonOrders
  });
  return response.data;
};

const sectionService = {
  getCourseSections,
  getSection,
  createSection,
  updateSection,
  deleteSection,
  reorderSections,
  addLessonToSection,
  removeLessonFromSection,
  reorderLessons
};

export default sectionService;
