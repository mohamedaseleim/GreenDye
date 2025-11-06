import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Card,
  CardContent,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Check as ApproveIcon,
  Close as RejectIcon,
  Visibility as ViewIcon,
  AttachMoney as PayoutIcon,
  TrendingUp as MetricsIcon,
  VerifiedUser as VerifiedIcon,
  HourglassEmpty as PendingIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import adminService from '../services/adminService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminTrainers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterVerified, setFilterVerified] = useState('');
  const [filterApplication, setFilterApplication] = useState('');
  const [currentTab, setCurrentTab] = useState(0);
  
  // Dialogs
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openMetricsDialog, setOpenMetricsDialog] = useState(false);
  const [openPayoutDialog, setOpenPayoutDialog] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  
  // Selected data
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [trainerMetrics, setTrainerMetrics] = useState(null);
  const [trainerPayouts, setTrainerPayouts] = useState([]);
  
  // Form data
  const [reviewNotes, setReviewNotes] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('bank_transfer');
  const [payoutNotes, setPayoutNotes] = useState('');
  
  // Create trainer form data
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    userId: '',
    fullName: '',
    bio: '',
    expertise: '',
    commissionRate: 20
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchTrainers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate, page, rowsPerPage, search, filterStatus, filterVerified, filterApplication, currentTab]);

  const fetchTrainers = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search
      };
      
      if (filterStatus !== '') {
        params.status = filterStatus;
      }
      if (filterVerified !== '') {
        params.verified = filterVerified;
      }
      if (filterApplication !== '') {
        params.applicationStatus = filterApplication;
      }
      
      // If on pending applications tab, filter by pending status
      if (currentTab === 1) {
        const response = await adminService.getPendingApplications(params);
        setTrainers(response.data || []);
        setTotal(response.total || 0);
      } else {
        const response = await adminService.getAllTrainers(params);
        setTrainers(response.data || []);
        setTotal(response.total || 0);
      }
    } catch (error) {
      toast.error('Failed to fetch trainers');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (trainerId) => {
    try {
      await adminService.approveTrainer(trainerId, reviewNotes);
      toast.success('Trainer application approved');
      setReviewNotes('');
      fetchTrainers();
    } catch (error) {
      toast.error('Failed to approve trainer');
      console.error('Error:', error);
    }
  };

  const handleReject = async (trainerId) => {
    try {
      await adminService.rejectTrainer(trainerId, reviewNotes);
      toast.success('Trainer application rejected');
      setReviewNotes('');
      fetchTrainers();
    } catch (error) {
      toast.error('Failed to reject trainer');
      console.error('Error:', error);
    }
  };

  const handleDelete = async (trainerId) => {
    if (!window.confirm('Are you sure you want to delete this trainer profile?')) {
      return;
    }
    
    try {
      await adminService.deleteTrainer(trainerId);
      toast.success('Trainer deleted successfully');
      fetchTrainers();
    } catch (error) {
      toast.error('Failed to delete trainer');
      console.error('Error:', error);
    }
  };

  const handleViewDetails = async (trainer) => {
    setSelectedTrainer(trainer);
    setOpenDetailsDialog(true);
  };

  const handleViewMetrics = async (trainer) => {
    try {
      setSelectedTrainer(trainer);
      const response = await adminService.getTrainerMetrics(trainer._id);
      setTrainerMetrics(response.data);
      setOpenMetricsDialog(true);
    } catch (error) {
      toast.error('Failed to load metrics');
      console.error('Error:', error);
    }
  };

  const handleViewPayouts = async (trainer) => {
    try {
      setSelectedTrainer(trainer);
      const response = await adminService.getTrainerPayouts(trainer._id);
      setTrainerPayouts(response.data || []);
      setOpenPayoutDialog(true);
    } catch (error) {
      toast.error('Failed to load payouts');
      console.error('Error:', error);
    }
  };

  const handleCreatePayout = async () => {
    if (!payoutAmount || parseFloat(payoutAmount) <= 0) {
      toast.error('Please enter a valid payout amount');
      return;
    }

    try {
      await adminService.createPayout(selectedTrainer._id, {
        amount: parseFloat(payoutAmount),
        payoutMethod,
        notes: payoutNotes
      });
      toast.success('Payout created successfully');
      setPayoutAmount('');
      setPayoutNotes('');
      handleViewPayouts(selectedTrainer);
      fetchTrainers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create payout');
      console.error('Error:', error);
    }
  };

  const handleUpdateVerification = async (trainerId, isVerified) => {
    try {
      await adminService.updateVerificationStatus(trainerId, isVerified, reviewNotes);
      toast.success(`Trainer ${isVerified ? 'verified' : 'unverified'} successfully`);
      setReviewNotes('');
      fetchTrainers();
    } catch (error) {
      toast.error('Failed to update verification status');
      console.error('Error:', error);
    }
  };

  const handleOpenCreateDialog = async () => {
    setOpenCreateDialog(true);
    await fetchUsers();
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await adminService.getUsers({ role: 'student', limit: 100 });
      setUsers(response.data || []);
    } catch (error) {
      toast.error('Failed to load users');
      console.error('Error:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateTrainer = async () => {
    if (!createFormData.userId) {
      toast.error('Please select a user');
      return;
    }
    
    if (!createFormData.fullName) {
      toast.error('Please enter full name');
      return;
    }

    try {
      const requestData = {
        userId: createFormData.userId,
        fullName: createFormData.fullName,
        commissionRate: createFormData.commissionRate !== '' && createFormData.commissionRate !== null 
          ? parseFloat(createFormData.commissionRate) 
          : 20
      };

      // Add optional fields if provided
      if (createFormData.bio) {
        requestData.bio = { en: createFormData.bio };
      }
      if (createFormData.expertise) {
        const expertiseArray = createFormData.expertise.split(',').map(e => e.trim()).filter(e => e);
        if (expertiseArray.length > 0) {
          requestData.expertise = expertiseArray;
        }
      }

      await adminService.createTrainer(requestData);
      toast.success('Trainer profile created successfully');
      
      // Reset form
      setCreateFormData({
        userId: '',
        fullName: '',
        bio: '',
        expertise: '',
        commissionRate: 20
      });
      setOpenCreateDialog(false);
      fetchTrainers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create trainer profile');
      console.error('Error:', error);
    }
  };

  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false);
    setCreateFormData({
      userId: '',
      fullName: '',
      bio: '',
      expertise: '',
      commissionRate: 20
    });
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    setPage(0);
  };

  const getStatusChip = (trainer) => {
    if (trainer.applicationStatus === 'approved') {
      return <Chip label="Approved" color="success" size="small" />;
    } else if (trainer.applicationStatus === 'rejected') {
      return <Chip label="Rejected" color="error" size="small" />;
    } else if (trainer.applicationStatus === 'under_review') {
      return <Chip label="Under Review" color="warning" size="small" />;
    } else {
      return <Chip label="Pending" color="default" size="small" />;
    }
  };

  const getVerificationChip = (isVerified) => {
    return isVerified 
      ? <Chip label="Verified" color="primary" size="small" icon={<VerifiedIcon />} />
      : <Chip label="Not Verified" color="default" size="small" icon={<PendingIcon />} />;
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Trainer Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchTrainers}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
          >
            Add Trainer
          </Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label="All Trainers" />
          <Tab label="Pending Applications" />
        </Tabs>
      </Paper>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Name or email..."
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Verified</InputLabel>
              <Select
                value={filterVerified}
                label="Verified"
                onChange={(e) => { setFilterVerified(e.target.value); setPage(0); }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Verified</MenuItem>
                <MenuItem value="false">Not Verified</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Application</InputLabel>
              <Select
                value={filterApplication}
                label="Application"
                onChange={(e) => { setFilterApplication(e.target.value); setPage(0); }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
                <MenuItem value="under_review">Under Review</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Trainers Table */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : trainers.length === 0 ? (
          <Box p={3}>
            <Alert severity="info">No trainers found</Alert>
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Trainer ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Verified</TableCell>
                  <TableCell>Commission</TableCell>
                  <TableCell>Pending Payout</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trainers.map((trainer) => (
                  <TableRow key={trainer._id}>
                    <TableCell>{trainer.trainerId}</TableCell>
                    <TableCell>{trainer.fullName || trainer.user?.name}</TableCell>
                    <TableCell>{trainer.user?.email}</TableCell>
                    <TableCell>{getStatusChip(trainer)}</TableCell>
                    <TableCell>{getVerificationChip(trainer.isVerified)}</TableCell>
                    <TableCell>{trainer.commissionRate}%</TableCell>
                    <TableCell>${trainer.pendingPayout?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleViewDetails(trainer)}>
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Metrics">
                        <IconButton size="small" onClick={() => handleViewMetrics(trainer)}>
                          <MetricsIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Payouts">
                        <IconButton size="small" onClick={() => handleViewPayouts(trainer)}>
                          <PayoutIcon />
                        </IconButton>
                      </Tooltip>
                      {trainer.applicationStatus === 'pending' && (
                        <>
                          <Tooltip title="Approve">
                            <IconButton 
                              size="small" 
                              color="success"
                              onClick={() => handleApprove(trainer._id)}
                            >
                              <ApproveIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleReject(trainer._id)}
                            >
                              <RejectIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip title="Delete">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDelete(trainer._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={handlePageChange}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleRowsPerPageChange}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </>
        )}
      </TableContainer>

      {/* Trainer Details Dialog */}
      <Dialog 
        open={openDetailsDialog} 
        onClose={() => setOpenDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Trainer Details</DialogTitle>
        <DialogContent>
          {selectedTrainer && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Trainer ID</Typography>
                  <Typography variant="body1">{selectedTrainer.trainerId}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Full Name</Typography>
                  <Typography variant="body1">{selectedTrainer.fullName}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Email</Typography>
                  <Typography variant="body1">{selectedTrainer.user?.email}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Application Status</Typography>
                  <Typography variant="body1">{getStatusChip(selectedTrainer)}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Commission Rate</Typography>
                  <Typography variant="body1">{selectedTrainer.commissionRate}%</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Pending Payout</Typography>
                  <Typography variant="body1">${selectedTrainer.pendingPayout?.toFixed(2) || '0.00'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Total Paid Out</Typography>
                  <Typography variant="body1">${selectedTrainer.totalPaidOut?.toFixed(2) || '0.00'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Rating</Typography>
                  <Typography variant="body1">{selectedTrainer.rating?.toFixed(1) || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Expertise</Typography>
                  <Box sx={{ mt: 1 }}>
                    {selectedTrainer.expertise?.map((exp, idx) => (
                      <Chip key={idx} label={exp} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                    ))}
                  </Box>
                </Grid>
                {selectedTrainer.reviewNotes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">Review Notes</Typography>
                    <Typography variant="body2">{selectedTrainer.reviewNotes}</Typography>
                  </Grid>
                )}
              </Grid>
              <Divider sx={{ my: 2 }} />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Add Review Notes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                {!selectedTrainer.isVerified && (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => handleUpdateVerification(selectedTrainer._id, true)}
                  >
                    Verify Trainer
                  </Button>
                )}
                {selectedTrainer.isVerified && (
                  <Button
                    variant="outlined"
                    color="warning"
                    onClick={() => handleUpdateVerification(selectedTrainer._id, false)}
                  >
                    Unverify Trainer
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Metrics Dialog */}
      <Dialog 
        open={openMetricsDialog} 
        onClose={() => setOpenMetricsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Performance Metrics</DialogTitle>
        <DialogContent>
          {trainerMetrics && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="primary">Courses</Typography>
                      <Typography variant="h4">{trainerMetrics.courses.total}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Published: {trainerMetrics.courses.published} | Draft: {trainerMetrics.courses.draft}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="primary">Students</Typography>
                      <Typography variant="h4">{trainerMetrics.students.total}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Active: {trainerMetrics.students.activeEnrollments} | Completed: {trainerMetrics.students.completedEnrollments}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="primary">Revenue</Typography>
                      <Typography variant="h4">${trainerMetrics.revenue.totalRevenue.toFixed(2)}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Trainer Earnings: ${trainerMetrics.revenue.trainerEarnings.toFixed(2)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="primary">Performance</Typography>
                      <Typography variant="h4">{trainerMetrics.performance.averageCourseRating.toFixed(1)}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Completion Rate: {trainerMetrics.performance.completionRate}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMetricsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Payout Dialog */}
      <Dialog 
        open={openPayoutDialog} 
        onClose={() => setOpenPayoutDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Trainer Payouts</DialogTitle>
        <DialogContent>
          {selectedTrainer && (
            <Box sx={{ mt: 2 }}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6">Payout Summary</Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="textSecondary">Pending</Typography>
                      <Typography variant="h6">${selectedTrainer.pendingPayout?.toFixed(2) || '0.00'}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="textSecondary">Total Paid</Typography>
                      <Typography variant="h6">${selectedTrainer.totalPaidOut?.toFixed(2) || '0.00'}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="textSecondary">Commission</Typography>
                      <Typography variant="h6">{selectedTrainer.commissionRate}%</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Typography variant="h6" sx={{ mb: 2 }}>Create New Payout</Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Amount"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Payout Method</InputLabel>
                    <Select
                      value={payoutMethod}
                      label="Payout Method"
                      onChange={(e) => setPayoutMethod(e.target.value)}
                    >
                      <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                      <MenuItem value="paypal">PayPal</MenuItem>
                      <MenuItem value="stripe">Stripe</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Notes"
                    value={payoutNotes}
                    onChange={(e) => setPayoutNotes(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    onClick={handleCreatePayout}
                    disabled={!payoutAmount || parseFloat(payoutAmount) <= 0}
                  >
                    Process Payout
                  </Button>
                </Grid>
              </Grid>

              <Divider sx={{ mb: 2 }} />
              
              <Typography variant="h6" sx={{ mb: 2 }}>Payout History</Typography>
              {trainerPayouts.length === 0 ? (
                <Alert severity="info">No payouts yet</Alert>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {trainerPayouts.map((payout) => (
                      <TableRow key={payout._id}>
                        <TableCell>{new Date(payout.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>${payout.amount.toFixed(2)}</TableCell>
                        <TableCell>{payout.payoutMethod}</TableCell>
                        <TableCell>
                          <Chip 
                            label={payout.status} 
                            size="small"
                            color={payout.status === 'completed' ? 'success' : 'default'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPayoutDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create Trainer Dialog */}
      <Dialog 
        open={openCreateDialog} 
        onClose={handleCloseCreateDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create Trainer Profile</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Select User</InputLabel>
                  <Select
                    value={createFormData.userId}
                    label="Select User"
                    onChange={(e) => {
                      const selectedUser = users.find(u => u._id === e.target.value);
                      setCreateFormData({
                        ...createFormData,
                        userId: e.target.value,
                        fullName: selectedUser?.name || ''
                      });
                    }}
                    disabled={loadingUsers}
                  >
                    {loadingUsers ? (
                      <MenuItem value="">
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Loading users...
                      </MenuItem>
                    ) : users.length === 0 ? (
                      <MenuItem value="">No users available</MenuItem>
                    ) : (
                      users.map((user) => (
                        <MenuItem key={user._id} value={user._id}>
                          {user.name} ({user.email})
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={createFormData.fullName}
                  onChange={(e) => setCreateFormData({ ...createFormData, fullName: e.target.value })}
                  required
                  helperText="Trainer's full name for profile"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Bio (Optional)"
                  value={createFormData.bio}
                  onChange={(e) => setCreateFormData({ ...createFormData, bio: e.target.value })}
                  helperText="Brief description about the trainer"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Expertise (Optional)"
                  value={createFormData.expertise}
                  onChange={(e) => setCreateFormData({ ...createFormData, expertise: e.target.value })}
                  placeholder="e.g., Web Development, Machine Learning, Data Science"
                  helperText="Comma-separated list of expertise areas"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Commission Rate (%)"
                  value={createFormData.commissionRate}
                  onChange={(e) => setCreateFormData({ ...createFormData, commissionRate: e.target.value })}
                  inputProps={{ min: 0, max: 100, step: 1 }}
                  helperText="Percentage commission for the trainer (default: 20%)"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog}>Cancel</Button>
          <Button 
            onClick={handleCreateTrainer}
            variant="contained"
            disabled={!createFormData.userId || !createFormData.fullName}
          >
            Create Trainer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminTrainers;
