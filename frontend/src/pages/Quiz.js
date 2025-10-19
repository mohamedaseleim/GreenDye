import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchQuiz,
  submitQuiz,
  getQuizAttempts
} from '../services/quizService';

function Quiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState([]);

  useEffect(() => {
    async function loadQuiz() {
      try {
        const data = await fetchQuiz(id);
        // Initialize answers array with empty strings
        setAnswers(data.questions.map(() => ''));
        setQuiz(data);
        const past = await getQuizAttempts(id);
        setAttempts(past || []);
      } finally {
        setLoading(false);
      }
    }
    loadQuiz();
  }, [id]);

  function handleChange(value, index) {
    const updated = [...answers];
    updated[index] = value;
    setAnswers(updated);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const result = await submitQuiz(id, answers, quiz.course);
      setResults(result);
    } catch (err) {
      console.error(err);
      alert('Error submitting quiz. Please try again.');
    }
  }

  if (loading) return <p>Loading...</p>;
  if (!quiz) return <p>Quiz not found</p>;

  return (
    <div>
      <h2>{quiz.title.get('en') || 'Quiz'}</h2>
      {results ? (
        <div>
          <h3>Results</h3>
          <p>
            Score: {results.score.toFixed(2)}% ({results.earnedPoints} out of{' '}
            {results.totalPoints} points)
          </p>
          <p>Passed: {results.passed ? 'Yes' : 'No'}</p>
          {quiz.showResults !== 'never' && (
            <ul>
              {results.results.map((res, idx) => (
                <li key={idx}>
                  Question {idx + 1}: {res.isCorrect === true && 'Correct'}
                  {res.isCorrect === false && 'Incorrect'}
                  {res.isCorrect === null && 'Needs manual grading'}
                </li>
              ))}
            </ul>
          )}
          <button onClick={() => navigate('/dashboard')}>Back to dashboard</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {quiz.questions.map((q, idx) => (
            <div key={idx} style={{ marginBottom: '1rem' }}>
              <p>{q.question.get('en')}</p>
              {q.type === 'multiple-choice' && (
                <div>
                  {q.options.map((opt, optIdx) => (
                    <label key={optIdx} style={{ display: 'block' }}>
                      <input
                        type="radio"
                        name={`q-${idx}`}
                        value={opt.text.get('en')}
                        checked={answers[idx] === opt.text.get('en')}
                        onChange={(e) => handleChange(e.target.value, idx)}
                      />{' '}
                      {opt.text.get('en')}
                    </label>
                  ))}
                </div>
              )}
              {q.type === 'true-false' && (
                <select
                  value={answers[idx]}
                  onChange={(e) => handleChange(e.target.value, idx)}
                >
                  <option value="">Select</option>
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              )}
              {q.type === 'short-answer' && (
                <input
                  type="text"
                  value={answers[idx]}
                  onChange={(e) => handleChange(e.target.value, idx)}
                />
              )}
              {q.type === 'essay' && (
                <textarea
                  value={answers[idx]}
                  onChange={(e) => handleChange(e.target.value, idx)}
                  rows={4}
                />
              )}
            </div>
          ))}
          <button type="submit">Submit Quiz</button>
        </form>
      )}
      <hr />
      <h3>Past Attempts</h3>
      {attempts.length === 0 ? (
        <p>No attempts recorded.</p>
      ) : (
        <ul>
          {attempts.map((att, index) => (
            <li key={index}>
              Attempt {att.attempt}: {att.score}/{att.maxScore} points —{' '}
              {new Date(att.completedAt).toLocaleString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Quiz;
