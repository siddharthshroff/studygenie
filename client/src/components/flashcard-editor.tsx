import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCreateFlashcard, useUpdateFlashcard } from "@/hooks/use-study-sets";
import { useToast } from "@/hooks/use-toast";
import type { Flashcard } from "@shared/schema";

interface FlashcardEditorProps {
  flashcard?: Flashcard | null;
  studySetId?: number;
  onClose: () => void;
}

export function FlashcardEditor({ flashcard, studySetId, onClose }: FlashcardEditorProps) {
  const [question, setQuestion] = useState(flashcard?.question || "");
  const [answer, setAnswer] = useState(flashcard?.answer || "");
  const { toast } = useToast();

  const createMutation = useCreateFlashcard();
  const updateMutation = useUpdateFlashcard();

  const handleSave = () => {
    if (!question.trim() || !answer.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both question and answer.",
        variant: "destructive",
      });
      return;
    }

    if (flashcard) {
      // Update existing flashcard
      updateMutation.mutate(
        { id: flashcard.id, question, answer },
        {
          onSuccess: () => {
            toast({
              title: "Success",
              description: "Flashcard updated successfully.",
            });
            onClose();
          },
          onError: () => {
            toast({
              title: "Error",
              description: "Failed to update flashcard.",
              variant: "destructive",
            });
          },
        }
      );
    } else if (studySetId) {
      // Create new flashcard
      createMutation.mutate(
        { studySetId, question, answer, order: 0 },
        {
          onSuccess: () => {
            toast({
              title: "Success",
              description: "Flashcard created successfully.",
            });
            onClose();
          },
          onError: () => {
            toast({
              title: "Error",
              description: "Failed to create flashcard.",
              variant: "destructive",
            });
          },
        }
      );
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {flashcard ? "Edit Flashcard" : "Create New Flashcard"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question
              </label>
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter your question here..."
                rows={4}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Answer
              </label>
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Enter the answer here..."
                rows={4}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-2"></i>
                  Save Flashcard
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
