import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { School, Verified, Language, People } from '@mui/icons-material';

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const features = [
    {
      icon: <School fontSize="large" />,
      title: 'Quality Education',
      description: 'Access world-class courses from expert trainers'
    },
    {
      icon: <Verified fontSize="large" />,
      title: 'Verified Certificates',
      description: 'Earn verified certificates upon course completion'
    },
    {
      icon: <Language fontSize="large" />,
      title: 'Multi-Language Support',
      description: 'Learn in Arabic, English, or French'
    },
    {
      icon: <People fontSize="large" />,
      title: 'Expert Trainers',
      description: 'Learn from verified and accredited trainers'
    }
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 10,
          textAlign: 'center'
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" component="h1" gutterBottom>
            {t('heroTitle')}
          </Typography>
          <Typography variant="h5" component="p" gutterBottom>
            {t('heroSubtitle')}
          </Typography>
          <Box sx={{ mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              color="secondary"
              onClick={() => navigate('/courses')}
              sx={{ mr: 2 }}
            >
              {t('exploreCourses')}
            </Button>
            <Button
              variant="outlined"
              size="large"
              color="inherit"
              onClick={() => navigate('/register')}
            >
              {t('getStarted')}
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" component="h2" align="center" gutterBottom>
          Why Choose GreenDye Academy?
        </Typography>
        <Grid container spacing={4} sx={{ mt: 2 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                <Box sx={{ color: 'primary.main', mb: 2 }}>
                  {feature.icon}
                </Box>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box sx={{ bgcolor: 'grey.100', py: 8 }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Ready to Start Learning?
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Join thousands of students already learning on GreenDye Academy
          </Typography>
          <Button
            variant="contained"
            size="large"
            color="primary"
            onClick={() => navigate('/register')}
            sx={{ mt: 3 }}
          >
            {t('register')}
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
