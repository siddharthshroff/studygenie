import { 
  users, studySets, flashcards, quizQuestions, uploadedFiles,
  type User, type InsertUser, type StudySet, type InsertStudySet,
  type Flashcard, type InsertFlashcard, type QuizQuestion, type InsertQuizQuestion,
  type UploadedFile, type InsertUploadedFile
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Study Set methods
  getStudySets(): Promise<StudySet[]>;
  getStudySet(id: number): Promise<StudySet | undefined>;
  createStudySet(studySet: InsertStudySet): Promise<StudySet>;
  updateStudySet(id: number, studySet: Partial<InsertStudySet>): Promise<StudySet | undefined>;
  deleteStudySet(id: number): Promise<boolean>;

  // Flashcard methods
  getFlashcardsByStudySet(studySetId: number): Promise<Flashcard[]>;
  createFlashcard(flashcard: InsertFlashcard): Promise<Flashcard>;
  updateFlashcard(id: number, flashcard: Partial<InsertFlashcard>): Promise<Flashcard | undefined>;
  deleteFlashcard(id: number): Promise<boolean>;

  // Quiz Question methods
  getQuizQuestionsByStudySet(studySetId: number): Promise<QuizQuestion[]>;
  createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion>;
  updateQuizQuestion(id: number, question: Partial<InsertQuizQuestion>): Promise<QuizQuestion | undefined>;
  deleteQuizQuestion(id: number): Promise<boolean>;

  // File methods
  getUploadedFiles(): Promise<UploadedFile[]>;
  getUploadedFile(id: number): Promise<UploadedFile | undefined>;
  createUploadedFile(file: InsertUploadedFile): Promise<UploadedFile>;
  updateUploadedFile(id: number, file: Partial<InsertUploadedFile>): Promise<UploadedFile | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private studySets: Map<number, StudySet>;
  private flashcards: Map<number, Flashcard>;
  private quizQuestions: Map<number, QuizQuestion>;
  private uploadedFiles: Map<number, UploadedFile>;
  private currentUserId: number;
  private currentStudySetId: number;
  private currentFlashcardId: number;
  private currentQuizQuestionId: number;
  private currentFileId: number;

  constructor() {
    this.users = new Map();
    this.studySets = new Map();
    this.flashcards = new Map();
    this.quizQuestions = new Map();
    this.uploadedFiles = new Map();
    this.currentUserId = 1;
    this.currentStudySetId = 1;
    this.currentFlashcardId = 1;
    this.currentQuizQuestionId = 1;
    this.currentFileId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Study Set methods
  async getStudySets(): Promise<StudySet[]> {
    return Array.from(this.studySets.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getStudySet(id: number): Promise<StudySet | undefined> {
    return this.studySets.get(id);
  }

  async createStudySet(insertStudySet: InsertStudySet): Promise<StudySet> {
    const id = this.currentStudySetId++;
    const studySet: StudySet = { 
      ...insertStudySet, 
      id, 
      createdAt: new Date(),
      description: insertStudySet.description || null
    };
    this.studySets.set(id, studySet);
    return studySet;
  }

  async updateStudySet(id: number, updateData: Partial<InsertStudySet>): Promise<StudySet | undefined> {
    const existing = this.studySets.get(id);
    if (!existing) return undefined;
    
    const updated: StudySet = { ...existing, ...updateData };
    this.studySets.set(id, updated);
    return updated;
  }

  async deleteStudySet(id: number): Promise<boolean> {
    return this.studySets.delete(id);
  }

  // Flashcard methods
  async getFlashcardsByStudySet(studySetId: number): Promise<Flashcard[]> {
    return Array.from(this.flashcards.values())
      .filter(card => card.studySetId === studySetId)
      .sort((a, b) => a.order - b.order);
  }

  async createFlashcard(insertFlashcard: InsertFlashcard): Promise<Flashcard> {
    const id = this.currentFlashcardId++;
    const flashcard: Flashcard = { 
      ...insertFlashcard, 
      id, 
      order: insertFlashcard.order || 0 
    };
    this.flashcards.set(id, flashcard);
    return flashcard;
  }

  async updateFlashcard(id: number, updateData: Partial<InsertFlashcard>): Promise<Flashcard | undefined> {
    const existing = this.flashcards.get(id);
    if (!existing) return undefined;
    
    const updated: Flashcard = { ...existing, ...updateData };
    this.flashcards.set(id, updated);
    return updated;
  }

  async deleteFlashcard(id: number): Promise<boolean> {
    return this.flashcards.delete(id);
  }

  // Quiz Question methods
  async getQuizQuestionsByStudySet(studySetId: number): Promise<QuizQuestion[]> {
    return Array.from(this.quizQuestions.values())
      .filter(question => question.studySetId === studySetId)
      .sort((a, b) => a.order - b.order);
  }

  async createQuizQuestion(insertQuestion: InsertQuizQuestion): Promise<QuizQuestion> {
    const id = this.currentQuizQuestionId++;
    const question: QuizQuestion = { 
      ...insertQuestion, 
      id, 
      order: insertQuestion.order || 0 
    };
    this.quizQuestions.set(id, question);
    return question;
  }

  async updateQuizQuestion(id: number, updateData: Partial<InsertQuizQuestion>): Promise<QuizQuestion | undefined> {
    const existing = this.quizQuestions.get(id);
    if (!existing) return undefined;
    
    const updated: QuizQuestion = { ...existing, ...updateData };
    this.quizQuestions.set(id, updated);
    return updated;
  }

  async deleteQuizQuestion(id: number): Promise<boolean> {
    return this.quizQuestions.delete(id);
  }

  // File methods
  async getUploadedFiles(): Promise<UploadedFile[]> {
    return Array.from(this.uploadedFiles.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getUploadedFile(id: number): Promise<UploadedFile | undefined> {
    return this.uploadedFiles.get(id);
  }

  async createUploadedFile(insertFile: InsertUploadedFile): Promise<UploadedFile> {
    const id = this.currentFileId++;
    const file: UploadedFile = { 
      ...insertFile, 
      id, 
      createdAt: new Date(),
      status: insertFile.status || "pending",
      extractedText: insertFile.extractedText || null
    };
    this.uploadedFiles.set(id, file);
    return file;
  }

  async updateUploadedFile(id: number, updateData: Partial<InsertUploadedFile>): Promise<UploadedFile | undefined> {
    const existing = this.uploadedFiles.get(id);
    if (!existing) return undefined;
    
    const updated: UploadedFile = { ...existing, ...updateData };
    this.uploadedFiles.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
