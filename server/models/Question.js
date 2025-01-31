import mongoose from 'mongoose';

const { Schema } = mongoose;

const QuestionSchema = new Schema({
  class: { type: Number, required: true }, // Class level (5-12)
  subject: { type: String, required: true }, // Subject name (e.g., Biology)
  subSubject:{type:String},
  chapter: { type: String, required: true }, // Chapter name
  type: { 
    type: String, 
    enum: ['mcq', 'shortAnswer', 'mediumAnswer', 'longAnswer', 'caseBased', 'assertionReason', 'imageBased'], 
    required: true 
  },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true }, // Difficulty level
  text: { type: String, required: true }, // Main question text
  options: [{ type: String }], // For MCQs (optional)
  marks: { type: Number, required: true }, // Marks assigned
  
  // Assertion-Reason Type
  assertion: { type: String }, // Assertion statement
  reason: { type: String }, // Reason statement
  correctAnswer: { type: String, enum: ['A', 'B', 'C', 'D'] }, // Correct answer for AR (A: Both true, R explains A, etc.)

  // Case-Based Questions
  caseDetails: {  
    subQuestions: [
      {
        text: { type: String },
        marks: { type: Number },
        answer: { type: String, required: true }, 

      },
    ],
  },

  // Image-Based Questions
  imageUrl: { type: String }, // URL of the image (stored in Firebase or another cloud storage)
  
  // Answer Section
  answer: { type: String }, // Detailed answer



  createdAt: { type: Date, default: Date.now }, // Timestamp

});




export default mongoose.model('QuestionPaperData', QuestionSchema);
