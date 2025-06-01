import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { StudySet, Flashcard, QuizQuestion } from "@shared/schema";

export function useStudySets() {
  return useQuery<StudySet[]>({
    queryKey: ["/api/study-sets"],
  });
}

export function useStudySet(id: number) {
  return useQuery<StudySet>({
    queryKey: ["/api/study-sets", id],
  });
}

export function useFlashcards(studySetId: number) {
  return useQuery<Flashcard[]>({
    queryKey: ["/api/study-sets", studySetId, "flashcards"],
  });
}

export function useQuizQuestions(studySetId: number) {
  return useQuery<QuizQuestion[]>({
    queryKey: ["/api/study-sets", studySetId, "quiz-questions"],
  });
}

export function useCreateStudySet() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { title: string; description?: string }) => {
      const response = await apiRequest("POST", "/api/study-sets", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study-sets"] });
    },
  });
}

export function useCreateFlashcard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { studySetId: number; question: string; answer: string; order: number }) => {
      const response = await apiRequest("/api/flashcards", "POST", data);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/study-sets", variables.studySetId, "flashcards"] });
    },
  });
}

export function useUpdateFlashcard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number; question?: string; answer?: string }) => {
      const response = await apiRequest("PUT", `/api/flashcards/${id}`, data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/study-sets", data.studySetId, "flashcards"] });
    },
  });
}

export function useDeleteFlashcard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/flashcards/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/study-sets"] });
    },
  });
}

export function useCreateQuizQuestion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { studySetId: number; question: string; options: string[]; correctAnswer: number; order: number }) => {
      const response = await apiRequest("/api/quiz-questions", "POST", data);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/study-sets", variables.studySetId, "quiz-questions"] });
    },
  });
}
