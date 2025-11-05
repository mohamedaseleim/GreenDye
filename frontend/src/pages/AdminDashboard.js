import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Tab,
  Tabs,
  CircularProgress
} from '@mui/material';
import {
  Description as PageIcon,
  Image as MediaIcon,
  Announcement as AnnouncementIcon,
  School as CourseIcon,
  Forum as ForumIcon,
  CardMembership as CertificateIcon,
  School as TrainerIcon,
  People as UsersIcon,
  Payment as PaymentIcon,
  Settings as SettingsIcon,
  LibraryBooks as EnrollmentIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import adminService from '../services/adminService';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    // Check if user is admin
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchStats();
  }, [user, navigate]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await adminService.getDashboardStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    // Navigate to different sections based on tab
    const routes = [
      '/admin/dashboard',
      '/admin/certificates',
      '/admin/pages',
      '/admin/media',
      '/admin/announcements',
      '/admin/courses',
      '/admin/trainers',
      '/admin/users',
      '/admin/moderation',
      '/admin/payments',
      '/admin/enrollments',
      '/admin/email-marketing',
      '/admin/settings'
    ];
    
    if (routes[newValue] !== '/admin/dashboard') {
      navigate(routes[newValue]);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        Admin Dashboard
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Overview" />
          <Tab label="Certificates" icon={<CertificateIcon />} iconPosition="start" />
          <Tab label="Pages" icon={<PageIcon />} iconPosition="start" />
          <Tab label="Media" icon={<MediaIcon />} iconPosition="start" />
          <Tab label="Announcements" icon={<AnnouncementIcon />} iconPosition="start" />
          <Tab label="Courses" icon={<CourseIcon />} iconPosition="start" />
          <Tab label="Trainers" icon={<TrainerIcon />} iconPosition="start" />
          <Tab label="Users" icon={<UsersIcon />} iconPosition="start" />
          <Tab label="Moderation" icon={<ForumIcon />} iconPosition="start" />
          <Tab label="Payments" icon={<PaymentIcon />} iconPosition="start" />
          <Tab label="Enrollments" icon={<EnrollmentIcon />} iconPosition="start" />
          <Tab label="Email Marketing" icon={<EmailIcon />} iconPosition="start" />
          <Tab label="Settings" icon={<SettingsIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {stats && (
        <Grid container spacing={3}>
          {/* Pages Statistics */}
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <PageIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                  <Typography variant="h6">Pages</Typography>
                </Box>
                <Typography variant="h4" gutterBottom>
                  {stats.pages?.total || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Published: {stats.pages?.published || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Drafts: {stats.pages?.draft || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Media Statistics */}
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <MediaIcon color="secondary" sx={{ fontSize: 40, mr: 2 }} />
                  <Typography variant="h6">Media</Typography>
                </Box>
                <Typography variant="h4" gutterBottom>
                  {stats.media?.total || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total media files
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Announcements Statistics */}
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <AnnouncementIcon color="info" sx={{ fontSize: 40, mr: 2 }} />
                  <Typography variant="h6">Announcements</Typography>
                </Box>
                <Typography variant="h4" gutterBottom>
                  {stats.announcements?.active || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active announcements
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Courses Statistics */}
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <CourseIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                  <Typography variant="h6">Courses</Typography>
                </Box>
                <Typography variant="h4" gutterBottom>
                  {stats.courses?.total || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total courses
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Users Statistics */}
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <UsersIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                  <Typography variant="h6">Users</Typography>
                </Box>
                <Typography variant="h4" gutterBottom>
                  {stats.users?.total || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Students: {stats.users?.students || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Trainers: {stats.users?.trainers || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Admins: {stats.users?.admins || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Moderation Statistics */}
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <ForumIcon color="warning" sx={{ fontSize: 40, mr: 2 }} />
                  <Typography variant="h6">Moderation</Typography>
                </Box>
                <Typography variant="h4" gutterBottom>
                  {stats.moderation?.pendingForums || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending forum posts
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Use the tabs above to navigate to different admin sections.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default AdminDashboard;
