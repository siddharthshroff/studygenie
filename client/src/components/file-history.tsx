import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, FileText, Calendar, Eye, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { AddContentDialog } from "./add-content-dialog";
import type { UploadedFile, StudySet, Flashcard, QuizQuestion } from "@shared/schema";

interface FileWithStudySet extends UploadedFile {
  studySet?: StudySet & {
    flashcards: Flashcard[];
    quizQuestions: QuizQuestion[];
  };
}

export function FileHistory() {
  const [expandedFiles, setExpandedFiles] = useState<Set<number>>(new Set());
  const [showAllFlashcards, setShowAllFlashcards] = useState<Set<number>>(new Set());
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showAnswers, setShowAnswers] = useState<Set<number>>(new Set());
  const [showAllQuestions, setShowAllQuestions] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const { data: files = [], isLoading } = useQuery<FileWithStudySet[]>({
    queryKey: ['/api/files']
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: number) => {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete file");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "File deleted",
        description: "File and associated study materials have been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete file",
        variant: "destructive",
      });
    },
  });

  const toggleExpanded = (fileId: number) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(fileId)) {
      newExpanded.delete(fileId);
    } else {
      newExpanded.add(fileId);
    }
    setExpandedFiles(newExpanded);
  };

  const toggleShowAllFlashcards = (fileId: number) => {
    const newShowAll = new Set(showAllFlashcards);
    if (newShowAll.has(fileId)) {
      newShowAll.delete(fileId);
    } else {
      newShowAll.add(fileId);
    }
    setShowAllFlashcards(newShowAll);
  };

  const toggleFlippedCard = (cardId: string) => {
    const newFlipped = new Set(flippedCards);
    if (newFlipped.has(cardId)) {
      newFlipped.delete(cardId);
    } else {
      newFlipped.add(cardId);
    }
    setFlippedCards(newFlipped);
  };

  const selectAnswer = (questionId: string, answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const toggleShowAnswers = (fileId: number) => {
    const newShowAnswers = new Set(showAnswers);
    if (newShowAnswers.has(fileId)) {
      newShowAnswers.delete(fileId);
    } else {
      newShowAnswers.add(fileId);
    }
    setShowAnswers(newShowAnswers);
  };

  const toggleShowAllQuestions = (fileId: number) => {
    const newShowAllQuestions = new Set(showAllQuestions);
    if (newShowAllQuestions.has(fileId)) {
      newShowAllQuestions.delete(fileId);
    } else {
      newShowAllQuestions.add(fileId);
    }
    setShowAllQuestions(newShowAllQuestions);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('text')) return '📄';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📊';
    return '📄';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">File History</h2>
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 h-24 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No files uploaded yet</h3>
        <p className="text-gray-500 mb-4">Upload your first document to start creating study materials</p>
        <Button variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Upload a file
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full max-h-screen overflow-hidden">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">File History</h2>
        <Badge variant="secondary">{files.length} files</Badge>
      </div>

      <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-280px)] pr-2 pb-8">
        {files.map((file) => (
          <Card key={file.id} className="border border-gray-200">
            <Collapsible>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getFileIcon(file.mimeType)}</span>
                      <div>
                        <CardTitle className="text-base">{file.originalName}</CardTitle>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-gray-500 flex items-center">
                            <Calendar className="mr-1 h-3 w-3" />
                            {new Date(file.uploadedAt).toLocaleDateString()}
                          </span>
                          <Badge className={getStatusColor(file.status)} variant="secondary">
                            {file.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {file.studySet && (
                        <div className="text-right text-sm text-gray-500">
                          <div>{file.studySet.flashcards?.length || 0} flashcards</div>
                          <div>{file.studySet.quizQuestions?.length || 0} quiz questions</div>
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFileMutation.mutate(file.id);
                        }}
                        disabled={deleteFileMutation.isPending}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="pt-0">
                  {file.studySet ? (
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h4 className="font-medium text-gray-900 mb-1">{file.studySet.title}</h4>
                        <p className="text-sm text-gray-600">{file.studySet.description}</p>
                      </div>

                      {(file.studySet.flashcards?.length > 0 || file.studySet.quizQuestions?.length > 0) && (
                        <Tabs defaultValue="flashcards" className="w-full">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="flashcards">
                              Flashcards ({file.studySet.flashcards?.length || 0})
                            </TabsTrigger>
                            <TabsTrigger value="quiz">
                              Quiz ({file.studySet.quizQuestions?.length || 0})
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="flashcards" className="mt-4">
                            <div className="flex justify-between items-center mb-4">
                              <span className="text-sm text-gray-600">
                                {file.studySet.flashcards?.length || 0} flashcards
                              </span>
                              <AddContentDialog
                                studySetId={file.studySet.id}
                                type="flashcard"
                                trigger={
                                  <Button variant="outline" size="sm">
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Flashcard
                                  </Button>
                                }
                              />
                            </div>
                            {file.studySet.flashcards && file.studySet.flashcards.length > 0 ? (
                              <div className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                  {(showAllFlashcards.has(file.id) 
                                    ? file.studySet.flashcards 
                                    : file.studySet.flashcards.slice(0, 4)
                                  ).map((flashcard: any) => {
                                    const cardId = `${file.id}-${flashcard.id}`;
                                    const isFlipped = flippedCards.has(cardId);
                                    
                                    return (
                                      <div 
                                        key={flashcard.id} 
                                        className="relative h-32 cursor-pointer perspective-1000"
                                        onClick={() => toggleFlippedCard(cardId)}
                                      >
                                        <div className={`absolute inset-0 w-full h-full transition-transform duration-600 transform-style-preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                                          {/* Front of card - Question */}
                                          <div className="absolute inset-0 w-full h-full bg-white border-2 border-blue-200 rounded-lg p-4 backface-hidden flex flex-col justify-center">
                                            <div className="text-xs text-blue-600 mb-2 font-semibold">QUESTION</div>
                                            <div className="text-sm font-medium text-gray-900 text-center">
                                              {flashcard.question}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-2 text-center">Click to reveal answer</div>
                                          </div>
                                          
                                          {/* Back of card - Answer */}
                                          <div className="absolute inset-0 w-full h-full bg-blue-50 border-2 border-blue-300 rounded-lg p-4 backface-hidden rotate-y-180 flex flex-col justify-center">
                                            <div className="text-xs text-blue-600 mb-2 font-semibold">ANSWER</div>
                                            <div className="text-sm text-gray-700 text-center">
                                              {flashcard.answer}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-2 text-center">Click to see question</div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                
                                {file.studySet.flashcards.length > 4 && (
                                  <div className="text-center">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => toggleShowAllFlashcards(file.id)}
                                    >
                                      {showAllFlashcards.has(file.id) 
                                        ? 'Show fewer flashcards' 
                                        : `+${file.studySet.flashcards.length - 4} more flashcards`
                                      }
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-center py-4">No flashcards available</p>
                            )}
                          </TabsContent>

                          <TabsContent value="quiz" className="mt-4">
                            <div className="flex justify-between items-center mb-4">
                              <span className="text-sm text-gray-600">
                                {file.studySet.quizQuestions?.length || 0} quiz questions
                              </span>
                              <AddContentDialog
                                studySetId={file.studySet.id}
                                type="quiz"
                                trigger={
                                  <Button variant="outline" size="sm">
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Quiz Question
                                  </Button>
                                }
                              />
                            </div>
                            {file.studySet.quizQuestions && file.studySet.quizQuestions.length > 0 ? (
                              <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                  <div className="text-sm text-gray-600">
                                    Answer the questions below and click "Show Answers" to see results
                                  </div>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => toggleShowAnswers(file.id)}
                                  >
                                    {showAnswers.has(file.id) ? 'Hide Answers' : 'Show Answers'}
                                  </Button>
                                </div>
                                
                                {(showAllQuestions.has(file.id) ? file.studySet.quizQuestions : file.studySet.quizQuestions.slice(0, 3)).map((question, index) => {
                                  const questionId = `${file.id}-${question.id}`;
                                  const selectedAnswer = selectedAnswers[questionId];
                                  const showAnswer = showAnswers.has(file.id);
                                  
                                  return (
                                    <div key={question.id} className="bg-white border rounded-lg p-4">
                                      <div className="font-medium text-sm mb-3">
                                        {index + 1}. {question.question}
                                      </div>
                                      <div className="space-y-2">
                                        {question.options.map((option, optionIndex) => {
                                          const isSelected = selectedAnswer === optionIndex;
                                          const isCorrect = optionIndex === question.correctAnswer;
                                          const isWrong = showAnswer && isSelected && !isCorrect;
                                          
                                          let optionClass = 'text-sm p-3 rounded border cursor-pointer transition-colors ';
                                          
                                          if (showAnswer) {
                                            if (isCorrect) {
                                              optionClass += 'bg-green-50 border-green-200 text-green-800 font-medium';
                                            } else if (isWrong) {
                                              optionClass += 'bg-red-50 border-red-200 text-red-800';
                                            } else {
                                              optionClass += 'bg-gray-50 border-gray-200 text-gray-600';
                                            }
                                          } else {
                                            if (isSelected) {
                                              optionClass += 'bg-blue-50 border-blue-200 text-blue-800 font-medium';
                                            } else {
                                              optionClass += 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100';
                                            }
                                          }
                                          
                                          return (
                                            <div 
                                              key={optionIndex}
                                              className={optionClass}
                                              onClick={() => !showAnswer && selectAnswer(questionId, optionIndex)}
                                            >
                                              <span className="font-medium mr-2">
                                                {String.fromCharCode(65 + optionIndex)}.
                                              </span>
                                              {option}
                                              {showAnswer && isCorrect && (
                                                <span className="ml-2 text-green-600">✓</span>
                                              )}
                                              {showAnswer && isWrong && (
                                                <span className="ml-2 text-red-600">✗</span>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                                
                                {file.studySet.quizQuestions.length > 3 && (
                                  <div className="text-center">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => toggleShowAllQuestions(file.id)}
                                    >
                                      {showAllQuestions.has(file.id) 
                                        ? 'Show fewer questions' 
                                        : `+${file.studySet.quizQuestions.length - 3} more questions`
                                      }
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-center py-4">No quiz questions available</p>
                            )}
                          </TabsContent>
                        </Tabs>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500 mb-2">No study materials generated yet</p>
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        Generate Study Materials
                      </Button>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>
    </div>
  );
}