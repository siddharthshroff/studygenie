import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useCreateFlashcard, useCreateQuizQuestion } from "@/hooks/use-study-sets";

interface AddContentDialogProps {
  studySetId: number;
  type: "flashcard" | "quiz";
  trigger: React.ReactNode;
}

export function AddContentDialog({ studySetId, type, trigger }: AddContentDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createFlashcard = useCreateFlashcard();
  const createQuizQuestion = useCreateQuizQuestion();

  const [flashcardData, setFlashcardData] = useState({
    question: "",
    answer: ""
  });

  const [quizData, setQuizData] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0
  });

  const handleFlashcardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!flashcardData.question.trim() || !flashcardData.answer.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both question and answer",
        variant: "destructive",
      });
      return;
    }

    createFlashcard.mutate({
      studySetId,
      question: flashcardData.question,
      answer: flashcardData.answer,
      order: 0
    }, {
      onSuccess: () => {
        toast({
          title: "Flashcard added",
          description: "New flashcard has been created successfully.",
        });
        setFlashcardData({ question: "", answer: "" });
        setOpen(false);
        queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to create flashcard",
          variant: "destructive",
        });
      }
    });
  };

  const handleQuizSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!quizData.question.trim()) {
      toast({
        title: "Error",
        description: "Please enter a question",
        variant: "destructive",
      });
      return;
    }

    const filledOptions = quizData.options.filter(opt => opt.trim());
    if (filledOptions.length < 2) {
      toast({
        title: "Error",
        description: "Please provide at least 2 answer options",
        variant: "destructive",
      });
      return;
    }

    createQuizQuestion.mutate({
      studySetId,
      question: quizData.question,
      options: quizData.options.filter(opt => opt.trim()),
      correctAnswer: quizData.correctAnswer,
      order: 0
    }, {
      onSuccess: () => {
        toast({
          title: "Quiz question added",
          description: "New quiz question has been created successfully.",
        });
        setQuizData({
          question: "",
          options: ["", "", "", ""],
          correctAnswer: 0
        });
        setOpen(false);
        queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to create quiz question",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Add New {type === "flashcard" ? "Flashcard" : "Quiz Question"}
          </DialogTitle>
          <DialogDescription>
            Create a new {type === "flashcard" ? "flashcard" : "quiz question"} for this study set.
          </DialogDescription>
        </DialogHeader>

        {type === "flashcard" ? (
          <form onSubmit={handleFlashcardSubmit} className="space-y-4">
            <div>
              <Label htmlFor="question">Question</Label>
              <Textarea
                id="question"
                value={flashcardData.question}
                onChange={(e) => setFlashcardData(prev => ({
                  ...prev,
                  question: e.target.value
                }))}
                placeholder="Enter the question..."
                required
              />
            </div>
            <div>
              <Label htmlFor="answer">Answer</Label>
              <Textarea
                id="answer"
                value={flashcardData.answer}
                onChange={(e) => setFlashcardData(prev => ({
                  ...prev,
                  answer: e.target.value
                }))}
                placeholder="Enter the answer..."
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createFlashcard.isPending}>
                {createFlashcard.isPending ? "Creating..." : "Create Flashcard"}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleQuizSubmit} className="space-y-4">
            <div>
              <Label htmlFor="quiz-question">Question</Label>
              <Textarea
                id="quiz-question"
                value={quizData.question}
                onChange={(e) => setQuizData(prev => ({
                  ...prev,
                  question: e.target.value
                }))}
                placeholder="Enter the quiz question..."
                required
              />
            </div>
            <div>
              <Label>Answer Options</Label>
              <div className="space-y-2">
                {quizData.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={quizData.correctAnswer === index}
                      onChange={() => setQuizData(prev => ({
                        ...prev,
                        correctAnswer: index
                      }))}
                      className="mt-1"
                    />
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...quizData.options];
                        newOptions[index] = e.target.value;
                        setQuizData(prev => ({
                          ...prev,
                          options: newOptions
                        }));
                      }}
                      placeholder={`Option ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500">Select the correct answer by clicking the radio button</p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createQuizQuestion.isPending}>
                {createQuizQuestion.isPending ? "Creating..." : "Create Quiz Question"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}