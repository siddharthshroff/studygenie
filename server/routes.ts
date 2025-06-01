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

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "your-openai-api-key"
});

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
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
        // For PDF files, we'll return sample text for demonstration
        // In a real implementation, you'd use a PDF parsing library
        return "This is sample text extracted from a PDF file. In a production environment, this would contain the actual text content from your uploaded PDF document.";

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
  
  // Upload file endpoint
  app.post("/api/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Create file record
      const uploadedFile = await storage.createUploadedFile({
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        status: "processing"
      });

      // Extract text asynchronously
      setImmediate(async () => {
        try {
          const extractedText = await extractTextFromFile(req.file!.path, req.file!.mimetype);
          await storage.updateUploadedFile(uploadedFile.id, {
            extractedText,
            status: "completed"
          });
        } catch (error) {
          console.error('Error processing file:', error);
          await storage.updateUploadedFile(uploadedFile.id, {
            status: "error"
          });
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
  app.get("/api/files/:id", async (req, res) => {
    try {
      const file = await storage.getUploadedFile(parseInt(req.params.id));
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      res.json(file);
    } catch (error) {
      res.status(500).json({ error: "Failed to get file" });
    }
  });

  // Generate AI content from file
  app.post("/api/generate/:fileId", async (req, res) => {
    try {
      const fileId = parseInt(req.params.fileId);
      const file = await storage.getUploadedFile(fileId);
      
      if (!file || !file.extractedText) {
        return res.status(400).json({ error: "File not found or text not extracted" });
      }

      const [flashcards, quizQuestions] = await Promise.all([
        generateFlashcards(file.extractedText),
        generateQuizQuestions(file.extractedText)
      ]);

      res.json({ flashcards, quizQuestions });
    } catch (error) {
      console.error('Generation error:', error);
      res.status(500).json({ error: "Failed to generate content" });
    }
  });

  // Study Sets CRUD
  app.get("/api/study-sets", async (req, res) => {
    try {
      const studySets = await storage.getStudySets();
      res.json(studySets);
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
