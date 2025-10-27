import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

// Define colours for pie segments
const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

/**
 * UserAnalytics component renders detailed analytics for a student's account.
 * It fetches data from `/api/analytics/user` and visualises metrics such as
 * course enrollments, certificates earned, learning time, quiz performance and
 * learning streak using charts.
 */
const UserAnalytics = () => {
  const { token } = useAuth();
  const { t } = useTranslation();

  // Local state for analytics data, loading and error handling
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
  /**
   * Fetch analytics for the current user from the backend. A bearer token is
   * attached to the request for authorisation. The response structure is
   * defined in the backend controller: it includes `enrollments` (total,
   * active, completed), `certificates`, `learningTime`, `quizPerformance`
   * (average score and total quizzes) and `learningStreak` among other fields
   *【592339372323590†L351-L364】.
   */
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get('/api/analytics/user', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setAnalytics(response.data.data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || err.message || 'Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [token]);

  // While loading, show a spinner
  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  // If there was an error fetching analytics, display it
  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  // Do not attempt to render charts if analytics is empty
  if (!analytics) {
    return null;
  }

  // Prepare pie chart data for course enrollment distribution
  const { total, active, completed } = analytics.enrollments;
  const notStarted = total - active - completed;
  const enrollmentData = [
    { name: t('active'), value: active },
    { name: t('completed'), value: completed },
    { name: t('notStarted'), value: notStarted }
  ];

  // Prepare bar chart data for quiz performance
  const quizData = [
    {
      name: t('quizPerformance'),
      averageScore: analytics.quizPerformance.averageScore,
      totalQuizzes: analytics.quizPerformance.totalQuizzes
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {t('analytics')}
      </Typography>

      {/* Overview metrics */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6">{t('coursesEnrolled')}</Typography>
              <Typography variant="h4">{total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6">{t('certificatesEarned')}</Typography>
              <Typography variant="h4">{analytics.certificates}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6">{t('learningTime')}</Typography>
              <Typography variant="h4">{analytics.learningTime}h</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6">{t('learningStreak')}</Typography>
              <Typography variant="h4">{analytics.learningStreak}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Enrollment distribution pie chart */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          {t('enrollmentDistribution')}
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={enrollmentData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {enrollmentData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Box>

      {/* Quiz performance bar chart */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          {t('quizPerformance')}
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={quizData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="averageScore" fill="#8884d8" name={t('averageScore')} />
            <Bar dataKey="totalQuizzes" fill="#82ca9d" name={t('totalQuizzes')} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default UserAnalytics;
