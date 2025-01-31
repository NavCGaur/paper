import mongoose from "mongoose";
import OpenAI from 'openai';
import Question from "./models/Question.js"; 
import {  mongoUri, maxTokensPerRequest, apiDelay } from "./config.js";
import { subjectsData, questionTypes, questionCount } from "./data/data.js"; // Importing new subjects data



const generateQuestion = async (prompt) => {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokensPerRequest
    });

    console.log("Chat gpt response", completion.choices[0].message.content)
    
    return completion.choices[0].message.content;
  } catch (error) {
    console.error("API Error:", error.response ? error.response.data : error);
    return null;
  }
};

export const generateAndStoreQuestions = async () => {
  await mongoose.connect(mongoUri);

  for (const classData of subjectsData) {
    for (const subject of classData.subjects) {
      for (const chapter of subject.chapters) {
        for (const type of questionTypes) {
          const prompt = createPrompt(classData.class, subject.name, chapter, type);
          console.log(`Generating ${type} for ${chapter}...`);

          const result = await generateQuestion(prompt);
          if (result) {
            try {
              const questionData = JSON.parse(result);
              await Question.insertMany(questionData);
              console.log(`Stored ${type} for ${chapter}.`);
            } catch (parseError) {
              console.error("JSON Parsing Error:", parseError);
            }
          }

          await new Promise((resolve) => setTimeout(resolve, apiDelay)); // API rate limit handling
        }
      }
    }
  }
  mongoose.connection.close();
};

const createPrompt = (classLevel, subject, chapter, type) => {
    let promptTemplate = `Generate ${questionCount[type]} Class ${classLevel.replace("Class ", "")} CBSE ${subject} ${type} questions on the chapter "${chapter}".\n`;
    promptTemplate += `Provide JSON output in the following format:\n`;

  const schema = {
    "mcq": {
      "class": classLevel.replace("Class ", ""),
      "subject": subject,
      "chapter": chapter,
      "type": "mcq",
      "difficulty": "easy",
      "text": "Sample question?",
      "options": ["A", "B", "C", "D"], 
      "correctAnswer": "Please provide the correct answer as one of the following options: A, B, C, or D.",
      "marks": 1,
      "answer": "Explain the correct answer."
    },
    "assertionReason": {
      "class": classLevel.replace("Class ", ""),
      "subject": subject,
      "chapter": chapter,
      "type": "assertionReason",
      "difficulty": "easy",
      "assertion": "Archegonium is the female sex organ in bryophytes.",
      "reason": "Algae also possess the archegonium.",
      "options": {
        "A": "Both Assertion and Reason are true, and Reason is a correct explanation for Assertion.",
        "B": "Both Assertion and Reason are true, but Reason is not a correct explanation for Assertion.",
        "C": "Assertion is true, and Reason is false.",
        "D": "Both Assertion and Reason are false."
      },
      "correctAnswer": "C", 
      "marks": 1,
      "answer": "Explanation: The assertion is true, but the reason is false. Archegonium is indeed the female sex organ in bryophytes, but algae do not possess archegonia, making the reason false."
    },

    "shortAnswer": {
      "class": classLevel.replace("Class ", ""),
      "subject": subject,
      "chapter": chapter,
      "type": "shortAnswer",
      "difficulty": "easy",
      "text": "Sample short-answer question?",
      "marks": 2,
      "answer": "Briefly explain the concept."
    },
    "longAnswer": {
      "class": classLevel.replace("Class ", ""),
      "subject": subject,
      "chapter": chapter,
      "type": "longAnswer",
      "difficulty": "easy",
      "text": "Sample long-answer question?",
      "marks": 4,
      "answer": "Provide a detailed explanation with examples."
    },
    "caseBased": {
      "class": classLevel.replace("Class ", ""),
      "subject": subject,
      "chapter": chapter,
      "type": "caseBased",
      "difficulty": "easy",
      "caseText": "A passage describing a case related to the questions of minimum lenth 90 words.",
      "questions": [
        { "text": "Sub question 1?", "marks": 1, "answer": "Explanation." },
        { "text": "Sub question 2?", "marks": 1, "answer": "Explanation." },
        { "text": "Sub question 2?", "marks": 1, "answer": "Explanation." },
        { "text": "Sub question 2?", "marks": 1, "answer": "Explanation." },
        { "text": "Sub question 2?", "marks": 1, "answer": "Explanation." },

      ]
    }
  };

  return promptTemplate + JSON.stringify(schema[type], null, 2);
};

generateAndStoreQuestions();
