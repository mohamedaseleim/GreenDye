import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Button,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import {
  PlayCircleOutline,
  CheckCircle,
  MenuBook,
  Quiz,
  Assignment,
  VideoLibrary,
  ArrowBack,
} from '@mui/icons-material';
import axios from 'axios';

const CoursePlayer = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [enrollment, setEnrollment] = useState(null);
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCourseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const fetchCourseData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch enrollment details
      const enrollmentResponse = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/enrollments/my-courses`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      
      const userEnrollment = enrollmentResponse.data.data?.find(
        (e) => (e.course?._id || e.course) === courseId
      );

      if (!userEnrollment) {
        setError('You are not enrolled in this course');
        setLoading(false);
        return;
      }

      setEnrollment(userEnrollment);
      
      // Fetch course details
      const courseResponse = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/courses/${courseId}`
      );
      
      setCourse(courseResponse.data.data);
      
      // For demo purposes, create sample lessons
      // In a real implementation, you would fetch these from the API
      const sampleLessons = [
        {
          _id: '1',
          title: 'Introduction to the Course',
          type: 'video',
          duration: 15,
          completed: userEnrollment.progress >= 20,
        },
        {
          _id: '2',
          title: 'Getting Started',
          type: 'text',
          duration: 10,
          completed: userEnrollment.progress >= 40,
        },
        {
          _id: '3',
          title: 'Core Concepts',
          type: 'video',
          duration: 25,
          completed: userEnrollment.progress >= 60,
        },
        {
          _id: '4',
          title: 'Practice Quiz',
          type: 'quiz',
          duration: 20,
          completed: userEnrollment.progress >= 80,
        },
        {
          _id: '5',
          title: 'Final Assignment',
          type: 'assignment',
          duration: 30,
          completed: userEnrollment.progress >= 100,
        },
      ];
      
      setLessons(sampleLessons);
      setCurrentLesson(sampleLessons[0]);
    } catch (err) {
      setError('Failed to load course content. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getCourseTitle = (courseTitle) => {
    if (typeof courseTitle === 'object' && courseTitle !== null) {
      return courseTitle.en || courseTitle.ar || courseTitle.fr || 'Untitled Course';
    }
    return courseTitle || 'Untitled Course';
  };

  const getLessonIcon = (type) => {
    switch (type) {
      case 'video':
        return <VideoLibrary />;
      case 'text':
        return <MenuBook />;
      case 'quiz':
        return <Quiz />;
      case 'assignment':
        return <Assignment />;
      default:
        return <PlayCircleOutline />;
    }
  };

  const handleLessonClick = (lesson) => {
    setCurrentLesson(lesson);
  };

  const handleMarkComplete = async () => {
    try {
      // In a real implementation, you would call the API to mark the lesson as complete
      // For now, we'll just update the local state
      setCurrentLesson({ ...currentLesson, completed: true });
      
      // Find next incomplete lesson
      const currentIndex = lessons.findIndex((l) => l._id === currentLesson._id);
      const nextLesson = lessons[currentIndex + 1];
      if (nextLesson && !nextLesson.completed) {
        setCurrentLesson(nextLesson);
      }
    } catch (err) {
      console.error('Failed to mark lesson as complete:', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/my-courses')}>
          Back to My Courses
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      <Grid container sx={{ height: '100%' }}>
        {/* Course Content Area */}
        <Grid item xs={12} md={8} sx={{ height: '100%', overflow: 'auto' }}>
          <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <IconButton onClick={() => navigate('/my-courses')} sx={{ mr: 2 }}>
                <ArrowBack />
              </IconButton>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h5">{getCourseTitle(course?.title)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {enrollment?.progress || 0}% Complete
                </Typography>
              </Box>
            </Box>

            <LinearProgress
              variant="determinate"
              value={enrollment?.progress || 0}
              sx={{ mb: 4, height: 8, borderRadius: 1 }}
            />

            {/* Current Lesson Content */}
            {currentLesson && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  {getLessonIcon(currentLesson.type)}
                  <Typography variant="h5">{currentLesson.title}</Typography>
                  {currentLesson.completed && (
                    <Chip label="Completed" color="success" size="small" />
                  )}
                </Box>
                
                <Divider sx={{ my: 2 }} />

                {/* Lesson Content Area */}
                <Box
                  sx={{
                    minHeight: 400,
                    bgcolor: 'grey.100',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                  }}
                >
                  {currentLesson.type === 'video' && (
                    <Box sx={{ textAlign: 'center' }}>
                      <VideoLibrary sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        Video Player
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Duration: {currentLesson.duration} minutes
                      </Typography>
                    </Box>
                  )}
                  {currentLesson.type === 'text' && (
                    <Box sx={{ p: 4, width: '100%' }}>
                      <Typography variant="body1" paragraph>
                        This is where the lesson text content would appear. In a full implementation,
                        this would load the actual lesson content from the database.
                      </Typography>
                      <Typography variant="body1" paragraph>
                        The content can include formatted text, images, code snippets, and more.
                      </Typography>
                    </Box>
                  )}
                  {currentLesson.type === 'quiz' && (
                    <Box sx={{ textAlign: 'center' }}>
                      <Quiz sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        Quiz Assessment
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Test your knowledge
                      </Typography>
                    </Box>
                  )}
                  {currentLesson.type === 'assignment' && (
                    <Box sx={{ textAlign: 'center' }}>
                      <Assignment sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        Assignment
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Complete and submit your work
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
                  <Button
                    variant="outlined"
                    disabled={lessons.indexOf(currentLesson) === 0}
                    onClick={() => {
                      const currentIndex = lessons.indexOf(currentLesson);
                      if (currentIndex > 0) {
                        setCurrentLesson(lessons[currentIndex - 1]);
                      }
                    }}
                  >
                    Previous Lesson
                  </Button>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {!currentLesson.completed && (
                      <Button variant="contained" color="success" onClick={handleMarkComplete}>
                        Mark as Complete
                      </Button>
                    )}
                    <Button
                      variant="contained"
                      disabled={lessons.indexOf(currentLesson) === lessons.length - 1}
                      onClick={() => {
                        const currentIndex = lessons.indexOf(currentLesson);
                        if (currentIndex < lessons.length - 1) {
                          setCurrentLesson(lessons[currentIndex + 1]);
                        }
                      }}
                    >
                      Next Lesson
                    </Button>
                  </Box>
                </Box>
              </Paper>
            )}
          </Box>
        </Grid>

        {/* Course Curriculum Sidebar */}
        <Grid
          item
          xs={12}
          md={4}
          sx={{
            height: '100%',
            borderLeft: { md: 1 },
            borderColor: 'divider',
            bgcolor: 'grey.50',
            overflow: 'auto',
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Course Curriculum
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {lessons.filter((l) => l.completed).length} of {lessons.length} lessons completed
            </Typography>
            
            <Divider sx={{ my: 2 }} />

            <List>
              {lessons.map((lesson, index) => (
                <ListItem key={lesson._id} disablePadding sx={{ mb: 1 }}>
                  <ListItemButton
                    selected={currentLesson?._id === lesson._id}
                    onClick={() => handleLessonClick(lesson)}
                    sx={{
                      borderRadius: 1,
                      '&.Mui-selected': {
                        bgcolor: 'primary.light',
                        color: 'primary.contrastText',
                        '&:hover': {
                          bgcolor: 'primary.main',
                        },
                      },
                    }}
                  >
                    <ListItemIcon>
                      {lesson.completed ? (
                        <CheckCircle color="success" />
                      ) : (
                        getLessonIcon(lesson.type)
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={`${index + 1}. ${lesson.title}`}
                      secondary={`${lesson.duration} min`}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CoursePlayer;
