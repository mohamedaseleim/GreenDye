import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const About = () => {
  return (
    <Container>
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" gutterBottom>
          About
        </Typography>
        <Typography>
          About page - Coming soon
        </Typography>
      </Box>
    </Container>
  );
};

export default About;
