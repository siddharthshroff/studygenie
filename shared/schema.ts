import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const studySets = pgTable("study_sets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  fileId: integer("file_id").references(() => uploadedFiles.id),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const flashcards = pgTable("flashcards", {
  id: serial("id").primaryKey(),
  studySetId: integer("study_set_id").references(() => studySets.id).notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  order: integer("order").notNull().default(0),
}, (table) => ({
  studySetIdIdx: index("flashcards_study_set_id_idx").on(table.studySetId),
}));

export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  studySetId: integer("study_set_id").references(() => studySets.id).notNull(),
  question: text("question").notNull(),
  options: text("options").array().notNull(),
  correctAnswer: integer("correct_answer").notNull(),
  order: integer("order").notNull().default(0),
}, (table) => ({
  studySetIdIdx: index("quiz_questions_study_set_id_idx").on(table.studySetId),
}));

export const uploadedFiles = pgTable("uploaded_files", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  extractedText: text("extracted_text"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, error
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  studySetId: integer("study_set_id").references(() => studySets.id),
  userId: integer("user_id").references(() => users.id).notNull(),
}, (table) => ({
  studySetIdIdx: index("uploaded_files_study_set_id_idx").on(table.studySetId),
  userIdIdx: index("uploaded_files_user_id_idx").on(table.userId),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
});

export const loginUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
});

export const insertStudySetSchema = createInsertSchema(studySets).pick({
  title: true,
  description: true,
  fileId: true,
  userId: true,
});

export const insertFlashcardSchema = createInsertSchema(flashcards).pick({
  studySetId: true,
  question: true,
  answer: true,
  order: true,
});

export const insertQuizQuestionSchema = createInsertSchema(quizQuestions).pick({
  studySetId: true,
  question: true,
  options: true,
  correctAnswer: true,
  order: true,
});

export const insertUploadedFileSchema = createInsertSchema(uploadedFiles).pick({
  filename: true,
  originalName: true,
  mimeType: true,
  extractedText: true,
  status: true,
  userId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertStudySet = z.infer<typeof insertStudySetSchema>;
export type StudySet = typeof studySets.$inferSelect;
export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;
export type Flashcard = typeof flashcards.$inferSelect;
export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertUploadedFile = z.infer<typeof insertUploadedFileSchema>;
export type UploadedFile = typeof uploadedFiles.$inferSelect;
