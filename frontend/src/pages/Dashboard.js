import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Paper,
  LinearProgress,
  Button,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  School,
  EmojiEvents,
  TrendingUp,
  PlayCircleOutline,
  Person,
  CardMembership,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
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
      if (err.response?.status === 401) {
        setError('Please login to view your dashboard');
      } else {
        setError('Failed to load dashboard data');
      }
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

  const completedCourses = enrollments.filter((e) => e.completionStatus === 'completed').length;
  const inProgressCourses = enrollments.filter((e) => e.completionStatus === 'in_progress').length;
  const totalProgress = enrollments.length > 0
    ? enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length
    : 0;

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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom>
          Welcome back, {user?.name || 'Student'}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your learning progress and achievements
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <School />
                </Avatar>
                <Box>
                  <Typography variant="h4">{enrollments.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enrolled Courses
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <EmojiEvents />
                </Avatar>
                <Box>
                  <Typography variant="h4">{completedCourses}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <TrendingUp />
                </Avatar>
                <Box>
                  <Typography variant="h4">{inProgressCourses}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    In Progress
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <CardMembership />
                </Avatar>
                <Box>
                  <Typography variant="h4">{completedCourses}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Certificates
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Continue Learning */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Continue Learning
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {enrollments.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  You haven't enrolled in any courses yet
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate('/courses')}
                  sx={{ mt: 2 }}
                >
                  Browse Courses
                </Button>
              </Box>
            ) : (
              <List>
                {enrollments.slice(0, 5).map((enrollment) => (
                  <ListItem
                    key={enrollment._id}
                    sx={{
                      mb: 2,
                      bgcolor: 'grey.50',
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'grey.100' },
                    }}
                    onClick={() => navigate(`/learn/${enrollment.course?._id || enrollment.course}`)}
                  >
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <ListItemText
                          primary={getCourseTitle(enrollment.course?.title)}
                          secondary={`${enrollment.progress || 0}% complete`}
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<PlayCircleOutline />}
                        >
                          Continue
                        </Button>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={enrollment.progress || 0}
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}
            {enrollments.length > 5 && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button variant="text" onClick={() => navigate('/my-courses')}>
                  View All Courses
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Your Progress
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress
                  variant="determinate"
                  value={totalProgress}
                  size={120}
                  thickness={4}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h4" component="div" color="text.secondary">
                    {Math.round(totalProgress)}%
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Overall Progress
              </Typography>
            </Box>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Profile
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
                <Person />
              </Avatar>
              <Box>
                <Typography variant="subtitle1">{user?.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {user?.email}
                </Typography>
              </Box>
            </Box>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate('/my-courses')}
            >
              View My Courses
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
