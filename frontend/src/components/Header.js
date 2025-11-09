import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Select,
  FormControl,
  Container,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import axios from 'axios';

const Header = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { language, changeLanguage } = useLanguage();
  const { currency, changeCurrency } = useCurrency();
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  const [dynamicPages, setDynamicPages] = useState([]);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMobileMenu = (event) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/');
  };

  useEffect(() => {
    fetchPublishedPages();
  }, []);

  const fetchPublishedPages = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/pages`, {
        params: { location: 'header' }
      });
      setDynamicPages(response.data.data || []);
    } catch (error) {
      console.error('Error fetching pages:', error);
    }
  };

  return (
    <AppBar position="static">
      <Container maxWidth="lg">
        <Toolbar>
          {/* Logo */}
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              flexGrow: 1,
              textDecoration: 'none',
              color: 'inherit',
              fontWeight: 'bold',
            }}
          >
            🌿 GreenDye Academy
          </Typography>

          {/* Desktop Navigation */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, alignItems: 'center' }}>
            <Button color="inherit" component={RouterLink} to="/">
              {t('home')}
            </Button>
            <Button color="inherit" component={RouterLink} to="/courses">
              {t('courses')}
            </Button>
            <Button color="inherit" component={RouterLink} to="/about">
              {t('about')}
            </Button>
            <Button color="inherit" component={RouterLink} to="/contact">
              {t('contact')}
            </Button>

            {/* Dynamic Pages */}
            {dynamicPages.map((page) => (
              <Button 
                key={page._id} 
                color="inherit" 
                component={RouterLink} 
                to={`/${page.slug}`}
              >
                {page.title?.[language] || page.title?.en || page.slug}
              </Button>
            ))}

            {/* Analytics links: shown only when logged in */}
            {isAuthenticated && (
              <Button color="inherit" component={RouterLink} to="/analytics">
                {t('analytics')}
              </Button>
            )}
            {isAuthenticated && user?.role === 'trainer' && (
              <Button color="inherit" component={RouterLink} to="/trainer/dashboard">
                Trainer Dashboard
              </Button>
            )}
            {isAuthenticated && user?.role === 'admin' && (
              <Button color="inherit" component={RouterLink} to="/admin/dashboard">
                Admin Dashboard
              </Button>
            )}

            {/* Language Selector */}
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <Select
                value={language}
                onChange={(e) => changeLanguage(e.target.value)}
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.3)',
                  },
                }}
              >
                <MenuItem value="en">EN</MenuItem>
                <MenuItem value="ar">العربية</MenuItem>
                <MenuItem value="fr">FR</MenuItem>
              </Select>
            </FormControl>

            {/* Currency Selector */}
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <Select
                value={currency}
                onChange={(e) => changeCurrency(e.target.value)}
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.3)',
                  },
                }}
              >
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
                <MenuItem value="EGP">EGP</MenuItem>
                <MenuItem value="SAR">SAR</MenuItem>
                <MenuItem value="NGN">NGN</MenuItem>
              </Select>
            </FormControl>

            {/* User Menu */}
            {isAuthenticated ? (
              <div>
                <IconButton size="large" onClick={handleMenu} color="inherit">
                  <AccountCircle />
                </IconButton>
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
                  <MenuItem
                    onClick={() => {
                      navigate('/dashboard');
                      handleClose();
                    }}
                  >
                    {t('dashboard')}
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      navigate('/my-courses');
                      handleClose();
                    }}
                  >
                    {t('myCourses')}
                  </MenuItem>
                  {/* Analytics menu items */}
                    <MenuItem
                      onClick={() => {
                        navigate('/analytics');
                        handleClose();
                      }}
                    >
                      {t('analytics')}
                    </MenuItem>
                    {user?.role === 'trainer' && (
                      <MenuItem
                        onClick={() => {
                          navigate('/trainer/dashboard');
                          handleClose();
                        }}
                      >
                        Trainer Dashboard
                      </MenuItem>
                    )}
                    {user?.role === 'admin' && (
                      <>
                        <MenuItem
                          onClick={() => {
                            navigate('/admin/analytics');
                            handleClose();
                          }}
                        >
                          {t('adminAnalytics')}
                        </MenuItem>
                        <MenuItem
                          onClick={() => {
                            navigate('/admin/dashboard');
                            handleClose();
                          }}
                        >
                          {t('adminDashboard')}
                        </MenuItem>
                      </>
                    )}
                  <MenuItem onClick={handleLogout}>{t('logout')}</MenuItem>
                </Menu>
              </div>
            ) : (
              <>
                <Button color="inherit" component={RouterLink} to="/login">
                  {t('login')}
                </Button>
                <Button variant="outlined" color="inherit" component={RouterLink} to="/register">
                  {t('register')}
                </Button>
              </>
            )}
          </Box>

          {/* Mobile Menu */}
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <IconButton size="large" onClick={handleMobileMenu} color="inherit">
              <MenuIcon />
            </IconButton>
            <Menu anchorEl={mobileMenuAnchor} open={Boolean(mobileMenuAnchor)} onClose={handleMobileMenuClose}>
              <MenuItem
                onClick={() => {
                  navigate('/');
                  handleMobileMenuClose();
                }}
              >
                {t('home')}
              </MenuItem>
              <MenuItem
                onClick={() => {
                  navigate('/courses');
                  handleMobileMenuClose();
                }}
              >
                {t('courses')}
              </MenuItem>
              <MenuItem
                onClick={() => {
                  navigate('/about');
                  handleMobileMenuClose();
                }}
              >
                {t('about')}
              </MenuItem>
              <MenuItem
                onClick={() => {
                  navigate('/contact');
                  handleMobileMenuClose();
                }}
              >
                {t('contact')}
              </MenuItem>
              {/* Dynamic Pages */}
              {dynamicPages.map((page) => (
                <MenuItem
                  key={page._id}
                  onClick={() => {
                    navigate(`/${page.slug}`);
                    handleMobileMenuClose();
                  }}
                >
                  {page.title?.[language] || page.title?.en || page.slug}
                </MenuItem>
              ))}
              {isAuthenticated && (
                <>
                  {/* Mobile analytics menu items */}
                  <MenuItem
                    onClick={() => {
                      navigate('/analytics');
                      handleMobileMenuClose();
                    }}
                  >
                    {t('analytics')}
                  </MenuItem>
                  {user?.role === 'admin' && (
                    <>
                      <MenuItem
                        onClick={() => {
                          navigate('/admin/analytics');
                          handleMobileMenuClose();
                        }}
                      >
                        {t('adminAnalytics')}
                      </MenuItem>
                      <MenuItem
                        onClick={() => {
                          navigate('/admin/dashboard');
                          handleMobileMenuClose();
                        }}
                      >
                        {t('adminDashboard')}
                      </MenuItem>
                    </>
                  )}
                  <MenuItem
                    onClick={() => {
                      navigate('/dashboard');
                      handleMobileMenuClose();
                    }}
                  >
                    {t('dashboard')}
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      navigate('/my-courses');
                      handleMobileMenuClose();
                    }}
                  >
                    {t('myCourses')}
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>{t('logout')}</MenuItem>
                </>
              )}
              {!isAuthenticated && (
                <>
                  <MenuItem
                    onClick={() => {
                      navigate('/login');
                      handleMobileMenuClose();
                    }}
                  >
                    {t('login')}
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      navigate('/register');
                      handleMobileMenuClose();
                    }}
                  >
                    {t('register')}
                  </MenuItem>
                </>
              )}
              {/* Language selection on mobile */}
              <MenuItem>
                <FormControl size="small" fullWidth>
                  <Select
                    value={language}
                    onChange={(e) => {
                      changeLanguage(e.target.value);
                      handleMobileMenuClose();
                    }}
                  >
                    <MenuItem value="en">EN</MenuItem>
                    <MenuItem value="ar">العربية</MenuItem>
                    <MenuItem value="fr">FR</MenuItem>
                  </Select>
                </FormControl>
              </MenuItem>
              {/* Currency selection on mobile */}
              <MenuItem>
                <FormControl size="small" fullWidth>
                  <Select
                    value={currency}
                    onChange={(e) => {
                      changeCurrency(e.target.value);
                      handleMobileMenuClose();
                    }}
                  >
                    <MenuItem value="USD">USD</MenuItem>
                    <MenuItem value="EUR">EUR</MenuItem>
                    <MenuItem value="EGP">EGP</MenuItem>
                    <MenuItem value="SAR">SAR</MenuItem>
                    <MenuItem value="NGN">NGN</MenuItem>
                  </Select>
                </FormControl>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
