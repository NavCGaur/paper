import React, { useState, useEffect } from 'react';
import { useGeneratePaper3Mutation } from '../../state/api';
import { TextField, Button, LinearProgress, MenuItem, Select, InputLabel, FormControl, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { chaptersData } from "./data";
import './index.css';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';

// Firebase configuration (replace with your Firebase project config)
const firebaseConfig = {
    apiKey: "AIzaSyAMpeDEUisFVOnVog6jyeQlAKccb_kn9b8",
    authDomain: "paper-f4198.firebaseapp.com",
    projectId: "paper-f4198",
    storageBucket: "paper-f4198.firebasestorage.app",
    messagingSenderId: "619998441166",
    appId: "1:619998441166:web:55c0eaff2f3eab2cb26a9f",
    measurementId: "G-F7JMZJT1X7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

function PaperInterface3({ onClose }) {

  const initialFormState = {
    className: '',
    subject: '',
    difficulty: 'easy',
    numQuestions: '',
    sections: [],
    chapters: [],
  };
 
  const [formData, setFormData] = useState(initialFormState);
  const [numSections, setNumSections] = useState(1);
  const [generatePaper3, { isLoading }] = useGeneratePaper3Mutation();
  const [filePath, setFilePath] = useState(null);
  const [availableChapters, setAvailableChapters] = useState([]);
  const [buttonStatus, setButtonStatus] = useState('initial'); // 'initial', 'loading', 'downloaded', 'ready'

  const resetForm = () => {
    setFormData(initialFormState);
    setNumSections(1);
    setAvailableChapters([]);
    setFilePath(null);
    setButtonStatus('initial');
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    const updatedFormData = { ...formData, totalMarks: totalPaperMarks };

    try {
      const result = await generatePaper3(updatedFormData).unwrap();
      setFilePath(result.filePath); // Assuming filePath is returned from the backend
    } catch (error) {
      console.error('Failed to generate paper:', error);
    }
  };


  useEffect(() => {
    if (isLoading) {
      setButtonStatus('loading');
    }
  }, [isLoading]);

  useEffect(() => {
    if (filePath) {
      const downloadFile = async () => {
        try {
          // Use Firebase SDK to get the download URL
          const fileRef = ref(storage, filePath);
          const url = await getDownloadURL(fileRef);

          // Trigger the download
          const a = document.createElement('a');
          a.href = url;
          a.download = filePath.split('/').pop(); // Extract the file name from the path
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);

          setButtonStatus('downloaded');
          
          // After 6 seconds, change to 'ready' state
          setTimeout(() => {
            setButtonStatus('ready');
          }, 6000);
          } catch (error) {
          console.error('Failed to download file:', error);
          setButtonStatus('initial');

        }
      };

      downloadFile();
    }
  }, [filePath]);

  const getButtonContent = () => {
    switch (buttonStatus) {
      case 'loading':
        return (
          <div style={{ textAlign: 'center', marginTop: '5px' }}>
            <LinearProgress 
              sx={{ 
                flexGrow: 1, 
                backgroundColor: 'lightgrey',
                mb: 1
              }}
            />
            <p style={{ color: '#000000', margin: 0 }}>
              Your Paper is being generated, please wait.
            </p>
          </div>
        );
      case 'downloaded':
        return (
          <span style={{ color: '#fff' }}>
            Paper Downloaded, Check Download folder
          </span>
        );
      case 'ready':
        return 'Generate another paper';
      default:
        return 'Generate Paper';
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
    <div className="container__paperInterface3"  style={{ position: 'relative' }}>
      <div className="paperInterface3__header">
        <h3>Fill Paper Details</h3>
        <IconButton 
          onClick={onClose}
          aria-label="close"
          className="paperInterface3__close-icon"
          size="large"
          sx={{ 
            color: 'white',
            '&:hover': {
              color: '#e0e0e0'
            },
            '& .MuiSvgIcon-root': {
              fontSize: '2rem'  
            },
            padding: '12px',   
          }}
        >
          <CloseIcon />
        </IconButton>
      </div>


      <form onSubmit={handleSubmit} className="container__paperInterface3-form">
        <div className="container__paperInterface3-form-group">
          <FormControl fullWidth margin="normal">
            <InputLabel>Class</InputLabel>
            <Select
              name="className"
              value={formData.className}
              onChange={handleChange}
              required
              MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
            >
                           required
              {Array.from({ length: 8 }, (_, i) => (
                <MenuItem key={i + 5} value={i + 5}>
                {i + 5}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        <div className="container__paperInterface3-form-group">
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

        <div className="container__paperInterface3-form-group">
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
                <MenuItem key={index} value={chapter}
                sx={{ // Inline styles
                      '&.Mui-selected': { // Target the selected state
                        backgroundColor: '#C4E4FD', // Darker blue
                      },
                      '&.Mui-selected:hover': { // Hover on selected
                        backgroundColor: '#C4E4FD',
                      },
                   }}>
                  {chapter}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>


        
        {/*      
        <div className="container__paperInterface3-form-group">
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

        <div className="container__paperInterface3-form-group">
          <TextField
            label="Number of Questions"
            type="number"
            name="numQuestions"
            value={formData.numQuestions}
            onChange={handleChange}
            required
            fullWidth
            margin="normal"
            size="small" 
          />
        </div>

        */}

        <div className="container__paperInterface3-form-group">
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
          <div key={index} className="paperInterface3__form-group">
            <p>{section.sectionName}</p>
            <TextField
              label="No. of Ques"
              type="number"
              value={section.numQuestions}
              onChange={(e) => handleSectionChange(index, 'numQuestions', e.target.value)}
              margin="normal"
              size="small"
              className="small-text-field"
            />
            <p>Marks: {section.totalMarks}</p>
          </div>
        ))}

        <div className="container__paperInterface3-form-summary">
          <p>Total Questions: {totalQuestions}</p>
          <p>Total Marks: {totalPaperMarks}</p>
        </div>

        <Button
          type={buttonStatus === 'ready' ? 'button' : 'submit'}
          variant="contained"
          color="primary"
          disabled={isLoading}
          fullWidth
          onClick={buttonStatus === 'ready' ? resetForm : undefined}
          sx={{
            backgroundColor: isLoading ? 'white' : undefined,
            color: isLoading ? 'black' : undefined,
            '&:hover': {
              backgroundColor: buttonStatus === 'ready' ? '#1565c0' : undefined
            }
          }}
          >
          {getButtonContent()}
        </Button>
      </form>

      
    </div>
  );
}

export default PaperInterface3;
