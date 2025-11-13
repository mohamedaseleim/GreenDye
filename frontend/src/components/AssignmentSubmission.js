import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import assignmentService from '../services/assignmentService';

export default function AssignmentSubmission({ assignmentId, assignment, onSubmit }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [assignmentData, setAssignmentData] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [submissionType, setSubmissionType] = useState('');
  const [submissionContent, setSubmissionContent] = useState({
    text: '',
    url: '',
    files: []
  });
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (assignment) {
      setAssignmentData(assignment);
      setLoading(false);
      if (assignment.submissionType && assignment.submissionType.length > 0) {
        setSubmissionType(assignment.submissionType[0]);
      }
    } else {
      fetchAssignment();
    }
    fetchSubmission();
  }, [assignmentId, assignment]);

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      const response = await assignmentService.getAssignment(assignmentId);
      setAssignmentData(response.data);
      if (response.data.submissionType && response.data.submissionType.length > 0) {
        setSubmissionType(response.data.submissionType[0]);
      }
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch assignment');
      setLoading(false);
    }
  };

  const fetchSubmission = async () => {
    try {
      const response = await assignmentService.getMySubmission(assignmentId);
      setSubmission(response.data);
    } catch (err) {
      // No submission yet, that's okay
      setSubmission(null);
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    
    // Validate file types
    const allowedTypes = assignmentData?.allowedFileTypes || [];
    const invalidFiles = files.filter(file => {
      const extension = file.name.split('.').pop().toLowerCase();
      return !allowedTypes.includes(extension);
    });

    if (invalidFiles.length > 0) {
      setError(`Invalid file types. Allowed: ${allowedTypes.join(', ')}`);
      return;
    }

    // Validate file sizes
    const maxSize = assignmentData?.maxFileSize || 10485760;
    const oversizedFiles = files.filter(file => file.size > maxSize);

    if (oversizedFiles.length > 0) {
      setError(`File(s) too large. Maximum size: ${(maxSize / 1048576).toFixed(2)} MB`);
      return;
    }

    setSubmissionContent(prev => ({
      ...prev,
      files: [...prev.files, ...files]
    }));
    setError('');
  };

  const handleRemoveFile = (index) => {
    setSubmissionContent(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      // Validate submission
      if (submissionType === 'file' && submissionContent.files.length === 0) {
        setError('Please upload at least one file');
        setSubmitting(false);
        return;
      }

      if (submissionType === 'text' && !submissionContent.text.trim()) {
        setError('Please enter your submission text');
        setSubmitting(false);
        return;
      }

      if (submissionType === 'url' && !submissionContent.url.trim()) {
        setError('Please enter a URL');
        setSubmitting(false);
        return;
      }

      // For file uploads, we need to upload files first
      let fileUrls = [];
      if (submissionType === 'file' && submissionContent.files.length > 0) {
        // TODO: Implement file upload to server
        // For now, we'll use mock URLs
        fileUrls = submissionContent.files.map((file, index) => ({
          name: file.name,
          url: `/uploads/assignments/${assignmentId}/${file.name}`,
          type: file.type,
          size: file.size
        }));
      }

      const submissionData = {
        submissionType,
        content: {
          text: submissionType === 'text' ? submissionContent.text : undefined,
          url: submissionType === 'url' ? submissionContent.url : undefined,
          files: submissionType === 'file' ? fileUrls : undefined
        }
      };

      const response = await assignmentService.submitAssignment(assignmentId, submissionData);
      setSuccess('Assignment submitted successfully!');
      setSubmission(response.data);
      if (onSubmit) onSubmit(response.data);
      setSubmitting(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit assignment');
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isDueDatePassed = () => {
    if (!assignmentData?.dueDate) return false;
    return new Date() > new Date(assignmentData.dueDate);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (!assignmentData) {
    return (
      <Alert severity="error">Assignment not found</Alert>
    );
  }

  // If already submitted
  if (submission && submission.status === 'submitted') {
    return (
      <Card>
        <CardContent>
          <Box textAlign="center" py={3}>
            <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Assignment Submitted
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Your assignment has been submitted successfully
            </Typography>

            {submission.submittedAt && (
              <Typography variant="caption" color="text.secondary">
                Submitted on: {formatDate(submission.submittedAt)}
              </Typography>
            )}

            {submission.status === 'graded' && (
              <Box mt={3}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Grade: {submission.score} / {assignmentData.maxPoints}
                </Typography>
                {submission.feedback && (
                  <Box mt={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Feedback:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {submission.feedback.en || 'No feedback provided'}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <AssignmentIcon color="primary" />
            <Typography variant="h5">
              {assignmentData.title?.en || 'Assignment'}
            </Typography>
          </Box>

          <Typography variant="body1" paragraph>
            {assignmentData.description?.en || 'No description'}
          </Typography>

          {assignmentData.instructions?.en && (
            <Box mt={2} p={2} bgcolor="grey.50" borderRadius={1}>
              <Typography variant="subtitle2" gutterBottom>
                Instructions:
              </Typography>
              <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                {assignmentData.instructions.en}
              </Typography>
            </Box>
          )}

          <Box display="flex" gap={2} mt={2} flexWrap="wrap">
            {assignmentData.dueDate && (
              <Chip
                icon={<ScheduleIcon />}
                label={`Due: ${formatDate(assignmentData.dueDate)}`}
                color={isDueDatePassed() ? 'error' : 'default'}
                variant="outlined"
              />
            )}
            <Chip
              label={`${assignmentData.maxPoints} points`}
              variant="outlined"
            />
            {assignmentData.isRequired && (
              <Chip label="Required" color="error" size="small" />
            )}
          </Box>

          {assignmentData.attachments && assignmentData.attachments.length > 0 && (
            <Box mt={3}>
              <Typography variant="subtitle2" gutterBottom>
                Attachments:
              </Typography>
              <List dense>
                {assignmentData.attachments.map((attachment, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <FileIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={attachment.name}
                      secondary={`${attachment.type || 'file'} - ${(attachment.size / 1024).toFixed(2)} KB`}
                    />
                    <Button
                      size="small"
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download
                    </Button>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Submit Your Work
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {isDueDatePassed() && !assignmentData.allowLateSubmission && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              The due date has passed. Late submissions are not allowed for this assignment.
            </Alert>
          )}

          {isDueDatePassed() && assignmentData.allowLateSubmission && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Late submission. {assignmentData.latePenalty}% penalty will be applied.
            </Alert>
          )}

          {assignmentData.submissionType && assignmentData.submissionType.length > 1 && (
            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <FormLabel component="legend">Submission Type</FormLabel>
              <RadioGroup
                value={submissionType}
                onChange={(e) => setSubmissionType(e.target.value)}
              >
                {assignmentData.submissionType.map((type) => (
                  <FormControlLabel
                    key={type}
                    value={type}
                    control={<Radio />}
                    label={type.charAt(0).toUpperCase() + type.slice(1)}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          )}

          {submissionType === 'file' && (
            <Box>
              <Button
                variant="contained"
                component="label"
                startIcon={<UploadIcon />}
                disabled={submitting || (isDueDatePassed() && !assignmentData.allowLateSubmission)}
                sx={{ mb: 2 }}
              >
                Upload Files
                <input
                  type="file"
                  hidden
                  multiple
                  accept={assignmentData.allowedFileTypes?.map(t => `.${t}`).join(',')}
                  onChange={handleFileUpload}
                />
              </Button>

              {submissionContent.files.length > 0 && (
                <List>
                  {submissionContent.files.map((file, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <FileIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={file.name}
                        secondary={`${(file.size / 1024).toFixed(2)} KB`}
                      />
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleRemoveFile(index)}
                      >
                        Remove
                      </Button>
                    </ListItem>
                  ))}
                </List>
              )}

              <Typography variant="caption" color="text.secondary">
                Allowed types: {assignmentData.allowedFileTypes?.join(', ')}
                {' | '}
                Max size: {((assignmentData.maxFileSize || 10485760) / 1048576).toFixed(2)} MB
              </Typography>
            </Box>
          )}

          {submissionType === 'text' && (
            <TextField
              fullWidth
              multiline
              rows={10}
              label="Your Answer"
              value={submissionContent.text}
              onChange={(e) => setSubmissionContent(prev => ({ ...prev, text: e.target.value }))}
              disabled={submitting || (isDueDatePassed() && !assignmentData.allowLateSubmission)}
              placeholder="Type your answer here..."
            />
          )}

          {submissionType === 'url' && (
            <TextField
              fullWidth
              label="URL"
              value={submissionContent.url}
              onChange={(e) => setSubmissionContent(prev => ({ ...prev, url: e.target.value }))}
              disabled={submitting || (isDueDatePassed() && !assignmentData.allowLateSubmission)}
              placeholder="https://..."
              helperText="Enter the URL of your submission (e.g., GitHub repo, Google Drive link)"
            />
          )}

          {submitting && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
            </Box>
          )}

          <Box mt={3}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={submitting || (isDueDatePassed() && !assignmentData.allowLateSubmission)}
              fullWidth
            >
              {submitting ? 'Submitting...' : 'Submit Assignment'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
