import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Alert,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import adminService from '../services/adminService';

export default function SectionManager({ open, onClose, courseId, sections, onUpdate }) {
  const [localSections, setLocalSections] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [editingSection, setEditingSection] = useState(null);
  const [formData, setFormData] = useState({
    title: { en: '', ar: '', fr: '' },
    description: { en: '', ar: '', fr: '' },
    order: 0,
    lessons: [],
  });
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && courseId) {
      loadData();
    }
  }, [open, courseId]);

  useEffect(() => {
    if (sections) {
      setLocalSections(sections);
    }
  }, [sections]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sectionsRes, lessonsRes] = await Promise.all([
        adminService.getSections(courseId),
        adminService.getLessons(courseId),
      ]);
      setLocalSections(sectionsRes.data || []);
      setLessons(lessonsRes.data || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to load data');
      setLoading(false);
    }
  };

  const handleCreateSection = async () => {
    try {
      setError('');
      const sectionData = {
        ...formData,
        course: courseId,
        order: localSections.length,
      };
      await adminService.createSection(sectionData);
      await loadData();
      onUpdate && onUpdate();
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create section');
    }
  };

  const handleUpdateSection = async () => {
    try {
      setError('');
      await adminService.updateSection(editingSection._id, formData);
      await loadData();
      onUpdate && onUpdate();
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update section');
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm('Are you sure you want to delete this section?')) return;
    try {
      setError('');
      await adminService.deleteSection(sectionId);
      await loadData();
      onUpdate && onUpdate();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete section');
    }
  };

  const handleAddLessonToSection = async (sectionId) => {
    if (!selectedLessonId) return;
    try {
      setError('');
      await adminService.addLessonToSection(sectionId, selectedLessonId);
      await loadData();
      onUpdate && onUpdate();
      setSelectedLessonId('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add lesson to section');
    }
  };

  const handleRemoveLessonFromSection = async (sectionId, lessonId) => {
    try {
      setError('');
      await adminService.removeLessonFromSection(sectionId, lessonId);
      await loadData();
      onUpdate && onUpdate();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove lesson from section');
    }
  };

  const handleEditSection = (section) => {
    setEditingSection(section);
    setFormData({
      title: section.title || { en: '', ar: '', fr: '' },
      description: section.description || { en: '', ar: '', fr: '' },
      order: section.order || 0,
      lessons: section.lessons || [],
    });
  };

  const resetForm = () => {
    setEditingSection(null);
    setFormData({
      title: { en: '', ar: '', fr: '' },
      description: { en: '', ar: '', fr: '' },
      order: 0,
      lessons: [],
    });
  };

  const handleInputChange = (field, value, language = null) => {
    if (language) {
      setFormData((prev) => ({
        ...prev,
        [field]: {
          ...prev[field],
          [language]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const getLessonTitle = (lessonId) => {
    const lesson = lessons.find(l => l._id === lessonId);
    return lesson ? (lesson.title?.en || 'Untitled') : 'Unknown';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Manage Course Sections</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 3 }}>
          {/* Section Form */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              {editingSection ? 'Edit Section' : 'Create New Section'}
            </Typography>

            <TextField
              fullWidth
              label="Section Title (English)"
              value={formData.title.en}
              onChange={(e) => handleInputChange('title', e.target.value, 'en')}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Section Title (Arabic)"
              value={formData.title.ar}
              onChange={(e) => handleInputChange('title', e.target.value, 'ar')}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Section Title (French)"
              value={formData.title.fr}
              onChange={(e) => handleInputChange('title', e.target.value, 'fr')}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Description (English)"
              value={formData.description.en}
              onChange={(e) => handleInputChange('description', e.target.value, 'en')}
              margin="normal"
              multiline
              rows={3}
            />

            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              {editingSection ? (
                <>
                  <Button
                    variant="contained"
                    onClick={handleUpdateSection}
                    disabled={loading}
                  >
                    Update Section
                  </Button>
                  <Button variant="outlined" onClick={resetForm}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleCreateSection}
                  disabled={loading}
                  startIcon={<AddIcon />}
                >
                  Create Section
                </Button>
              )}
            </Box>
          </Box>

          {/* Sections List */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              Course Sections ({localSections.length})
            </Typography>

            {localSections.length === 0 ? (
              <Alert severity="info">
                No sections yet. Create your first section to organize lessons.
              </Alert>
            ) : (
              <List>
                {localSections.map((section, index) => (
                  <Paper key={section._id} sx={{ mb: 2, p: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="start">
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {index + 1}. {section.title?.en || 'Untitled Section'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {section.description?.en || 'No description'}
                        </Typography>
                        <Chip
                          label={`${section.lessons?.length || 0} lessons`}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </Box>
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleEditSection(section)}
                        >
                          <AddIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteSection(section._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Lessons in Section */}
                    {section.lessons && section.lessons.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Divider sx={{ mb: 1 }} />
                        <Typography variant="caption" color="text.secondary">
                          Lessons in this section:
                        </Typography>
                        <List dense>
                          {section.lessons.map((lessonId) => (
                            <ListItem key={lessonId}>
                              <ListItemText
                                primary={getLessonTitle(lessonId)}
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                              <ListItemSecondaryAction>
                                <IconButton
                                  edge="end"
                                  size="small"
                                  onClick={() =>
                                    handleRemoveLessonFromSection(section._id, lessonId)
                                  }
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </ListItemSecondaryAction>
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}

                    {/* Add Lesson to Section */}
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Add Lesson</InputLabel>
                        <Select
                          value={selectedLessonId}
                          onChange={(e) => setSelectedLessonId(e.target.value)}
                          label="Add Lesson"
                        >
                          {lessons
                            .filter(
                              (l) => !section.lessons?.includes(l._id)
                            )
                            .map((lesson) => (
                              <MenuItem key={lesson._id} value={lesson._id}>
                                {lesson.title?.en || 'Untitled'}
                              </MenuItem>
                            ))}
                        </Select>
                      </FormControl>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleAddLessonToSection(section._id)}
                        disabled={!selectedLessonId}
                      >
                        Add
                      </Button>
                    </Box>
                  </Paper>
                ))}
              </List>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
