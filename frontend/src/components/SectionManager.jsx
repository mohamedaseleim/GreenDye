import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Chip,
  Divider,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  PlayLesson as LessonIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { toast } from 'react-toastify';
import sectionService from '../services/sectionService';

const SectionManager = ({ courseId, onUpdate }) => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [formData, setFormData] = useState({
    title: { en: '', ar: '', fr: '' },
    description: { en: '', ar: '', fr: '' }
  });

  const fetchSections = useCallback(async () => {
    try {
      setLoading(true);
      const response = await sectionService.getCourseSections(courseId);
      setSections(response.data || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast.error('Failed to load sections');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) {
      fetchSections();
    }
  }, [courseId, fetchSections]);

  const handleOpenDialog = (section = null) => {
    if (section) {
      setEditingSection(section);
      setFormData({
        title: section.title || { en: '', ar: '', fr: '' },
        description: section.description || { en: '', ar: '', fr: '' }
      });
    } else {
      setEditingSection(null);
      setFormData({
        title: { en: '', ar: '', fr: '' },
        description: { en: '', ar: '', fr: '' }
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSection(null);
    setFormData({
      title: { en: '', ar: '', fr: '' },
      description: { en: '', ar: '', fr: '' }
    });
  };

  const handleSaveSection = async () => {
    try {
      if (!formData.title.en) {
        toast.error('English title is required');
        return;
      }

      if (editingSection) {
        await sectionService.updateSection(editingSection._id, formData);
        toast.success('Section updated successfully');
      } else {
        await sectionService.createSection({
          course: courseId,
          ...formData
        });
        toast.success('Section created successfully');
      }

      handleCloseDialog();
      fetchSections();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error saving section:', error);
      toast.error('Failed to save section');
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm('Are you sure you want to delete this section?')) {
      return;
    }

    try {
      await sectionService.deleteSection(sectionId);
      toast.success('Section deleted successfully');
      fetchSections();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error('Failed to delete section');
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update local state immediately for better UX
    setSections(items);

    try {
      // Prepare section orders
      const sectionOrders = items.map((section, index) => ({
        sectionId: section._id,
        order: index
      }));

      await sectionService.reorderSections(courseId, sectionOrders);
      toast.success('Sections reordered successfully');
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error reordering sections:', error);
      toast.error('Failed to reorder sections');
      // Revert on error
      fetchSections();
    }
  };

  const getTitleText = (titleMap) => {
    if (!titleMap) return 'Untitled';
    return titleMap.en || titleMap.ar || titleMap.fr || 'Untitled';
  };

  const getDescriptionText = (descMap) => {
    if (!descMap) return '';
    return descMap.en || descMap.ar || descMap.fr || '';
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Loading sections...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Course Sections</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Section
        </Button>
      </Box>

      {sections.length === 0 ? (
        <Alert severity="info">
          No sections created yet. Click "Add Section" to organize your course into modules.
        </Alert>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="sections">
            {(provided) => (
              <Box
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {sections.map((section, index) => (
                  <Draggable
                    key={section._id}
                    draggableId={section._id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        sx={{
                          mb: 2,
                          backgroundColor: snapshot.isDragging ? 'action.hover' : 'background.paper'
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                            <Box
                              {...provided.dragHandleProps}
                              sx={{ mr: 2, cursor: 'grab', color: 'text.secondary' }}
                            >
                              <DragIcon />
                            </Box>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="h6" gutterBottom>
                                {getTitleText(section.title)}
                              </Typography>
                              {getDescriptionText(section.description) && (
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                  {getDescriptionText(section.description)}
                                </Typography>
                              )}
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Chip
                                  icon={<LessonIcon />}
                                  label={`${section.lessons?.length || 0} Lessons`}
                                  size="small"
                                  variant="outlined"
                                />
                                <Chip
                                  label={`Order: ${section.order}`}
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                />
                              </Box>
                            </Box>
                            <Box>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDialog(section)}
                                color="primary"
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteSection(section._id)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Box>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingSection ? 'Edit Section' : 'Create New Section'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Section Title
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                required
                label="Title (English)"
                value={formData.title.en}
                onChange={(e) => setFormData({
                  ...formData,
                  title: { ...formData.title, en: e.target.value }
                })}
              />
              <TextField
                fullWidth
                label="Title (Arabic)"
                value={formData.title.ar}
                onChange={(e) => setFormData({
                  ...formData,
                  title: { ...formData.title, ar: e.target.value }
                })}
              />
              <TextField
                fullWidth
                label="Title (French)"
                value={formData.title.fr}
                onChange={(e) => setFormData({
                  ...formData,
                  title: { ...formData.title, fr: e.target.value }
                })}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              Section Description (Optional)
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description (English)"
                value={formData.description.en}
                onChange={(e) => setFormData({
                  ...formData,
                  description: { ...formData.description, en: e.target.value }
                })}
              />
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description (Arabic)"
                value={formData.description.ar}
                onChange={(e) => setFormData({
                  ...formData,
                  description: { ...formData.description, ar: e.target.value }
                })}
              />
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description (French)"
                value={formData.description.fr}
                onChange={(e) => setFormData({
                  ...formData,
                  description: { ...formData.description, fr: e.target.value }
                })}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveSection} variant="contained" color="primary">
            {editingSection ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SectionManager;
