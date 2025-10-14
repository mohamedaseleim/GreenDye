import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  Paper,
  Card,
  CardContent,
} from '@mui/material';
import { Email, Phone, LocationOn, Send } from '@mui/icons-material';
import { toast } from 'react-toastify';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate form submission
    setTimeout(() => {
      toast.success('Message sent successfully! We will get back to you soon.');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
      setLoading(false);
    }, 1000);
  };

  const contactInfo = [
    {
      icon: <Email fontSize="large" />,
      title: 'Email',
      content: 'info@greendye-academy.com',
      link: 'mailto:info@greendye-academy.com',
    },
    {
      icon: <Phone fontSize="large" />,
      title: 'Phone',
      content: '+20 123 456 7890',
      link: 'tel:+201234567890',
    },
    {
      icon: <LocationOn fontSize="large" />,
      title: 'Address',
      content: 'Cairo, Egypt',
      link: null,
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 6,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h2" component="h1" gutterBottom>
            Contact Us
          </Typography>
          <Typography variant="h6">
            Have questions? We'd love to hear from you.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={6}>
          {/* Contact Form */}
          <Grid item xs={12} md={7}>
            <Paper elevation={3} sx={{ p: 4 }}>
              <Typography variant="h4" gutterBottom>
                Send us a Message
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Fill out the form below and we'll get back to you as soon as possible.
              </Typography>
              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  margin="normal"
                  multiline
                  rows={6}
                  required
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={<Send />}
                  sx={{ mt: 3 }}
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Contact Information */}
          <Grid item xs={12} md={5}>
            <Typography variant="h4" gutterBottom>
              Get in Touch
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              We're here to help and answer any question you might have. We look forward to
              hearing from you.
            </Typography>

            {contactInfo.map((info, index) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ color: 'primary.main' }}>{info.icon}</Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        {info.title}
                      </Typography>
                      {info.link ? (
                        <Typography
                          component="a"
                          href={info.link}
                          variant="body1"
                          sx={{ textDecoration: 'none', color: 'primary.main' }}
                        >
                          {info.content}
                        </Typography>
                      ) : (
                        <Typography variant="body1">{info.content}</Typography>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}

            {/* Office Hours */}
            <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>
                Office Hours
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Monday - Friday: 9:00 AM - 6:00 PM
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Saturday: 10:00 AM - 4:00 PM
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sunday: Closed
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Contact;
