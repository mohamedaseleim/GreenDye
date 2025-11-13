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
  Paper,
  Typography,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  VideoLibrary as VideoIcon,
  Article as ArticleIcon,
  Description as DocumentIcon,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { toast } from 'react-toastify';
import adminService from '../services/adminService';

const LessonManagement = ({ courseId, open, onClose }) => {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [formData, setFormData] = useState({
    title: { en: '', ar: '', fr: '' },
    description: { en: '', ar: '', fr: '' },
    type: 'video',
    content: {
      video: { url: '', duration: 0, thumbnail: '' },
      text: { en: '', ar: '', fr: '' },
      document: { url: '', type: 'pdf', name: '' },
    },
    duration: 0,
    isFree: false,
    isPublished: true,
  });

  // Quill editor configuration
  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ align: [] }],
      ['link', 'image', 'video'],
      [{ color: [] }, { background: [] }],
      ['blockquote', 'code-block'],
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
    'indent',
    'align',
    'link',
    'image',
    'video',
    'color',
    'background',
    'blockquote',
    'code-block',
  ];

  useEffect(() => {
    if (open && courseId) {
      fetchLessons();
    }
  }, [open, courseId]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const response = await adminService.getLessonsByCourse(courseId);
      setLessons(response.data || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      toast.error('Failed to fetch lessons');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (lesson = null) => {
    if (lesson) {
      setSelectedLesson(lesson);
      setFormData({
        title: lesson.title || { en: '', ar: '', fr: '' },
        description: lesson.description || { en: '', ar: '', fr: '' },
        type: lesson.type || 'video',
        content: lesson.content || {
          video: { url: '', duration: 0, thumbnail: '' },
          text: { en: '', ar: '', fr: '' },
          document: { url: '', type: 'pdf', name: '' },
        },
        duration: lesson.duration || 0,
        isFree: lesson.isFree || false,
        isPublished: lesson.isPublished || true,
      });
    } else {
      setSelectedLesson(null);
      setFormData({
        title: { en: '', ar: '', fr: '' },
        description: { en: '', ar: '', fr: '' },
        type: 'video',
        content: {
          video: { url: '', duration: 0, thumbnail: '' },
          text: { en: '', ar: '', fr: '' },
          document: { url: '', type: 'pdf', name: '' },
        },
        duration: 0,
        isFree: false,
        isPublished: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedLesson(null);
  };

  const handleSaveLesson = async () => {
    try {
      const lessonData = {
        ...formData,
        course: courseId,
        order: selectedLesson ? selectedLesson.order : lessons.length,
      };

      if (selectedLesson) {
        await adminService.updateLesson(selectedLesson._id, lessonData);
        toast.success('Lesson updated successfully');
      } else {
        await adminService.createLesson(lessonData);
        toast.success('Lesson created successfully');
      }

      handleCloseDialog();
      fetchLessons();
    } catch (error) {
      console.error('Error saving lesson:', error);
      toast.error('Failed to save lesson');
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (window.confirm('Are you sure you want to delete this lesson?')) {
      try {
        await adminService.deleteLesson(lessonId);
        toast.success('Lesson deleted successfully');
        fetchLessons();
      } catch (error) {
        console.error('Error deleting lesson:', error);
        toast.error('Failed to delete lesson');
      }
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(lessons);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setLessons(items);

    try {
      const orderedIds = items.map((item) => item._id);
      await adminService.reorderLessons(courseId, orderedIds);
      toast.success('Lessons reordered successfully');
    } catch (error) {
      console.error('Error reordering lessons:', error);
      toast.error('Failed to reorder lessons');
      fetchLessons(); // Revert on error
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
      default:
        return <ArticleIcon />;
    }
  };

  const getLessonTitle = (lesson) => {
    if (typeof lesson.title === 'object' && lesson.title !== null) {
      return lesson.title.en || lesson.title.ar || lesson.title.fr || 'Untitled Lesson';
    }
    return lesson.title || 'Untitled Lesson';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Manage Lessons</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Add Lesson
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : lessons.length === 0 ? (
          <Alert severity="info" sx={{ my: 2 }}>
            No lessons yet. Click "Add Lesson" to create your first lesson.
          </Alert>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="lessons">
              {(provided) => (
                <Box {...provided.droppableProps} ref={provided.innerRef}>
                  {lessons.map((lesson, index) => (
                    <Draggable key={lesson._id} draggableId={lesson._id} index={index}>
                      {(provided, snapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          sx={{
                            mb: 2,
                            backgroundColor: snapshot.isDragging ? 'action.hover' : 'background.paper',
                          }}
                        >
                          <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                              <Box {...provided.dragHandleProps}>
                                <DragIcon sx={{ cursor: 'grab' }} />
                              </Box>
                              <Box sx={{ flexGrow: 1 }}>
                                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                  {getLessonIcon(lesson.type)}
                                  <Typography variant="subtitle1" fontWeight="medium">
                                    {getLessonTitle(lesson)}
                                  </Typography>
                                  <Chip
                                    label={lesson.type}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                  />
                                  {lesson.isFree && (
                                    <Chip label="Free" size="small" color="success" />
                                  )}
                                  {!lesson.isPublished && (
                                    <Chip label="Draft" size="small" color="default" />
                                  )}
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                  Duration: {lesson.duration} min
                                </Typography>
                              </Box>
                              <Box>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenDialog(lesson)}
                                  title="Edit"
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteLesson(lesson._id)}
                                  title="Delete"
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      {/* Lesson Edit/Create Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>{selectedLesson ? 'Edit Lesson' : 'Create New Lesson'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary">
                  Basic Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              {/* Title */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  label="Title (English)"
                  value={formData.title.en}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      title: { ...formData.title, en: e.target.value },
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Title (Arabic)"
                  value={formData.title.ar}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      title: { ...formData.title, ar: e.target.value },
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Title (French)"
                  value={formData.title.fr}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      title: { ...formData.title, fr: e.target.value },
                    })
                  }
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Description (English)"
                  value={formData.description.en}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: { ...formData.description, en: e.target.value },
                    })
                  }
                />
              </Grid>

              {/* Lesson Type and Settings */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                  Lesson Type & Settings
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>Lesson Type</InputLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    label="Lesson Type"
                  >
                    <MenuItem value="video">Video</MenuItem>
                    <MenuItem value="text">Text/Article</MenuItem>
                    <MenuItem value="document">Document</MenuItem>
                    <MenuItem value="quiz">Quiz</MenuItem>
                    <MenuItem value="assignment">Assignment</MenuItem>
                    <MenuItem value="live">Live Session</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Duration (minutes)"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: Number(e.target.value) || 0 })
                  }
                  inputProps={{ min: 0 }}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Access</InputLabel>
                  <Select
                    value={formData.isFree}
                    onChange={(e) => setFormData({ ...formData, isFree: e.target.value })}
                    label="Access"
                  >
                    <MenuItem value={false}>Paid (Course Purchase Required)</MenuItem>
                    <MenuItem value={true}>Free Preview</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Content Based on Type */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                  Lesson Content
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              {formData.type === 'video' && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      required
                      label="Video URL"
                      placeholder="https://example.com/video.mp4 or YouTube/Vimeo link"
                      value={formData.content.video.url}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          content: {
                            ...formData.content,
                            video: { ...formData.content.video, url: e.target.value },
                          },
                        })
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Video Duration (seconds)"
                      value={formData.content.video.duration}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          content: {
                            ...formData.content,
                            video: {
                              ...formData.content.video,
                              duration: Number(e.target.value) || 0,
                            },
                          },
                        })
                      }
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Thumbnail URL (optional)"
                      value={formData.content.video.thumbnail}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          content: {
                            ...formData.content,
                            video: { ...formData.content.video, thumbnail: e.target.value },
                          },
                        })
                      }
                    />
                  </Grid>
                </>
              )}

              {formData.type === 'text' && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Content (English)
                    </Typography>
                    <ReactQuill
                      theme="snow"
                      value={formData.content.text.en}
                      onChange={(value) =>
                        setFormData({
                          ...formData,
                          content: {
                            ...formData.content,
                            text: { ...formData.content.text, en: value },
                          },
                        })
                      }
                      modules={quillModules}
                      formats={quillFormats}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Content (Arabic)
                    </Typography>
                    <ReactQuill
                      theme="snow"
                      value={formData.content.text.ar}
                      onChange={(value) =>
                        setFormData({
                          ...formData,
                          content: {
                            ...formData.content,
                            text: { ...formData.content.text, ar: value },
                          },
                        })
                      }
                      modules={quillModules}
                      formats={quillFormats}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Content (French)
                    </Typography>
                    <ReactQuill
                      theme="snow"
                      value={formData.content.text.fr}
                      onChange={(value) =>
                        setFormData({
                          ...formData,
                          content: {
                            ...formData.content,
                            text: { ...formData.content.text, fr: value },
                          },
                        })
                      }
                      modules={quillModules}
                      formats={quillFormats}
                    />
                  </Grid>
                </>
              )}

              {formData.type === 'document' && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      required
                      label="Document URL"
                      placeholder="https://example.com/document.pdf"
                      value={formData.content.document.url}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          content: {
                            ...formData.content,
                            document: { ...formData.content.document, url: e.target.value },
                          },
                        })
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Document Type</InputLabel>
                      <Select
                        value={formData.content.document.type}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            content: {
                              ...formData.content,
                              document: { ...formData.content.document, type: e.target.value },
                            },
                          })
                        }
                        label="Document Type"
                      >
                        <MenuItem value="pdf">PDF</MenuItem>
                        <MenuItem value="doc">Word Document</MenuItem>
                        <MenuItem value="ppt">PowerPoint</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Document Name"
                      value={formData.content.document.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          content: {
                            ...formData.content,
                            document: { ...formData.content.document, name: e.target.value },
                          },
                        })
                      }
                    />
                  </Grid>
                </>
              )}

              {/* Publication Status */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Publication Status</InputLabel>
                  <Select
                    value={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.value })}
                    label="Publication Status"
                  >
                    <MenuItem value={true}>Published</MenuItem>
                    <MenuItem value={false}>Draft</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveLesson} variant="contained" color="primary">
            {selectedLesson ? 'Update Lesson' : 'Create Lesson'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default LessonManagement;
