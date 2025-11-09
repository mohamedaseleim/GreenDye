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
  Button,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
} from '@mui/material';
import {
  School,
  People,
  TrendingUp,
  AttachMoney,
  Star,
  Add,
  Visibility,
  CheckCircle,
  Schedule,
  VerifiedUser,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const TrainerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  useEffect(() => {
    if (user && user.role === 'trainer') {
      fetchDashboardData();
      fetchCourses();
    } else if (user && user.role !== 'trainer') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/trainer/dashboard/stats`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setStats(response.data.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Trainer profile not found. Please complete your trainer profile setup.');
      } else if (err.response?.status === 401) {
        setError('Please login to view your dashboard');
      } else {
        setError('Failed to load dashboard data');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    setLoadingCourses(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/trainer/dashboard/courses`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setCourses(response.data.data || []);
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const getCourseTitle = (courseTitle) => {
    if (typeof courseTitle === 'object' && courseTitle !== null) {
      return courseTitle.en || courseTitle.ar || courseTitle.fr || 'Untitled Course';
    }
    return courseTitle || 'Untitled Course';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error && !stats) {
    return (
      <Container>
        <Box sx={{ py: 8 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Typography variant="h3" gutterBottom>
            Trainer Dashboard
          </Typography>
          {stats?.trainer?.isVerified && (
            <Chip
              icon={<VerifiedUser />}
              label="Verified Trainer"
              color="success"
              variant="outlined"
            />
          )}
        </Box>
        <Typography variant="body1" color="text.secondary">
          Welcome back, {stats?.trainer?.fullName || user?.name}!
        </Typography>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                  <School />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats?.stats?.totalCourses || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Courses
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stats?.stats?.publishedCourses || 0} published
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
                <Avatar sx={{ bgcolor: 'info.main', width: 56, height: 56 }}>
                  <People />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats?.stats?.totalStudents || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Students
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stats?.stats?.activeStudents || 0} active
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
                <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
                  <AttachMoney />
                </Avatar>
                <Box>
                  <Typography variant="h4">
                    {formatCurrency(stats?.earnings?.trainerEarnings || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Earnings
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatCurrency(stats?.earnings?.pendingPayout || 0)} pending
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
                <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56 }}>
                  <Star />
                </Avatar>
                <Box>
                  <Typography variant="h4">
                    {stats?.stats?.averageRating?.toFixed(1) || '0.0'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Rating
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stats?.stats?.totalReviews || 0} reviews
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* My Courses */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">My Courses</Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/admin/courses')}
              >
                Create Course
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {loadingCourses ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : courses.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  You haven't created any courses yet
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate('/admin/courses')}
                  sx={{ mt: 2 }}
                >
                  Create Your First Course
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Course</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell align="center">Students</TableCell>
                      <TableCell align="center">Rating</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {courses.slice(0, 5).map((course) => (
                      <TableRow key={course._id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <img
                              src={course.thumbnail || '/uploads/courses/default-thumbnail.jpg'}
                              alt={getCourseTitle(course.title)}
                              style={{ width: 50, height: 50, borderRadius: 4, objectFit: 'cover' }}
                            />
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {getCourseTitle(course.title)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {course.category}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={course.isPublished ? 'Published' : 'Draft'}
                            color={course.isPublished ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          {course.stats?.totalEnrollments || 0}
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            <Star fontSize="small" sx={{ color: 'warning.main' }} />
                            <Typography variant="body2">
                              {course.stats?.rating?.toFixed(1) || 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(course.stats?.revenue || 0)}
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            startIcon={<Visibility />}
                            onClick={() => navigate(`/courses/${course._id}`)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {courses.length > 5 && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button variant="text" onClick={() => navigate('/admin/courses')}>
                  View All Courses
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Earnings Summary */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Earnings Summary
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Revenue
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {formatCurrency(stats?.earnings?.totalRevenue || 0)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Platform Fee ({stats?.trainer?.commissionRate || 0}%)
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {formatCurrency(stats?.earnings?.platformFee || 0)}
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" fontWeight="bold">
                  Your Earnings
                </Typography>
                <Typography variant="body2" fontWeight="bold" color="success.main">
                  {formatCurrency(stats?.earnings?.trainerEarnings || 0)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Pending Payout
                </Typography>
                <Typography variant="body2" fontWeight="medium" color="warning.main">
                  {formatCurrency(stats?.earnings?.pendingPayout || 0)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Total Paid Out
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {formatCurrency(stats?.earnings?.totalPaidOut || 0)}
                </Typography>
              </Box>
            </Box>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate('/admin/payments')}
            >
              View Payment Details
            </Button>
          </Paper>

          {/* Recent Activity */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Enrollments
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <List>
                {stats.recentActivity.map((activity, index) => (
                  <ListItem key={activity._id || index} sx={{ px: 0 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight="medium">
                          {activity.student?.name || 'Unknown Student'}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="caption" display="block">
                            {activity.course?.title || 'Unknown Course'}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Chip
                              size="small"
                              label={activity.status}
                              color={
                                activity.status === 'completed'
                                  ? 'success'
                                  : activity.status === 'active'
                                  ? 'primary'
                                  : 'default'
                              }
                              icon={
                                activity.status === 'completed' ? (
                                  <CheckCircle fontSize="small" />
                                ) : (
                                  <Schedule fontSize="small" />
                                )
                              }
                            />
                            <Typography variant="caption" color="text.secondary">
                              {activity.progress}% complete
                            </Typography>
                          </Box>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No recent enrollments
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Add />}
                onClick={() => navigate('/admin/courses')}
              >
                Create New Course
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<People />}
                onClick={() => navigate('/admin/enrollments')}
              >
                View All Students
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<TrendingUp />}
                onClick={() => navigate('/analytics')}
              >
                View Analytics
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<AttachMoney />}
                onClick={() => navigate('/admin/payments')}
              >
                Earnings & Payouts
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
};

export default TrainerDashboard;
