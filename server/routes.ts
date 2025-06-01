import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated } from "./auth";
import { storage } from "./storage";
import {
  insertStudySetSchema,
  insertFlashcardSchema,
  insertQuizQuestionSchema,
  type InsertStudySet,
  type InsertFlashcard,
  type InsertQuizQuestion,
  loginUserSchema,
  type LoginUser
} from "@shared/schema";
import multer from "multer";
import fs from "fs";
import OpenAI from "openai";
import PDFExtract from "pdf-extraction";
import mammoth from "mammoth";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    cb(null, allowedMimes.includes(file.mimetype));
  }
});

// Sanitize text to remove invalid UTF-8 sequences
function sanitizeText(text: string): string {
  return text.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').replace(/\uFFFD/g, '');
}

async function extractTextFromFile(filePath: string, mimeType: string): Promise<string> {
  try {
    switch (mimeType) {
      case 'application/pdf':
        return new Promise(async (resolve, reject) => {
          try {
            const pdfExtract = new PDFExtract();
            pdfExtract.extract(filePath, {}, (err, data) => {
              if (err) {
                reject(err);
                return;
              }
              if (!data || !data.pages) {
                resolve('');
                return;
              }
              const text = data.pages
                .map(page => page.content.map(item => item.str).join(' '))
                .join('\n');
              resolve(text);
            });
          } catch (error) {
            reject(error);
          }
        });

      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;

      case 'text/plain':
        return fs.readFileSync(filePath, 'utf-8');

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
          content: "You are an expert educator. Create flashcards from the provided text. Generate 5-10 high-quality flashcards with clear questions and concise answers. Return valid JSON in this format: {\"flashcards\": [{\"question\": \"...\", \"answer\": \"...\"}]}"
        },
        {
          role: "user",
          content: `Create flashcards from this text:\n\n${text.substring(0, 4000)}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content!);
    return result.flashcards || [];
  } catch (error) {
    console.error('Error generating flashcards:', error);
    throw new Error('Failed to generate flashcards');
  }
}

async function generateQuizQuestions(text: string): Promise<Array<{question: string, options: string[], correctAnswer: number}>> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert educator. Create multiple choice quiz questions from the provided text. Generate 5-10 high-quality questions with 4 options each. Return valid JSON in this format: {\"questions\": [{\"question\": \"...\", \"options\": [\"A\", \"B\", \"C\", \"D\"], \"correctAnswer\": 0}]}"
        },
        {
          role: "user",
          content: `Create quiz questions from this text:\n\n${text.substring(0, 4000)}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content!);
    return result.questions || [];
  } catch (error) {
    console.error('Error generating quiz questions:', error);
    throw new Error('Failed to generate quiz questions');
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post('/api/login', async (req, res) => {
    try {
      const validatedData = loginUserSchema.parse(req.body);
      const user = await storage.getUserByEmail(validatedData.email);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const bcrypt = await import("bcrypt");
      const isValidPassword = await bcrypt.compare(validatedData.password, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      (req.session as any).userId = user.id;
      res.json({ id: user.id, email: user.email });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Study sets
  app.get("/api/study-sets", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const studySets = await storage.getStudySets(userId);
      res.json(studySets);
    } catch (error) {
      console.error('Error fetching study sets:', error);
      res.status(500).json({ message: "Failed to fetch study sets" });
    }
  });

  app.post("/api/study-sets", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const validatedData = insertStudySetSchema.parse({
        ...req.body,
        userId
      });
      const studySet = await storage.createStudySet(validatedData);
      res.status(201).json(studySet);
    } catch (error) {
      console.error('Error creating study set:', error);
      res.status(500).json({ message: "Failed to create study set" });
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
          const rawText = await extractTextFromFile(req.file!.path, req.file!.mimetype);
          const extractedText = sanitizeText(rawText);
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
      console.error('Error fetching file:', error);
      res.status(500).json({ error: "Failed to fetch file" });
    }
  });

  // Generate content from file
  app.post("/api/files/:id/generate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const file = await storage.getUploadedFile(parseInt(req.params.id), userId);
      
      if (!file || !file.extractedText) {
        return res.status(400).json({ error: "File not found or text not extracted" });
      }

      const [flashcards, quizQuestions] = await Promise.all([
        generateFlashcards(file.extractedText),
        generateQuizQuestions(file.extractedText)
      ]);

      res.json({ flashcards, quizQuestions });
    } catch (error) {
      console.error('Error generating content:', error);
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
      console.error('Error fetching files:', error);
      res.status(500).json({ error: "Failed to fetch files" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}