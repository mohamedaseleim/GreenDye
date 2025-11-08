import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { renderIcon, getCurrentLang } from '../utils/contentHelpers';

const Home = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState(null);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/content-settings/public`);
      setContent(response.data.data);
    } catch (error) {
      console.error('Error fetching content:', error);
      // Fall back to default content if fetch fails
      setContent({
        homePage: {
          heroTitle: {
            en: 'Welcome to GreenDye Academy',
            ar: 'مرحبًا بك في أكاديمية GreenDye',
            fr: 'Bienvenue à l\'Académie GreenDye',
          },
          heroSubtitle: {
            en: 'Learn, Grow, and Succeed with Quality Education',
            ar: 'تعلم، انمو، وانجح مع التعليم الجيد',
            fr: 'Apprendre, Grandir et Réussir avec une Éducation de Qualité',
          },
          features: [
            { icon: 'School', title: 'Quality Education', description: 'Access world-class courses from expert trainers' },
            { icon: 'Verified', title: 'Verified Certificates', description: 'Earn verified certificates upon course completion' },
            { icon: 'Language', title: 'Multi-Language Support', description: 'Learn in Arabic, English, or French' },
            { icon: 'People', title: 'Expert Trainers', description: 'Learn from verified and accredited trainers' },
          ],
        },
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  const currentLang = getCurrentLang(i18n);
  const heroTitle = content?.homePage?.heroTitle?.[currentLang] || t('heroTitle');
  const heroSubtitle = content?.homePage?.heroSubtitle?.[currentLang] || t('heroSubtitle');
  const features = content?.homePage?.features || [];

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
            {heroTitle}
          </Typography>
          <Typography variant="h5" component="p" gutterBottom>
            {heroSubtitle}
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
                  {renderIcon(feature.icon)}
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
