import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  IconButton,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Close as CloseIcon, CloudUpload as UploadIcon } from '@mui/icons-material';
import adminService from '../services/adminService';

export default function LessonEditor({ open, onClose, lesson, courseId, onSave }) {
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    course: courseId,
    title: { en: '' },
    description: { en: '' },
    type: 'video',
    order: 0,
    isFree: false,
    isPublished: false,
    duration: 0,
    content: {
      video: { url: '', duration: 0, thumbnail: '' },
      text: { en: '' },
      document: { url: '', type: '', name: '' },
    },
    resources: [],
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (lesson) {
      setFormData({
        course: lesson.course || courseId,
        title: lesson.title || { en: '' },
        description: lesson.description || { en: '' },
        type: lesson.type || 'video',
        order: lesson.order || 0,
        isFree: lesson.isFree || false,
        isPublished: lesson.isPublished || false,
        duration: lesson.duration || 0,
        content: lesson.content || {
          video: { url: '', duration: 0, thumbnail: '' },
          text: { en: '' },
          document: { url: '', type: '', name: '' },
        },
        resources: lesson.resources || [],
      });
    }
  }, [lesson, courseId]);

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

  const handleContentChange = (contentType, field, value) => {
    setFormData((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        [contentType]: {
          ...prev.content[contentType],
          [field]: value,
        },
      },
    }));
  };

  const handleFileUpload = async (file, category) => {
    try {
      setUploading(true);
      setError('');
      setUploadProgress(0);

      const formDataUpload = new FormData();
      formDataUpload.append('files', file);
      formDataUpload.append('category', category);

      const response = await adminService.uploadMedia(formDataUpload);

      if (response.success && response.data.length > 0) {
        const uploadedFile = response.data[0];
        setUploadProgress(100);

        if (category === 'videos') {
          handleContentChange('video', 'url', uploadedFile.url);
          if (uploadedFile.metadata?.duration) {
            handleContentChange('video', 'duration', uploadedFile.metadata.duration);
          }
        } else if (category === 'documents') {
          handleContentChange('document', 'url', uploadedFile.url);
          handleContentChange('document', 'type', uploadedFile.metadata?.format || '');
          handleContentChange('document', 'name', uploadedFile.originalName);
        }
      }

      setUploading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setError('');
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save lesson');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {lesson ? 'Edit Lesson' : 'Create New Lesson'}
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
          <Tab label="Content" />
          <Tab label="Settings" />
        </Tabs>

        {activeTab === 0 && (
          <Box>
            <TextField
              fullWidth
              label="Lesson Title"
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
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Lesson Type</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
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

            <TextField
              fullWidth
              label="Order"
              type="number"
              value={formData.order}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                handleInputChange('order', isNaN(value) ? 0 : value);
              }}
              margin="normal"
            />
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            {formData.type === 'video' && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Video Content
                </Typography>

                <Button
                  variant="contained"
                  component="label"
                  startIcon={<UploadIcon />}
                  disabled={uploading}
                  sx={{ mb: 2 }}
                >
                  Upload Video
                  <input
                    type="file"
                    hidden
                    accept="video/*"
                    onChange={(e) => handleFileUpload(e.target.files[0], 'videos')}
                  />
                </Button>

                {uploading && (
                  <Box sx={{ mb: 2 }}>
                    <LinearProgress variant="determinate" value={uploadProgress} />
                  </Box>
                )}

                <TextField
                  fullWidth
                  label="Video URL"
                  value={formData.content.video?.url || ''}
                  onChange={(e) => handleContentChange('video', 'url', e.target.value)}
                  margin="normal"
                  helperText="Upload a video or provide a URL"
                />

                <TextField
                  fullWidth
                  label="Thumbnail URL"
                  value={formData.content.video?.thumbnail || ''}
                  onChange={(e) => handleContentChange('video', 'thumbnail', e.target.value)}
                  margin="normal"
                />

                <TextField
                  fullWidth
                  label="Duration (seconds)"
                  type="number"
                  value={formData.content.video?.duration || 0}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    handleContentChange('video', 'duration', isNaN(value) ? 0 : value);
                  }}
                  margin="normal"
                />
              </Box>
            )}

            {formData.type === 'text' && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Text Content
                </Typography>

                <TextField
                  fullWidth
                  label="Content"
                  value={formData.content.text?.en || ''}
                  onChange={(e) => handleContentChange('text', 'en', e.target.value)}
                  margin="normal"
                  multiline
                  rows={10}
                  placeholder="Enter lesson content here..."
                />
              </Box>
            )}

            {formData.type === 'document' && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Document Content
                </Typography>

                <Button
                  variant="contained"
                  component="label"
                  startIcon={<UploadIcon />}
                  disabled={uploading}
                  sx={{ mb: 2 }}
                >
                  Upload Document
                  <input
                    type="file"
                    hidden
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                    onChange={(e) => handleFileUpload(e.target.files[0], 'documents')}
                  />
                </Button>

                {uploading && (
                  <Box sx={{ mb: 2 }}>
                    <LinearProgress variant="determinate" value={uploadProgress} />
                  </Box>
                )}

                <TextField
                  fullWidth
                  label="Document URL"
                  value={formData.content.document?.url || ''}
                  onChange={(e) => handleContentChange('document', 'url', e.target.value)}
                  margin="normal"
                />

                <TextField
                  fullWidth
                  label="Document Name"
                  value={formData.content.document?.name || ''}
                  onChange={(e) => handleContentChange('document', 'name', e.target.value)}
                  margin="normal"
                />
              </Box>
            )}

            {(formData.type === 'quiz' || formData.type === 'assignment') && (
              <Box>
                <Alert severity="info" sx={{ mb: 2 }}>
                  {formData.type === 'quiz'
                    ? 'Quizzes are managed separately. Save this lesson and then add a quiz to it.'
                    : 'Assignment content will be managed through the assignment management interface.'}
                </Alert>
              </Box>
            )}
          </Box>
        )}

        {activeTab === 2 && (
          <Box>
            <TextField
              fullWidth
              label="Duration (minutes)"
              type="number"
              value={formData.duration}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                handleInputChange('duration', isNaN(value) ? 0 : value);
              }}
              margin="normal"
              helperText="Estimated time to complete this lesson"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isFree}
                  onChange={(e) => handleInputChange('isFree', e.target.checked)}
                />
              }
              label="Free Preview"
              sx={{ mt: 2, display: 'block' }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isPublished}
                  onChange={(e) => handleInputChange('isPublished', e.target.checked)}
                />
              }
              label="Published"
              sx={{ mt: 1, display: 'block' }}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={uploading}>
          {lesson ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
