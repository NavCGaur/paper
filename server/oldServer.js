import express from 'express';
import cors from 'cors';
import mongoose from "mongoose";
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { AlignmentType, Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, VerticalAlign } from "docx";
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import {  mongoUri } from "./config.js";
import {questionData} from "./data/Questions.js"
import QuestionPaperData from "./models/Question.js"; // Your Mongoose model


dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Firebase configuration
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
const firebaseApp = initializeApp(firebaseConfig);
const storage = getStorage(firebaseApp);
const db = getFirestore(firebaseApp);

await mongoose.connect(mongoUri);


// Function to format fetched questions into a Word document
async function formatQuestionPaper(title, instructions, sections) {
  let questionNumber = 1;
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          children: [new TextRun({ text: "PMSHRI KENDRIYA VIDYALAYA SAURKHAND", bold: true, size: 28 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [new TextRun({ text: title, bold: true, size: 24 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
        }),
        ...instructions.map(inst => new Paragraph({ text: inst, spacing: { after: 200 } })),
        ...sections.map(section => {
          const rows = [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: section.title, bold: true, size: 24 }),
                      ],
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                  columnSpan: 3,
                  verticalAlign: VerticalAlign.CENTER,
                }),
              ],
            }),
            ...section.questions.map(q => {

              console.log("q",q)

              const questionParagraphs = [
                new Paragraph({
                  text: q.text,
                  spacing: { after: 100 },
                  indent: { left: 50 },
                }),
              ];

            if (q.type === "mcq" && q.options) {
                q.options.forEach((option, index) => {
                  questionParagraphs.push(
                    new Paragraph({
                      children: [
                        new TextRun({ text: `(${String.fromCharCode(97 + index)}) ${option}` }),
                      ],
                      spacing: { before: 50 },
                      indent: { left: 50 },
                    })
                  );
                });
              } else if (q.type === "caseBased" && q.questions) {

                const caseMarks = q.questions.reduce(
                  (total, caseQuestion) => total + (caseQuestion.marks || 0),
                  0
                );
                q.marks = caseMarks;

                console.log("q.marks",q.marks)
              
                q.questions.forEach((caseQuestion, index) => {
                  questionParagraphs.push(
                    new Paragraph({
                      children: [
                        new TextRun({ text: `${index + 1}. ${caseQuestion.text} (${caseQuestion.marks} marks)` }),
                      ],
                      spacing: { before: 50 },
                      indent: { left: 50 },
                    })
                  );
                });
              }


              return new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: `${questionNumber++}`, alignment: AlignmentType.CENTER })],
                    width: { size: 5, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                  }),
                  new TableCell({
                    children: questionParagraphs,
                    width: { size: 90, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: `${q.marks}`, alignment: AlignmentType.CENTER })],
                    width: { size: 5, type: WidthType.PERCENTAGE },
                    verticalAlign: VerticalAlign.CENTER,
                  }),
                ],
              });
            }),
          ];
          return new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } });
        }),
      ],
    }],
  });
  return Packer.toBuffer(doc);
}

app.post('/generate-paper', async (req, res) => {
  
  const { 
    className, 
    subject, 
    difficulty, 
    numQuestions, 
    sections, 
    chapters,
    totalMarks
  } = req.body;  
  try {

    const hasSectionE = sections.length > 4 && sections[4].numQuestions !== undefined;

    console.log("sections",sections)
    // Current prompt has some formatting issues. Here's the improved version:
          const prompt = `
          Generate a Class ${className} CBSE ${subject} question paper with the following specifications:
          Difficulty Level: ${difficulty}
          Selected Chapters: ${chapters.join(', ')}

          **Question Distribution:**
          ${sections.map((section, index) =>
              `Section ${String.fromCharCode(65 + index)} (${section.markPerQuestion} mark${section.markPerQuestion > 1 ? 's' : ''} each) - ${section.numQuestions} questions`
          ).join('\n')}

          ${
            hasSectionE
                ? `**Case-Based Section Requirements:**
        - Section E should contain exactly ${sections[4].numQuestions} case-based question(s)
        - Each case-based question should include:
            - A case description of at least 90 words (MANDATORY) relevant to the selected chapters
            - Exactly 5 sub-questions worth 1 mark each`
                : ''
        }

          Expected JSON Structure:
          {
              "sectionA": [
                  {
                      "type": "mcq",
                      "text": "Question text here",
                      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                      "marks": 1
                  }
              ],
              "sectionB": [
                  {
                      "type": "shortAnswer",
                      "text": "Question text here",
                      "marks": 2
                  }
              ],
              "sectionC": [
                  {
                      "type": "mediumAnswer",
                      "text": "Question text here",
                      "marks": 3
                  }
              ],
              "sectionD": [
                  {
                      "type": "longAnswer",
                      "text": "Question text here",
                      "marks": 4
                  }
              ],
              "sectionE": [
                  {
                      "type": "caseBased",
                      "text": "Case description - must be of minimum 90 words",
                      "questions": [
                          { "text": "Sub-question 1", "marks": 1 },
                          { "text": "Sub-question 2", "marks": 1 },
                          { "text": "Sub-question 3", "marks": 1 },
                          { "text": "Sub-question 4", "marks": 1 },
                          { "text": "Sub-question 5", "marks": 1 }
                      ],

                  }
              ]
          }
          `
        const tokenCount = prompt.split(/\s+/).length; 
        console.log('Token count:', tokenCount);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const responseContent = completion.choices[0].message.content;
    console.log("responseContent", responseContent)
    let questions;
    try {
      questions = JSON.parse(responseContent);
    } catch (parseError) {
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Invalid JSON format in ChatGPT response.");
      }
    }

    const title = `HALF YEARLY EXAMINATION - ${subject.toUpperCase()} CLASS ${className}`;
    const instructions = [
      `Maximum Marks:  ${totalMarks}`,
      "Time: 3 Hours",  
      "All questions are compulsory.",
    ];
    const buffer = await formatQuestionPaper(title, instructions, 
      sections.map((section, index) => ({
        title: `SECTION ${String.fromCharCode(65 + index)} (${section.markPerQuestion} Mark Each)`, 
        questions: questions[`section${String.fromCharCode(65 + index)}`]
      }))
    );

    const fileName = `QuestionPaper_Class${className}_${subject}.docx`;
    const storageRef = ref(storage, `questionPapers/${fileName}`);
    const metadata = { contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };

    try {
        await uploadBytes(storageRef, buffer, metadata);
        const downloadURL = await getDownloadURL(storageRef);


        console.log('File uploaded successfully. URL:', downloadURL);


        const paperRef = doc(db, 'questionPapers', `${className}-${subject}`);


    try {
        await setDoc(paperRef, {
          className,
          subject,
          difficulty,
          numQuestions,
          downloadURL,
          createdAt: new Date().toISOString(),
        });
        console.log('Document successfully written:', paperRef.path);
        res.json({ filePath: downloadURL });


      } catch (err) {
        console.error('Error writing document:', err.message);
      }
      } catch (err) {
        console.error('Error uploading file to storage:', err.message);
        throw err; // Rethrow to ensure proper error handling
      }

    

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});






app.post('/generate-paper3', async (req, res) => {
  const {
    className,
    subject,
    difficulty,
    numQuestions,
    sections,
    chapters,
    totalMarks
  } = req.body;

  try {
    // Generate ChatGPT Prompt
    console.log (
    numQuestions,
    sections,
    chapters,
    totalMarks)

    const prompt = `
          Generate a Class ${className} CBSE ${subject} question paper with the following specifications:
          Difficulty Level: ${difficulty}
          Selected Chapters: ${chapters.join(', ')}

          **Question Distribution:**
          ${sections.map((section, index) =>
              `Section ${String.fromCharCode(65 + index)} (${section.markPerQuestion} mark${section.markPerQuestion > 1 ? 's' : ''} each) - ${section.numQuestions} questions`
          ).join('\n')}

          **Case-Based Section Requirements:**
          - Section E should contain exactly ${sections[4].numQuestions}  case-based question(s)
          - Each caseBased question should include:
            - A case description of at least 90 words (MANDATORY) relevant to the selected chapters
            - Exactly 5 sub-questions worth 1 mark each

          Expected JSON Structure:
          {
              "sectionA": [
                  {
                      "type": "mcq",
                      "text": "Question text here",
                      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
                      "marks": 1
                  }
              ],
              "sectionB": [
                  {
                      "type": "shortAnswer",
                      "text": "Question text here",
                      "marks": 2
                  }
              ],
              "sectionC": [
                  {
                      "type": "mediumAnswer",
                      "text": "Question text here",
                      "marks": 3
                  }
              ],
              "sectionD": [
                  {
                      "type": "longAnswer",
                      "text": "Question text here",
                      "marks": 4
                  }
              ],
              "sectionE": [
                  {
                      "type": "caseBased",
                      "text": "Case description - must be of minimum 90 words",
                      "questions": [
                          { "text": "Sub-question 1", "marks": 1 },
                          { "text": "Sub-question 2", "marks": 1 },
                          { "text": "Sub-question 3", "marks": 1 },
                          { "text": "Sub-question 4", "marks": 1 },
                          { "text": "Sub-question 5", "marks": 1 }
                      ],
                       "number of case based Question": ${sections[4].numQuestions},

                  }
              ]
          }
          `
  


    // Generate questions using ChatGPT
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const responseContent = completion.choices[0].message.content;

    console.log("responseContent",responseContent)
    let questions;
    try {
      questions = JSON.parse(responseContent);
    } catch (parseError) {
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Invalid JSON format in ChatGPT response.");
      }
    }

    // Format the question paper
    const title = `P. M SHRI KENDRIYA VIDYALAYA SAURKHAND\n\nPERIODIC TEST 2\n\nSUBJECT- ${subject.toUpperCase()}\n\nCLASS - ${className}`;
    const instructions = [
      `Time: 1 hour 30 minutes`,
      `Maximum Marks: ${totalMarks}`,
      "All questions are compulsory."
    ];

    const buffer = await formatQuestionPaper3(title, instructions, sections.map((section, index) => ({
      title: `SECTION ${String.fromCharCode(65 + index)} - (${section.markPerQuestion} Marks Each)`,
      questions: questions[`section${String.fromCharCode(65 + index)}`]
    })));

    // Upload the file to Firebase Storage
    const fileName = `QuestionPaper_Class${className}_${subject}.docx`;
    const storageRef = ref(storage, `questionPapers/${fileName}`);
    const metadata = { contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };

    await uploadBytes(storageRef, buffer, metadata);
    const downloadURL = await getDownloadURL(storageRef);

    // Save metadata in Firestore
    const paperRef = doc(db, 'questionPapers', `${className}-${subject}`);
    await setDoc(paperRef, {
      className,
      subject,
      difficulty,
      numQuestions,
      downloadURL,
      createdAt: new Date().toISOString(),
    });

    res.json({ filePath: downloadURL });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

async function formatQuestionPaper3(title, instructions, sections) {
  let questionNumber = 1;

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Palanquin Dark"
          }
        }
      }
    },
    sections: [{
      children: [
        // Title (School name and exam name)
        new Paragraph({
          children: [
            new TextRun({ 
              text: title,
              bold: true,
              size: 28,
              font: "Palanquin Dark"
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),

        // Instructions
        ...instructions.map(inst => new Paragraph({
          children: [
            new TextRun({ 
              text: inst,
              size: 24,
              font: "Palanquin Dark"
            })
          ],
          spacing: { after: 200 }
        })),

        // Sections
        ...sections.flatMap(section => [
          // Section Header
          new Paragraph({
            children: [
              new TextRun({ 
                text: section.title,
                bold: true,
                size: 24,
                font: "Palanquin Dark"
              })
            ],
            spacing: { before: 400, after: 200 }
          }),

          // Questions
          ...section.questions.flatMap(q => {
            if (q.type === "mcq") {
              // Question text in one paragraph
              const questionPara = new Paragraph({
                children: [
                  new TextRun({ 
                    text: `${questionNumber++}. ${q.text}`,
                    size: 22,
                    font: "Palanquin Dark"
                  })
                ],
                spacing: { after: 100 }
              });

              // Each option in its own paragraph
              const optionParas = q.options.map((option, index) => 
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `    ${String.fromCharCode(97 + index)}) ${option}`,
                      size: 22,
                      font: "Palanquin Dark"
                    })
                  ],
                  spacing: { after: 100 }
                })
              );

              return [questionPara, ...optionParas];
            }

            if (q.type === "caseBased") {
              const caseParagraphs = [
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: `${questionNumber++}. Case Study:\n`,
                      bold: true,
                      size: 22,
                      font: "Palanquin Dark"
                    }),
                    new TextRun({ 
                      text: q.text,
                      size: 22,
                      font: "Palanquin Dark"
                    })
                  ],
                  spacing: { after: 200 }
                }),
                ...q.questions.map((subQ, index) => new Paragraph({
                  children: [
                    new TextRun({ 
                      text: `${String.fromCharCode(97 + index)}) ${subQ.text}`,
                      size: 22,
                      font: "Palanquin Dark"
                    })
                  ],
                  spacing: { after: 200 }
                }))
              ];
              return caseParagraphs;
            }

            // Regular questions (short/long answer)
            return new Paragraph({
              children: [
                new TextRun({ 
                  text: `${questionNumber++}. ${q.text}`,
                  size: 22,
                  font: "Palanquin Dark"
                })
              ],
              spacing: { after: 200 }
            });
          })
        ])
      ]
    }]
  });

  return Packer.toBuffer(doc);
}

// Get question counts grouped by class, subject, chapter, and type
app.get('/question-summary', async (req, res) => {
  
  try {

    const summary = await QuestionPaperData.aggregate([
      {
        $group: {
          _id: { class: "$class", subject: "$subject", chapter: "$chapter", type: "$type" },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: { class: "$_id.class", subject: "$_id.subject", chapter: "$_id.chapter" },
          questionTypes: {
            $push: { type: "$_id.type", count: "$count" }
          }
        }
      },
      { $sort: { "_id.class": 1, "_id.subject": 1, "_id.chapter": 1 } }
    ]);

    console.log(summary)
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: "Error fetching question summary", error });
  }
});


const insertData = async () => {
  try {
    await QuestionPaperData.insertMany(questionData); // Insert new questions
    console.log("Questions inserted successfully");
  } catch (error) {
    console.error("Error inserting data:", error);
  }
};

// Run the insert function
//insertData();


const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

