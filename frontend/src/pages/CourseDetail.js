import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
} from '@mui/material';
import {
  PlayCircleOutline,
  AccessTime,
  Language,
  School,
  CheckCircle,
  Person,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchCourseDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchCourseDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/courses/${id}`
      );
      setCourse(response.data.data);
    } catch (err) {
      setError('Failed to load course details. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      toast.info('Please login to enroll in this course');
      navigate('/login');
      return;
    }

    setEnrolling(true);
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/enrollments/enroll`,
        { courseId: id },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      toast.success('Successfully enrolled in the course!');
      navigate('/my-courses');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to enroll. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  const getCourseTitle = (courseTitle) => {
    if (typeof courseTitle === 'object' && courseTitle !== null) {
      return courseTitle.en || courseTitle.ar || courseTitle.fr || 'Untitled Course';
    }
    return courseTitle || 'Untitled Course';
  };

  const getCourseDescription = (courseDescription) => {
    if (typeof courseDescription === 'object' && courseDescription !== null) {
      return courseDescription.en || courseDescription.ar || courseDescription.fr || '';
    }
    return courseDescription || '';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !course) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          {error || 'Course not found'}
        </Alert>
      </Container>
    );
  }

  const learningObjectives = course.learningObjectives || [
    'Understand core concepts',
    'Apply practical skills',
    'Complete hands-on projects',
    'Earn a certificate',
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 6,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                {course.category && (
                  <Chip label={course.category} sx={{ bgcolor: 'white', color: 'primary.main' }} />
                )}
                {course.level && (
                  <Chip label={course.level} variant="outlined" sx={{ color: 'white', borderColor: 'white' }} />
                )}
              </Box>
              <Typography variant="h3" component="h1" gutterBottom>
                {getCourseTitle(course.title)}
              </Typography>
              <Typography variant="h6" sx={{ mb: 3 }}>
                {getCourseDescription(course.shortDescription || course.description)}
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {course.duration && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTime />
                    <Typography>{course.duration} hours</Typography>
                  </Box>
                )}
                {course.language && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Language />
                    <Typography>{Array.isArray(course.language) ? course.language.join(', ') : course.language}</Typography>
                  </Box>
                )}
                {course.studentsEnrolled !== undefined && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <School />
                    <Typography>{course.studentsEnrolled} students enrolled</Typography>
                  </Box>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h4" color="primary" gutterBottom>
                    {course.price === 0 ? 'Free' : `$${course.price}`}
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={<PlayCircleOutline />}
                    onClick={handleEnroll}
                    disabled={enrolling}
                    sx={{ mb: 2 }}
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll Now'}
                  </Button>
                  <Typography variant="body2" color="text.secondary" align="center">
                    {course.price === 0 ? 'Access all course content for free' : '30-day money-back guarantee'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Course Content */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            {/* About Section */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                About This Course
              </Typography>
              <Typography variant="body1" paragraph>
                {getCourseDescription(course.description)}
              </Typography>
            </Paper>

            {/* Learning Objectives */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                What You'll Learn
              </Typography>
              <List>
                {learningObjectives.map((objective, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckCircle color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={objective} />
                  </ListItem>
                ))}
              </List>
            </Paper>

            {/* Requirements */}
            {course.prerequisites && course.prerequisites.length > 0 && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h5" gutterBottom>
                  Requirements
                </Typography>
                <List>
                  {course.prerequisites.map((req, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={req} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            {/* Instructor Info */}
            {course.instructor && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Instructor
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ width: 56, height: 56 }}>
                    <Person />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1">
                      {course.instructor.name || 'Expert Trainer'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {course.instructor.title || 'Professional Instructor'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )}

            {/* Course Info */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Course Details
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Duration
                </Typography>
                <Typography variant="body2">{course.duration} hours</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Level
                </Typography>
                <Typography variant="body2">{course.level}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Category
                </Typography>
                <Typography variant="body2">{course.category}</Typography>
              </Box>
              {course.certificate && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Certificate
                  </Typography>
                  <Typography variant="body2">
                    <CheckCircle color="primary" fontSize="small" />
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default CourseDetail;
