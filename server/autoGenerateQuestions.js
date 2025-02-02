import axios from "axios";
import { promises as fs } from "fs";
import {openaiApiKey} from "./config.js";


const OUTPUT_FILE = "casequestions.json";
const ERROR_FILE = "errors.log";
const CHAPTERS = [
  "Nutrition in Plants",
  "Nutrition in Animals",
  "Fibre to Fabric",
  "Heat",
  "Acids, Bases, and Salts",
  "Physical and Chemical Changes",
  "Weather, Climate, and Adaptations of Animals",
  "Winds, Storms, and Cyclones",
  "Soil",
  "Respiration in Organisms",
  "Transportation in Animals and Plants",
  "Reproduction in Plants",
  "Motion and Time",
  "Electric Current and its Effects",
  "Light",
  "Water: A Precious Resource",
  "Forests: Our Lifeline",
  "Wastewater Story"
];

// Function to generate prompt for MCQs
const generateMCQPrompt = (chapter) => {
    return `Provide 3 MCQ type questions from the chapter "${chapter}" of Science of class 7 in the following JSON format:
  
    [{
      "class": 7,
      "subject": "Science",
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
    return `Provide 3 Short Answer type questions from the chapter "${chapter}" of Science of class 7 in the following JSON format:
  
    [{
      "class": 7,
      "subject": "Science",
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
    return `Provide 2 mediumAnswer type questions from the chapter "${chapter}" of Science of class 7 Strictly in the following JSON format. Do not change class, subject, type, difficulty, marks fields:
  
    [{ 
      "class": 7,
      "subject": "Science",
      "chapter": "${chapter}",
      "type": "mediumAnswer", 
      "difficulty": "easy",
      "text": "Describe the three main layers of the Earth and their characteristics.",
      "marks": 3,
      "answer": "The Earth consists of three main layers: crust, mantle, and core. The crust is the outermost layer where we live, made up of solid rocks and minerals, and is thinnest under the oceans and thickest under mountains. The mantle is the middle layer, much thicker than the crust, consisting of semi-solid rocks and minerals at very high temperatures. "
    }]`;
  };

  const generateLongAnswerPrompt = (chapter) => {
    return `Provide 1 long Answer type questions from the chapter "${chapter}" of Science of class 7 in the following JSON format:
  
    [{ 
      "class": 7,
      "subject": "Science",
      "chapter": "${chapter}",
      "type": "longAnswer", 
      "difficulty": "easy",
      "text": "Describe the three main layers of the Earth and their characteristics.",
      "marks": 4,
      "answer": "The Earth consists of three main layers: crust, mantle, and core. The crust is the outermost layer where we live, made up of solid rocks and minerals, and is thinnest under the oceans and thickest under mountains. The mantle is the middle layer, much thicker than the crust, consisting of semi-solid rocks and minerals at very high temperatures. "
    }]`;
  };

  const generateCaseBasedAnswerPrompt = (chapter) => {
    return `Provide 1 caseBased Answer type questions from the chapter "${chapter}" of Science of class 7 in the following JSON format:
  
    ["class": 6,
         "subject": "Science",
      "chapter": "${chapter}",
         "type": "caseBased",
         "difficulty": "easy",
         "text": "During geography class, Maya was studying a globe. Her teacher explained how imaginary lines called latitudes and longitudes help us locate places on Earth. She learned about the equator, prime meridian, and how these lines create a grid system.",
         "marks": 5,
         "caseDetails": {
           "subQuestions": [
             {
               "text": "What is the equator and why is it important?",
               "marks": 1,
               "answer": "The equator is the 0° latitude that divides Earth into Northern and Southern hemispheres and helps in determining locations."
             },
             {
               "text": "What is the prime meridian?",
               "marks": 1,
               "answer": "The prime meridian is the 0° longitude passing through Greenwich, London, dividing Earth into Eastern and Western hemispheres."
             },
             {
               "text": "How do latitudes and longitudes help us?",
               "marks": 1,
               "answer": "They form a grid system that helps us locate any point on Earth's surface accurately."
             },
             {
               "text": "What are the major latitude lines called?",
               "marks": 1,
               "answer": "The major latitude lines are the Equator, Tropic of Cancer, Tropic of Capricorn, Arctic Circle, and Antarctic Circle."
             },
             {
               "text": "How many degrees are there between the poles?",
               "marks": 1,
               "answer": "There are 180 degrees between the North and South poles (90°N to 90°S)."
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
  //const autoGenerateMCQQuestions = async () => {
  //  for (const chapter of CHAPTERS) {
      // Process MCQs
      //await processResponse(chapter, "MCQ", generateMCQPrompt, isValidMCQ);
      //console.log("⏳ Waiting 15 seconds before fetching Short Answer questions...");
      //await new Promise((resolve) => setTimeout(resolve, 15000)); // 15s delay

   // }
    //console.log("🎉 All chapters processed!");
  //};
  
  const autoGenerateShortQuestions = async () => {
    for (const chapter of CHAPTERS) {
      // Process Short Answer questions
      await processResponse(chapter, "Short Answer", generateShortAnswerPrompt, isValidShortAnswer);
      console.log("⏳ Waiting 30 seconds before next chapter...");
      await new Promise((resolve) => setTimeout(resolve, 30000)); // 30s delay
    }
    console.log("🎉 All chapters processed!");
  };
  
  const autoGenerateMediumQuestions = async () => {
    for (const chapter of CHAPTERS) {
      await processResponse(chapter, "Medium Answer", generateMediumAnswerPrompt, isValidMediumAnswer);
      console.log("⏳ Waiting 60 seconds before next chapter...");
      await new Promise((resolve) => setTimeout(resolve, 60000)); // 60s delay
    }
    console.log("🎉 All chapters processed!");
  };
  
  const autoGenerateLongQuestions = async () => {
    for (const chapter of CHAPTERS) {
      await processResponse(chapter, "Long Answer", generateLongAnswerPrompt, isValidLongAnswer);
      console.log("⏳ Waiting 60 seconds before next chapter...");
      await new Promise((resolve) => setTimeout(resolve, 60000)); // 60s delay
    }
    console.log("🎉 All chapters processed!");
  };
  
  const autoGenerateCaseQuestions = async () => {
    for (const chapter of CHAPTERS) {
      await processResponse(chapter, "Case Based Answer", generateCaseBasedAnswerPrompt, isValidCaseBased);
      console.log("⏳ Waiting 60 seconds before next chapter...");
      await new Promise((resolve) => setTimeout(resolve, 60000)); // 60s delay
    }
    console.log("🎉 All chapters processed!");
  };
  
  const autoGenerateQuestions = async () => {
    // Ensure functions run sequentially
    //await autoGenerateShortQuestions();
    //await autoGenerateMediumQuestions();
    //await autoGenerateLongQuestions();
    await autoGenerateCaseQuestions();
  };
  
  
 export default autoGenerateQuestions ;