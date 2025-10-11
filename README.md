# GreenDye Academy - Training and Qualification Platform

A comprehensive e-learning platform for GreenDye Academy, supporting multi-language education and training across Africa, Asia, and the Middle East.

## 🌟 Features

### Core Features
- **Multi-language Support**: Arabic, English, and French
- **Certificate Verification**: Verify authenticity of certificates issued by the academy
- **Trainer Verification**: Verify accredited trainers
- **Learning Management System (LMS)**: 
  - Synchronous learning (live sessions)
  - Asynchronous learning (recorded courses)
  - Self-paced learning paths
- **User Management**: Students, trainers, and administrators
- **Course Management**: Create, edit, and manage courses
- **Progress Tracking**: Track student progress and achievements
- **Payment Integration**: Secure payment processing for courses
- **Mobile-First Design**: Responsive design that works on all devices
- **Progressive Web App (PWA)**: Installable mobile experience

### Additional Features
- **Discussion Forums**: Interactive community discussions
- **Live Chat Support**: Real-time support for students
- **Assessment & Quizzes**: Test knowledge and track progress
- **Video Streaming**: Optimized video delivery for courses
- **Certificates Generation**: Automatic certificate generation upon course completion
- **Notifications**: Email and push notifications
- **Analytics Dashboard**: Comprehensive analytics for admins
- **Content Management**: Easy content updates through admin panel

## 🚀 Technology Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: AWS S3 or local storage
- **Video Streaming**: HLS streaming protocol
- **Real-time**: Socket.io for live features

### Frontend
- **Framework**: React.js with hooks
- **State Management**: Context API / Redux
- **UI Library**: Material-UI / Tailwind CSS
- **Internationalization**: i18next
- **API Communication**: Axios
- **PWA**: Workbox for service workers

### Mobile
- **Technology**: Progressive Web App (PWA)
- **Alternative**: React Native (future implementation)

### DevOps
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx
- **Control Panel**: Hestia Control Panel v1.9.4
- **OS**: Ubuntu 22.04
- **CI/CD**: GitHub Actions

## 📋 Prerequisites

- Node.js >= 16.x
- MongoDB >= 5.x
- npm or yarn
- Docker (optional, for containerized deployment)

## 🛠️ Installation

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/mohamedaseleim/GreenDye.git
cd GreenDye
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

4. Create environment configuration:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Start MongoDB:
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or use your local MongoDB installation
```

6. Start the backend server:
```bash
cd backend
npm run dev
```

7. Start the frontend development server:
```bash
cd frontend
npm start
```

8. Access the application at `http://localhost:3000`

### Production Deployment with Docker

1. Build and start all services:
```bash
docker-compose up -d
```

2. Access the application at your domain

## 🗂️ Project Structure

```
GreenDye/
├── backend/                 # Backend API
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Express middleware
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   └── utils/             # Utility functions
├── frontend/              # React frontend
│   ├── public/           # Static files
│   └── src/              # Source code
│       ├── components/   # React components
│       ├── pages/        # Page components
│       ├── services/     # API services
│       ├── contexts/     # React contexts
│       └── locales/      # Translation files
├── mobile-app/           # Mobile app (PWA/React Native)
├── docs/                 # Documentation
├── deployment/           # Deployment configurations
└── docker-compose.yml    # Docker composition file
```

## 🔐 Environment Variables

Create a `.env` file in the backend directory:

```env
# Server
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000

# Database
MONGODB_URI=mongodb://localhost:27017/greendye

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRE=30d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-password

# File Upload
MAX_FILE_SIZE=10485760
FILE_UPLOAD_PATH=./uploads

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

## 📱 Mobile App

The platform includes a Progressive Web App (PWA) that can be installed on mobile devices:

1. Visit the website on your mobile device
2. Click "Add to Home Screen" when prompted
3. The app will be installed and can be used like a native app

## 🌐 Multi-language Support

The platform supports three languages:
- Arabic (ar) - العربية
- English (en) - Default
- French (fr) - Français

Language can be changed from the user menu or automatically detected based on browser settings.

## 📊 API Documentation

API documentation is available at `/api/docs` when running the server.

### Key Endpoints

- **Authentication**: `/api/auth/*`
- **Courses**: `/api/courses/*`
- **Users**: `/api/users/*`
- **Certificates**: `/api/certificates/*`
- **Trainers**: `/api/trainers/*`
- **Verification**: `/api/verify/*`

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👥 Support

For support, email support@greendye-academy.com or join our community forum.

## 🎯 Roadmap

- [x] Multi-language support
- [x] Certificate verification
- [x] Trainer verification
- [x] LMS with synchronous/asynchronous learning
- [x] PWA support
- [ ] Mobile app (React Native)
- [ ] AI-powered course recommendations
- [ ] Gamification features
- [ ] Social learning features
- [ ] Advanced analytics
- [ ] Integration with external LMS systems

## 🏆 Target Audience

The platform is designed for:
- Students of all ages
- Professionals seeking training
- Organizations requiring corporate training
- Trainers and educators

**Geographic Focus**: Africa, Asia, and Middle East, with primary focus on Egypt.
