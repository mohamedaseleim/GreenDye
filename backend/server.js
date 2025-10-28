const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize Express app
const app = express();

// If behind a proxy/load balancer (Heroku, Vercel, Nginx)
app.set('trust proxy', 1);

// Security middleware
app.use(
  helmet({
    // Tweak if you embed PDFs/images/QRs on the frontend
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Sanitize data
app.use(mongoSanitize());

// Prevent XSS attacks
app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Prevent http param pollution
app.use(hpp());

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Serve generated invoices
app.use('/invoices', express.static(path.join(__dirname, 'invoices')));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/certificates', require('./routes/certificateRoutes'));
app.use('/api/trainers', require('./routes/trainerRoutes'));
app.use('/api/verify', require('./routes/verifyRoutes')); // public verification (supports ?t=token)
app.use('/api/enrollments', require('./routes/enrollmentRoutes'));
app.use('/api/lessons', require('./routes/lessonRoutes'));
app.use('/api/quizzes', require('./routes/quizRoutes')); // includes attempts/analytics/grade
app.use('/api/forums', require('./routes/forumRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/gamification', require('./routes/gamificationRoutes'));
app.use('/api/recommendations', require('./routes/recommendationRoutes'));
app.use('/api/corporate', require('./routes/corporateRoutes'));
app.use('/api/search', require('./routes/searchRoutes'));
app.use('/api/progress', require('./routes/progressRoutes'));
app.use('/api/lms-integration', require('./routes/lmsIntegrationRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));

// NEW: refund routes for admin approval workflow
app.use('/api/refunds', require('./routes/refundRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'GreenDye Academy API is running',
    timestamp: new Date().toISOString(),
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'GreenDye Academy API Documentation',
    version: '1.2.0',
    endpoints: {
      auth: '/api/auth - Authentication endpoints',
      users: '/api/users - User management',
      courses: '/api/courses - Course management',
      certificates: '/api/certificates - Certificate management',
      trainers: '/api/trainers - Trainer management',
      verify: '/api/verify - Verification services',
      enrollments: '/api/enrollments - Course enrollments',
      lessons: '/api/lessons - Lesson management',
      quizzes:
        '/api/quizzes - Quiz and assessment (including submission, attempts, analytics and grading)',
      forums: '/api/forums - Discussion forums',
      notifications: '/api/notifications - Notification system',
      payments: '/api/payments - Payment processing',
      analytics: '/api/analytics - Analytics and reports',
      gamification: '/api/gamification - Badges, points, and leaderboards',
      chat: '/api/chat - Live chat support',
      recommendations: '/api/recommendations - AI-powered course recommendations',
      corporate: '/api/corporate - Corporate portal and team management',
      search: '/api/search - Advanced search functionality',
      progress: '/api/progress - Progress tracking',
      lmsIntegration: '/api/lms-integration - External LMS integrations',
      refunds: '/api/refunds - Refund requests (admin approval workflow)', // Added refund docs
    },
  });
});

// Handle 404 (keep before error handler)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
    ╔══════════════════════════════════════════════╗
    ║   GreenDye Academy API Server Running       ║
    ║   Environment: ${process.env.NODE_ENV || 'development'}                    ║
    ║   Port: ${PORT}                                ║
    ║   URL: http://localhost:${PORT}               ║
    ╚══════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

// Socket.io setup for real-time features
const io = require('socket.io')(server, {
  cors: {
    origin:
      process.env.SOCKET_CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join-course', (courseId) => {
    socket.join(`course-${courseId}`);
    console.log(`User joined course room: ${courseId}`);
  });

  socket.on('leave-course', (courseId) => {
    socket.leave(`course-${courseId}`);
    console.log(`User left course room: ${courseId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Export for testing
module.exports = { app, server, io };
