import React from 'react';
import { Container, Typography, Box, Grid, Card, CardContent, Paper } from '@mui/material';
import { School, Verified, Language, People, TrendingUp, Security } from '@mui/icons-material';

const About = () => {
  const features = [
    {
      icon: <School fontSize="large" />,
      title: 'Quality Education',
      description: 'We provide world-class courses from expert trainers across multiple disciplines and industries.',
    },
    {
      icon: <Verified fontSize="large" />,
      title: 'Verified Certificates',
      description: 'Earn verified certificates upon course completion with unique IDs and QR codes for authentication.',
    },
    {
      icon: <Language fontSize="large" />,
      title: 'Multi-Language',
      description: 'Learn in your preferred language with full support for Arabic, English, and French.',
    },
    {
      icon: <People fontSize="large" />,
      title: 'Expert Trainers',
      description: 'Learn from verified and accredited trainers with proven industry experience and qualifications.',
    },
    {
      icon: <TrendingUp fontSize="large" />,
      title: 'Career Growth',
      description: 'Advance your career with practical skills and industry-recognized certifications.',
    },
    {
      icon: <Security fontSize="large" />,
      title: 'Secure Platform',
      description: 'Your data is protected with industry-standard security measures and encryption.',
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" component="h1" gutterBottom>
            About GreenDye Academy
          </Typography>
          <Typography variant="h6" sx={{ mt: 2 }}>
            Empowering learners across Africa, Asia, and the Middle East with quality education
          </Typography>
        </Container>
      </Box>

      {/* Mission Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={6}>
          <Grid item xs={12} md={6}>
            <Typography variant="h4" gutterBottom color="primary">
              Our Mission
            </Typography>
            <Typography variant="body1" paragraph>
              GreenDye Academy is committed to democratizing education by providing accessible,
              high-quality training and qualification programs to students and professionals across
              Africa, Asia, and the Middle East, with a primary focus on Egypt.
            </Typography>
            <Typography variant="body1" paragraph>
              We believe that education is a fundamental right and a powerful tool for personal and
              professional growth. Our platform breaks down barriers to learning by offering courses
              in multiple languages and at various skill levels.
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h4" gutterBottom color="primary">
              Our Vision
            </Typography>
            <Typography variant="body1" paragraph>
              To become the leading e-learning platform in the region, recognized for quality
              education, verified certifications, and excellent learning experiences.
            </Typography>
            <Typography variant="body1" paragraph>
              We envision a world where anyone, anywhere, can access world-class education and
              develop the skills they need to succeed in the modern economy. Our commitment to
              multi-language support and cultural sensitivity ensures that learning is inclusive
              and accessible to all.
            </Typography>
          </Grid>
        </Grid>
      </Container>

      {/* Features Section */}
      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" gutterBottom sx={{ mb: 6 }}>
            Why Choose Us
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ height: '100%', textAlign: 'center' }}>
                  <CardContent>
                    <Box sx={{ color: 'primary.main', mb: 2 }}>
                      {feature.icon}
                    </Box>
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
      </Box>

      {/* Stats Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={4} sx={{ textAlign: 'center' }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h3" color="primary" gutterBottom>
                1000+
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Students
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h3" color="primary" gutterBottom>
                100+
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Courses
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h3" color="primary" gutterBottom>
                50+
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Expert Trainers
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h3" color="primary" gutterBottom>
                3
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Languages
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default About;
