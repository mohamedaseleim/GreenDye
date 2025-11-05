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
  TableRow,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Tabs,
  Tab
} from '@mui/material';
import {
  People as UsersIcon,
  School as CourseIcon,
  CardMembership as CertificateIcon,
  TrendingUp as TrendingIcon,
  AttachMoney as RevenueIcon,
  PersonAdd as NewUserIcon,
  Public as GeographicIcon,
  Schedule as TimeIcon,
  FilterList as FunnelIcon
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
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';
import axios from 'axios';

const MAX_CHART_COURSES = 5;
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D'];

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [userGrowthData, setUserGrowthData] = useState(null);
  const [revenueTrendsData, setRevenueTrendsData] = useState(null);
  const [coursePopularityData, setCoursePopularityData] = useState(null);
  const [geographicData, setGeographicData] = useState(null);
  const [peakUsageData, setPeakUsageData] = useState(null);
  const [conversionFunnelData, setConversionFunnelData] = useState(null);
  const [growthPeriod, setGrowthPeriod] = useState('monthly');
  const [revenuePeriod, setRevenuePeriod] = useState('monthly');
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  useEffect(() => {
    if (userGrowthData) {
      fetchUserGrowth();
    }
  }, [growthPeriod]);

  useEffect(() => {
    if (revenueTrendsData) {
      fetchRevenueTrends();
    }
  }, [revenuePeriod]);

  const fetchAllAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const headers = {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      };

      const [
        platformRes,
        userGrowthRes,
        revenueTrendsRes,
        coursePopularityRes,
        geographicRes,
        peakUsageRes,
        conversionFunnelRes
      ] = await Promise.all([
        axios.get(`${apiUrl}/api/analytics/platform`, { headers }),
        axios.get(`${apiUrl}/api/analytics/user-growth?period=${growthPeriod}`, { headers }),
        axios.get(`${apiUrl}/api/analytics/revenue-trends?period=${revenuePeriod}`, { headers }),
        axios.get(`${apiUrl}/api/analytics/course-popularity`, { headers }),
        axios.get(`${apiUrl}/api/analytics/geographic-distribution`, { headers }),
        axios.get(`${apiUrl}/api/analytics/peak-usage-times`, { headers }),
        axios.get(`${apiUrl}/api/analytics/conversion-funnel`, { headers })
      ]);

      setAnalyticsData(platformRes.data.data);
      setUserGrowthData(userGrowthRes.data.data);
      setRevenueTrendsData(revenueTrendsRes.data.data);
      setCoursePopularityData(coursePopularityRes.data.data);
      setGeographicData(geographicRes.data.data);
      setPeakUsageData(peakUsageRes.data.data);
      setConversionFunnelData(conversionFunnelRes.data.data);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Authentication required');
      } else if (err.response?.status === 403) {
        setError('Admin access required to view platform analytics');
      } else {
        setError('Failed to load platform analytics');
      }
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserGrowth = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.get(
        `${apiUrl}/api/analytics/user-growth?period=${growthPeriod}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setUserGrowthData(response.data.data);
    } catch (err) {
      console.error('Error fetching user growth:', err);
    }
  };

  const fetchRevenueTrends = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.get(
        `${apiUrl}/api/analytics/revenue-trends?period=${revenuePeriod}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setRevenueTrendsData(response.data.data);
    } catch (err) {
      console.error('Error fetching revenue trends:', err);
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
    
    return growthData.map(item => {
      let label = '';
      if (item._id.hour !== undefined) {
        label = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')} ${String(item._id.hour).padStart(2, '0')}:00`;
      } else if (item._id.day !== undefined) {
        label = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`;
      } else if (item._id.week !== undefined) {
        label = `${item._id.year}-W${String(item._id.week).padStart(2, '0')}`;
      } else {
        label = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
      }
      
      return {
        label,
        users: item.count,
        cumulative: item.cumulative,
        students: item.students,
        trainers: item.trainers,
        admins: item.admins
      };
    });
  };

  const formatRevenueData = (revenueData) => {
    if (!revenueData || revenueData.length === 0) return [];
    
    return revenueData.map(item => {
      let label = '';
      if (item._id.day !== undefined) {
        label = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`;
      } else if (item._id.week !== undefined) {
        label = `${item._id.year}-W${String(item._id.week).padStart(2, '0')}`;
      } else {
        label = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
      }
      
      return {
        label,
        revenue: item.revenue,
        transactions: item.transactions,
        avgTransaction: item.avgTransactionValue,
        cumulativeRevenue: item.cumulativeRevenue,
        uniqueUsers: item.uniqueUsers
      };
    });
  };

  const handleGrowthPeriodChange = (event, newPeriod) => {
    if (newPeriod !== null) {
      setGrowthPeriod(newPeriod);
    }
  };

  const handleRevenuePeriodChange = (event, newPeriod) => {
    if (newPeriod !== null) {
      setRevenuePeriod(newPeriod);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!analyticsData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="info">No analytics data available</Alert>
      </Container>
    );
  }

  const { overview, popularCourses, userGrowth } = analyticsData;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        Advanced Analytics Dashboard
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Overview" />
          <Tab label="User Growth" icon={<UsersIcon />} iconPosition="start" />
          <Tab label="Revenue" icon={<RevenueIcon />} iconPosition="start" />
          <Tab label="Courses" icon={<CourseIcon />} iconPosition="start" />
          <Tab label="Geography" icon={<GeographicIcon />} iconPosition="start" />
          <Tab label="Usage Times" icon={<TimeIcon />} iconPosition="start" />
          <Tab label="Conversion Funnel" icon={<FunnelIcon />} iconPosition="start" />
        </Tabs>
      </Box>
      
      {activeTab === 0 && (
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
                <BarChart data={popularCourses.slice(0, MAX_CHART_COURSES)}>
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
      )}

      {/* User Growth Tab */}
      {activeTab === 1 && userGrowthData && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">User Growth Trends</Typography>
                <ToggleButtonGroup
                  value={growthPeriod}
                  exclusive
                  onChange={handleGrowthPeriodChange}
                  size="small"
                >
                  <ToggleButton value="daily">Daily</ToggleButton>
                  <ToggleButton value="weekly">Weekly</ToggleButton>
                  <ToggleButton value="monthly">Monthly</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={formatGrowthData(userGrowthData.growth)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="cumulative" stroke="#1976d2" fill="#1976d2" fillOpacity={0.6} name="Cumulative Users" />
                  <Area type="monotone" dataKey="users" stroke="#2e7d32" fill="#2e7d32" fillOpacity={0.6} name="New Users" />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>User Growth by Role</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={formatGrowthData(userGrowthData.growth)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="students" stackId="a" fill="#0088FE" name="Students" />
                  <Bar dataKey="trainers" stackId="a" fill="#00C49F" name="Trainers" />
                  <Bar dataKey="admins" stackId="a" fill="#FFBB28" name="Admins" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Revenue Trends Tab */}
      {activeTab === 2 && revenueTrendsData && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Revenue Trends</Typography>
                <ToggleButtonGroup
                  value={revenuePeriod}
                  exclusive
                  onChange={handleRevenuePeriodChange}
                  size="small"
                >
                  <ToggleButton value="daily">Daily</ToggleButton>
                  <ToggleButton value="weekly">Weekly</ToggleButton>
                  <ToggleButton value="monthly">Monthly</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={formatRevenueData(revenueTrendsData.trends)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#2e7d32" strokeWidth={2} name="Revenue ($)" />
                  <Line yAxisId="right" type="monotone" dataKey="transactions" stroke="#1976d2" strokeWidth={2} name="Transactions" />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Cumulative Revenue</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={formatRevenueData(revenueTrendsData.trends)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  <Area type="monotone" dataKey="cumulativeRevenue" stroke="#2e7d32" fill="#2e7d32" fillOpacity={0.6} name="Cumulative Revenue ($)" />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Average Transaction Value</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={formatRevenueData(revenueTrendsData.trends)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  <Bar dataKey="avgTransaction" fill="#1976d2" name="Avg Transaction ($)" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Course Popularity Tab */}
      {activeTab === 3 && coursePopularityData && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Course Popularity Metrics</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Course</TableCell>
                      <TableCell align="right">Total Enrollments</TableCell>
                      <TableCell align="right">Completed</TableCell>
                      <TableCell align="right">Active</TableCell>
                      <TableCell align="right">Avg Progress</TableCell>
                      <TableCell align="right">Completion Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {coursePopularityData.courseMetrics.map((course, index) => (
                      <TableRow key={index}>
                        <TableCell>{course.title || 'Unknown Course'}</TableCell>
                        <TableCell align="right">{course.totalEnrollments}</TableCell>
                        <TableCell align="right">{course.completedEnrollments}</TableCell>
                        <TableCell align="right">{course.activeEnrollments}</TableCell>
                        <TableCell align="right">{course.avgProgress.toFixed(1)}%</TableCell>
                        <TableCell align="right">{course.completionRate.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
          {coursePopularityData.enrollmentTrends.length > 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Enrollment Trends (Top Courses)</Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={coursePopularityData.enrollmentTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={(item) => `${item.year}-${String(item.month).padStart(2, '0')}`} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {[...new Set(coursePopularityData.enrollmentTrends.map(item => item.courseTitle))].map((title, index) => (
                      <Line 
                        key={title} 
                        type="monotone" 
                        dataKey="enrollments" 
                        data={coursePopularityData.enrollmentTrends.filter(item => item.courseTitle === title)}
                        stroke={COLORS[index % COLORS.length]} 
                        name={title}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Geographic Distribution Tab */}
      {activeTab === 4 && geographicData && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>User Distribution by Country</Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={geographicData.userDistribution.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalUsers" fill="#1976d2" name="Total Users" />
                  <Bar dataKey="activeUsers" fill="#2e7d32" name="Active Users" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Revenue by Country</Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={geographicData.revenueDistribution.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  <Bar dataKey="totalRevenue" fill="#2e7d32" name="Total Revenue ($)" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Enrollment Distribution by Country</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Country</TableCell>
                      <TableCell align="right">Total Enrollments</TableCell>
                      <TableCell align="right">Completed</TableCell>
                      <TableCell align="right">Completion Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {geographicData.enrollmentDistribution.slice(0, 15).map((country, index) => (
                      <TableRow key={index}>
                        <TableCell>{country._id || 'Unknown'}</TableCell>
                        <TableCell align="right">{country.totalEnrollments}</TableCell>
                        <TableCell align="right">{country.completedEnrollments}</TableCell>
                        <TableCell align="right">
                          {country.totalEnrollments > 0 
                            ? ((country.completedEnrollments / country.totalEnrollments) * 100).toFixed(1) 
                            : 0}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Peak Usage Times Tab */}
      {activeTab === 5 && peakUsageData && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Activity by Hour of Day</Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={peakUsageData.hourlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" label={{ value: 'Hour of Day', position: 'insideBottom', offset: -5 }} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="totalEvents" fill="#1976d2" name="Total Events" />
                  <Bar yAxisId="right" dataKey="uniqueUsers" fill="#2e7d32" name="Unique Users" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Activity by Day of Week</Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={peakUsageData.dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dayName" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="totalEvents" fill="#1976d2" name="Total Events" />
                  <Bar yAxisId="right" dataKey="uniqueUsers" fill="#2e7d32" name="Unique Users" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Conversion Funnel Tab */}
      {activeTab === 6 && conversionFunnelData && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Conversion Funnel - Overall Rate: {conversionFunnelData.overallConversionRate}%
              </Typography>
              <ResponsiveContainer width="100%" height={500}>
                <BarChart
                  data={conversionFunnelData.funnel}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="stage" type="category" />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'count') return [value, 'Count'];
                      if (name === 'percentage') return [`${value}%`, 'Conversion Rate'];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#1976d2" name="Users">
                    <LabelList dataKey="count" position="right" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Funnel Metrics</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Stage</TableCell>
                      <TableCell align="right">Count</TableCell>
                      <TableCell align="right">Conversion Rate</TableCell>
                      <TableCell align="right">Drop-off Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {conversionFunnelData.funnel.map((stage, index) => (
                      <TableRow key={index}>
                        <TableCell>{stage.stage}</TableCell>
                        <TableCell align="right">{stage.count}</TableCell>
                        <TableCell align="right">{stage.percentage}%</TableCell>
                        <TableCell align="right">{stage.dropOff}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default AdminAnalytics;
