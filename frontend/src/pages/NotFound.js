import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const NotFound = () => {
  return (
    <Container>
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" gutterBottom>
          NotFound
        </Typography>
        <Typography>
          NotFound page - Coming soon
        </Typography>
      </Box>
    </Container>
  );
};

export default NotFound;
