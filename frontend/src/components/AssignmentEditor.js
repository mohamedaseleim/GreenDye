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
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  FormGroup,
  Checkbox,
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import adminService from '../services/adminService';

export default function AssignmentEditor({ open, onClose, assignment, courseId, lessonId, onSave }) {
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    course: courseId,
    lesson: lessonId,
    title: { en: '' },
    description: { en: '' },
    instructions: { en: '' },
    dueDate: '',
    maxPoints: 100,
    submissionType: ['file'],
    allowedFileTypes: ['pdf', 'doc', 'docx', 'txt', 'zip'],
    maxFileSize: 10485760, // 10MB
    attachments: [],
    isRequired: true,
    allowLateSubmission: false,
    latePenalty: 0,
    isPublished: false,
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (assignment) {
      setFormData({
        course: assignment.course || courseId,
        lesson: assignment.lesson || lessonId,
        title: assignment.title || { en: '' },
        description: assignment.description || { en: '' },
        instructions: assignment.instructions || { en: '' },
        dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString().slice(0, 16) : '',
        maxPoints: assignment.maxPoints || 100,
        submissionType: assignment.submissionType || ['file'],
        allowedFileTypes: assignment.allowedFileTypes || ['pdf', 'doc', 'docx', 'txt', 'zip'],
        maxFileSize: assignment.maxFileSize || 10485760,
        attachments: assignment.attachments || [],
        isRequired: assignment.isRequired !== undefined ? assignment.isRequired : true,
        allowLateSubmission: assignment.allowLateSubmission || false,
        latePenalty: assignment.latePenalty || 0,
        isPublished: assignment.isPublished || false,
      });
    }
  }, [assignment, courseId, lessonId]);

  const handleInputChange = (field, value, nested = null) => {
    if (nested) {
      setFormData((prev) => ({
        ...prev,
        [field]: {
          ...prev[field],
          [nested]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSubmissionTypeChange = (type) => {
    setFormData((prev) => {
      const types = prev.submissionType.includes(type)
        ? prev.submissionType.filter(t => t !== type)
        : [...prev.submissionType, type];
      return { ...prev, submissionType: types.length > 0 ? types : ['file'] };
    });
  };

  const handleAttachmentUpload = async (file) => {
    try {
      setUploading(true);
      setError('');
      setUploadProgress(0);

      const formDataUpload = new FormData();
      formDataUpload.append('files', file);
      formDataUpload.append('category', 'documents');

      const response = await adminService.uploadMedia(formDataUpload);

      if (response.success && response.data.length > 0) {
        const uploadedFile = response.data[0];
        setUploadProgress(100);

        const newAttachment = {
          name: uploadedFile.originalName,
          url: uploadedFile.url,
          type: uploadedFile.metadata?.format || file.type,
          size: file.size,
        };

        setFormData((prev) => ({
          ...prev,
          attachments: [...prev.attachments, newAttachment],
        }));
      }

      setUploading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Attachment upload failed');
      setUploading(false);
    }
  };

  const handleAttachmentDelete = (index) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    try {
      setError('');
      // Convert dueDate string to Date object
      const dataToSave = {
        ...formData,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
      };
      await onSave(dataToSave);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save assignment');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {assignment ? 'Edit Assignment' : 'Create New Assignment'}
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 2 }}>
          <Tab label="Basic Info" />
          <Tab label="Instructions" />
          <Tab label="Attachments" />
          <Tab label="Settings" />
        </Tabs>

        {activeTab === 0 && (
          <Box>
            <TextField
              fullWidth
              label="Assignment Title"
              value={formData.title.en}
              onChange={(e) => handleInputChange('title', e.target.value, 'en')}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Description"
              value={formData.description?.en || ''}
              onChange={(e) => handleInputChange('description', e.target.value, 'en')}
              margin="normal"
              multiline
              rows={3}
              required
            />

            <TextField
              fullWidth
              label="Due Date"
              type="datetime-local"
              value={formData.dueDate}
              onChange={(e) => handleInputChange('dueDate', e.target.value)}
              margin="normal"
              InputLabelProps={{
                shrink: true,
              }}
            />

            <TextField
              fullWidth
              label="Max Points"
              type="number"
              value={formData.maxPoints}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                handleInputChange('maxPoints', isNaN(value) ? 100 : value);
              }}
              margin="normal"
              inputProps={{ min: 0 }}
            />
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            <TextField
              fullWidth
              label="Instructions"
              value={formData.instructions?.en || ''}
              onChange={(e) => handleInputChange('instructions', e.target.value, 'en')}
              margin="normal"
              multiline
              rows={10}
              placeholder="Provide detailed instructions for this assignment..."
            />

            <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
              Submission Types
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.submissionType.includes('file')}
                    onChange={() => handleSubmissionTypeChange('file')}
                  />
                }
                label="File Upload"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.submissionType.includes('text')}
                    onChange={() => handleSubmissionTypeChange('text')}
                  />
                }
                label="Text Entry"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.submissionType.includes('url')}
                    onChange={() => handleSubmissionTypeChange('url')}
                  />
                }
                label="URL/Link"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.submissionType.includes('video')}
                    onChange={() => handleSubmissionTypeChange('video')}
                  />
                }
                label="Video"
              />
            </FormGroup>

            {formData.submissionType.includes('file') && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Allowed File Types
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {['pdf', 'doc', 'docx', 'txt', 'zip', 'jpg', 'png', 'ppt', 'pptx'].map((type) => (
                    <Chip
                      key={type}
                      label={type.toUpperCase()}
                      onClick={() => {
                        const types = formData.allowedFileTypes.includes(type)
                          ? formData.allowedFileTypes.filter(t => t !== type)
                          : [...formData.allowedFileTypes, type];
                        handleInputChange('allowedFileTypes', types);
                      }}
                      color={formData.allowedFileTypes.includes(type) ? 'primary' : 'default'}
                      variant={formData.allowedFileTypes.includes(type) ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}

        {activeTab === 2 && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Assignment Attachments
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload materials students need to complete this assignment
            </Typography>

            <Button
              variant="contained"
              component="label"
              startIcon={<AddIcon />}
              disabled={uploading}
              sx={{ mb: 2 }}
            >
              Add Attachment
              <input
                type="file"
                hidden
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,.jpg,.png"
                onChange={(e) => handleAttachmentUpload(e.target.files[0])}
              />
            </Button>

            {uploading && (
              <Box sx={{ mb: 2 }}>
                <LinearProgress variant="determinate" value={uploadProgress} />
              </Box>
            )}

            {formData.attachments.length > 0 ? (
              <List>
                {formData.attachments.map((attachment, index) => (
                  <ListItem key={index} sx={{ border: '1px solid #e0e0e0', mb: 1, borderRadius: 1 }}>
                    <ListItemText
                      primary={attachment.name}
                      secondary={`Type: ${attachment.type || 'N/A'} | Size: ${attachment.size ? (attachment.size / 1024).toFixed(2) : '0'} KB`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleAttachmentDelete(index)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info">No attachments added yet</Alert>
            )}
          </Box>
        )}

        {activeTab === 3 && (
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isRequired}
                  onChange={(e) => handleInputChange('isRequired', e.target.checked)}
                />
              }
              label="Required Assignment"
              sx={{ display: 'block', mb: 2 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.allowLateSubmission}
                  onChange={(e) => handleInputChange('allowLateSubmission', e.target.checked)}
                />
              }
              label="Allow Late Submission"
              sx={{ display: 'block', mb: 2 }}
            />

            {formData.allowLateSubmission && (
              <TextField
                fullWidth
                label="Late Penalty (%)"
                type="number"
                value={formData.latePenalty}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  handleInputChange('latePenalty', isNaN(value) ? 0 : Math.min(100, Math.max(0, value)));
                }}
                margin="normal"
                inputProps={{ min: 0, max: 100 }}
                helperText="Percentage deduction for late submissions"
              />
            )}

            <TextField
              fullWidth
              label="Max File Size (MB)"
              type="number"
              value={formData.maxFileSize / 1048576}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                handleInputChange('maxFileSize', isNaN(value) ? 10485760 : value * 1048576);
              }}
              margin="normal"
              inputProps={{ min: 1, max: 100, step: 0.1 }}
              helperText="Maximum file size for submissions"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isPublished}
                  onChange={(e) => handleInputChange('isPublished', e.target.checked)}
                />
              }
              label="Published"
              sx={{ display: 'block', mt: 2 }}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {assignment ? 'Update Assignment' : 'Create Assignment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
