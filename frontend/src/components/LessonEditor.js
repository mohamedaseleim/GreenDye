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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import { Close as CloseIcon, CloudUpload as UploadIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
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

  // ReactQuill editor configuration
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

  const handleResourceUpload = async (file) => {
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

        const newResource = {
          name: uploadedFile.originalName,
          url: uploadedFile.url,
          type: uploadedFile.metadata?.format || file.type,
          size: file.size,
          description: ''
        };

        setFormData((prev) => ({
          ...prev,
          resources: [...prev.resources, newResource]
        }));
      }

      setUploading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Resource upload failed');
      setUploading(false);
    }
  };

  const handleResourceDelete = (index) => {
    setFormData((prev) => ({
      ...prev,
      resources: prev.resources.filter((_, i) => i !== index)
    }));
  };

  const handleResourceDescriptionChange = (index, description) => {
    setFormData((prev) => ({
      ...prev,
      resources: prev.resources.map((resource, i) => 
        i === index ? { ...resource, description } : resource
      )
    }));
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
          <Tab label="Resources" />
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

                <Box sx={{ mb: 2, mt: 2 }}>
                  <ReactQuill
                    theme="snow"
                    value={formData.content.text?.en || ''}
                    onChange={(value) => handleContentChange('text', 'en', value)}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Enter lesson content here..."
                    style={{ height: '300px', marginBottom: '50px' }}
                  />
                </Box>
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
            <Typography variant="subtitle1" gutterBottom>
              Downloadable Resources
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload PDFs, documents, and other materials for students to download
            </Typography>

            <Button
              variant="contained"
              component="label"
              startIcon={<AddIcon />}
              disabled={uploading}
              sx={{ mb: 2 }}
            >
              Add Resource
              <input
                type="file"
                hidden
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,.jpg,.png"
                onChange={(e) => handleResourceUpload(e.target.files[0])}
              />
            </Button>

            {uploading && (
              <Box sx={{ mb: 2 }}>
                <LinearProgress variant="determinate" value={uploadProgress} />
              </Box>
            )}

            {formData.resources.length > 0 ? (
              <List>
                {formData.resources.map((resource, index) => (
                  <ListItem key={index} sx={{ border: '1px solid #e0e0e0', mb: 1, borderRadius: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <ListItemText
                        primary={resource.name}
                        secondary={`Type: ${resource.type || 'N/A'} | Size: ${resource.size ? (resource.size / 1024).toFixed(2) : '0'} KB`}
                      />
                      <TextField
                        fullWidth
                        size="small"
                        label="Description (optional)"
                        value={resource.description || ''}
                        onChange={(e) => handleResourceDescriptionChange(index, e.target.value)}
                        sx={{ mt: 1 }}
                      />
                    </Box>
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleResourceDelete(index)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info">No resources added yet</Alert>
            )}
          </Box>
        )}

        {activeTab === 3 && (
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
