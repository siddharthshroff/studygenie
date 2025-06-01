import { 
  users, studySets, flashcards, quizQuestions, uploadedFiles,
  type User, type InsertUser, type StudySet, type InsertStudySet,
  type Flashcard, type InsertFlashcard, type QuizQuestion, type InsertQuizQuestion,
  type UploadedFile, type InsertUploadedFile
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(id: number, hashedPassword: string): Promise<void>;

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
  deleteUploadedFile(id: number): Promise<boolean>;

  // User Uploaded Files methods
  getUploadedFilesByUser(userId: number): Promise<UploadedFile[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async getStudySets(): Promise<StudySet[]> {
    return await db.select().from(studySets).orderBy(studySets.createdAt);
  }

  async getStudySet(id: number): Promise<StudySet | undefined> {
    const [studySet] = await db.select().from(studySets).where(eq(studySets.id, id));
    return studySet || undefined;
  }

  async createStudySet(insertStudySet: InsertStudySet): Promise<StudySet> {
    const [studySet] = await db
      .insert(studySets)
      .values(insertStudySet)
      .returning();
    return studySet;
  }

  async updateStudySet(id: number, updateData: Partial<InsertStudySet>): Promise<StudySet | undefined> {
    const [studySet] = await db
      .update(studySets)
      .set(updateData)
      .where(eq(studySets.id, id))
      .returning();
    return studySet || undefined;
  }

  async deleteStudySet(id: number): Promise<boolean> {
    const result = await db.delete(studySets).where(eq(studySets.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getFlashcardsByStudySet(studySetId: number): Promise<Flashcard[]> {
    return await db
      .select()
      .from(flashcards)
      .where(eq(flashcards.studySetId, studySetId))
      .orderBy(flashcards.order);
  }

  async createFlashcard(insertFlashcard: InsertFlashcard): Promise<Flashcard> {
    const [flashcard] = await db
      .insert(flashcards)
      .values(insertFlashcard)
      .returning();
    return flashcard;
  }

  async updateFlashcard(id: number, updateData: Partial<InsertFlashcard>): Promise<Flashcard | undefined> {
    const [flashcard] = await db
      .update(flashcards)
      .set(updateData)
      .where(eq(flashcards.id, id))
      .returning();
    return flashcard || undefined;
  }

  async deleteFlashcard(id: number): Promise<boolean> {
    const result = await db.delete(flashcards).where(eq(flashcards.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getQuizQuestionsByStudySet(studySetId: number): Promise<QuizQuestion[]> {
    return await db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.studySetId, studySetId))
      .orderBy(quizQuestions.order);
  }

  async createQuizQuestion(insertQuestion: InsertQuizQuestion): Promise<QuizQuestion> {
    const [question] = await db
      .insert(quizQuestions)
      .values(insertQuestion)
      .returning();
    return question;
  }

  async updateQuizQuestion(id: number, updateData: Partial<InsertQuizQuestion>): Promise<QuizQuestion | undefined> {
    const [question] = await db
      .update(quizQuestions)
      .set(updateData)
      .where(eq(quizQuestions.id, id))
      .returning();
    return question || undefined;
  }

  async deleteQuizQuestion(id: number): Promise<boolean> {
    const result = await db.delete(quizQuestions).where(eq(quizQuestions.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getUploadedFiles(): Promise<UploadedFile[]> {
    return await db.select().from(uploadedFiles).orderBy(uploadedFiles.uploadedAt);
  }

  async getUploadedFile(id: number): Promise<UploadedFile | undefined> {
    const [file] = await db.select().from(uploadedFiles).where(eq(uploadedFiles.id, id));
    return file || undefined;
  }

  async createUploadedFile(insertFile: InsertUploadedFile): Promise<UploadedFile> {
    const [file] = await db
      .insert(uploadedFiles)
      .values(insertFile)
      .returning();
    return file;
  }

  async updateUploadedFile(id: number, updateData: Partial<InsertUploadedFile>): Promise<UploadedFile | undefined> {
    const [file] = await db
      .update(uploadedFiles)
      .set(updateData)
      .where(eq(uploadedFiles.id, id))
      .returning();
    return file || undefined;
  }

  async updateUserPassword(id: number, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, id));
  }

  async deleteUploadedFile(id: number): Promise<boolean> {
    const result = await db
      .delete(uploadedFiles)
      .where(eq(uploadedFiles.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getUploadedFilesByUser(userId: number): Promise<UploadedFile[]> {
    return await db
      .select()
      .from(uploadedFiles)
      .where(eq(uploadedFiles.userId, userId))
      .orderBy(uploadedFiles.uploadedAt);
  }
}

export const storage = new DatabaseStorage();
