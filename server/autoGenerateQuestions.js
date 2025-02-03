import axios from "axios";
import { promises as fs } from "fs";
import {openaiApiKey} from "./config.js";


const CHAPTERS = [
  "Chemical Reactions and Equations",
  "Acids, Bases, and Salts",
  "Metals and Non-metals",
  "Carbon and Its Compounds",
  "Periodic Classification of Elements",
  "Life Processes",
  "Control and Coordination",
  "How do Organisms Reproduce?",
  "Heredity and Evolution",
  "Light: Reflection and Refraction",
  "The Human Eye and the Colourful World",
  "Electricity",
  "Magnetic Effects of Electric Current",
  "Sources of Energy",
  "Our Environment",
  "Management of Natural Resources"
];



const Class = 10;
const Subject = "Science";
  
const OUTPUT_FILE = `class${Class}${Subject}Questions.json`;
const ERROR_FILE = "errors.log";



// Function to generate prompt for MCQs
const generateMCQPrompt = (chapter) => {
    return `Provide 3 MCQ type questions from the chapter "${chapter}" of ${Subject} of class "${Class}" in the following JSON format:
  
    [{
      "class": ${Class},
      "subject": "${Subject}",
      "chapter": "${chapter}",
      "type": "mcq",
      "difficulty": "easy",
      "text": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "A",
      "marks": 1,
      "createdAt": "2024-02-02T00:00:00Z"
    }]`;
  };
  
  // Function to generate prompt for Short Answer questions
  const generateShortAnswerPrompt = (chapter) => {
    return `Provide 3 Short Answer type questions from the chapter "${chapter}" of ${Subject} of class "${Class}" in the following JSON format:
  
    [{
      "class": ${Class},
      "subject": "${Subject}",
      "chapter": "${chapter}",
      "type": "shortAnswer",
      "difficulty": "easy",
      "text": "What is a short answer question?",
      "marks": 2,
      "answer": "A short answer question requires a brief but complete response, typically 1-2 sentences.",
      "createdAt": "2024-02-02T00:00:00Z"
    }]`;
  };


  const generateMediumAnswerPrompt = (chapter) => {
    return `Provide 2 mediumAnswer type questions from the chapter "${chapter}" of ${Subject} of class "${Class}" Strictly in the following JSON format:
  
    [{ 
      "class": ${Class},
      "subject": "${Subject}",
      "chapter": "${chapter}",
      "type": "mediumAnswer", 
      "difficulty": "easy",
      "text": "Describe the three main layers of the Earth and their characteristics.",
      "marks": 3,
      "answer": "The Earth consists of three main layers: crust, mantle, and core. The crust is the outermost layer where we live, made up of solid rocks and minerals, and is thinnest under the oceans and thickest under mountains. The mantle is the middle layer, much thicker than the crust, consisting of semi-solid rocks and minerals at very high temperatures. "
    }]`;
  };

  const generateLongAnswerPrompt = (chapter) => {
    return `Provide 1 long Answer type questions from the chapter "${chapter}" of ${Subject} of class "${Class}" in the following JSON format:
  
    [{ 
      "class": ${Class},
      "subject": "${Subject}",
      "chapter": "${chapter}",
      "type": "longAnswer", 
      "difficulty": "easy",
      "text": "Question Text here",
      "marks": 4,
      "answer": "Answer of question in detail with at least 90 words. "
    }]`;
  };

  const generateCaseBasedAnswerPrompt = (chapter) => {
    return `Provide 1 caseBased Answer type questions from the chapter "${chapter}" of ${Subject} of class "${Class}" in the following JSON format:
  
    ["class": ${Class},
      "subject": "${Subject}",
      "chapter": "${chapter}",
         "type": "caseBased",
         "difficulty": "easy",
         "text": "Case description text here  - must be of minimum 90 words.",
         "marks": 5,
         "caseDetails": {
           "subQuestions": [
             {
               "text": "Question text here related to case description",
               "marks": 1,
               "answer": "One line answer text here."
             },
             {
               "text": "Question text here related to case description",
               "marks": 1,
               "answer": "One line answer text here."
             },
             {
               "text": "Question text here related to case description",
               "marks": 1,
               "answer": "One line answer text here."
             },
             {
               "text": "Question text here related to case description",
               "marks": 1,
               "answer": "One line answer text here."
             },
             {
               "text": "Question text here related to case description",
               "marks": 1,
               "answer": "One line answer text here."
             }
           ]
         }
       },

]`;
  };
  
  // Function to request questions from OpenAI
  const fetchQuestions = async (prompt) => {
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
            model: "gpt-3.5-turbo",
            messages: [{ role: "system", content: prompt }],
          temperature: 0.7,
          max_tokens: 600
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiApiKey}`
          }
        }
      );
  
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error("❌ API Error:", error.message);
      return null;
    }
  };
  
  // Function to validate MCQ questions
  const isValidMCQ = (question) => {
    return (
      question &&
      typeof question === "object" &&
      question.class === 7 &&
      question.subject === "Science" &&
      typeof question.chapter === "string" &&
      question.type === "mcq" &&
      typeof question.text === "string" &&
      Array.isArray(question.options) &&
      question.options.length === 4 &&
      ["A", "B", "C", "D"].includes(question.correctAnswer)
    );
  };
  
  // Function to validate Short Answer questions
  const isValidShortAnswer = (question) => {
    return (
      question &&
      typeof question === "object" &&
      question.class === 7 &&
      question.subject === "Science" &&
      typeof question.chapter === "string" &&
      question.type === "shortAnswer" &&
      typeof question.text === "string" &&
      typeof question.answer === "string" &&
      question.marks === 2
    );
  };

  const isValidMediumAnswer = (question) => {
    return (
      question &&
      typeof question === "object" &&
      question.class === 7 &&
      question.subject === "Science" &&
      typeof question.chapter === "string" &&
      question.type === "mediumAnswer" &&
      typeof question.text === "string" &&
      typeof question.answer === "string" &&
      question.marks === 3
    );
  };
  
  const isValidLongAnswer = (question) => {
    return (
      question &&
      typeof question === "object" &&
      question.class === 7 &&
      question.subject === "Science" &&
      typeof question.chapter === "string" &&
      question.type === "longAnswer" &&
      typeof question.text === "string" &&
      typeof question.answer === "string" &&
      question.marks === 4
    );
  };
  
  
  const isValidCaseBased = (question) => {
    return (
      question &&
      typeof question === "object" &&
      question.class === 7 && // Checking for class 6
      question.subject === "Science" && // Ensure the subject is 'Social Science'
      typeof question.chapter === "string" && // Ensure chapter is a string
      question.type === "caseBased" && // Type should be 'caseBased'
      typeof question.text === "string" && // The main text should be a string
      typeof question.caseDetails === "object" && // Ensure caseDetails is an object
      Array.isArray(question.caseDetails.subQuestions) && // Ensure subQuestions is an array
      question.caseDetails.subQuestions.every(
        (subQ) =>
          typeof subQ.text === "string" && // Each subQuestion text should be a string
          typeof subQ.marks === "number" && subQ.marks > 0 && // Marks should be a positive number
          typeof subQ.answer === "string" && subQ.answer.trim() !== "" // Ensure answer is a non-empty string
      ) &&
      question.marks === 5 // Total marks should be 5
    );
  };
  
  
  
  // Function to process responses
  const processResponse = async (chapter, type, promptGenerator, validator, attempt = 1) => {
    console.log(`📘 Fetching ${type} questions for "${chapter}" (Attempt ${attempt})`);
  
    const responseText = await fetchQuestions(promptGenerator(chapter));
  
  
  
    try {
      const questions = JSON.parse(responseText);
      console.log(questions);
  
     
  
  
    
  
      await fs.appendFile(OUTPUT_FILE, JSON.stringify(questions, null, 2) + ",\n");
      console.log(`✅ Successfully saved ${type} questions for "${chapter}"`);
    } catch (error) {
      console.error(`❌ JSON Parse Error for "${chapter}" (${type}):`, error.message);
      await fs.appendFile(ERROR_FILE, `ParseError: ${chapter} (${type})\n`);
    }
  };
  
  // Main function to run the process
  const autoGenerateMCQQuestions = async () => {
    for (const chapter of CHAPTERS) {
       //Process MCQs
      await processResponse(chapter, "MCQ", generateMCQPrompt, isValidMCQ);
      console.log("⏳ Waiting 15 seconds before fetching next MCQ question...");
      await new Promise((resolve) => setTimeout(resolve, 15000)); // 15s delay

    }
    console.log("🎉 All chapters processed!");
  };
  
  const autoGenerateShortQuestions = async () => {
    for (const chapter of CHAPTERS) {
      // Process Short Answer questions
      await processResponse(chapter, "Short Answer", generateShortAnswerPrompt, isValidShortAnswer);
      console.log("⏳ Waiting 15 seconds before next ShortAnswer...");
      await new Promise((resolve) => setTimeout(resolve, 15000)); // 15s delay
    }
    console.log("🎉 All chapters processed!");
  };
  
  const autoGenerateMediumQuestions = async () => {
    for (const chapter of CHAPTERS) {
      await processResponse(chapter, "Medium Answer", generateMediumAnswerPrompt, isValidMediumAnswer);
      console.log("⏳ Waiting 30 seconds before next chapter...");
      await new Promise((resolve) => setTimeout(resolve, 30000)); // 30s delay
    }
    console.log("🎉 All chapters processed!");
  };
  
  const autoGenerateLongQuestions = async () => {
    for (const chapter of CHAPTERS) {
      await processResponse(chapter, "Long Answer", generateLongAnswerPrompt, isValidLongAnswer);
      console.log("⏳ Waiting 30 seconds before next chapter...");
      await new Promise((resolve) => setTimeout(resolve, 30000)); // 30s delay
    }
    console.log("🎉 All chapters processed!");
  };
  
  const autoGenerateCaseQuestions = async () => {
    for (const chapter of CHAPTERS) {
      await processResponse(chapter, "Case Based Answer", generateCaseBasedAnswerPrompt, isValidCaseBased);
      console.log("⏳ Waiting 30 seconds before next chapter...");
      await new Promise((resolve) => setTimeout(resolve, 30000)); // 30s delay
    }
    console.log("🎉 All chapters processed!");
  };
  
  const autoGenerateQuestions = async () => {
    // Ensure functions run sequentially
    //await autoGenerateMCQQuestions();
    //await autoGenerateShortQuestions();
    await autoGenerateMediumQuestions();
    await autoGenerateLongQuestions();
    //await autoGenerateCaseQuestions();
  };
  
  
 export default autoGenerateQuestions ;