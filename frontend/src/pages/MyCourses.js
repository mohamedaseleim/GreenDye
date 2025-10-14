import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Tabs,
  Tab,
  LinearProgress,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { PlayCircleOutline, CheckCircle, Schedule } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const MyCourses = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (user) {
      fetchEnrollments();
    }
  }, [user]);

  const fetchEnrollments = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/enrollments/my-courses`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setEnrollments(response.data.data || []);
    } catch (err) {
      setError('Failed to load your courses. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const filteredEnrollments = enrollments.filter((enrollment) => {
    if (tabValue === 0) return true; // All courses
    if (tabValue === 1) return enrollment.completionStatus === 'in_progress'; // In Progress
    if (tabValue === 2) return enrollment.completionStatus === 'completed'; // Completed
    return true;
  });

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Typography variant="h3" gutterBottom>
        My Courses
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage and continue your learning journey
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label={`All Courses (${enrollments.length})`} />
          <Tab
            label={`In Progress (${enrollments.filter((e) => e.completionStatus === 'in_progress').length})`}
          />
          <Tab
            label={`Completed (${enrollments.filter((e) => e.completionStatus === 'completed').length})`}
          />
        </Tabs>
      </Box>

      {/* Courses Grid */}
      {filteredEnrollments.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {tabValue === 0
              ? "You haven't enrolled in any courses yet"
              : tabValue === 1
              ? 'No courses in progress'
              : 'No completed courses yet'}
          </Typography>
          {tabValue === 0 && (
            <Button variant="contained" onClick={() => navigate('/courses')} sx={{ mt: 2 }}>
              Browse Courses
            </Button>
          )}
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredEnrollments.map((enrollment) => {
            const course = enrollment.course || {};
            const courseId = typeof course === 'object' ? course._id : course;
            
            return (
              <Grid item xs={12} sm={6} md={4} key={enrollment._id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => navigate(`/learn/${courseId}`)}
                >
                  <CardMedia
                    component="img"
                    height="180"
                    image={course.thumbnail || '/placeholder-course.jpg'}
                    alt={getCourseTitle(course.title)}
                    sx={{ bgcolor: 'grey.200' }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                      <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        {getCourseTitle(course.title)}
                      </Typography>
                      {enrollment.completionStatus === 'completed' && (
                        <CheckCircle color="success" />
                      )}
                      {enrollment.completionStatus === 'in_progress' && (
                        <Schedule color="primary" />
                      )}
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {getCourseDescription(course.description)}
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Progress
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {enrollment.progress || 0}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={enrollment.progress || 0}
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                    </Box>
                    {enrollment.lastAccessedAt && (
                      <Typography variant="caption" color="text.secondary">
                        Last accessed: {new Date(enrollment.lastAccessedAt).toLocaleDateString()}
                      </Typography>
                    )}
                    {enrollment.completionStatus === 'completed' && enrollment.certificateIssued && (
                      <Chip
                        label="Certificate Available"
                        color="success"
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    )}
                  </CardContent>
                  <CardActions>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<PlayCircleOutline />}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/learn/${courseId}`);
                      }}
                    >
                      {enrollment.completionStatus === 'completed' ? 'Review' : 'Continue Learning'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
};

export default MyCourses;
