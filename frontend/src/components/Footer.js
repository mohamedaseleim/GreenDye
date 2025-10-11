import React from 'react';
import { Box, Container, Typography, Link, Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              GreenDye Academy
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Comprehensive Training and Qualification Platform
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              Quick Links
            </Typography>
            <Link href="/courses" color="inherit" display="block">
              {t('courses')}
            </Link>
            <Link href="/about" color="inherit" display="block">
              {t('about')}
            </Link>
            <Link href="/contact" color="inherit" display="block">
              {t('contact')}
            </Link>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              Verification
            </Typography>
            <Link href="/verify/certificate" color="inherit" display="block">
              {t('verifyCertificate')}
            </Link>
            <Link href="/verify/trainer" color="inherit" display="block">
              {t('verifyTrainer')}
            </Link>
          </Grid>
        </Grid>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 3 }}>
          {t('footerText')}
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
