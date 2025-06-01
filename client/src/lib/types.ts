export interface GeneratedFlashcard {
  question: string;
  answer: string;
}

export interface GeneratedQuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface AIGeneratedContent {
  flashcards: GeneratedFlashcard[];
  quizQuestions: GeneratedQuizQuestion[];
}

export interface FileUploadStatus {
  id: number;
  filename: string;
  originalName: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
}
