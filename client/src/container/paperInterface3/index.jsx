import React, { useState } from 'react';
import { useGeneratePaper3Mutation } from '../../state/api';
import { TextField, Button, CircularProgress, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import { chaptersData } from "./data";
import './index.css';

function PaperInterface3() {
  const [formData, setFormData] = useState({
    className: '',
    subject: '',
    difficulty: 'medium',
    numQuestions: '',
    sections: [],
    chapters: [],
    
  });

  const [numSections, setNumSections] = useState(1);
  const [generatePaper3, { isLoading }] = useGeneratePaper3Mutation();
  const [filePath, setFilePath] = useState(null);
  const [availableChapters, setAvailableChapters] = useState([]);

  const handleSubmit = async (e) => {
    console.log(formData);
    e.preventDefault();

    const updatedFormData = { ...formData, totalMarks: totalPaperMarks };

    console.log(updatedFormData); // Check the final data being sent
    try {
      const result = await generatePaper3(updatedFormData).unwrap();
      console.log('API Response:', result); // Debugging the response
      setFilePath(result.filePath); // Assuming filePath is returned from the backend
    } catch (error) {
      console.error('Failed to generate paper:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => {
      const updatedFormData = { ...prevFormData, [name]: value };

      // Update chapters only if both class and subject are selected
      if (name === 'className' || name === 'subject') {
        const { className, subject } = updatedFormData;
        if (className && subject) {
          const key = `${className}.${subject}`;
          setAvailableChapters(chaptersData[key] || []); // Fetch chapters or set empty
          updatedFormData.chapters = []; // Reset selected chapters
        }
      }
      return updatedFormData;
    });
  };

  const handleChaptersChange = (e) => {
    const selectedChapters = e.target.value;
    setFormData({ ...formData, chapters: selectedChapters });
  };

  const handleNumSectionsChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setNumSections(value);

    // Initialize sections within formData based on the number selected
    const newSections = Array.from({ length: value }, (_, index) => ({
      sectionName: `Section ${String.fromCharCode(65 + index)}`,
      numQuestions: 0,
      totalMarks: 0,
    }));
    setFormData({ ...formData, sections: newSections });
  };

  const handleSectionChange = (index, field, value) => {
    const updatedSections = formData.sections.map((section, i) => {
      if (i === index) {
        const updatedSection = { ...section, [field]: value };
        if (field === 'numQuestions') {
          const questionCount = parseInt(value, 10) || 0;
          updatedSection.markPerQuestion = index + 1;
          updatedSection.totalMarks = questionCount * (index + 1); // Marking scheme
        }
        return updatedSection;
      }
      return section;
    });
    setFormData({ ...formData, sections: updatedSections });
  };

  const getSubjects = (className) => {
    if (className >= 1 && className <= 5) {
      return ['English', 'Hindi', 'Mathematics', 'Environmental Studies'];
    } else if (className >= 6 && className <= 10) {
      return ['English', 'Hindi', 'Mathematics', 'Science', 'Social Science'];
    } else if (className >= 11 && className <= 12) {
      return ['English', 'Hindi', 'Physics', 'Biology', 'Chemistry', 'Mathematics', 'History', 'Geography','Economics', 'Political Science'];
    } else {
      return [];
    }
  };

  const totalQuestions = formData.sections.reduce((sum, section) => sum + parseInt(section.numQuestions || 0, 10), 0);
  const totalPaperMarks = formData.sections.reduce((sum, section) => sum + parseInt(section.totalMarks || 0, 10), 0);

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
              MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
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
              MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
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
            <InputLabel>Chapters</InputLabel>
            <Select
              name="chapters"
              value={formData.chapters}
              onChange={handleChaptersChange}
              multiple
              required
            >
              {availableChapters.map((chapter, index) => (
                <MenuItem key={index} value={chapter}>
                  {chapter}
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

        <div className="form-group">
          <FormControl fullWidth margin="normal">
            <InputLabel>Number of Sections</InputLabel>
            <Select
              value={numSections}
              onChange={handleNumSectionsChange}
            >
              {Array.from({ length: 5 }, (_, i) => (
                <MenuItem key={i + 1} value={i + 1}>
                  {i + 1}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        {formData.sections.map((section, index) => (
          <div key={index} className="paperInterface2__form-group">
            <h4>{section.sectionName}</h4>
            <TextField
              label="Number of Questions"
              type="number"
              value={section.numQuestions}
              onChange={(e) => handleSectionChange(index, 'numQuestions', e.target.value)}
              margin="normal"
              size="small"
            />
            <p>Total Marks: {section.totalMarks}</p>
          </div>
        ))}

        <div className="form-summary">
          <p>Total Questions: {totalQuestions}</p>
          <p>Total Marks: {totalPaperMarks}</p>
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

export default PaperInterface3;
