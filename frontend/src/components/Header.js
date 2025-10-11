import React, { useState } from 'react';
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
  Container
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Language as LanguageIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const Header = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { language, changeLanguage } = useLanguage();
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);

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
              fontWeight: 'bold'
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

            {/* Language Selector */}
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <Select
                value={language}
                onChange={(e) => changeLanguage(e.target.value)}
                sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' } }}
              >
                <MenuItem value="en">EN</MenuItem>
                <MenuItem value="ar">العربية</MenuItem>
                <MenuItem value="fr">FR</MenuItem>
              </Select>
            </FormControl>

            {/* User Menu */}
            {isAuthenticated ? (
              <div>
                <IconButton
                  size="large"
                  onClick={handleMenu}
                  color="inherit"
                >
                  <AccountCircle />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                >
                  <MenuItem onClick={() => { navigate('/dashboard'); handleClose(); }}>
                    {t('dashboard')}
                  </MenuItem>
                  <MenuItem onClick={() => { navigate('/my-courses'); handleClose(); }}>
                    {t('myCourses')}
                  </MenuItem>
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
            <IconButton
              size="large"
              onClick={handleMobileMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={mobileMenuAnchor}
              open={Boolean(mobileMenuAnchor)}
              onClose={handleMobileMenuClose}
            >
              <MenuItem onClick={() => { navigate('/'); handleMobileMenuClose(); }}>
                {t('home')}
              </MenuItem>
              <MenuItem onClick={() => { navigate('/courses'); handleMobileMenuClose(); }}>
                {t('courses')}
              </MenuItem>
              <MenuItem onClick={() => { navigate('/about'); handleMobileMenuClose(); }}>
                {t('about')}
              </MenuItem>
              <MenuItem onClick={() => { navigate('/contact'); handleMobileMenuClose(); }}>
                {t('contact')}
              </MenuItem>
              {isAuthenticated && (
                <>
                  <MenuItem onClick={() => { navigate('/dashboard'); handleMobileMenuClose(); }}>
                    {t('dashboard')}
                  </MenuItem>
                  <MenuItem onClick={() => { navigate('/my-courses'); handleMobileMenuClose(); }}>
                    {t('myCourses')}
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>{t('logout')}</MenuItem>
                </>
              )}
              {!isAuthenticated && (
                <>
                  <MenuItem onClick={() => { navigate('/login'); handleMobileMenuClose(); }}>
                    {t('login')}
                  </MenuItem>
                  <MenuItem onClick={() => { navigate('/register'); handleMobileMenuClose(); }}>
                    {t('register')}
                  </MenuItem>
                </>
              )}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
