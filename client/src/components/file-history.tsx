import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, FileText, Calendar, Eye } from "lucide-react";
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

  const { data: files = [], isLoading } = useQuery<FileWithStudySet[]>({
    queryKey: ['/api/files']
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
                            {file.studySet.quizQuestions && file.studySet.quizQuestions.length > 0 ? (
                              <div className="space-y-4">
                                {file.studySet.quizQuestions.slice(0, 3).map((question, index) => (
                                  <div key={question.id} className="bg-white border rounded-lg p-4">
                                    <div className="font-medium text-sm mb-3">
                                      {index + 1}. {question.question}
                                    </div>
                                    <div className="space-y-1">
                                      {question.options.map((option, optionIndex) => (
                                        <div 
                                          key={optionIndex}
                                          className={`text-sm p-2 rounded ${
                                            optionIndex === question.correctAnswer 
                                              ? 'bg-green-50 text-green-800 font-medium' 
                                              : 'bg-gray-50 text-gray-600'
                                          }`}
                                        >
                                          {String.fromCharCode(65 + optionIndex)}. {option}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                                {file.studySet.quizQuestions.length > 3 && (
                                  <div className="text-center py-2 text-sm text-gray-500">
                                    +{file.studySet.quizQuestions.length - 3} more questions
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