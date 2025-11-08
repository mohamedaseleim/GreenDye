import React, { useState, useEffect } from 'react';
import { Alert, IconButton, Box, Collapse } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import axios from 'axios';

const AnnouncementBanner = ({ userRole = 'all' }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [closedAnnouncements, setClosedAnnouncements] = useState([]);

  useEffect(() => {
    fetchActiveAnnouncements();
    // Load closed announcements from localStorage
    try {
      const closed = JSON.parse(localStorage.getItem('closedAnnouncements') || '[]');
      setClosedAnnouncements(closed);
    } catch (error) {
      console.error('Error loading closed announcements from localStorage:', error);
      setClosedAnnouncements([]);
    }
  }, []);

  const fetchActiveAnnouncements = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/announcements/active`);
      setAnnouncements(response.data.data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const handleClose = (announcementId) => {
    const newClosed = [...closedAnnouncements, announcementId];
    setClosedAnnouncements(newClosed);
    localStorage.setItem('closedAnnouncements', JSON.stringify(newClosed));
  };

  const getLocalizedText = (textObject) => {
    if (!textObject) return '';
    return textObject.en || textObject.ar || textObject.fr || '';
  };

  const getSeverity = (type) => {
    const severityMap = {
      info: 'info',
      warning: 'warning',
      success: 'success',
      error: 'error',
      maintenance: 'warning'
    };
    return severityMap[type] || 'info';
  };

  // Filter announcements for current user
  const visibleAnnouncements = announcements.filter(announcement => {
    // Check if already closed
    if (closedAnnouncements.includes(announcement._id)) return false;
    
    // Check target audience
    if (announcement.targetAudience.includes('all')) return true;
    if (announcement.targetAudience.includes(userRole)) return true;
    
    return false;
  });

  if (visibleAnnouncements.length === 0) return null;

  return (
    <Box sx={{ width: '100%' }}>
      {visibleAnnouncements.map((announcement) => (
        <Collapse key={announcement._id} in={true}>
          <Alert
            severity={getSeverity(announcement.type)}
            sx={{ 
              mb: 1,
              borderRadius: 0,
              '& .MuiAlert-message': { width: '100%' }
            }}
            action={
              announcement.dismissible && (
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => handleClose(announcement._id)}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              )
            }
          >
            <strong>{getLocalizedText(announcement.title)}</strong>
            {announcement.content && (
              <Box sx={{ mt: 0.5 }}>
                {getLocalizedText(announcement.content)}
              </Box>
            )}
          </Alert>
        </Collapse>
      ))}
    </Box>
  );
};

export default AnnouncementBanner;
