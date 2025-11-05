import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  IconButton,
  Card,
  CardContent,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

export default function QuizBuilder({ open, onClose, quiz, courseId, lessonId, onSave }) {
  const [formData, setFormData] = useState({
    course: courseId,
    lesson: lessonId || null,
    title: { en: '' },
    description: { en: '' },
    questions: [],
    totalPoints: 0,
    passingScore: 70,
    timeLimit: 0,
    attemptsAllowed: 1,
    shuffleQuestions: false,
    shuffleOptions: false,
    showResults: 'after-submission',
    isRequired: false,
    isPublished: false,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (quiz) {
      setFormData({
        course: quiz.course || courseId,
        lesson: quiz.lesson || lessonId || null,
        title: quiz.title || { en: '' },
        description: quiz.description || { en: '' },
        questions: quiz.questions || [],
        totalPoints: quiz.totalPoints || 0,
        passingScore: quiz.passingScore || 70,
        timeLimit: quiz.timeLimit || 0,
        attemptsAllowed: quiz.attemptsAllowed || 1,
        shuffleQuestions: quiz.shuffleQuestions || false,
        shuffleOptions: quiz.shuffleOptions || false,
        showResults: quiz.showResults || 'after-submission',
        isRequired: quiz.isRequired || false,
        isPublished: quiz.isPublished || false,
      });
    }
  }, [quiz, courseId, lessonId]);

  const handleInputChange = (field, value, nested = null) => {
    if (nested) {
      setFormData((prev) => ({
        ...prev,
        [field]: {
          ...prev[field],
          [nested]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleAddQuestion = () => {
    const newQuestion = {
      question: { en: '' },
      type: 'multiple-choice',
      options: [
        { text: { en: '' }, isCorrect: false },
        { text: { en: '' }, isCorrect: false },
      ],
      points: 1,
      explanation: { en: '' },
      difficulty: 'medium',
    };

    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
  };

  const handleDeleteQuestion = (index) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const handleQuestionChange = (index, field, value, nested = null) => {
    setFormData((prev) => {
      const updatedQuestions = [...prev.questions];
      if (nested) {
        updatedQuestions[index] = {
          ...updatedQuestions[index],
          [field]: {
            ...updatedQuestions[index][field],
            [nested]: value,
          },
        };
      } else {
        updatedQuestions[index] = {
          ...updatedQuestions[index],
          [field]: value,
        };
      }
      return { ...prev, questions: updatedQuestions };
    });
  };

  const handleAddOption = (questionIndex) => {
    setFormData((prev) => {
      const updatedQuestions = [...prev.questions];
      updatedQuestions[questionIndex].options.push({
        text: { en: '' },
        isCorrect: false,
      });
      return { ...prev, questions: updatedQuestions };
    });
  };

  const handleDeleteOption = (questionIndex, optionIndex) => {
    setFormData((prev) => {
      const updatedQuestions = [...prev.questions];
      updatedQuestions[questionIndex].options = updatedQuestions[
        questionIndex
      ].options.filter((_, i) => i !== optionIndex);
      return { ...prev, questions: updatedQuestions };
    });
  };

  const handleOptionChange = (questionIndex, optionIndex, field, value, nested = null) => {
    setFormData((prev) => {
      const updatedQuestions = [...prev.questions];
      const options = [...updatedQuestions[questionIndex].options];

      if (nested) {
        options[optionIndex] = {
          ...options[optionIndex],
          [field]: {
            ...options[optionIndex][field],
            [nested]: value,
          },
        };
      } else {
        options[optionIndex] = {
          ...options[optionIndex],
          [field]: value,
        };

        // If setting as correct, uncheck other options for multiple-choice
        if (field === 'isCorrect' && value === true) {
          options.forEach((opt, i) => {
            if (i !== optionIndex) {
              opt.isCorrect = false;
            }
          });
        }
      }

      updatedQuestions[questionIndex].options = options;
      return { ...prev, questions: updatedQuestions };
    });
  };

  const handleSubmit = async () => {
    try {
      setError('');

      // Validate
      if (!formData.title.en) {
        setError('Quiz title is required');
        return;
      }

      if (formData.questions.length === 0) {
        setError('At least one question is required');
        return;
      }

      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save quiz');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{quiz ? 'Edit Quiz' : 'Create New Quiz'}</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Quiz Information
          </Typography>

          <TextField
            fullWidth
            label="Quiz Title"
            value={formData.title.en}
            onChange={(e) => handleInputChange('title', e.target.value, 'en')}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Description"
            value={formData.description?.en || ''}
            onChange={(e) => handleInputChange('description', e.target.value, 'en')}
            margin="normal"
            multiline
            rows={2}
          />

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <TextField
              label="Passing Score (%)"
              type="number"
              value={formData.passingScore}
              onChange={(e) => handleInputChange('passingScore', parseInt(e.target.value, 10))}
              sx={{ flex: 1 }}
            />

            <TextField
              label="Time Limit (minutes)"
              type="number"
              value={formData.timeLimit}
              onChange={(e) => handleInputChange('timeLimit', parseInt(e.target.value, 10))}
              sx={{ flex: 1 }}
              helperText="0 = no limit"
            />

            <TextField
              label="Attempts Allowed"
              type="number"
              value={formData.attemptsAllowed}
              onChange={(e) => handleInputChange('attemptsAllowed', parseInt(e.target.value, 10))}
              sx={{ flex: 1 }}
              helperText="-1 = unlimited"
            />
          </Box>

          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.shuffleQuestions}
                  onChange={(e) => handleInputChange('shuffleQuestions', e.target.checked)}
                />
              }
              label="Shuffle Questions"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.shuffleOptions}
                  onChange={(e) => handleInputChange('shuffleOptions', e.target.checked)}
                />
              }
              label="Shuffle Options"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isRequired}
                  onChange={(e) => handleInputChange('isRequired', e.target.checked)}
                />
              }
              label="Required"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isPublished}
                  onChange={(e) => handleInputChange('isPublished', e.target.checked)}
                />
              }
              label="Published"
            />
          </Box>

          <FormControl fullWidth margin="normal">
            <InputLabel>Show Results</InputLabel>
            <Select
              value={formData.showResults}
              onChange={(e) => handleInputChange('showResults', e.target.value)}
              label="Show Results"
            >
              <MenuItem value="immediately">Immediately</MenuItem>
              <MenuItem value="after-submission">After Submission</MenuItem>
              <MenuItem value="never">Never</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">Questions</Typography>
            <Button startIcon={<AddIcon />} onClick={handleAddQuestion} variant="contained">
              Add Question
            </Button>
          </Box>

          {formData.questions.map((question, qIndex) => (
            <Card key={qIndex} sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Question {qIndex + 1}
                  </Typography>
                  <IconButton onClick={() => handleDeleteQuestion(qIndex)} color="error" size="small">
                    <DeleteIcon />
                  </IconButton>
                </Box>

                <TextField
                  fullWidth
                  label="Question Text"
                  value={question.question.en}
                  onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value, 'en')}
                  margin="normal"
                  multiline
                  rows={2}
                />

                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <FormControl sx={{ flex: 1 }}>
                    <InputLabel>Question Type</InputLabel>
                    <Select
                      value={question.type}
                      onChange={(e) => handleQuestionChange(qIndex, 'type', e.target.value)}
                      label="Question Type"
                    >
                      <MenuItem value="multiple-choice">Multiple Choice</MenuItem>
                      <MenuItem value="true-false">True/False</MenuItem>
                      <MenuItem value="short-answer">Short Answer</MenuItem>
                      <MenuItem value="essay">Essay</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl sx={{ flex: 1 }}>
                    <InputLabel>Difficulty</InputLabel>
                    <Select
                      value={question.difficulty}
                      onChange={(e) => handleQuestionChange(qIndex, 'difficulty', e.target.value)}
                      label="Difficulty"
                    >
                      <MenuItem value="easy">Easy</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="hard">Hard</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    label="Points"
                    type="number"
                    value={question.points}
                    onChange={(e) =>
                      handleQuestionChange(qIndex, 'points', parseInt(e.target.value, 10))
                    }
                    sx={{ flex: 1 }}
                  />
                </Box>

                {(question.type === 'multiple-choice' || question.type === 'true-false') && (
                  <Box sx={{ mt: 2 }}>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mb: 1 }}
                    >
                      <Typography variant="subtitle2">Options</Typography>
                      {question.type === 'multiple-choice' && (
                        <Button size="small" onClick={() => handleAddOption(qIndex)}>
                          Add Option
                        </Button>
                      )}
                    </Box>

                    {question.options?.map((option, oIndex) => (
                      <Box key={oIndex} display="flex" gap={1} alignItems="center" sx={{ mb: 1 }}>
                        <TextField
                          fullWidth
                          label={`Option ${oIndex + 1}`}
                          value={option.text.en}
                          onChange={(e) =>
                            handleOptionChange(qIndex, oIndex, 'text', e.target.value, 'en')
                          }
                          size="small"
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={option.isCorrect}
                              onChange={(e) =>
                                handleOptionChange(qIndex, oIndex, 'isCorrect', e.target.checked)
                              }
                            />
                          }
                          label="Correct"
                        />
                        {question.type === 'multiple-choice' && question.options.length > 2 && (
                          <IconButton
                            onClick={() => handleDeleteOption(qIndex, oIndex)}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}

                {question.type === 'short-answer' && (
                  <TextField
                    fullWidth
                    label="Correct Answer"
                    value={question.correctAnswer || ''}
                    onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', e.target.value)}
                    margin="normal"
                    size="small"
                  />
                )}

                <TextField
                  fullWidth
                  label="Explanation (optional)"
                  value={question.explanation?.en || ''}
                  onChange={(e) => handleQuestionChange(qIndex, 'explanation', e.target.value, 'en')}
                  margin="normal"
                  multiline
                  rows={2}
                  size="small"
                />
              </CardContent>
            </Card>
          ))}

          {formData.questions.length === 0 && (
            <Alert severity="info">No questions added yet. Click "Add Question" to get started.</Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          {quiz ? 'Update Quiz' : 'Create Quiz'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
