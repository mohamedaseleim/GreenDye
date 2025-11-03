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
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Block as BlockIcon,
  Restore as RestoreIcon,
  FileDownload as DownloadIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import adminService from '../services/adminService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminCertificates = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filterValid, setFilterValid] = useState('');
  const [filterRevoked, setFilterRevoked] = useState('');
  const [openBulkDialog, setOpenBulkDialog] = useState(false);
  const [bulkData, setBulkData] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchCertificates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate, page, rowsPerPage, search, filterValid, filterRevoked]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search,
        isValid: filterValid,
        isRevoked: filterRevoked
      };
      
      const response = await adminService.getAllCertificates(params);
      setCertificates(response.data || []);
      setTotal(response.total || 0);
    } catch (error) {
      toast.error('Failed to fetch certificates');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(0);
  };

  const handleRevoke = async (id) => {
    if (!window.confirm('Are you sure you want to revoke this certificate?')) {
      return;
    }

    try {
      await adminService.revokeCertificate(id, 'Revoked by administrator');
      toast.success('Certificate revoked successfully');
      fetchCertificates();
    } catch (error) {
      toast.error('Failed to revoke certificate');
      console.error('Error:', error);
    }
  };

  const handleRestore = async (id) => {
    try {
      await adminService.restoreCertificate(id);
      toast.success('Certificate restored successfully');
      fetchCertificates();
    } catch (error) {
      toast.error('Failed to restore certificate');
      console.error('Error:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this certificate?')) {
      return;
    }

    try {
      await adminService.deleteCertificate(id);
      toast.success('Certificate deleted successfully');
      fetchCertificates();
    } catch (error) {
      toast.error('Failed to delete certificate');
      console.error('Error:', error);
    }
  };

  const handleRegenerate = async (id) => {
    try {
      await adminService.regenerateCertificate(id);
      toast.success('Certificate regenerated successfully');
      fetchCertificates();
    } catch (error) {
      toast.error('Failed to regenerate certificate');
      console.error('Error:', error);
    }
  };

  const handleExport = async () => {
    try {
      const response = await adminService.exportCertificates({
        format: 'csv',
        isValid: filterValid,
        isRevoked: filterRevoked
      });
      
      toast.success('Export completed');
      console.log('Export data:', response);
    } catch (error) {
      toast.error('Failed to export certificates');
      console.error('Error:', error);
    }
  };

  const handleBulkUpload = async () => {
    try {
      // Parse CSV data
      const lines = bulkData.trim().split('\n');
      const certificates = lines.slice(1).map(line => {
        const [userEmail, courseId, grade, score, issueDate] = line.split(',');
        return {
          userEmail: userEmail?.trim(),
          courseId: courseId?.trim(),
          grade: grade?.trim(),
          score: score ? parseFloat(score.trim()) : undefined,
          issueDate: issueDate?.trim()
        };
      });

      const response = await adminService.bulkUploadCertificates(certificates);
      toast.success(`Uploaded ${response.data.success.length} certificates. ${response.data.failed.length} failed.`);
      setOpenBulkDialog(false);
      setBulkData('');
      fetchCertificates();
    } catch (error) {
      toast.error('Failed to bulk upload certificates');
      console.error('Error:', error);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Certificate Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => setOpenBulkDialog(true)}
            sx={{ mr: 1 }}
          >
            Bulk Upload
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            sx={{ mr: 1 }}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              // Future: Add certificate creation dialog
              toast.info('Certificate creation form coming soon');
            }}
          >
            Add Certificate
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search"
              placeholder="Search by name or certificate ID"
              value={search}
              onChange={handleSearchChange}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Valid Status</InputLabel>
              <Select
                value={filterValid}
                onChange={(e) => setFilterValid(e.target.value)}
                label="Valid Status"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Valid</MenuItem>
                <MenuItem value="false">Invalid</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Revoked Status</InputLabel>
              <Select
                value={filterRevoked}
                onChange={(e) => setFilterRevoked(e.target.value)}
                label="Revoked Status"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="false">Active</MenuItem>
                <MenuItem value="true">Revoked</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={fetchCertificates}
              startIcon={<RefreshIcon />}
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Table */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={5}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Certificate ID</TableCell>
                <TableCell>User Name</TableCell>
                <TableCell>Course</TableCell>
                <TableCell>Grade</TableCell>
                <TableCell>Issue Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {certificates.map((cert) => (
                <TableRow key={cert._id}>
                  <TableCell>{cert.certificateId}</TableCell>
                  <TableCell>{cert.userName}</TableCell>
                  <TableCell>
                    {cert.course?.title?.en || cert.courseName?.en || 'N/A'}
                  </TableCell>
                  <TableCell>{cert.grade}</TableCell>
                  <TableCell>
                    {new Date(cert.issueDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {cert.isRevoked ? (
                      <Chip label="Revoked" color="error" size="small" />
                    ) : cert.isValid ? (
                      <Chip label="Valid" color="success" size="small" />
                    ) : (
                      <Chip label="Invalid" color="warning" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleRegenerate(cert._id)}
                      title="Regenerate"
                    >
                      <RefreshIcon />
                    </IconButton>
                    {cert.isRevoked ? (
                      <IconButton
                        size="small"
                        onClick={() => handleRestore(cert._id)}
                        title="Restore"
                      >
                        <RestoreIcon />
                      </IconButton>
                    ) : (
                      <IconButton
                        size="small"
                        onClick={() => handleRevoke(cert._id)}
                        title="Revoke"
                      >
                        <BlockIcon />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(cert._id)}
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
            component="div"
            count={total}
            page={page}
            onPageChange={handlePageChange}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[10, 20, 50, 100]}
          />
        </TableContainer>
      )}

      {/* Bulk Upload Dialog */}
      <Dialog open={openBulkDialog} onClose={() => setOpenBulkDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Bulk Upload Certificates</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Paste CSV data with format: userEmail, courseId, grade, score, issueDate
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={10}
            value={bulkData}
            onChange={(e) => setBulkData(e.target.value)}
            placeholder="user@example.com,60a1b2c3d4e5f6g7h8i9j0k,A,95,2024-01-15"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBulkDialog(false)}>Cancel</Button>
          <Button onClick={handleBulkUpload} variant="contained">
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminCertificates;
