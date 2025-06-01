import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";

export default function AllQuizzes() {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showAnswers, setShowAnswers] = useState(false);

  const { data: studySets, isLoading } = useQuery({
    queryKey: ["/api/study-sets", "with-content"],
    queryFn: () => fetch("/api/study-sets?include=content").then(res => res.json()),
  });

  const handleAnswerSelect = (questionId: string, optionIndex: number) => {
    if (!showAnswers) {
      setSelectedAnswers(prev => ({
        ...prev,
        [questionId]: optionIndex
      }));
    }
  };

  const resetQuiz = () => {
    setSelectedAnswers({});
    setShowAnswers(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading quiz questions...</div>
      </div>
    );
  }

  const allQuizQuestions = studySets?.reduce((acc: any[], studySet: any) => {
    if (studySet.quizQuestions) {
      const questionsWithStudySet = studySet.quizQuestions.map((question: any) => ({
        ...question,
        studySetTitle: studySet.title
      }));
      return [...acc, ...questionsWithStudySet];
    }
    return acc;
  }, []) || [];

  const calculateScore = () => {
    let correct = 0;
    allQuizQuestions.forEach((question: any) => {
      const questionId = `question-${question.id}`;
      if (selectedAnswers[questionId] === question.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">All Quiz Questions</h1>
            <p className="text-gray-600 mt-1">
              {allQuizQuestions.length} quiz questions across all study sets
            </p>
          </div>
          {allQuizQuestions.length > 0 && (
            <div className="flex gap-2">
              {!showAnswers ? (
                <Button onClick={() => setShowAnswers(true)}>
                  Show Answers
                </Button>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="text-lg font-semibold">
                    Score: {calculateScore()}/{allQuizQuestions.length}
                    <span className="text-sm text-gray-500 ml-2">
                      ({Math.round((calculateScore() / allQuizQuestions.length) * 100)}%)
                    </span>
                  </div>
                  <Button variant="outline" onClick={resetQuiz}>
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {allQuizQuestions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No quiz questions found</h3>
              <p className="text-gray-500 mb-4">
                Upload some documents and generate quiz questions to get started.
              </p>
              <Link href="/">
                <Button>Go to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {allQuizQuestions.map((question: any, index: number) => {
              const questionId = `question-${question.id}`;
              const selectedAnswer = selectedAnswers[questionId];
              const isCorrect = selectedAnswer === question.correctAnswer;
              
              return (
                <Card key={question.id} className="border border-gray-200">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {question.studySetTitle}
                          </Badge>
                          <span className="text-sm text-gray-500">Question {index + 1}</span>
                        </div>
                        <CardTitle className="text-lg">{question.question}</CardTitle>
                      </div>
                      {showAnswers && (
                        <Badge 
                          variant={isCorrect ? "default" : "destructive"}
                          className="ml-4"
                        >
                          {isCorrect ? "Correct" : "Incorrect"}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {question.options.map((option: string, optionIndex: number) => {
                        const isSelected = selectedAnswer === optionIndex;
                        const isCorrectOption = optionIndex === question.correctAnswer;
                        
                        let buttonClass = "w-full text-left justify-start h-auto p-3 ";
                        
                        if (showAnswers) {
                          if (isCorrectOption) {
                            buttonClass += "bg-green-100 border-green-300 text-green-800 hover:bg-green-100";
                          } else if (isSelected && !isCorrectOption) {
                            buttonClass += "bg-red-100 border-red-300 text-red-800 hover:bg-red-100";
                          } else {
                            buttonClass += "bg-gray-50 text-gray-600 hover:bg-gray-50";
                          }
                        } else {
                          if (isSelected) {
                            buttonClass += "bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200";
                          } else {
                            buttonClass += "bg-white hover:bg-gray-50";
                          }
                        }
                        
                        return (
                          <Button
                            key={optionIndex}
                            variant="outline"
                            className={buttonClass}
                            onClick={() => handleAnswerSelect(questionId, optionIndex)}
                            disabled={showAnswers}
                          >
                            <span className="font-medium mr-2">
                              {String.fromCharCode(65 + optionIndex)}.
                            </span>
                            {option}
                          </Button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}