import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const Dashboard = () => {
  return (
    <Container>
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" gutterBottom>
          Dashboard
        </Typography>
        <Typography>
          Dashboard page - Coming soon
        </Typography>
      </Box>
    </Container>
  );
};

export default Dashboard;
