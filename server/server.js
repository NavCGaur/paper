import express from 'express';
import cors from 'cors';
import mongoose from "mongoose";
import dotenv from 'dotenv';
import fs from 'fs';
import { AlignmentType, Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, VerticalAlign, TabStopType } from "docx";
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import {questionData} from "./data/Questions.js"
import QuestionPaperData from "./models/Question.js"; // Your Mongoose model
import autoGenerateQuestions from './autoGenerateQuestions.js';


dotenv.config();


const mongoUri = process.env.MONGO_URI;
const frontendUrl = process.env.FRONTEND_URL;


const app = express();

app.use(express.json());

app.use(cors({
  origin: frontendUrl
}));

// Handle preflight requests
app.options('*', cors({
  origin: frontendUrl,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

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
  console.log("inside formatQuestionPaper",)

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
              } else if (q.type === "caseBased" && q.caseDetails?.subQuestions) {

                const caseMarks = q.caseDetails.subQuestions.reduce(
                  (total, caseQuestion) => total + (caseQuestion.marks || 0),
                  0
                );
                q.marks = caseMarks;
            
                console.log("q.marks", q.marks);
            
                q.caseDetails.subQuestions.forEach((caseQuestion, index) => {
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

const shuffleArray = (array) => array.sort(() => Math.random() - 0.5);

app.post('/generate-paper', async (req, res) => {

  console.log("inside generate-paper",)

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
        const questionTypes = ["mcq", "shortAnswer", "mediumAnswer", "longAnswer", "caseBased"];

        // Assign default types if not provided
        const processedSections = sections.map((section, index) => ({
            ...section,
            type: section.type || questionTypes[index] || "mcq"
        }));

        // Fetching questions from MongoDB
        const fetchedQuestions = await QuestionPaperData.find({
            class:className,
            subject,
            chapter: { $in: chapters }
        });

        if (!fetchedQuestions || fetchedQuestions.length === 0) {
            return res.status(404).json({ error: "No questions found for the selected criteria." });
        }

        // Organizing questions by type and chapter
        const questionsByTypeAndChapter = {};

        fetchedQuestions.forEach(question => {
            if (!questionsByTypeAndChapter[question.type]) {
                questionsByTypeAndChapter[question.type] = {};
            }
            if (!questionsByTypeAndChapter[question.type][question.chapter]) {
                questionsByTypeAndChapter[question.type][question.chapter] = [];
            }
            questionsByTypeAndChapter[question.type][question.chapter].push(question);
        });

        // Structure for question paper
        const questionPaper = {};

        processedSections.forEach((section, index) => {
            const sectionKey = `section${String.fromCharCode(65 + index)}`;
            const type = section.type;
            const requiredQuestions = section.numQuestions;

            let selectedQuestions = [];

            if (questionsByTypeAndChapter[type]) {
                const chapterWiseQuestions = questionsByTypeAndChapter[type];
                const availableChapters = Object.keys(chapterWiseQuestions);

                // Step 1: Ensure at least one question per chapter
                let remainingSlots = requiredQuestions;
                availableChapters.forEach(chapter => {
                    if (remainingSlots > 0 && chapterWiseQuestions[chapter].length > 0) {
                        shuffleArray(chapterWiseQuestions[chapter]); // Randomize chapter questions
                        selectedQuestions.push(chapterWiseQuestions[chapter].pop());
                        remainingSlots--;
                    }
                });

                // Step 2: Fill remaining slots randomly from all chapters
                if (remainingSlots > 0) {
                    let allRemainingQuestions = availableChapters.flatMap(chapter => chapterWiseQuestions[chapter]);
                    shuffleArray(allRemainingQuestions); // Randomize
                    selectedQuestions.push(...allRemainingQuestions.slice(0, remainingSlots));
                }
            }

            questionPaper[sectionKey] = selectedQuestions;
        });

        // Generating the Word document
        const title = `HALF YEARLY EXAMINATION - ${subject.toUpperCase()} CLASS ${className}`;
        const instructions = [
            `Maximum Marks: ${totalMarks}`,
            "Time: 3 Hours",
            "All questions are compulsory."
        ];

        const buffer = await formatQuestionPaper(title, instructions, 
            processedSections.map((section, index) => ({
                title: `SECTION ${String.fromCharCode(65 + index)} (${section.markPerQuestion} Mark Each)`,
                questions: questionPaper[`section${String.fromCharCode(65 + index)}`]
            }))
        );

        // Uploading to Firebase
        const fileName = `QuestionPaper_Class${className}_${subject}.docx`;
        const storageRef = ref(storage, `questionPapers/${fileName}`);
        const metadata = { contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };

        try {
            await uploadBytes(storageRef, buffer, metadata);
            const downloadURL = await getDownloadURL(storageRef);

            console.log('File uploaded successfully. URL:', downloadURL);

            // Storing document details in Firestore
            const paperRef = doc(db, 'questionPapers', `${className}-${subject}`);
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
            console.error('Error uploading file to storage:', err.message);
            throw err;
        }

    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});




app.post('/generate-paper3', async (req, res) => {

  console.log("inside generate-paper-3",)

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

    const questionTypes = ["mcq", "shortAnswer", "mediumAnswer", "longAnswer", "caseBased"];

        // Assign default types if not provided
        const processedSections = sections.map((section, index) => ({
            ...section,
            type: section.type || questionTypes[index] || "mcq"
        }));

        // Fetching questions from MongoDB
        const fetchedQuestions = await QuestionPaperData.find({
            class:className,
            subject,
            chapter: { $in: chapters }
        });

        if (!fetchedQuestions || fetchedQuestions.length === 0) {
            return res.status(404).json({ error: "No questions found for the selected criteria." });
        }

        // Organizing questions by type and chapter
        const questionsByTypeAndChapter = {};

        fetchedQuestions.forEach(question => {
            if (!questionsByTypeAndChapter[question.type]) {
                questionsByTypeAndChapter[question.type] = {};
            }
            if (!questionsByTypeAndChapter[question.type][question.chapter]) {
                questionsByTypeAndChapter[question.type][question.chapter] = [];
            }
            questionsByTypeAndChapter[question.type][question.chapter].push(question);
        });

        // Structure for question paper
        const questionPaper = {};

        processedSections.forEach((section, index) => {
            const sectionKey = `section${String.fromCharCode(65 + index)}`;
            const type = section.type;
            const requiredQuestions = section.numQuestions;

            let selectedQuestions = [];

            if (questionsByTypeAndChapter[type]) {
                const chapterWiseQuestions = questionsByTypeAndChapter[type];
                const availableChapters = Object.keys(chapterWiseQuestions);

                // Step 1: Ensure at least one question per chapter
                let remainingSlots = requiredQuestions;
                availableChapters.forEach(chapter => {
                    if (remainingSlots > 0 && chapterWiseQuestions[chapter].length > 0) {
                        shuffleArray(chapterWiseQuestions[chapter]); // Randomize chapter questions
                        selectedQuestions.push(chapterWiseQuestions[chapter].pop());
                        remainingSlots--;
                    }
                });

                // Step 2: Fill remaining slots randomly from all chapters
                if (remainingSlots > 0) {
                    let allRemainingQuestions = availableChapters.flatMap(chapter => chapterWiseQuestions[chapter]);
                    shuffleArray(allRemainingQuestions); // Randomize
                    selectedQuestions.push(...allRemainingQuestions.slice(0, remainingSlots));
                }
            }

            questionPaper[sectionKey] = selectedQuestions;
        });

    // Format the question paper
    const title = `P. M SHRI KENDRIYA VIDYALAYA SAURKHAND\n\nPERIODIC TEST 2\n\nSUBJECT- ${subject.toUpperCase()}\n\nCLASS - ${className}`;
    const instructions = [
      `Time: 1 hour 30 minutes`,
      `Maximum Marks: ${totalMarks}`,
      "All questions are compulsory."
    ];

    const buffer = await formatQuestionPaper3(title, instructions, 
      processedSections.map((section, index) => ({
          title: `SECTION ${String.fromCharCode(65 + index)} (${section.markPerQuestion} Mark Each)`,
          questions: questionPaper[`section${String.fromCharCode(65 + index)}`]
      }))
  );


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

  console.log("inside formatQuestionPaper3",)
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

            if (q.type === "caseBased" && q.caseDetails?.subQuestions) {
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
                  ...q.caseDetails.subQuestions.map((subQ, index) => new Paragraph({
                      children: [
                          new TextRun({ 
                              text: `${String.fromCharCode(97 + index)}) ${subQ.text}`,
                              size: 22,
                              font: "Palanquin Dark"
                          }),

                          new TextRun({ 
                            text: ` (${subQ.marks} mark${subQ.marks > 1 ? "s" : ""})`, 
                            size: 22,
                            font: "Palanquin Dark",
                        })
                      ],
                      spacing: { after: 200 },
                      tabStops: [{ position: 7000, type: TabStopType.RIGHT }]

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
    console.log("Inserting Questions");

    await QuestionPaperData.insertMany(questionData); // Insert new questions
    console.log("Questions inserted successfully");
  } catch (error) {
    console.error("Error inserting data:", error);
  }
};

// Run the insert function
insertData();

const deleteData = async()=>{
  try{
    console.log("Deleting Questions");
    await QuestionPaperData.deleteMany({ "class": 700}); 
    console.log("Questions deleted successfully");


  } catch (error) {
    console.error("Error inserting data:", error);
  }
  
}

// Run the Delete function
//deleteData();

const backupDatabase = async()=> {
  try {
    

    const data = await QuestionPaperData.find({});
    const filePath = `./backups/QuestionPaperData.json`;

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`Backup of QuestionPaperData saved to ${filePath}`);
    

    console.log('Database backup complete');
  } catch (error) {
    console.error('Error backing up database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Connection closed');
  }
}

//backupDatabase();


//autoGenerateQuestions();


const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

