import React, { useState, useEffect, useCallback } from 'react';
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
  ListItemIcon,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  VideoLibrary as VideoIcon,
  Article as ArticleIcon,
  Description as DocumentIcon,
  Quiz as QuizIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { toast } from 'react-toastify';
import adminService from '../services/adminService';

const SectionManagement = ({ courseId, open, onClose }) => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openSectionDialog, setOpenSectionDialog] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [descriptionTab, setDescriptionTab] = useState(0);
  
  const [sectionFormData, setSectionFormData] = useState({
    title: { en: '', ar: '', fr: '' },
    description: { en: '', ar: '', fr: '' },
  });

  // Quill editor configuration
  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      [{ color: [] }, { background: [] }],
      ['clean'],
    ],
  };

  const quillFormats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'link',
    'color',
    'background',
  ];

  const fetchSectionsAndLessons = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch sections
      const sectionsResponse = await adminService.get(`/api/sections/course/${courseId}`);
      setSections(sectionsResponse.data.data || []);
    } catch (error) {
      console.error('Error fetching sections and lessons:', error);
      toast.error('Failed to load sections and lessons');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (open && courseId) {
      fetchSectionsAndLessons();
    }
  }, [open, courseId, fetchSectionsAndLessons]);

  const handleCreateSection = () => {
    setSelectedSection(null);
    setSectionFormData({
      title: { en: '', ar: '', fr: '' },
      description: { en: '', ar: '', fr: '' },
    });
    setOpenSectionDialog(true);
  };

  const handleEditSection = (section) => {
    setSelectedSection(section);
    setSectionFormData({
      title: section.title || { en: '', ar: '', fr: '' },
      description: section.description || { en: '', ar: '', fr: '' },
    });
    setOpenSectionDialog(true);
  };

  const handleSaveSection = async () => {
    try {
      if (selectedSection) {
        // Update existing section
        await adminService.put(`/api/sections/${selectedSection._id}`, sectionFormData);
        toast.success('Section updated successfully');
      } else {
        // Create new section
        await adminService.post('/api/sections', {
          ...sectionFormData,
          course: courseId,
        });
        toast.success('Section created successfully');
      }
      setOpenSectionDialog(false);
      fetchSectionsAndLessons();
    } catch (error) {
      console.error('Error saving section:', error);
      toast.error('Failed to save section');
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm('Are you sure you want to delete this section? Lessons will be unassigned but not deleted.')) {
      return;
    }

    try {
      await adminService.delete(`/api/sections/${sectionId}`);
      toast.success('Section deleted successfully');
      fetchSectionsAndLessons();
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error('Failed to delete section');
    }
  };

  const handleDragEnd = async (result) => {
    const { source, destination, type } = result;

    // Dropped outside the list
    if (!destination) {
      return;
    }

    // No change in position
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    if (type === 'SECTION') {
      // Reordering sections
      const newSections = Array.from(sections);
      const [removed] = newSections.splice(source.index, 1);
      newSections.splice(destination.index, 0, removed);

      setSections(newSections);

      try {
        await adminService.put('/api/sections/reorder', {
          courseId,
          sections: newSections.map((s, index) => ({ _id: s._id, order: index })),
        });
        toast.success('Sections reordered successfully');
      } catch (error) {
        console.error('Error reordering sections:', error);
        toast.error('Failed to reorder sections');
        fetchSectionsAndLessons(); // Revert on error
      }
    } else if (type === 'LESSON') {
      // Reordering lessons within a section
      const sectionId = source.droppableId;
      const section = sections.find(s => s._id === sectionId);
      
      if (!section) return;

      const sectionLessons = section.lessons || [];
      const newLessons = Array.from(sectionLessons);
      const [removed] = newLessons.splice(source.index, 1);
      newLessons.splice(destination.index, 0, removed);

      // Update local state
      const newSections = sections.map(s => {
        if (s._id === sectionId) {
          return { ...s, lessons: newLessons };
        }
        return s;
      });
      setSections(newSections);

      try {
        await adminService.put(`/api/sections/${sectionId}/reorder-lessons`, {
          lessons: newLessons.map((l, index) => ({ _id: l._id, order: index })),
        });
        toast.success('Lessons reordered successfully');
      } catch (error) {
        console.error('Error reordering lessons:', error);
        toast.error('Failed to reorder lessons');
        fetchSectionsAndLessons(); // Revert on error
      }
    }
  };

  const getLessonIcon = (type) => {
    switch (type) {
      case 'video':
        return <VideoIcon />;
      case 'text':
        return <ArticleIcon />;
      case 'document':
        return <DocumentIcon />;
      case 'quiz':
        return <QuizIcon />;
      case 'assignment':
        return <AssignmentIcon />;
      default:
        return <ArticleIcon />;
    }
  };

  const getTitle = (titleMap, defaultValue = 'Untitled') => {
    if (!titleMap) return defaultValue;
    if (typeof titleMap === 'string') return titleMap;
    return titleMap.en || titleMap.ar || titleMap.fr || defaultValue;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Manage Course Sections
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateSection}
          sx={{ float: 'right' }}
        >
          Add Section
        </Button>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : sections.length === 0 ? (
          <Alert severity="info">
            No sections yet. Click "Add Section" to create your first section.
          </Alert>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="sections" type="SECTION">
              {(provided) => (
                <Box {...provided.droppableProps} ref={provided.innerRef}>
                  {sections.map((section, index) => (
                    <Draggable key={section._id} draggableId={section._id} index={index}>
                      {(provided) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          sx={{ mb: 2 }}
                        >
                          <CardContent>
                            <Box display="flex" alignItems="center" mb={2}>
                              <Box {...provided.dragHandleProps} sx={{ mr: 2 }}>
                                <DragIcon />
                              </Box>
                              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                                {getTitle(section.title, 'Untitled Section')}
                              </Typography>
                              <Chip label={`${section.lessons?.length || 0} lessons`} sx={{ mr: 1 }} />
                              <IconButton size="small" onClick={() => handleEditSection(section)}>
                                <EditIcon />
                              </IconButton>
                              <IconButton size="small" onClick={() => handleDeleteSection(section._id)}>
                                <DeleteIcon />
                              </IconButton>
                            </Box>

                            {section.description && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {getTitle(section.description, '')}
                              </Typography>
                            )}

                            <Droppable droppableId={section._id} type="LESSON">
                              {(provided) => (
                                <List {...provided.droppableProps} ref={provided.innerRef}>
                                  {(section.lessons || []).map((lesson, lessonIndex) => (
                                    <Draggable
                                      key={lesson._id}
                                      draggableId={lesson._id}
                                      index={lessonIndex}
                                    >
                                      {(provided) => (
                                        <ListItem
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          sx={{
                                            bgcolor: 'background.paper',
                                            border: 1,
                                            borderColor: 'divider',
                                            borderRadius: 1,
                                            mb: 1,
                                          }}
                                        >
                                          <ListItemIcon {...provided.dragHandleProps}>
                                            <DragIcon />
                                          </ListItemIcon>
                                          <ListItemIcon>
                                            {getLessonIcon(lesson.type)}
                                          </ListItemIcon>
                                          <ListItemText
                                            primary={getTitle(lesson.title, 'Untitled Lesson')}
                                            secondary={`${lesson.type} • ${lesson.duration || 0} min`}
                                          />
                                        </ListItem>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                </List>
                              )}
                            </Droppable>
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      {/* Section Dialog */}
      <Dialog open={openSectionDialog} onClose={() => setOpenSectionDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedSection ? 'Edit Section' : 'Create Section'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title (English)"
                value={sectionFormData.title.en || ''}
                onChange={(e) =>
                  setSectionFormData({
                    ...sectionFormData,
                    title: { ...sectionFormData.title, en: e.target.value },
                  })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Title (Arabic)"
                value={sectionFormData.title.ar || ''}
                onChange={(e) =>
                  setSectionFormData({
                    ...sectionFormData,
                    title: { ...sectionFormData.title, ar: e.target.value },
                  })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Title (French)"
                value={sectionFormData.title.fr || ''}
                onChange={(e) =>
                  setSectionFormData({
                    ...sectionFormData,
                    title: { ...sectionFormData.title, fr: e.target.value },
                  })
                }
              />
            </Grid>

            {/* Description with Rich Text Editor */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>
                <Typography variant="subtitle2" color="primary">
                  Section Description
                </Typography>
              </Divider>
            </Grid>

            <Grid item xs={12}>
              <Tabs value={descriptionTab} onChange={(e, val) => setDescriptionTab(val)}>
                <Tab label="English" />
                <Tab label="Arabic" />
                <Tab label="French" />
              </Tabs>
            </Grid>

            {descriptionTab === 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Description (English)
                </Typography>
                <ReactQuill
                  theme="snow"
                  value={sectionFormData.description.en || ''}
                  onChange={(value) =>
                    setSectionFormData({
                      ...sectionFormData,
                      description: { ...sectionFormData.description, en: value },
                    })
                  }
                  modules={quillModules}
                  formats={quillFormats}
                />
              </Grid>
            )}

            {descriptionTab === 1 && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Description (Arabic)
                </Typography>
                <ReactQuill
                  theme="snow"
                  value={sectionFormData.description.ar || ''}
                  onChange={(value) =>
                    setSectionFormData({
                      ...sectionFormData,
                      description: { ...sectionFormData.description, ar: value },
                    })
                  }
                  modules={quillModules}
                  formats={quillFormats}
                />
              </Grid>
            )}

            {descriptionTab === 2 && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Description (French)
                </Typography>
                <ReactQuill
                  theme="snow"
                  value={sectionFormData.description.fr || ''}
                  onChange={(value) =>
                    setSectionFormData({
                      ...sectionFormData,
                      description: { ...sectionFormData.description, fr: value },
                    })
                  }
                  modules={quillModules}
                  formats={quillFormats}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSectionDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveSection} variant="contained">
            {selectedSection ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default SectionManagement;
