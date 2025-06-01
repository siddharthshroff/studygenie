import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCreateStudySet, useCreateFlashcard, useCreateQuizQuestion } from "@/hooks/use-study-sets";
import { useToast } from "@/hooks/use-toast";
import type { AIGeneratedContent } from "@/lib/types";

interface SaveDialogProps {
  content: AIGeneratedContent;
  onClose: () => void;
  onSaved: () => void;
}

export function SaveDialog({ content, onClose, onSaved }: SaveDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const createStudySetMutation = useCreateStudySet();
  const createFlashcardMutation = useCreateFlashcard();
  const createQuizQuestionMutation = useCreateQuizQuestion();

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a title for your study set.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create the study set
      const studySet = await createStudySetMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
      });

      // Create flashcards
      const flashcardPromises = content.flashcards.map((flashcard, index) =>
        createFlashcardMutation.mutateAsync({
          studySetId: studySet.id,
          question: flashcard.question,
          answer: flashcard.answer,
          order: index,
        })
      );

      // Create quiz questions
      const quizPromises = content.quizQuestions.map((question, index) =>
        createQuizQuestionMutation.mutateAsync({
          studySetId: studySet.id,
          question: question.question,
          options: question.options,
          correctAnswer: question.correctAnswer,
          order: index,
        })
      );

      await Promise.all([...flashcardPromises, ...quizPromises]);

      toast({
        title: "Success!",
        description: `Study set "${title}" has been saved successfully.`,
      });

      onSaved();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save study set. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save Study Set</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Study Set Name
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Biology Chapter 5"
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for this study set..."
              rows={3}
              className="w-full"
            />
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">Content Summary</p>
              <p className="text-xs text-gray-600">
                {content.flashcards.length} flashcards • {content.quizQuestions.length} quiz questions
              </p>
            </div>
            <i className="fas fa-layer-group text-primary-600 text-xl"></i>
          </div>
          
          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={createStudySetMutation.isPending}
            >
              {createStudySetMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-2"></i>
                  Save Study Set
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
