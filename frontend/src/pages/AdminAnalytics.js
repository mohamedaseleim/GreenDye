import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

/**
 * AdminAnalytics renders platform-wide analytics for administrators. It pulls
 * statistics such as total users, courses, revenue, etc. from
 * `/api/analytics/platform` which is provided by the backend controller
 *【241128717574194†L150-L161】. Additionally it visualises popular courses and
 * user growth using Recharts. If the user is not authorised (non-admin), an
 * error message will be displayed instead.
 */
const AdminAnalytics = () => {
  const { token } = useAuth();
  const { t } = useTranslation();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/analytics/platform', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setStats(response.data.data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || err.message || 'Failed to fetch platform analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!stats) {
    return null;
  }

  // Extract overview metrics
  const {
    users,
    courses,
    enrollments,
    certificates,
    revenue,
    activeUsers,
    newUsers
  } = stats.overview;

  // Prepare data for popular courses chart
  const popularCoursesData = stats.popularCourses.map(course => ({
    name: course.title,
    enrollments: course.enrollments
  }));

  // Prepare user growth data for line chart
  const userGrowthData = Object.keys(stats.userGrowth).map(month => ({
    month,
    users: stats.userGrowth[month]
  }));

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {t('adminAnalytics')}
      </Typography>

      {/* Overview statistics cards */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6">{t('totalUsers')}</Typography>
              <Typography variant="h4">{users}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6">{t('totalCourses')}</Typography>
              <Typography variant="h4">{courses}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6">{t('totalEnrollments')}</Typography>
              <Typography variant="h4">{enrollments}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6">{t('totalCertificates')}</Typography>
              <Typography variant="h4">{certificates}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6">{t('revenue')}</Typography>
              <Typography variant="h4">${revenue.toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6">{t('activeUsers')}</Typography>
              <Typography variant="h4">{activeUsers}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6">{t('newUsers')}</Typography>
              <Typography variant="h4">{newUsers}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Popular courses bar chart */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          {t('popularCourses')}
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={popularCoursesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={60} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="enrollments" fill="#8884d8" name={t('enrollments')} />
          </BarChart>
        </ResponsiveContainer>
      </Box>

      {/* User growth line chart */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          {t('userGrowth')}
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={userGrowthData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="users" stroke="#82ca9d" name={t('users')} />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default AdminAnalytics;
