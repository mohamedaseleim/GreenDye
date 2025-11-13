import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Typography,
  IconButton,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { toast } from 'react-toastify';
import adminService from '../services/adminService';

const SectionManagement = ({ courseId, open, onClose }) => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [formData, setFormData] = useState({
    title: { en: '', ar: '', fr: '' },
    description: { en: '', ar: '', fr: '' },
    order: 0,
  });

  useEffect(() => {
    if (open && courseId) {
      fetchSections();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, courseId]);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const response = await adminService.getSections(courseId);
      setSections(response.data || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast.error('Failed to fetch sections');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (section = null) => {
    if (section) {
      setSelectedSection(section);
      setFormData({
        title: section.title || { en: '', ar: '', fr: '' },
        description: section.description || { en: '', ar: '', fr: '' },
        order: section.order || 0,
      });
    } else {
      setSelectedSection(null);
      setFormData({
        title: { en: '', ar: '', fr: '' },
        description: { en: '', ar: '', fr: '' },
        order: sections.length,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedSection(null);
  };

  const handleInputChange = (field, value, lang = null) => {
    if (lang) {
      setFormData((prev) => ({
        ...prev,
        [field]: {
          ...prev[field],
          [lang]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSaveSection = async () => {
    try {
      if (!formData.title.en) {
        toast.error('Please provide section title in English');
        return;
      }

      const sectionData = {
        ...formData,
        course: courseId,
      };

      if (selectedSection) {
        await adminService.updateSection(selectedSection._id, sectionData);
        toast.success('Section updated successfully');
      } else {
        await adminService.createSection(sectionData);
        toast.success('Section created successfully');
      }

      fetchSections();
      handleCloseDialog();
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
      await adminService.deleteSection(sectionId);
      toast.success('Section deleted successfully');
      fetchSections();
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error('Failed to delete section');
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) {
      return;
    }

    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order
    const updatedSections = items.map((item, index) => ({
      ...item,
      order: index,
    }));

    setSections(updatedSections);

    try {
      const orderedIds = updatedSections.map((s) => s._id);
      await adminService.reorderSections(orderedIds);
      toast.success('Sections reordered successfully');
    } catch (error) {
      console.error('Error reordering sections:', error);
      toast.error('Failed to reorder sections');
      fetchSections(); // Revert on error
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Manage Course Sections</Typography>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={() => handleOpenDialog()}
          >
            Add Section
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : sections.length === 0 ? (
          <Alert severity="info">
            No sections found. Create your first section to organize lessons.
          </Alert>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="sections">
              {(provided) => (
                <List {...provided.droppableProps} ref={provided.innerRef}>
                  {sections.map((section, index) => (
                    <Draggable
                      key={section._id}
                      draggableId={section._id}
                      index={index}
                    >
                      {(provided) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          sx={{ mb: 2 }}
                        >
                          <CardContent>
                            <Box display="flex" alignItems="center">
                              <Box {...provided.dragHandleProps} sx={{ mr: 2 }}>
                                <DragIcon color="action" />
                              </Box>
                              <Box flex={1}>
                                <Typography variant="h6">
                                  {section.title?.en || 'Untitled Section'}
                                </Typography>
                                {section.description?.en && (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {section.description.en}
                                  </Typography>
                                )}
                                <Chip
                                  label={`${section.lessons?.length || 0} Lessons`}
                                  size="small"
                                  sx={{ mt: 1 }}
                                />
                              </Box>
                              <Box>
                                <IconButton
                                  onClick={() => handleOpenDialog(section)}
                                  color="primary"
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton
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
                </List>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      {/* Section Editor Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedSection ? 'Edit Section' : 'Create New Section'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Title (English) *
              </Typography>
              <TextField
                fullWidth
                value={formData.title.en}
                onChange={(e) => handleInputChange('title', e.target.value, 'en')}
                placeholder="Enter section title"
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Title (Arabic)
              </Typography>
              <TextField
                fullWidth
                value={formData.title.ar}
                onChange={(e) => handleInputChange('title', e.target.value, 'ar')}
                placeholder="أدخل عنوان القسم"
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Title (French)
              </Typography>
              <TextField
                fullWidth
                value={formData.title.fr}
                onChange={(e) => handleInputChange('title', e.target.value, 'fr')}
                placeholder="Entrez le titre de la section"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Description (English)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={formData.description.en}
                onChange={(e) =>
                  handleInputChange('description', e.target.value, 'en')
                }
                placeholder="Enter section description"
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Description (Arabic)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={formData.description.ar}
                onChange={(e) =>
                  handleInputChange('description', e.target.value, 'ar')
                }
                placeholder="أدخل وصف القسم"
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Description (French)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={formData.description.fr}
                onChange={(e) =>
                  handleInputChange('description', e.target.value, 'fr')
                }
                placeholder="Entrez la description de la section"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveSection} variant="contained" color="primary">
            {selectedSection ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default SectionManagement;
