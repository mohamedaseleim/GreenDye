import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
  Box,
  Button,
  Typography,
  Paper,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  DragIndicator as DragIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  VideoLibrary as VideoIcon,
  Quiz as QuizIcon,
  Assignment as AssignmentIcon,
  Article as ArticleIcon,
} from '@mui/icons-material';
import adminService from '../services/adminService';
import LessonEditor from '../components/LessonEditor';
import QuizBuilder from '../components/QuizBuilder';
import AssignmentEditor from '../components/AssignmentEditor';

export default function AdminLessons() {
  const { courseId } = useParams();
  const [lessons, setLessons] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [lessonEditorOpen, setLessonEditorOpen] = useState(false);
  const [quizBuilderOpen, setQuizBuilderOpen] = useState(false);
  const [assignmentEditorOpen, setAssignmentEditorOpen] = useState(false);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [selectedLessonForQuiz, setSelectedLessonForQuiz] = useState(null);
  const [selectedLessonForAssignment, setSelectedLessonForAssignment] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [lessonsRes, quizzesRes, assignmentsRes] = await Promise.all([
        adminService.getLessons(courseId),
        adminService.getQuizzes(courseId),
        adminService.getAssignments(courseId),
      ]);
      setLessons(lessonsRes.data || []);
      setQuizzes(quizzesRes.data || []);
      setAssignments(assignmentsRes.data || []);
      setLoading(false);
    } catch (error) {
      showSnackbar('Failed to load lessons', 'error');
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) loadData();
  }, [courseId, loadData]);

  function showSnackbar(message, severity = 'success') {
    setSnackbar({ open: true, message, severity });
  }

  function onDragEnd(result) {
    const { destination, source } = result;
    if (!destination) return;
    if (destination.index === source.index) return;

    const reordered = Array.from(lessons);
    const [moved] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, moved);
    
    // Update order numbers
    reordered.forEach((lesson, index) => {
      lesson.order = index;
    });
    
    setLessons(reordered);
  }

  async function saveOrder() {
    try {
      const orderedIds = lessons.map(l => l._id);
      await adminService.reorderLessons(orderedIds);
      showSnackbar('Lesson order saved successfully');
    } catch (error) {
      showSnackbar('Failed to save lesson order', 'error');
    }
  }

  async function handleSaveLesson(lessonData) {
    try {
      if (currentLesson) {
        await adminService.updateLesson(currentLesson._id, lessonData);
        showSnackbar('Lesson updated successfully');
      } else {
        await adminService.createLesson(lessonData);
        showSnackbar('Lesson created successfully');
      }
      await loadData();
      setLessonEditorOpen(false);
      setCurrentLesson(null);
    } catch (error) {
      showSnackbar('Failed to save lesson', 'error');
      throw error;
    }
  }

  async function handleSaveQuiz(quizData) {
    try {
      if (currentQuiz) {
        await adminService.updateQuiz(currentQuiz._id, quizData);
        showSnackbar('Quiz updated successfully');
      } else {
        await adminService.createQuiz(quizData);
        showSnackbar('Quiz created successfully');
      }
      await loadData();
      setQuizBuilderOpen(false);
      setCurrentQuiz(null);
      setSelectedLessonForQuiz(null);
    } catch (error) {
      showSnackbar('Failed to save quiz', 'error');
      throw error;
    }
  }

  async function handleSaveAssignment(assignmentData) {
    try {
      if (currentAssignment) {
        await adminService.updateAssignment(currentAssignment._id, assignmentData);
        showSnackbar('Assignment updated successfully');
      } else {
        await adminService.createAssignment(assignmentData);
        showSnackbar('Assignment created successfully');
      }
      await loadData();
      setAssignmentEditorOpen(false);
      setCurrentAssignment(null);
      setSelectedLessonForAssignment(null);
    } catch (error) {
      showSnackbar('Failed to save assignment', 'error');
      throw error;
    }
  }

  function handleMenuClick(event, item, type) {
    setAnchorEl(event.currentTarget);
    setSelectedItem({ ...item, type });
  }

  function handleMenuClose() {
    setAnchorEl(null);
    setSelectedItem(null);
  }

  function handleEdit() {
    if (selectedItem.type === 'lesson') {
      setCurrentLesson(selectedItem);
      setLessonEditorOpen(true);
    } else if (selectedItem.type === 'quiz') {
      setCurrentQuiz(selectedItem);
      setQuizBuilderOpen(true);
    } else if (selectedItem.type === 'assignment') {
      setCurrentAssignment(selectedItem);
      setAssignmentEditorOpen(true);
    }
    handleMenuClose();
  }

  function handleDeleteClick() {
    setDeleteDialogOpen(true);
    handleMenuClose();
  }

  async function handleDeleteConfirm() {
    try {
      if (selectedItem.type === 'lesson') {
        await adminService.deleteLesson(selectedItem._id);
        showSnackbar('Lesson deleted successfully');
      } else if (selectedItem.type === 'quiz') {
        await adminService.deleteQuiz(selectedItem._id);
        showSnackbar('Quiz deleted successfully');
      } else if (selectedItem.type === 'assignment') {
        await adminService.deleteAssignment(selectedItem._id);
        showSnackbar('Assignment deleted successfully');
      }
      await loadData();
      setDeleteDialogOpen(false);
      setSelectedItem(null);
    } catch (error) {
      showSnackbar('Failed to delete item', 'error');
    }
  }

  function getLessonIcon(type) {
    switch (type) {
      case 'video':
        return <VideoIcon />;
      case 'quiz':
        return <QuizIcon />;
      case 'assignment':
        return <AssignmentIcon />;
      default:
        return <ArticleIcon />;
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, margin: '2rem auto', p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">Lesson & Content Management</Typography>
        <Box>
          <Button
            startIcon={<AddIcon />}
            onClick={() => {
              setCurrentLesson(null);
              setLessonEditorOpen(true);
            }}
            variant="contained"
            sx={{ mr: 1 }}
          >
            Add Lesson
          </Button>
          <Button
            startIcon={<QuizIcon />}
            onClick={() => {
              setCurrentQuiz(null);
              setSelectedLessonForQuiz(null);
              setQuizBuilderOpen(true);
            }}
            variant="outlined"
            sx={{ mr: 1 }}
          >
            Add Quiz
          </Button>
          <Button
            startIcon={<AssignmentIcon />}
            onClick={() => {
              setCurrentAssignment(null);
              setSelectedLessonForAssignment(null);
              setAssignmentEditorOpen(true);
            }}
            variant="outlined"
          >
            Add Assignment
          </Button>
        </Box>
      </Box>

      <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab label={`Lessons (${lessons.length})`} />
        <Tab label={`Quizzes (${quizzes.length})`} />
        <Tab label={`Assignments (${assignments.length})`} />
      </Tabs>

      {activeTab === 0 && (
        <Box>
          {lessons.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Button onClick={saveOrder} variant="contained" size="small">
                Save Order
              </Button>
            </Box>
          )}

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="lessonList">
              {(provided) => (
                <Box {...provided.droppableProps} ref={provided.innerRef}>
                  {lessons.map((lesson, index) => (
                    <Draggable draggableId={lesson._id} index={index} key={lesson._id}>
                      {(prov, snapshot) => (
                        <Paper
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          sx={{
                            p: 2,
                            mb: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            backgroundColor: snapshot.isDragging ? '#f0f0f0' : 'white',
                            ...prov.draggableProps.style,
                          }}
                        >
                          <Box {...prov.dragHandleProps}>
                            <DragIcon sx={{ cursor: 'grab' }} />
                          </Box>

                          <Box sx={{ color: 'text.secondary' }}>
                            {getLessonIcon(lesson.type)}
                          </Box>

                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              #{index + 1} — {lesson.title?.en || 'Untitled'}
                            </Typography>
                            <Box display="flex" gap={1} sx={{ mt: 0.5 }}>
                              <Chip label={lesson.type} size="small" />
                              {lesson.isFree && <Chip label="Free" size="small" color="primary" />}
                              {lesson.isPublished && (
                                <Chip label="Published" size="small" color="success" />
                              )}
                              {!lesson.isPublished && (
                                <Chip label="Draft" size="small" color="default" />
                              )}
                              {lesson.duration > 0 && (
                                <Chip label={`${lesson.duration} min`} size="small" />
                              )}
                            </Box>
                          </Box>

                          <IconButton
                            onClick={(e) => handleMenuClick(e, lesson, 'lesson')}
                            size="small"
                          >
                            <MoreIcon />
                          </IconButton>
                        </Paper>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </DragDropContext>

          {lessons.length === 0 && (
            <Alert severity="info">
              No lessons found. Click "Add Lesson" to create your first lesson.
            </Alert>
          )}
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          {quizzes.map((quiz) => (
            <Paper key={quiz._id} sx={{ p: 2, mb: 2 }}>
              <Box display="flex" alignItems="center" gap={2}>
                <QuizIcon sx={{ color: 'text.secondary' }} />

                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {quiz.title?.en || 'Untitled Quiz'}
                  </Typography>
                  <Box display="flex" gap={1} sx={{ mt: 0.5 }}>
                    <Chip label={`${quiz.questions?.length || 0} questions`} size="small" />
                    <Chip label={`${quiz.passingScore}% passing`} size="small" />
                    {quiz.isRequired && <Chip label="Required" size="small" color="error" />}
                    {quiz.isPublished && (
                      <Chip label="Published" size="small" color="success" />
                    )}
                    {!quiz.isPublished && <Chip label="Draft" size="small" color="default" />}
                    {quiz.lesson && <Chip label="Linked to Lesson" size="small" />}
                  </Box>
                </Box>

                <IconButton onClick={(e) => handleMenuClick(e, quiz, 'quiz')} size="small">
                  <MoreIcon />
                </IconButton>
              </Box>
            </Paper>
          ))}

          {quizzes.length === 0 && (
            <Alert severity="info">
              No quizzes found. Click "Add Quiz" to create your first quiz.
            </Alert>
          )}
        </Box>
      )}

      {activeTab === 2 && (
        <Box>
          {assignments.map((assignment) => (
            <Paper key={assignment._id} sx={{ p: 2, mb: 2 }}>
              <Box display="flex" alignItems="center" gap={2}>
                <AssignmentIcon sx={{ color: 'text.secondary' }} />

                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {assignment.title?.en || 'Untitled Assignment'}
                  </Typography>
                  <Box display="flex" gap={1} sx={{ mt: 0.5 }}>
                    <Chip label={`${assignment.maxPoints} points`} size="small" />
                    {assignment.dueDate && (
                      <Chip 
                        label={`Due: ${new Date(assignment.dueDate).toLocaleDateString()}`} 
                        size="small" 
                      />
                    )}
                    {assignment.isRequired && <Chip label="Required" size="small" color="error" />}
                    {assignment.isPublished && (
                      <Chip label="Published" size="small" color="success" />
                    )}
                    {!assignment.isPublished && <Chip label="Draft" size="small" color="default" />}
                    {assignment.lesson && <Chip label="Linked to Lesson" size="small" />}
                    {assignment.attachments?.length > 0 && (
                      <Chip label={`${assignment.attachments.length} attachments`} size="small" />
                    )}
                  </Box>
                </Box>

                <IconButton onClick={(e) => handleMenuClick(e, assignment, 'assignment')} size="small">
                  <MoreIcon />
                </IconButton>
              </Box>
            </Paper>
          ))}

          {assignments.length === 0 && (
            <Alert severity="info">
              No assignments found. Click "Add Assignment" to create your first assignment.
            </Alert>
          )}
        </Box>
      )}

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" /> Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" /> Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this {selectedItem?.type}?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Lesson Editor Dialog */}
      <LessonEditor
        open={lessonEditorOpen}
        onClose={() => {
          setLessonEditorOpen(false);
          setCurrentLesson(null);
        }}
        lesson={currentLesson}
        courseId={courseId}
        onSave={handleSaveLesson}
      />

      {/* Quiz Builder Dialog */}
      <QuizBuilder
        open={quizBuilderOpen}
        onClose={() => {
          setQuizBuilderOpen(false);
          setCurrentQuiz(null);
          setSelectedLessonForQuiz(null);
        }}
        quiz={currentQuiz}
        courseId={courseId}
        lessonId={selectedLessonForQuiz}
        onSave={handleSaveQuiz}
      />

      {/* Assignment Editor Dialog */}
      <AssignmentEditor
        open={assignmentEditorOpen}
        onClose={() => {
          setAssignmentEditorOpen(false);
          setCurrentAssignment(null);
          setSelectedLessonForAssignment(null);
        }}
        assignment={currentAssignment}
        courseId={courseId}
        lessonId={selectedLessonForAssignment}
        onSave={handleSaveAssignment}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
