import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Breadcrumbs,
  Link,
  CircularProgress,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import SectionManager from '../components/SectionManager';
import LessonSectionManager from '../components/LessonSectionManager';
import { useAuth } from '../contexts/AuthContext';

const CourseContentManager = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'trainer')) {
      navigate('/');
      return;
    }
    fetchCourse();
  }, [user, navigate, courseId]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/courses/${courseId}`);
      setCourse(response.data.data);
      setSections(response.data.data.sections || []);
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error('Failed to load course');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = () => {
    fetchCourse();
  };

  const getCourseTitle = () => {
    if (!course || !course.title) return 'Unknown Course';
    return course.title.en || course.title.ar || course.title.fr || 'Unknown Course';
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!course) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">Course not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
        >
          Back
        </Button>

        <Breadcrumbs sx={{ mb: 2 }}>
          <Link
            underline="hover"
            color="inherit"
            sx={{ cursor: 'pointer' }}
            onClick={() => navigate('/admin/courses')}
          >
            Courses
          </Link>
          <Typography color="text.primary">{getCourseTitle()}</Typography>
          <Typography color="text.primary">Content Management</Typography>
        </Breadcrumbs>

        <Typography variant="h4" component="h1" gutterBottom>
          Course Content Management
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Organize your course into sections and manage lesson assignments
        </Typography>
      </Box>

      {/* Course Info */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {getCourseTitle()}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary">
            Category: {course.category}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Level: {course.level}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Duration: {course.duration} hours
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sections: {sections.length}
          </Typography>
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(e, newValue) => setCurrentTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Manage Sections" />
          <Tab label="Organize Lessons" />
        </Tabs>
      </Paper>

      {/* Content */}
      <Paper sx={{ p: 3 }}>
        {currentTab === 0 && (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Sections</strong> help you organize your course into logical modules or chapters.
                You can create sections, reorder them using drag-and-drop, and edit their details.
              </Typography>
            </Alert>
            <SectionManager courseId={courseId} onUpdate={handleUpdate} />
          </Box>
        )}

        {currentTab === 1 && (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Assign lessons</strong> to sections and reorder them using drag-and-drop.
                This helps students follow a structured learning path.
              </Typography>
            </Alert>
            <LessonSectionManager
              courseId={courseId}
              sections={sections}
              onUpdate={handleUpdate}
            />
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default CourseContentManager;
