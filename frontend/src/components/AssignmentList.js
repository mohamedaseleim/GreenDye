import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import AssignmentEditor from './AssignmentEditor';
import assignmentService from '../services/assignmentService';

export default function AssignmentList({ courseId, lessonId, onUpdate }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuAssignment, setMenuAssignment] = useState(null);

  useEffect(() => {
    fetchAssignments();
  }, [courseId, lessonId]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await assignmentService.getAssignments(courseId, lessonId);
      setAssignments(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch assignments');
      setLoading(false);
    }
  };

  const handleCreateAssignment = () => {
    setSelectedAssignment(null);
    setEditorOpen(true);
  };

  const handleEditAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setEditorOpen(true);
    handleMenuClose();
  };

  const handleDeleteAssignment = async (assignmentId) => {
    try {
      await assignmentService.deleteAssignment(assignmentId);
      fetchAssignments();
      handleMenuClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete assignment');
    }
  };

  const handleSaveAssignment = async (assignmentData) => {
    try {
      if (selectedAssignment) {
        await assignmentService.updateAssignment(selectedAssignment._id, assignmentData);
      } else {
        await assignmentService.createAssignment(assignmentData);
      }
      fetchAssignments();
      if (onUpdate) onUpdate();
    } catch (err) {
      throw err;
    }
  };

  const handleMenuOpen = (event, assignment) => {
    setAnchorEl(event.currentTarget);
    setMenuAssignment(assignment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuAssignment(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Assignments</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateAssignment}
        >
          Create Assignment
        </Button>
      </Box>

      {assignments.length === 0 ? (
        <Card>
          <CardContent>
            <Box textAlign="center" py={3}>
              <AssignmentIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No assignments yet
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Create your first assignment to start tracking student submissions
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateAssignment}
              >
                Create First Assignment
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {assignments.map((assignment) => (
            <Grid item xs={12} key={assignment._id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box flex={1}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Typography variant="h6">
                          {assignment.title?.en || 'Untitled Assignment'}
                        </Typography>
                        {assignment.isRequired && (
                          <Chip label="Required" size="small" color="error" />
                        )}
                        {assignment.isPublished ? (
                          <Chip label="Published" size="small" color="success" />
                        ) : (
                          <Chip label="Draft" size="small" />
                        )}
                      </Box>

                      <Typography variant="body2" color="text.secondary" paragraph>
                        {assignment.description?.en || 'No description'}
                      </Typography>

                      <Box display="flex" gap={2} flexWrap="wrap">
                        {assignment.dueDate && (
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <ScheduleIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              Due: {formatDate(assignment.dueDate)}
                            </Typography>
                          </Box>
                        )}
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <CheckCircleIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {assignment.maxPoints} points
                          </Typography>
                        </Box>
                      </Box>

                      {assignment.submissionType && assignment.submissionType.length > 0 && (
                        <Box mt={1}>
                          <Typography variant="caption" color="text.secondary">
                            Submission types:{' '}
                            {assignment.submissionType.map(type => type.charAt(0).toUpperCase() + type.slice(1)).join(', ')}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <IconButton
                      onClick={(e) => handleMenuOpen(e, assignment)}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleEditAssignment(menuAssignment)}>
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => handleDeleteAssignment(menuAssignment?._id)}
          sx={{ color: 'error.main' }}
        >
          Delete
        </MenuItem>
      </Menu>

      <AssignmentEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        assignment={selectedAssignment}
        courseId={courseId}
        lessonId={lessonId}
        onSave={handleSaveAssignment}
      />
    </Box>
  );
}
