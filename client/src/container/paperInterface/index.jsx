import React, { useState } from 'react';
import { useGeneratePaperMutation } from '../../state/api';
import { TextField, Button, CircularProgress, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import './index.css';

function PaperInterface() {
  const [formData, setFormData] = useState({
    className: '',
    subject: '',
    difficulty: 'medium',
    numQuestions: '',
  });

  const [generatePaper, { isLoading }] = useGeneratePaperMutation();
  const [filePath, setFilePath] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await generatePaper(formData).unwrap();

      console.log('API Response:', result); // Debugging the response

      setFilePath(result.filePath); // Assuming filePath is returned from the backend
    } catch (error) {
      console.error('Failed to generate paper:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const getSubjects = (className) => {
    if (className >= 1 && className <= 5) {
      return ['English', 'Hindi', 'Mathematics', 'Environmental Studies'];
    } else if (className >= 6 && className <= 10) {
      return ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science'];
    } else if (className >= 11 && className <= 12) {
      return ['English', 'Hindi', 'Physics', 'Biology', 'Chemistry', 'Mathematics', 'History', 'Geography', 'Political Science'];
    } else {
      return [];
    }
  };

  return (
    <div className="container">
      <h1>CBSE Question Paper Generator</h1>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <FormControl fullWidth margin="normal">
            <InputLabel>Class</InputLabel>
            <Select
              name="className"
              value={formData.className}
              onChange={handleChange}
              required
              MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }} // Set max height
            >
              {Array.from({ length: 12 }, (_, i) => (
                <MenuItem key={i + 1} value={i + 1}>
                  {i + 1}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        <div className="form-group">
          <FormControl fullWidth margin="normal">
            <InputLabel>Subject</InputLabel>
            <Select
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }} // Set max height
            >
              {getSubjects(formData.className).map((subject, index) => (
                <MenuItem key={index} value={subject}>
                  {subject}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        <div className="form-group">
          <FormControl fullWidth margin="normal">
            <InputLabel>Difficulty Level</InputLabel>
            <Select
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
              required
            >
              <MenuItem value="easy">Easy</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="hard">Hard</MenuItem>
            </Select>
          </FormControl>
        </div>

        <div className="form-group">
          <TextField
            label="Number of Questions"
            type="number"
            name="numQuestions"
            value={formData.numQuestions}
            onChange={handleChange}
            required
            fullWidth
            margin="normal"
          />
        </div>

        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={isLoading}
          fullWidth
        >
          {isLoading ? <CircularProgress size={24} /> : 'Generate Paper'}
        </Button>
      </form>

      {filePath && (
        <Button
          variant="contained"
          color="secondary"
          href={filePath}
          target="_blank"
          rel="noopener noreferrer"
        >
          Download File
        </Button>
      )}
    </div>
  );
}

export default PaperInterface;
