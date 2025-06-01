import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FlashcardGrid } from "./flashcard-grid";
import { QuizView } from "./quiz-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

interface UploadedFile {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  status: string;
  uploadedAt: string;
}

interface FileHistoryProps {
  onSelectFile?: (fileId: number) => void;
}

export function FileHistory({ onSelectFile }: FileHistoryProps) {
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["/api/files"],
  });

  const { data: flashcards = [] } = useQuery({
    queryKey: ["/api/flashcards", selectedFileId],
    enabled: !!selectedFileId,
  });

  const { data: quizQuestions = [] } = useQuery({
    queryKey: ["/api/quiz-questions", selectedFileId], 
    enabled: !!selectedFileId,
  });

  const handleFileSelect = (fileId: number) => {
    setSelectedFileId(fileId);
    onSelectFile?.(fileId);
  };

  const handleGenerateContent = async (fileId: number) => {
    try {
      const response = await fetch(`/api/generate/${fileId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // Refresh the flashcards and quiz questions
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to generate content:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Files</h3>
        <div className="grid gap-4">
          {files.map((file: UploadedFile) => (
            <Card key={file.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-900">
                    {file.originalName}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      file.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : file.status === 'error'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {file.status}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleFileSelect(file.id)}
                      variant={selectedFileId === file.id ? "default" : "outline"}
                    >
                      View Content
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerateContent(file.id)}
                    >
                      Generate
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{file.mimeType}</span>
                  <span>{format(new Date(file.uploadedAt), 'MMM d, yyyy HH:mm')}</span>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {files.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-upload text-4xl mb-4 text-gray-300"></i>
              <p>No files uploaded yet</p>
              <p className="text-sm">Upload a document to get started</p>
            </div>
          )}
        </div>
      </div>

      {selectedFileId && (flashcards.length > 0 || quizQuestions.length > 0) && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated Study Materials</h3>
          <Tabs defaultValue="flashcards" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="flashcards">
                Flashcards ({flashcards.length})
              </TabsTrigger>
              <TabsTrigger value="quiz">
                Quiz Questions ({quizQuestions.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="flashcards" className="space-y-4">
              {flashcards.length > 0 ? (
                <FlashcardGrid flashcards={flashcards} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No flashcards generated yet</p>
                  <p className="text-sm">Click "Generate" to create flashcards from this file</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="quiz" className="space-y-4">
              {quizQuestions.length > 0 ? (
                <QuizView questions={quizQuestions} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No quiz questions generated yet</p>
                  <p className="text-sm">Click "Generate" to create quiz questions from this file</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}