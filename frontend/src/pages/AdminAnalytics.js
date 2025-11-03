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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  People as UsersIcon,
  School as CourseIcon,
  CardMembership as CertificateIcon,
  TrendingUp as TrendingIcon,
  AttachMoney as RevenueIcon,
  PersonAdd as NewUserIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminAnalytics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);

  useEffect(() => {
    // Check if user is admin
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchPlatformAnalytics();
  }, [user, navigate]);

  const fetchPlatformAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/analytics/platform');
      setAnalyticsData(response.data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatGrowthData = (growthData) => {
    if (!growthData || growthData.length === 0) return [];
    
    return growthData.map(item => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      users: item.count
    }));
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

  const { overview, popularCourses, userGrowth } = analyticsData;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        Platform Analytics
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Total Users Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <UsersIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h6">Total Users</Typography>
              </Box>
              <Typography variant="h4" gutterBottom>
                {overview?.totalUsers || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active: {overview?.activeUsers || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* New Users Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <NewUserIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h6">New Users</Typography>
              </Box>
              <Typography variant="h4" gutterBottom>
                {overview?.newUsers || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last 30 days
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Courses Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <CourseIcon color="secondary" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h6">Total Courses</Typography>
              </Box>
              <Typography variant="h4" gutterBottom>
                {overview?.totalCourses || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active courses
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Enrollments Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TrendingIcon color="info" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h6">Enrollments</Typography>
              </Box>
              <Typography variant="h4" gutterBottom>
                {overview?.totalEnrollments || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total enrollments
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Certificates Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <CertificateIcon color="warning" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h6">Certificates</Typography>
              </Box>
              <Typography variant="h4" gutterBottom>
                {overview?.totalCertificates || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Issued certificates
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Revenue Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <RevenueIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h6">Revenue</Typography>
              </Box>
              <Typography variant="h4" gutterBottom>
                {formatCurrency(overview?.totalRevenue)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total revenue
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* User Growth Chart */}
        {userGrowth && userGrowth.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                User Growth Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={formatGrowthData(userGrowth)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="users" stroke="#2e7d32" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}

        {/* Popular Courses */}
        {popularCourses && popularCourses.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Popular Courses (Top 10)
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Course</TableCell>
                      <TableCell align="right">Views</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {popularCourses.map((course, index) => (
                      <TableRow key={index}>
                        <TableCell>{course.title || 'Unknown Course'}</TableCell>
                        <TableCell align="right">{course.views || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        )}

        {/* Popular Courses Bar Chart */}
        {popularCourses && popularCourses.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Popular Courses Views
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={popularCourses.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="title" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="views" fill="#2e7d32" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default AdminAnalytics;
