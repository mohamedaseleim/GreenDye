import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { CurrencyProvider } from './contexts/CurrencyContext';

// Pages
import Home from './pages/Home';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import VerifyCertificate from './pages/VerifyCertificate';
import VerifyTrainer from './pages/VerifyTrainer';
import MyCourses from './pages/MyCourses';
import CoursePlayer from './pages/CoursePlayer';
import About from './pages/About';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import Forum from './pages/Forum';
import Chat from './pages/Chat';

// NEW: Quiz pages
import Quiz from './pages/Quiz';
// If you create a separate results page component, uncomment the next line:
// import QuizResults from './pages/QuizResults';

// Components
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

// NEW: Admin-only content management
import AdminRoute from './components/AdminRoute';
import AdminLessons from './pages/AdminLessons';
import AdminDashboard from './pages/AdminDashboard';
import AdminCertificates from './pages/AdminCertificates';
import AdminPages from './pages/AdminPages';
import AdminMedia from './pages/AdminMedia';
import AdminModeration from './pages/AdminModeration';
import AdminAnnouncements from './pages/AdminAnnouncements';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminTrainers from './pages/AdminTrainers';
import AdminUsers from './pages/AdminUsers';
import AdminCourses from './pages/AdminCourses';
import AdminPayments from './pages/AdminPayments';
import AdminSettings from './pages/AdminSettings';

// NEW: analytics import
import { trackPageView } from './services/analyticsService';
import Analytics from './pages/Analytics';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2e7d32', // Green theme
      light: '#60ad5e',
      dark: '#005005',
    },
    secondary: {
      main: '#ff9800',
      light: '#ffc947',
      dark: '#c66900',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

// Component to track page views
function AnalyticsTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);
  return null;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Nest context providers: language first, then currency, then auth */}
      <LanguageProvider>
        <CurrencyProvider>
          <AuthProvider>
            <Router>
              <Layout>
                {/* Analytics tracker */}
                <AnalyticsTracker />
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/courses" element={<Courses />} />
                  <Route path="/courses/:id" element={<CourseDetail />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/forums" element={<Forum />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/verify/certificate" element={<VerifyCertificate />} />
                  <Route
                    path="/verify/certificate/:certificateId"
                    element={<VerifyCertificate />}
                  />
                  <Route path="/verify/trainer" element={<VerifyTrainer />} />
                  <Route
                    path="/verify/trainer/:trainerId"
                    element={<VerifyTrainer />}
                  />

                  {/* Private routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <PrivateRoute>
                        <Dashboard />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/my-courses"
                    element={
                      <PrivateRoute>
                        <MyCourses />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/learn/:courseId"
                    element={
                      <PrivateRoute>
                        <CoursePlayer />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/analytics"
                    element={
                      <PrivateRoute>
                        <Analytics />
                      </PrivateRoute>
                    }
                  />

                  {/* NEW: Admin-only content management */}
                  <Route
                    path="/admin/dashboard"
                    element={
                      <PrivateRoute>
                        <AdminRoute>
                          <AdminDashboard />
                        </AdminRoute>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/admin/certificates"
                    element={
                      <PrivateRoute>
                        <AdminRoute>
                          <AdminCertificates />
                        </AdminRoute>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/admin/pages"
                    element={
                      <PrivateRoute>
                        <AdminRoute>
                          <AdminPages />
                        </AdminRoute>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/admin/media"
                    element={
                      <PrivateRoute>
                        <AdminRoute>
                          <AdminMedia />
                        </AdminRoute>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/admin/announcements"
                    element={
                      <PrivateRoute>
                        <AdminRoute>
                          <AdminAnnouncements />
                        </AdminRoute>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/admin/moderation"
                    element={
                      <PrivateRoute>
                        <AdminRoute>
                          <AdminModeration />
                        </AdminRoute>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/admin/lessons/:courseId"
                    element={
                      <PrivateRoute>
                        <AdminRoute>
                          <AdminLessons />
                        </AdminRoute>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/admin/analytics"
                    element={
                      <PrivateRoute>
                        <AdminRoute>
                          <AdminAnalytics />
                        </AdminRoute>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/admin/payments"
                    element={
                      <PrivateRoute>
                        <AdminRoute>
                          <AdminPayments />
                        </AdminRoute>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/admin/trainers"
                    element={
                      <PrivateRoute>
                        <AdminRoute>
                          <AdminTrainers />
                        </AdminRoute>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/admin/users"
                    element={
                      <PrivateRoute>
                        <AdminRoute>
                          <AdminUsers />
                        </AdminRoute>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/admin/courses"
                    element={
                      <PrivateRoute>
                        <AdminRoute>
                          <AdminCourses />
                        </AdminRoute>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/admin/settings"
                    element={
                      <PrivateRoute>
                        <AdminRoute>
                          <AdminSettings />
                        </AdminRoute>
                      </PrivateRoute>
                    }
                  />

                  {/* NEW: Quiz routes */}
                  <Route
                    path="/quizzes/:id"
                    element={
                      <PrivateRoute>
                        <Quiz />
                      </PrivateRoute>
                    }
                  />
                  {/* If you create a dedicated results page, enable this: */}
                  {/* <Route
                    path="/quizzes/:id/results"
                    element={
                      <PrivateRoute>
                        <QuizResults />
                      </PrivateRoute>
                    }
                  /> */}

                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </Router>
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
          </AuthProvider>
        </CurrencyProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
