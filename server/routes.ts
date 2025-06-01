import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, hashPassword, verifyPassword } from "./auth";
import { insertUserSchema, loginUserSchema, insertStudySetSchema, insertFlashcardSchema, insertQuizQuestionSchema } from "@shared/schema";
import multer from "multer";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

// File processing libraries
import mammoth from "mammoth";

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
});

// Ensure uploads directory exists with cross-platform path handling
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'video/mp4'
    ];
    cb(null, allowedMimes.includes(file.mimetype));
  }
});

async function extractTextFromFile(filePath: string, mimeType: string): Promise<string> {
  try {
    switch (mimeType) {
      case 'application/pdf':
        return new Promise(async (resolve, reject) => {
          const { PdfReader } = await import('pdfreader');
          const reader = new PdfReader();
          
          let text = '';
          let lastY = 0;
          
          reader.parseFileItems(filePath, (err: any, item: any) => {
            if (err) {
              reject(new Error(`PDF parsing failed: ${err.message}`));
              return;
            }
            
            if (!item) {
              // End of file
              const cleanText = text
                .replace(/\s+/g, ' ')
                .trim();
              
              if (cleanText.length < 50) {
                reject(new Error('PDF appears to contain minimal readable text'));
                return;
              }
              
              console.log('Extracted PDF text preview:', cleanText.substring(0, 200) + '...');
              resolve(cleanText);
              return;
            }
            
            if (item.text) {
              // Add line break if we're on a new line
              if (item.y > lastY + 1) {
                text += '\n';
              }
              
              text += item.text + ' ';
              lastY = item.y;
            }
          });
        });

      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        const docxResult = await mammoth.extractRawText({ path: filePath });
        return docxResult.value;

      case 'text/plain':
        return fs.readFileSync(filePath, 'utf-8');

      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        // For PowerPoint files, return sample text
        return "This is sample text extracted from a PowerPoint presentation. In a production environment, this would contain the actual text content from your uploaded PPTX slides.";

      case 'video/mp4':
        // For video files, return sample transcription
        return "This is sample transcribed text from a video file. In a production environment, this would contain the actual speech-to-text transcription from your uploaded MP4 video.";

      default:
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    console.error('Error extracting text:', error);
    throw error;
  }
}

async function generateFlashcards(text: string): Promise<Array<{question: string, answer: string}>> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert educational content creator. Generate flashcards from the provided text. Each flashcard should have a clear question and a comprehensive answer. Focus on key concepts, definitions, and important facts. Return the result as a JSON object with an array of flashcards."
        },
        {
          role: "user",
          content: `Generate 8-12 flashcards from this text. Return as JSON in this format: {"flashcards": [{"question": "What is...?", "answer": "The answer is..."}]}.\n\nText: ${text.substring(0, 3000)}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"flashcards": []}');
    return result.flashcards || [];
  } catch (error) {
    console.error('Error generating flashcards:', error);
    throw error;
  }
}

async function generateQuizQuestions(text: string): Promise<Array<{question: string, options: string[], correctAnswer: number}>> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert educational content creator. Generate multiple-choice quiz questions from the provided text. Each question should have 4 options with only one correct answer. Focus on testing understanding of key concepts. Return the result as a JSON object."
        },
        {
          role: "user",
          content: `Generate 5-8 multiple-choice questions from this text. Return as JSON in this format: {"questions": [{"question": "What is...?", "options": ["Option A", "Option B", "Option C", "Option D"], "correctAnswer": 0}]}. The correctAnswer should be the index (0-3) of the correct option.\n\nText: ${text.substring(0, 3000)}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"questions": []}');
    return result.questions || [];
  } catch (error) {
    console.error('Error generating quiz questions:', error);
    throw error;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.post('/api/signup', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(userData.password);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Set session
      req.session.userId = user.id;

      res.json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(400).json({ message: "Invalid signup data" });
    }
  });

  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = loginUserSchema.parse(req.body);
      
      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set session
      req.session.userId = user.id;

      res.json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Invalid login data" });
    }
  });

  app.get('/api/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Could not log out" });
      }
      res.clearCookie('connect.sid');
      res.redirect('/login');
    });
  });

  app.get('/api/auth/user', isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post('/api/auth/change-password', isAuthenticated, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters long" });
      }

      // Get the user to verify current password
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Hash new password and update
      const hashedNewPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(user.id, hashedNewPassword);

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });
  
  // Upload file endpoint
  app.post("/api/upload", isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const userId = req.session.userId;

      // Create file record
      const uploadedFile = await storage.createUploadedFile({
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        status: "processing",
        userId: userId
      });

      // Extract text asynchronously
      setImmediate(async () => {
        try {
          const extractedText = await extractTextFromFile(req.file!.path, req.file!.mimetype);
          await storage.updateUploadedFile(uploadedFile.id, {
            extractedText,
            status: "completed"
          }, userId);
        } catch (error) {
          console.error('Error processing file:', error);
          await storage.updateUploadedFile(uploadedFile.id, {
            status: "error"
          }, userId);
        } finally {
          // Clean up uploaded file
          fs.unlink(req.file!.path, () => {});
        }
      });

      res.json(uploadedFile);
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Get file status
  app.get("/api/files/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const file = await storage.getUploadedFile(parseInt(req.params.id), userId);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      res.json(file);
    } catch (error) {
      res.status(500).json({ error: "Failed to get file" });
    }
  });

  // Generate AI content from file
  app.post("/api/files/:id/generate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const fileId = parseInt(req.params.id);
      const file = await storage.getUploadedFile(fileId, userId);
      
      if (!file || !file.extractedText) {
        return res.status(400).json({ error: "File not found or text not extracted" });
      }

      console.log('Starting content generation for file:', fileId);
      console.log('Extracted text preview:', file.extractedText?.substring(0, 200) + '...');
      
      // Generate content using AI
      console.log('Calling OpenAI API for content generation...');
      const [generatedFlashcards, generatedQuizQuestions] = await Promise.all([
        generateFlashcards(file.extractedText),
        generateQuizQuestions(file.extractedText)
      ]);
      
      console.log(`Generated ${generatedFlashcards.length} flashcards and ${generatedQuizQuestions.length} quiz questions`);

      // Create a study set for this file
      const studySet = await storage.createStudySet({
        title: `Study Set for ${file.originalName}`,
        description: `Generated from uploaded file: ${file.originalName}`,
        userId: userId,
        fileId: fileId
      });

      // Link the file to the study set
      await storage.updateUploadedFile(fileId, { studySetId: studySet.id });

      // Save flashcards to database
      const savedFlashcards = [];
      for (const flashcard of generatedFlashcards) {
        const saved = await storage.createFlashcard({
          studySetId: studySet.id,
          question: flashcard.question,
          answer: flashcard.answer
        });
        savedFlashcards.push(saved);
      }

      // Save quiz questions to database
      const savedQuizQuestions = [];
      for (const question of generatedQuizQuestions) {
        const saved = await storage.createQuizQuestion({
          studySetId: studySet.id,
          question: question.question,
          options: question.options,
          correctAnswer: question.correctAnswer
        });
        savedQuizQuestions.push(saved);
      }

      res.json({ 
        flashcards: savedFlashcards, 
        quizQuestions: savedQuizQuestions,
        studySet: studySet
      });
    } catch (error) {
      console.error('Generation error:', error);
      res.status(500).json({ error: "Failed to generate content" });
    }
  });

  // Get all uploaded files with their study materials
  app.get('/api/files', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const files = await storage.getUploadedFiles(userId);
      
      // Get study sets and associated flashcards/quizzes for each file
      const filesWithStudyMaterials = await Promise.all(
        files.map(async (file) => {
          if (file.studySetId) {
            const studySet = await storage.getStudySet(file.studySetId, userId);
            if (studySet) {
              const flashcards = await storage.getFlashcardsByStudySet(studySet.id);
              const quizQuestions = await storage.getQuizQuestionsByStudySet(studySet.id);
              
              return {
                ...file,
                studySet: {
                  ...studySet,
                  flashcards,
                  quizQuestions
                }
              };
            }
          }
          return file;
        })
      );
      
      res.json(filesWithStudyMaterials);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  // Delete uploaded file
  app.delete("/api/files/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const fileId = parseInt(req.params.id);
      
      // Get the file to find associated study set (with user verification)
      const file = await storage.getUploadedFile(fileId, userId);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      // Delete associated study set and its content if it exists
      if (file.studySetId) {
        await storage.deleteStudySet(file.studySetId);
      }

      // Delete the file record
      const success = await storage.deleteUploadedFile(fileId, userId);
      if (!success) {
        return res.status(404).json({ error: "File not found" });
      }

      res.json({ message: "File deleted successfully" });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ error: "Failed to delete file" });
    }
  });

  // Get flashcards by study set
  app.get('/api/study-sets/:studySetId/flashcards', isAuthenticated, async (req, res) => {
    try {
      const studySetId = parseInt(req.params.studySetId);
      const flashcards = await storage.getFlashcardsByStudySet(studySetId);
      res.json(flashcards);
    } catch (error) {
      console.error("Error fetching flashcards:", error);
      res.status(500).json({ message: "Failed to fetch flashcards" });
    }
  });

  // Get quiz questions by study set
  app.get('/api/study-sets/:studySetId/quiz-questions', isAuthenticated, async (req, res) => {
    try {
      const studySetId = parseInt(req.params.studySetId);
      const quizQuestions = await storage.getQuizQuestionsByStudySet(studySetId);
      res.json(quizQuestions);
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      res.status(500).json({ message: "Failed to fetch quiz questions" });
    }
  });

  // Create new flashcard
  app.post('/api/flashcards', isAuthenticated, async (req, res) => {
    try {
      const { studySetId, question, answer } = req.body;
      
      if (!studySetId || !question || !answer) {
        return res.status(400).json({ message: "Study set ID, question, and answer are required" });
      }

      const flashcard = await storage.createFlashcard({
        studySetId,
        question,
        answer,
        order: 0
      });

      res.status(201).json(flashcard);
    } catch (error) {
      console.error("Error creating flashcard:", error);
      res.status(500).json({ message: "Failed to create flashcard" });
    }
  });

  // Create new quiz question
  app.post('/api/quiz-questions', isAuthenticated, async (req, res) => {
    try {
      const { studySetId, question, options, correctAnswer } = req.body;
      
      if (!studySetId || !question || !options || correctAnswer === undefined) {
        return res.status(400).json({ message: "Study set ID, question, options, and correct answer are required" });
      }

      const quizQuestion = await storage.createQuizQuestion({
        studySetId,
        question,
        options,
        correctAnswer,
        order: 0
      });

      res.status(201).json(quizQuestion);
    } catch (error) {
      console.error("Error creating quiz question:", error);
      res.status(500).json({ message: "Failed to create quiz question" });
    }
  });

  // Study Sets CRUD
  app.get("/api/study-sets", isAuthenticated, async (req: any, res) => {
    try {
      const includeContent = req.query.include === 'content';
      const userId = req.session.userId;
      const studySets = await storage.getStudySets(userId);
      
      if (includeContent) {
        // Include flashcards and quiz questions for each study set
        const studySetsWithContent = await Promise.all(
          studySets.map(async (studySet) => {
            const [flashcards, quizQuestions] = await Promise.all([
              storage.getFlashcardsByStudySet(studySet.id),
              storage.getQuizQuestionsByStudySet(studySet.id)
            ]);
            
            return {
              ...studySet,
              flashcards,
              quizQuestions
            };
          })
        );
        
        res.json(studySetsWithContent);
      } else {
        res.json(studySets);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to get study sets" });
    }
  });

  app.post("/api/study-sets", async (req, res) => {
    try {
      const validatedData = insertStudySetSchema.parse(req.body);
      const studySet = await storage.createStudySet(validatedData);
      res.json(studySet);
    } catch (error) {
      res.status(400).json({ error: "Invalid study set data" });
    }
  });

  app.get("/api/study-sets/:id", async (req, res) => {
    try {
      const studySet = await storage.getStudySet(parseInt(req.params.id));
      if (!studySet) {
        return res.status(404).json({ error: "Study set not found" });
      }
      res.json(studySet);
    } catch (error) {
      res.status(500).json({ error: "Failed to get study set" });
    }
  });

  // Flashcards CRUD
  app.get("/api/study-sets/:id/flashcards", async (req, res) => {
    try {
      const flashcards = await storage.getFlashcardsByStudySet(parseInt(req.params.id));
      res.json(flashcards);
    } catch (error) {
      res.status(500).json({ error: "Failed to get flashcards" });
    }
  });

  app.post("/api/flashcards", async (req, res) => {
    try {
      const validatedData = insertFlashcardSchema.parse(req.body);
      const flashcard = await storage.createFlashcard(validatedData);
      res.json(flashcard);
    } catch (error) {
      res.status(400).json({ error: "Invalid flashcard data" });
    }
  });

  app.put("/api/flashcards/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const flashcard = await storage.updateFlashcard(id, req.body);
      if (!flashcard) {
        return res.status(404).json({ error: "Flashcard not found" });
      }
      res.json(flashcard);
    } catch (error) {
      res.status(500).json({ error: "Failed to update flashcard" });
    }
  });

  app.delete("/api/flashcards/:id", async (req, res) => {
    try {
      const success = await storage.deleteFlashcard(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ error: "Flashcard not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete flashcard" });
    }
  });

  // Quiz Questions CRUD
  app.get("/api/study-sets/:id/quiz-questions", async (req, res) => {
    try {
      const questions = await storage.getQuizQuestionsByStudySet(parseInt(req.params.id));
      res.json(questions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get quiz questions" });
    }
  });

  app.post("/api/quiz-questions", async (req, res) => {
    try {
      const validatedData = insertQuizQuestionSchema.parse(req.body);
      const question = await storage.createQuizQuestion(validatedData);
      res.json(question);
    } catch (error) {
      res.status(400).json({ error: "Invalid quiz question data" });
    }
  });

  app.put("/api/quiz-questions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const question = await storage.updateQuizQuestion(id, req.body);
      if (!question) {
        return res.status(404).json({ error: "Quiz question not found" });
      }
      res.json(question);
    } catch (error) {
      res.status(500).json({ error: "Failed to update quiz question" });
    }
  });

  app.delete("/api/quiz-questions/:id", async (req, res) => {
    try {
      const success = await storage.deleteQuizQuestion(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ error: "Quiz question not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete quiz question" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
