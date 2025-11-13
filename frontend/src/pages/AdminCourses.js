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
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Check as ApproveIcon,
  Close as RejectIcon,
  BarChart as AnalyticsIcon,
  AttachMoney as PriceIcon,
  Category as CategoryIcon,
  LocalOffer as TagIcon,
  PlayLesson as LessonIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import adminService from '../services/adminService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { COURSE_CATEGORIES, getCourseTitle, getApprovalStatusColor } from '../utils/courseUtils';
import LessonManagement from '../components/LessonManagement';

const AdminCourses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentTab, setCurrentTab] = useState(0);
  
  // Statistics
  const [statistics, setStatistics] = useState(null);
  
  // Dialogs
  const [openPricingDialog, setOpenPricingDialog] = useState(false);
  const [openAnalyticsDialog, setOpenAnalyticsDialog] = useState(false);
  const [openTagsDialog, setOpenTagsDialog] = useState(false);
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openLessonDialog, setOpenLessonDialog] = useState(false);
  
  // Selected data
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseAnalytics, setCourseAnalytics] = useState(null);
  
  // Form data
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [discountActive, setDiscountActive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [trainers, setTrainers] = useState([]);
  const [formTags, setFormTags] = useState([]);
  const [formPrerequisites, setFormPrerequisites] = useState([]);
  const [formLearningOutcomes, setFormLearningOutcomes] = useState([]);
  const [newFormTag, setNewFormTag] = useState('');
  const [newPrerequisite, setNewPrerequisite] = useState('');
  const [newLearningOutcome, setNewLearningOutcome] = useState('');
  
  const initialCreateFormData = {
    title: { en: '', ar: '', fr: '' },
    description: { en: '', ar: '', fr: '' },
    category: '',
    level: 'beginner',
    price: 0,
    currency: 'USD',
    duration: 0,
    language: ['en'],
    thumbnail: '',
    instructor: '',
    approvalStatus: 'approved',
    isPublished: true,
    tags: [],
    prerequisites: [],
    learningOutcomes: []
  };
  
  const [createFormData, setCreateFormData] = useState(initialCreateFormData);

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'trainer')) {
      navigate('/');
      return;
    }
    fetchCourses();
    fetchStatistics();
    fetchCategories();
    fetchTags();
    fetchTrainers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate, page, rowsPerPage, search, filterCategory, filterLevel, filterStatus, currentTab]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search
      };

      // Add filters based on current tab
      if (currentTab === 0) {
        // All courses
        if (filterCategory) params.category = filterCategory;
        if (filterLevel) params.level = filterLevel;
        if (filterStatus) params.approvalStatus = filterStatus;
      } else if (currentTab === 1) {
        // Pending approval
        params.approvalStatus = 'pending';
      } else if (currentTab === 2) {
        // Published
        params.isPublished = 'true';
      }

      const response = currentTab === 1 
        ? await adminService.getPendingCourses(params)
        : await adminService.getAdminCourses(params);
      
      setCourses(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await adminService.getCourseStatistics();
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      await adminService.getCourseCategories();
      // Categories fetched but not stored - used for cache warming
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTags = async () => {
    try {
      await adminService.getCourseTags();
      // Tags fetched but not stored - used for cache warming
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const fetchTrainers = async () => {
    try {
      const response = await adminService.getAllTrainers({ limit: 100 });
      setTrainers(response.data || []);
    } catch (error) {
      console.error('Error fetching trainers:', error);
    }
  };

  const handleApproveCourse = async (courseId) => {
    try {
      await adminService.approveCourse(courseId);
      toast.success('Course approved successfully');
      fetchCourses();
      fetchStatistics();
    } catch (error) {
      console.error('Error approving course:', error);
      toast.error('Failed to approve course');
    }
  };

  const handleRejectCourse = async (courseId) => {
    try {
      await adminService.rejectCourse(courseId);
      toast.success('Course rejected');
      fetchCourses();
      fetchStatistics();
    } catch (error) {
      console.error('Error rejecting course:', error);
      toast.error('Failed to reject course');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await adminService.deleteAdminCourse(courseId);
        toast.success('Course deleted successfully');
        fetchCourses();
        fetchStatistics();
      } catch (error) {
        console.error('Error deleting course:', error);
        toast.error('Failed to delete course');
      }
    }
  };

  const handleOpenPricingDialog = (course) => {
    setSelectedCourse(course);
    setPrice(course.price || '');
    setCurrency(course.currency || 'USD');
    setDiscountPercentage(course.discount?.percentage || '');
    setDiscountActive(course.discount?.isActive || false);
    setOpenPricingDialog(true);
  };

  const handleSavePricing = async () => {
    try {
      await adminService.setCoursePricing(selectedCourse._id, {
        price: parseFloat(price),
        currency,
        discount: {
          percentage: parseFloat(discountPercentage) || 0,
          isActive: discountActive
        }
      });
      toast.success('Pricing updated successfully');
      setOpenPricingDialog(false);
      fetchCourses();
    } catch (error) {
      console.error('Error updating pricing:', error);
      toast.error('Failed to update pricing');
    }
  };

  const handleOpenAnalytics = async (course) => {
    setSelectedCourse(course);
    try {
      const response = await adminService.getCourseAnalytics(course._id);
      setCourseAnalytics(response.data);
      setOpenAnalyticsDialog(true);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to fetch analytics');
    }
  };

  const handleOpenTagsDialog = (course) => {
    setSelectedCourse(course);
    setSelectedTags(course.tags || []);
    setOpenTagsDialog(true);
  };

  const handleSaveTags = async () => {
    try {
      await adminService.updateCourseTags(selectedCourse._id, selectedTags);
      toast.success('Tags updated successfully');
      setOpenTagsDialog(false);
      fetchCourses();
      fetchTags();
    } catch (error) {
      console.error('Error updating tags:', error);
      toast.error('Failed to update tags');
    }
  };

  const handleAddTag = () => {
    if (newTag && !selectedTags.includes(newTag)) {
      setSelectedTags([...selectedTags, newTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleOpenCategoryDialog = (course) => {
    setSelectedCourse(course);
    setSelectedCategory(course.category || '');
    setOpenCategoryDialog(true);
  };

  const handleSaveCategory = async () => {
    try {
      await adminService.updateCourseCategory(selectedCourse._id, selectedCategory);
      toast.success('Category updated successfully');
      setOpenCategoryDialog(false);
      fetchCourses();
      fetchCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleCreateCourse = async () => {
    try {
      const courseData = {
        ...createFormData,
        tags: formTags,
        prerequisites: formPrerequisites,
        learningOutcomes: formLearningOutcomes
      };
      await adminService.createAdminCourse(courseData);
      toast.success('Course created successfully');
      setOpenCreateDialog(false);
      setCreateFormData(initialCreateFormData);
      setFormTags([]);
      setFormPrerequisites([]);
      setFormLearningOutcomes([]);
      fetchCourses();
      fetchStatistics();
      
      // Redirect trainers to their dashboard after successful course creation
      if (user && user.role === 'trainer') {
        navigate('/trainer/dashboard');
      }
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error('Failed to create course');
    }
  };

  const handleAddFormTag = () => {
    if (newFormTag && !formTags.includes(newFormTag)) {
      setFormTags([...formTags, newFormTag]);
      setNewFormTag('');
    }
  };

  const handleRemoveFormTag = (tagToRemove) => {
    setFormTags(formTags.filter(tag => tag !== tagToRemove));
  };

  const handleAddPrerequisite = () => {
    if (newPrerequisite && !formPrerequisites.includes(newPrerequisite)) {
      setFormPrerequisites([...formPrerequisites, newPrerequisite]);
      setNewPrerequisite('');
    }
  };

  const handleRemovePrerequisite = (prereqToRemove) => {
    setFormPrerequisites(formPrerequisites.filter(prereq => prereq !== prereqToRemove));
  };

  const handleAddLearningOutcome = () => {
    if (newLearningOutcome && !formLearningOutcomes.includes(newLearningOutcome)) {
      setFormLearningOutcomes([...formLearningOutcomes, newLearningOutcome]);
      setNewLearningOutcome('');
    }
  };

  const handleRemoveLearningOutcome = (outcomeToRemove) => {
    setFormLearningOutcomes(formLearningOutcomes.filter(outcome => outcome !== outcomeToRemove));
  };

  const handleOpenLessonDialog = (course) => {
    setSelectedCourse(course);
    setOpenLessonDialog(true);
  };

  const handleCloseLessonDialog = () => {
    setOpenLessonDialog(false);
    setSelectedCourse(null);
  };


  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1" gutterBottom>
            Course Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateDialog(true)}
          >
            Add Course
          </Button>
        </Box>
        
        {/* Statistics Cards */}
        {statistics && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Courses
                  </Typography>
                  <Typography variant="h4">
                    {statistics.overview.total}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Published
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {statistics.overview.published}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Pending Approval
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {statistics.overview.pendingApproval}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Enrollments
                  </Typography>
                  <Typography variant="h4">
                    {statistics.totalEnrollments}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={currentTab} onChange={(e, val) => setCurrentTab(val)}>
            <Tab label="All Courses" />
            <Tab label="Pending Approval" />
            <Tab label="Published" />
          </Tabs>
        </Box>

        {/* Filters and Actions */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Grid>
            {currentTab === 0 && (
              <>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      label="Category"
                    >
                      <MenuItem value="">All</MenuItem>
                      {COURSE_CATEGORIES.map((cat) => (
                        <MenuItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Level</InputLabel>
                    <Select
                      value={filterLevel}
                      onChange={(e) => setFilterLevel(e.target.value)}
                      label="Level"
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="beginner">Beginner</MenuItem>
                      <MenuItem value="intermediate">Intermediate</MenuItem>
                      <MenuItem value="advanced">Advanced</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      label="Status"
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="draft">Draft</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="approved">Approved</MenuItem>
                      <MenuItem value="rejected">Rejected</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchCourses}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Courses Table */}
        <TableContainer component={Paper}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : courses.length === 0 ? (
            <Alert severity="info" sx={{ m: 2 }}>
              No courses found
            </Alert>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Course</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Level</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Enrolled</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course._id}>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {getCourseTitle(course)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {course.instructor?.name || 'Unknown'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={course.category} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{course.level}</TableCell>
                      <TableCell>
                        {course.price > 0 ? (
                          <>
                            {course.currency} {course.price}
                            {course.discount?.isActive && course.discount?.percentage > 0 && (
                              <Chip 
                                label={`-${course.discount.percentage}%`} 
                                size="small" 
                                color="error" 
                                sx={{ ml: 1 }}
                              />
                            )}
                          </>
                        ) : (
                          'Free'
                        )}
                      </TableCell>
                      <TableCell>{course.enrolled || 0}</TableCell>
                      <TableCell>
                        <Chip 
                          label={course.approvalStatus} 
                          size="small" 
                          color={getApprovalStatusColor(course.approvalStatus)}
                        />
                        {course.isPublished && (
                          <Chip 
                            label="Published" 
                            size="small" 
                            color="success" 
                            variant="outlined"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenLessonDialog(course)}
                          title="Manage Lessons"
                          color="primary"
                        >
                          <LessonIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenAnalytics(course)}
                          title="View Analytics"
                        >
                          <AnalyticsIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenPricingDialog(course)}
                          title="Set Pricing"
                        >
                          <PriceIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenCategoryDialog(course)}
                          title="Change Category"
                        >
                          <CategoryIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleOpenTagsDialog(course)}
                          title="Manage Tags"
                        >
                          <TagIcon />
                        </IconButton>
                        {course.approvalStatus === 'pending' && (
                          <>
                            <IconButton 
                              size="small" 
                              color="success"
                              onClick={() => handleApproveCourse(course._id)}
                              title="Approve"
                            >
                              <ApproveIcon />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleRejectCourse(course._id)}
                              title="Reject"
                            >
                              <RejectIcon />
                            </IconButton>
                          </>
                        )}
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteCourse(course._id)}
                          title="Delete"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={total}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </TableContainer>
      </Box>

      {/* Pricing Dialog */}
      <Dialog open={openPricingDialog} onClose={() => setOpenPricingDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Set Course Pricing</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    label="Currency"
                  >
                    <MenuItem value="USD">USD</MenuItem>
                    <MenuItem value="EUR">EUR</MenuItem>
                    <MenuItem value="EGP">EGP</MenuItem>
                    <MenuItem value="SAR">SAR</MenuItem>
                    <MenuItem value="NGN">NGN</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }}>
                  <Typography variant="caption">Discount</Typography>
                </Divider>
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Discount Percentage"
                  type="number"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(e.target.value)}
                  inputProps={{ min: 0, max: 100 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Active</InputLabel>
                  <Select
                    value={discountActive}
                    onChange={(e) => setDiscountActive(e.target.value)}
                    label="Active"
                  >
                    <MenuItem value={true}>Yes</MenuItem>
                    <MenuItem value={false}>No</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPricingDialog(false)}>Cancel</Button>
          <Button onClick={handleSavePricing} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={openAnalyticsDialog} onClose={() => setOpenAnalyticsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Course Analytics</DialogTitle>
        <DialogContent>
          {courseAnalytics ? (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total Enrollments
                      </Typography>
                      <Typography variant="h4">
                        {courseAnalytics.enrollments.total}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Completion Rate
                      </Typography>
                      <Typography variant="h4" color="success.main">
                        {courseAnalytics.completionRate}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Average Progress
                      </Typography>
                      <Typography variant="h4">
                        {courseAnalytics.averageProgress}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Course Views
                      </Typography>
                      <Typography variant="h4">
                        {courseAnalytics.views}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Revenue
                      </Typography>
                      <Typography variant="h5" color="primary">
                        {courseAnalytics.revenue.currency} {courseAnalytics.revenue.total}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Enrollment Status
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="textSecondary">Active</Typography>
                          <Typography variant="h6">{courseAnalytics.enrollments.active}</Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="textSecondary">Completed</Typography>
                          <Typography variant="h6">{courseAnalytics.enrollments.completed}</Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="textSecondary">Dropped</Typography>
                          <Typography variant="h6">{courseAnalytics.enrollments.dropped}</Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="textSecondary">Suspended</Typography>
                          <Typography variant="h6">{courseAnalytics.enrollments.suspended}</Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAnalyticsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Tags Dialog */}
      <Dialog open={openTagsDialog} onClose={() => setOpenTagsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Manage Course Tags</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Add Tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <Button onClick={handleAddTag}>Add</Button>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedTags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      onDelete={() => handleRemoveTag(tag)}
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTagsDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveTags} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={openCategoryDialog} onClose={() => setOpenCategoryDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Change Course Category</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="Category"
              >
                {COURSE_CATEGORIES.map((cat) => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCategoryDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveCategory} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Create Course Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Create New Course</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              
              {/* Basic Information Section */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary">
                  Basic Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              {/* Title in English */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  label="Title (English)"
                  value={createFormData.title.en}
                  onChange={(e) => setCreateFormData({
                    ...createFormData,
                    title: { ...createFormData.title, en: e.target.value }
                  })}
                />
              </Grid>
              
              {/* Title in Arabic */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Title (Arabic)"
                  value={createFormData.title.ar}
                  onChange={(e) => setCreateFormData({
                    ...createFormData,
                    title: { ...createFormData.title, ar: e.target.value }
                  })}
                />
              </Grid>
              
              {/* Title in French */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Title (French)"
                  value={createFormData.title.fr}
                  onChange={(e) => setCreateFormData({
                    ...createFormData,
                    title: { ...createFormData.title, fr: e.target.value }
                  })}
                />
              </Grid>
              
              {/* Description in English */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  multiline
                  rows={3}
                  label="Description (English)"
                  value={createFormData.description.en}
                  onChange={(e) => setCreateFormData({
                    ...createFormData,
                    description: { ...createFormData.description, en: e.target.value }
                  })}
                />
              </Grid>
              
              {/* Description in Arabic */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description (Arabic)"
                  value={createFormData.description.ar}
                  onChange={(e) => setCreateFormData({
                    ...createFormData,
                    description: { ...createFormData.description, ar: e.target.value }
                  })}
                />
              </Grid>
              
              {/* Description in French */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description (French)"
                  value={createFormData.description.fr}
                  onChange={(e) => setCreateFormData({
                    ...createFormData,
                    description: { ...createFormData.description, fr: e.target.value }
                  })}
                />
              </Grid>

              {/* Course Details Section */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                  Course Details
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              {/* Category */}
              <Grid item xs={12} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={createFormData.category}
                    onChange={(e) => setCreateFormData({ ...createFormData, category: e.target.value })}
                    label="Category"
                  >
                    {COURSE_CATEGORIES.map((cat) => (
                      <MenuItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Level */}
              <Grid item xs={12} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>Level</InputLabel>
                  <Select
                    value={createFormData.level}
                    onChange={(e) => setCreateFormData({ ...createFormData, level: e.target.value })}
                    label="Level"
                  >
                    <MenuItem value="beginner">Beginner</MenuItem>
                    <MenuItem value="intermediate">Intermediate</MenuItem>
                    <MenuItem value="advanced">Advanced</MenuItem>
                    <MenuItem value="all">All Levels</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Duration */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  label="Duration (hours)"
                  type="number"
                  value={createFormData.duration}
                  onChange={(e) => setCreateFormData({ ...createFormData, duration: Number(e.target.value) || 0 })}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              
              {/* Instructor */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Instructor (Optional)</InputLabel>
                  <Select
                    value={createFormData.instructor}
                    onChange={(e) => setCreateFormData({ ...createFormData, instructor: e.target.value })}
                    label="Instructor (Optional)"
                  >
                    <MenuItem value="">
                      <em>None (Assigned to Admin)</em>
                    </MenuItem>
                    {trainers.map((trainer) => (
                      <MenuItem key={trainer._id} value={trainer._id}>
                        {trainer.name} ({trainer.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Language */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Primary Language</InputLabel>
                  <Select
                    value={createFormData.language[0] || 'en'}
                    onChange={(e) => setCreateFormData({ ...createFormData, language: [e.target.value] })}
                    label="Primary Language"
                  >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="ar">Arabic</MenuItem>
                    <MenuItem value="fr">French</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Pricing Section */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                  Pricing
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              {/* Price */}
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Price"
                  type="number"
                  value={createFormData.price}
                  onChange={(e) => setCreateFormData({ ...createFormData, price: Number(e.target.value) || 0 })}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              
              {/* Currency */}
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={createFormData.currency}
                    onChange={(e) => setCreateFormData({ ...createFormData, currency: e.target.value })}
                    label="Currency"
                  >
                    <MenuItem value="USD">USD</MenuItem>
                    <MenuItem value="EUR">EUR</MenuItem>
                    <MenuItem value="EGP">EGP</MenuItem>
                    <MenuItem value="SAR">SAR</MenuItem>
                    <MenuItem value="NGN">NGN</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Settings Section */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                  Course Settings
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              {/* Approval Status */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Approval Status</InputLabel>
                  <Select
                    value={createFormData.approvalStatus}
                    onChange={(e) => setCreateFormData({ ...createFormData, approvalStatus: e.target.value })}
                    label="Approval Status"
                  >
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Published Status */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Published Status</InputLabel>
                  <Select
                    value={createFormData.isPublished}
                    onChange={(e) => setCreateFormData({ ...createFormData, isPublished: e.target.value })}
                    label="Published Status"
                  >
                    <MenuItem value={true}>Published</MenuItem>
                    <MenuItem value={false}>Unpublished</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Thumbnail URL */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Thumbnail URL"
                  value={createFormData.thumbnail}
                  onChange={(e) => setCreateFormData({ ...createFormData, thumbnail: e.target.value })}
                  placeholder="https://example.com/thumbnail.jpg"
                />
              </Grid>

              {/* Content Section */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                  Course Content
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              {/* Tags */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Add Tag"
                    value={newFormTag}
                    onChange={(e) => setNewFormTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddFormTag()}
                  />
                  <Button onClick={handleAddFormTag} variant="outlined">Add</Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formTags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      onDelete={() => handleRemoveFormTag(tag)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Grid>

              {/* Prerequisites */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Prerequisites
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Add Prerequisite"
                    value={newPrerequisite}
                    onChange={(e) => setNewPrerequisite(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddPrerequisite()}
                  />
                  <Button onClick={handleAddPrerequisite} variant="outlined">Add</Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formPrerequisites.map((prereq, index) => (
                    <Chip
                      key={index}
                      label={prereq}
                      onDelete={() => handleRemovePrerequisite(prereq)}
                      color="secondary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Grid>

              {/* Learning Outcomes */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Learning Outcomes (What Students Will Learn)
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Add Learning Outcome"
                    value={newLearningOutcome}
                    onChange={(e) => setNewLearningOutcome(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddLearningOutcome()}
                  />
                  <Button onClick={handleAddLearningOutcome} variant="outlined">Add</Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formLearningOutcomes.map((outcome, index) => (
                    <Chip
                      key={index}
                      label={outcome}
                      onDelete={() => handleRemoveLearningOutcome(outcome)}
                      color="success"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateCourse} variant="contained" color="primary">
            Create Course
          </Button>
        </DialogActions>
      </Dialog>

      {/* Lesson Management Dialog */}
      {selectedCourse && (
        <LessonManagement
          courseId={selectedCourse._id}
          open={openLessonDialog}
          onClose={handleCloseLessonDialog}
        />
      )}
    </Container>
  );
};

export default AdminCourses;
