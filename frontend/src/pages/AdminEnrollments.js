import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  CircularProgress,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  IconButton,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  Tooltip
} from '@mui/material';
import {
  School as EnrollmentIcon,
  Add as AddIcon,
  RemoveCircle as RemoveIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import axios from 'axios';
import adminService from '../services/adminService';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

const AdminEnrollments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [enrollments, setEnrollments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [refundRequests, setRefundRequests] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    courseId: '',
    userId: '',
    startDate: '',
    endDate: ''
  });
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [unenrollDialogOpen, setUnenrollDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // For manual enrollment
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrollmentNotes, setEnrollmentNotes] = useState('');
  const [unenrollReason, setUnenrollReason] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate, page, rowsPerPage, filters, activeTab]);

  const getAuthHeaders = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 0) {
        await fetchEnrollments();
      } else if (activeTab === 1) {
        await Promise.all([fetchUsers(), fetchCourses()]);
      } else if (activeTab === 2) {
        await fetchRefundRequests();
      } else if (activeTab === 3) {
        await fetchAnalytics();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showSnackbar('Error fetching data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...filters
      };
      const response = await adminService.getAllEnrollments(params);
      setEnrollments(response.data);
      setTotalCount(response.totalCount);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      throw error;
    }
  };

  const fetchAnalytics = async () => {
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.courseId) params.courseId = filters.courseId;
      
      const response = await adminService.getEnrollmentAnalytics(params);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  };

  const fetchRefundRequests = async () => {
    try {
      const response = await adminService.getRefundRequests();
      setRefundRequests(response.data);
    } catch (error) {
      console.error('Error fetching refund requests:', error);
      throw error;
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users', getAuthHeaders());
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await axios.get('/api/courses', getAuthHeaders());
      setCourses(response.data.data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
    setPage(0);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleViewDetails = async (enrollment) => {
    try {
      const response = await adminService.getEnrollmentDetails(enrollment._id);
      setSelectedEnrollment(response.data);
      setDetailsOpen(true);
    } catch (error) {
      console.error('Error fetching enrollment details:', error);
      showSnackbar('Error fetching enrollment details', 'error');
    }
  };

  const handleManualEnrollment = async () => {
    if (!selectedUser || !selectedCourse) {
      showSnackbar('Please select both user and course', 'error');
      return;
    }

    try {
      await adminService.manualEnrollment({
        userId: selectedUser._id,
        courseId: selectedCourse._id,
        notes: enrollmentNotes
      });
      showSnackbar('User enrolled successfully', 'success');
      setSelectedUser(null);
      setSelectedCourse(null);
      setEnrollmentNotes('');
      if (activeTab === 0) {
        fetchEnrollments();
      }
    } catch (error) {
      console.error('Error enrolling user:', error);
      showSnackbar(error.response?.data?.message || 'Error enrolling user', 'error');
    }
  };

  const handleManualUnenrollment = async () => {
    if (!selectedEnrollment) return;

    try {
      await adminService.manualUnenrollment(selectedEnrollment._id, unenrollReason);
      showSnackbar('User unenrolled successfully', 'success');
      setUnenrollDialogOpen(false);
      setUnenrollReason('');
      setSelectedEnrollment(null);
      fetchEnrollments();
    } catch (error) {
      console.error('Error unenrolling user:', error);
      showSnackbar(error.response?.data?.message || 'Error unenrolling user', 'error');
    }
  };

  // Commenting out unused function to avoid lint error - can be used for future enhancement
  // const handleUpdateStatus = async (enrollmentId, newStatus) => {
  //   try {
  //     await adminService.updateEnrollmentStatus(enrollmentId, newStatus);
  //     showSnackbar('Enrollment status updated', 'success');
  //     fetchEnrollments();
  //   } catch (error) {
  //     console.error('Error updating status:', error);
  //     showSnackbar('Error updating status', 'error');
  //   }
  // };

  const handleApproveRefund = async (refundId) => {
    try {
      await adminService.approveRefund(refundId);
      showSnackbar('Refund approved and processed', 'success');
      fetchRefundRequests();
    } catch (error) {
      console.error('Error approving refund:', error);
      showSnackbar(error.response?.data?.message || 'Error approving refund', 'error');
    }
  };

  const handleRejectRefund = async () => {
    if (!selectedRefund) return;

    try {
      await adminService.rejectRefund(selectedRefund._id, rejectReason);
      showSnackbar('Refund rejected', 'success');
      setRefundDialogOpen(false);
      setRejectReason('');
      setSelectedRefund(null);
      fetchRefundRequests();
    } catch (error) {
      console.error('Error rejecting refund:', error);
      showSnackbar('Error rejecting refund', 'error');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'success',
      completed: 'primary',
      dropped: 'error',
      suspended: 'warning'
    };
    return colors[status] || 'default';
  };

  const getRefundStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      approved: 'success',
      rejected: 'error'
    };
    return colors[status] || 'default';
  };

  const COLORS = ['#2e7d32', '#ff9800', '#f44336', '#2196f3'];

  if (loading && enrollments.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          <EnrollmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Enrollment Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={fetchData}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="All Enrollments" />
          <Tab label="Manual Enroll/Unenroll" />
          <Tab label="Refund Management" />
          <Tab label="Analytics" />
        </Tabs>
      </Box>

      {/* Tab 0: All Enrollments */}
      {activeTab === 0 && (
        <Paper sx={{ p: 3 }}>
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="dropped">Dropped</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Start Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="End Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setFilters({ status: '', courseId: '', userId: '', startDate: '', endDate: '' })}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Course</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Enrolled Date</TableCell>
                  <TableCell>Last Access</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {enrollments.map((enrollment) => (
                  <TableRow key={enrollment._id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {enrollment.user?.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {enrollment.user?.email}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{enrollment.course?.title}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={enrollment.status}
                        color={getStatusColor(enrollment.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{enrollment.progress}%</TableCell>
                    <TableCell>
                      {enrollment.startDate ? format(new Date(enrollment.startDate), 'MMM dd, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {enrollment.lastAccessDate ? format(new Date(enrollment.lastAccessDate), 'MMM dd, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(enrollment)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Unenroll">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setSelectedEnrollment(enrollment);
                            setUnenrollDialogOpen(true);
                          }}
                        >
                          <RemoveIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}

      {/* Tab 1: Manual Enroll/Unenroll */}
      {activeTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Manually Enroll User in Course
          </Typography>
          <Grid container spacing={3} mt={1}>
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={users}
                getOptionLabel={(option) => `${option.name} (${option.email})`}
                value={selectedUser}
                onChange={(event, newValue) => setSelectedUser(newValue)}
                renderInput={(params) => (
                  <TextField {...params} label="Select User" fullWidth />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={courses}
                getOptionLabel={(option) => option.title}
                value={selectedCourse}
                onChange={(event, newValue) => setSelectedCourse(newValue)}
                renderInput={(params) => (
                  <TextField {...params} label="Select Course" fullWidth />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes (Optional)"
                multiline
                rows={3}
                value={enrollmentNotes}
                onChange={(e) => setEnrollmentNotes(e.target.value)}
                placeholder="Add any notes about this manual enrollment..."
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleManualEnrollment}
                disabled={!selectedUser || !selectedCourse}
                size="large"
              >
                Enroll User
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Tab 2: Refund Management */}
      {activeTab === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Refund Requests
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Course</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Requested Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {refundRequests.map((refund) => (
                  <TableRow key={refund._id}>
                    <TableCell>
                      <Typography variant="body2">{refund.user?.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {refund.user?.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {refund.payment?.course?.title || 'N/A'}
                    </TableCell>
                    <TableCell>
                      ${refund.refundAmount || refund.payment?.amount || 0}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {refund.reason || 'No reason provided'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={refund.status}
                        color={getRefundStatusColor(refund.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {format(new Date(refund.createdAt), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      {refund.status === 'pending' && (
                        <>
                          <Tooltip title="Approve Refund">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleApproveRefund(refund._id)}
                            >
                              <CheckIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject Refund">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setSelectedRefund(refund);
                                setRefundDialogOpen(true);
                              }}
                            >
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {refundRequests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="text.secondary">No refund requests found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Tab 3: Analytics */}
      {activeTab === 3 && analytics && (
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Enrollments
                  </Typography>
                  <Typography variant="h4">{analytics.totalEnrollments}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Active Enrollments
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {analytics.activeEnrollments}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Completion Rate
                  </Typography>
                  <Typography variant="h4" color="primary.main">
                    {analytics.completionRate}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Avg. Progress
                  </Typography>
                  <Typography variant="h4">{analytics.avgProgress}%</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Enrollments by Status
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(analytics.enrollmentsByStatus).map(([key, value]) => ({
                        name: key,
                        value: value
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(analytics.enrollmentsByStatus).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Enrollment Trends (Last 30 Days)
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.enrollmentsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#2e7d32" name="Enrollments" />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Top Courses by Enrollment
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.topCourses}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="courseName" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="enrollmentCount" fill="#2e7d32" name="Enrollments" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Enrollment Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Enrollment Details</DialogTitle>
        <DialogContent>
          {selectedEnrollment && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">User</Typography>
                <Typography variant="body1">{selectedEnrollment.enrollment?.user?.name}</Typography>
                <Typography variant="caption">{selectedEnrollment.enrollment?.user?.email}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Course</Typography>
                <Typography variant="body1">{selectedEnrollment.enrollment?.course?.title}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip label={selectedEnrollment.enrollment?.status} color={getStatusColor(selectedEnrollment.enrollment?.status)} />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Progress</Typography>
                <Typography variant="body1">{selectedEnrollment.enrollment?.progress}%</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Enrolled Date</Typography>
                <Typography variant="body1">
                  {selectedEnrollment.enrollment?.startDate ? format(new Date(selectedEnrollment.enrollment.startDate), 'MMM dd, yyyy') : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Completion Date</Typography>
                <Typography variant="body1">
                  {selectedEnrollment.enrollment?.completionDate ? format(new Date(selectedEnrollment.enrollment.completionDate), 'MMM dd, yyyy') : 'Not completed'}
                </Typography>
              </Grid>
              {selectedEnrollment.payment && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mt: 2 }}>Payment Information</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">Amount</Typography>
                    <Typography variant="body1">${selectedEnrollment.payment.amount} {selectedEnrollment.payment.currency}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">Payment Status</Typography>
                    <Typography variant="body1">{selectedEnrollment.payment.status}</Typography>
                  </Grid>
                </>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Unenroll Dialog */}
      <Dialog open={unenrollDialogOpen} onClose={() => setUnenrollDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Unenrollment</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This will remove the user from the course. This action cannot be undone.
          </Alert>
          <TextField
            fullWidth
            label="Reason for unenrollment"
            multiline
            rows={3}
            value={unenrollReason}
            onChange={(e) => setUnenrollReason(e.target.value)}
            placeholder="Please provide a reason..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnenrollDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleManualUnenrollment} color="error" variant="contained">
            Unenroll
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Refund Dialog */}
      <Dialog open={refundDialogOpen} onClose={() => setRefundDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Refund Request</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Reason for rejection"
            multiline
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Please provide a reason for rejection..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefundDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRejectRefund} color="error" variant="contained">
            Reject Refund
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminEnrollments;
