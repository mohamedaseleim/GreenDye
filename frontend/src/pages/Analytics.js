import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import {
  School as CourseIcon,
  CardMembership as CertificateIcon,
  Timer as TimeIcon,
  EmojiEvents as AchievementIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Analytics = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    fetchUserAnalytics();
  }, [isAuthenticated, navigate]);

  const fetchUserAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/analytics/user');
      setAnalyticsData(response.data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0 min';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} min`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!analyticsData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h5" color="text.secondary">
          No analytics data available
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        My Learning Analytics
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Enrollments Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <CourseIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h6">Courses</Typography>
              </Box>
              <Typography variant="h4" gutterBottom>
                {analyticsData.enrollments?.total || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active: {analyticsData.enrollments?.active || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed: {analyticsData.enrollments?.completed || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Certificates Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <CertificateIcon color="secondary" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h6">Certificates</Typography>
              </Box>
              <Typography variant="h4" gutterBottom>
                {analyticsData.certificates || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Certificates earned
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Learning Time Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TimeIcon color="info" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h6">Learning Time</Typography>
              </Box>
              <Typography variant="h4" gutterBottom>
                {formatTime(analyticsData.learningTime)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total time spent
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Learning Streak Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <AchievementIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h6">Streak</Typography>
              </Box>
              <Typography variant="h4" gutterBottom>
                {analyticsData.learningStreak || 0} days
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Current streak
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Quiz Performance */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quiz Performance
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Average Score</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {analyticsData.quizPerformance?.averageScore
                    ? `${Math.round(analyticsData.quizPerformance.averageScore)}%`
                    : 'N/A'}
                </Typography>
              </Box>
              {analyticsData.quizPerformance?.averageScore && (
                <LinearProgress
                  variant="determinate"
                  value={analyticsData.quizPerformance.averageScore}
                  sx={{ height: 10, borderRadius: 5 }}
                />
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Total Quizzes Completed: {analyticsData.quizPerformance?.totalQuizzes || 0}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            {analyticsData.recentActivity && analyticsData.recentActivity.length > 0 ? (
              <Box sx={{ mt: 2 }}>
                {analyticsData.recentActivity.map((activity, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 1,
                      borderBottom: index < analyticsData.recentActivity.length - 1 ? '1px solid #eee' : 'none'
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {activity.course?.title || 'Unknown Course'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Progress: {Math.round(activity.progress || 0)}%
                      </Typography>
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        backgroundColor: activity.status === 'completed' ? '#4caf50' : '#ff9800',
                        color: 'white'
                      }}
                    >
                      {activity.status}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                No recent activity
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Analytics;
