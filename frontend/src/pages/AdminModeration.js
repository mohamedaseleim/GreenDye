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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import adminService from '../services/adminService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminModeration = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [moderationReason, setModerationReason] = useState('');
  const [actionType, setActionType] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchPendingPosts();
  }, [user, navigate]);

  const fetchPendingPosts = async () => {
    try {
      setLoading(true);
      const response = await adminService.getPendingForumPosts({ status: 'pending' });
      setPosts(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch pending posts');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (post, action) => {
    setSelectedPost(post);
    setActionType(action);
    setModerationReason('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPost(null);
    setModerationReason('');
  };

  const handleModerate = async () => {
    try {
      await adminService.moderateForumPost(
        selectedPost._id,
        actionType,
        moderationReason
      );
      toast.success(`Post ${actionType === 'approved' ? 'approved' : 'rejected'} successfully`);
      handleCloseDialog();
      fetchPendingPosts();
    } catch (error) {
      toast.error('Failed to moderate post');
      console.error('Error:', error);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Content Moderation
        </Typography>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={5}>
          <CircularProgress />
        </Box>
      ) : posts.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No pending posts to moderate
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Author</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post._id}>
                  <TableCell>{post.title}</TableCell>
                  <TableCell>{post.author?.name || 'Unknown'}</TableCell>
                  <TableCell>{post.category || 'General'}</TableCell>
                  <TableCell>
                    {new Date(post.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={post.status || 'pending'}
                      color="warning"
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      color="success"
                      onClick={() => handleOpenDialog(post, 'approved')}
                      title="Approve"
                    >
                      <ApproveIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleOpenDialog(post, 'rejected')}
                      title="Reject"
                    >
                      <RejectIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Moderation Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {actionType === 'approved' ? 'Approve Post' : 'Reject Post'}
        </DialogTitle>
        <DialogContent>
          {selectedPost && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedPost.title}
              </Typography>
              <Typography variant="body1" paragraph>
                {selectedPost.content}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                By: {selectedPost.author?.name || 'Unknown'} •{' '}
                {new Date(selectedPost.createdAt).toLocaleString()}
              </Typography>
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label={actionType === 'rejected' ? 'Reason for rejection' : 'Notes (optional)'}
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                sx={{ mt: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleModerate}
            variant="contained"
            color={actionType === 'approved' ? 'success' : 'error'}
          >
            {actionType === 'approved' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminModeration;
