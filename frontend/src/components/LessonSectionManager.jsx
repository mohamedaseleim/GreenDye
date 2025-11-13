import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  PlayLesson as LessonIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { toast } from 'react-toastify';
import sectionService from '../services/sectionService';
import axios from 'axios';

const LessonSectionManager = ({ courseId, sections, onUpdate }) => {
  const [availableLessons, setAvailableLessons] = useState([]);
  const [sectionLessons, setSectionLessons] = useState({});
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedLesson, setSelectedLesson] = useState('');

  useEffect(() => {
    if (courseId && sections) {
      fetchLessons();
      organizeSectionLessons();
    }
  }, [courseId, sections]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/lessons?course=${courseId}`);
      setAvailableLessons(response.data.data || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      toast.error('Failed to load lessons');
    } finally {
      setLoading(false);
    }
  };

  const organizeSectionLessons = () => {
    const organized = {};
    sections.forEach(section => {
      organized[section._id] = section.lessons || [];
    });
    setSectionLessons(organized);
  };

  const handleAddLessonToSection = async () => {
    if (!selectedSection || !selectedLesson) {
      toast.error('Please select both section and lesson');
      return;
    }

    try {
      await sectionService.addLessonToSection(selectedSection, selectedLesson);
      toast.success('Lesson added to section successfully');
      setOpenDialog(false);
      setSelectedSection('');
      setSelectedLesson('');
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error adding lesson to section:', error);
      toast.error('Failed to add lesson to section');
    }
  };

  const handleRemoveLessonFromSection = async (sectionId, lessonId) => {
    if (!window.confirm('Remove this lesson from the section?')) {
      return;
    }

    try {
      await sectionService.removeLessonFromSection(sectionId, lessonId);
      toast.success('Lesson removed from section');
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error removing lesson from section:', error);
      toast.error('Failed to remove lesson from section');
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const sectionId = result.source.droppableId;
    const lessons = Array.from(sectionLessons[sectionId] || []);
    const [reorderedLesson] = lessons.splice(result.source.index, 1);
    lessons.splice(result.destination.index, 0, reorderedLesson);

    // Update local state immediately
    setSectionLessons({
      ...sectionLessons,
      [sectionId]: lessons
    });

    try {
      const lessonOrders = lessons.map((lesson, index) => ({
        lessonId: lesson._id,
        order: index
      }));

      await sectionService.reorderLessons(sectionId, lessonOrders);
      toast.success('Lessons reordered successfully');
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error reordering lessons:', error);
      toast.error('Failed to reorder lessons');
      // Revert on error
      if (onUpdate) onUpdate();
    }
  };

  const getLessonTitle = (lesson) => {
    if (!lesson.title) return 'Untitled Lesson';
    return lesson.title.en || lesson.title.ar || lesson.title.fr || 'Untitled Lesson';
  };

  const getUnassignedLessons = () => {
    const assignedLessonIds = new Set();
    Object.values(sectionLessons).forEach(lessons => {
      lessons.forEach(lesson => assignedLessonIds.add(lesson._id));
    });
    return availableLessons.filter(lesson => !assignedLessonIds.has(lesson._id));
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Loading lessons...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Organize Lessons into Sections</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          disabled={sections.length === 0}
        >
          Add Lesson to Section
        </Button>
      </Box>

      {sections.length === 0 ? (
        <Alert severity="info">
          Create sections first before organizing lessons.
        </Alert>
      ) : (
        <Box>
          <DragDropContext onDragEnd={handleDragEnd}>
            {sections.map(section => (
              <Card key={section._id} sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {section.title?.en || section.title?.ar || section.title?.fr || 'Untitled Section'}
                  </Typography>
                  
                  <Droppable droppableId={section._id}>
                    {(provided) => (
                      <List
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        sx={{ bgcolor: 'background.default', borderRadius: 1, p: 1 }}
                      >
                        {(sectionLessons[section._id] || []).length === 0 ? (
                          <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                            No lessons in this section yet
                          </Typography>
                        ) : (
                          (sectionLessons[section._id] || []).map((lesson, index) => (
                            <Draggable
                              key={lesson._id}
                              draggableId={lesson._id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <ListItem
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  sx={{
                                    bgcolor: snapshot.isDragging ? 'action.selected' : 'background.paper',
                                    mb: 1,
                                    borderRadius: 1,
                                    border: '1px solid',
                                    borderColor: 'divider'
                                  }}
                                >
                                  <Box
                                    {...provided.dragHandleProps}
                                    sx={{ mr: 2, cursor: 'grab', color: 'text.secondary' }}
                                  >
                                    <DragIcon />
                                  </Box>
                                  <LessonIcon sx={{ mr: 1, color: 'primary.main' }} />
                                  <ListItemText
                                    primary={getLessonTitle(lesson)}
                                    secondary={`Type: ${lesson.type || 'N/A'} | Duration: ${lesson.duration || 0} min`}
                                  />
                                  <ListItemSecondaryAction>
                                    <IconButton
                                      edge="end"
                                      onClick={() => handleRemoveLessonFromSection(section._id, lesson._id)}
                                      color="error"
                                      size="small"
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </ListItemSecondaryAction>
                                </ListItem>
                              )}
                            </Draggable>
                          ))
                        )}
                        {provided.placeholder}
                      </List>
                    )}
                  </Droppable>
                </CardContent>
              </Card>
            ))}
          </DragDropContext>

          {/* Show unassigned lessons */}
          {getUnassignedLessons().length > 0 && (
            <Card sx={{ mt: 2, bgcolor: 'warning.lighter' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="warning.dark">
                  Unassigned Lessons ({getUnassignedLessons().length})
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  These lessons are not assigned to any section yet:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {getUnassignedLessons().map(lesson => (
                    <Chip
                      key={lesson._id}
                      icon={<LessonIcon />}
                      label={getLessonTitle(lesson)}
                      variant="outlined"
                      color="warning"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* Add Lesson to Section Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Lesson to Section</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Select Section</InputLabel>
              <Select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                label="Select Section"
              >
                {sections.map(section => (
                  <MenuItem key={section._id} value={section._id}>
                    {section.title?.en || section.title?.ar || section.title?.fr || 'Untitled Section'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Select Lesson</InputLabel>
              <Select
                value={selectedLesson}
                onChange={(e) => setSelectedLesson(e.target.value)}
                label="Select Lesson"
              >
                {getUnassignedLessons().map(lesson => (
                  <MenuItem key={lesson._id} value={lesson._id}>
                    {getLessonTitle(lesson)} ({lesson.type})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {getUnassignedLessons().length === 0 && (
              <Alert severity="info">
                All lessons are already assigned to sections
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAddLessonToSection}
            variant="contained"
            color="primary"
            disabled={!selectedSection || !selectedLesson}
          >
            Add Lesson
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LessonSectionManager;
