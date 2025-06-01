import { useState } from "react";
import { FileUploader } from "@/components/file-uploader";
import { FlashcardGrid } from "@/components/flashcard-grid";
import { QuizView } from "@/components/quiz-view";
import { SaveDialog } from "@/components/save-dialog";
import { FileHistory } from "@/components/file-history";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStudySets } from "@/hooks/use-study-sets";
import type { AIGeneratedContent } from "@/lib/types";

export default function Dashboard() {
  const [generatedContent, setGeneratedContent] = useState<AIGeneratedContent | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const { data: studySets = [], isLoading } = useStudySets();

  const handleContentGenerated = (content: AIGeneratedContent) => {
    setGeneratedContent(content);
  };

  const handleSave = () => {
    setShowSaveDialog(true);
  };

  const handleSaved = () => {
    setShowSaveDialog(false);
    setGeneratedContent(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to StudySpark
          </h1>
          <p className="text-gray-600">
            Transform your documents into interactive study materials with AI
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Study Sets</p>
                <p className="text-2xl font-bold text-gray-900">{studySets.length}</p>
                <p className="text-xs text-green-600 mt-1">
                  <span>+{studySets.filter(s => new Date(s.createdAt) > new Date(Date.now() - 7*24*60*60*1000)).length}</span> this week
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <i className="fas fa-book text-primary-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Flashcards</p>
                <p className="text-2xl font-bold text-gray-900">
                  {studySets.reduce((acc, set) => acc + (set.flashcardCount || 0), 0)}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  <span>+12</span> this week
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <i className="fas fa-layer-group text-blue-600 text-xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Study Time</p>
                <p className="text-2xl font-bold text-gray-900">4.2h</p>
                <p className="text-xs text-purple-600 mt-1">
                  <span>+2.3h</span> this week
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <i className="fas fa-clock text-purple-600 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <Tabs defaultValue="upload" className="w-full">
            <div className="border-b border-gray-200 px-6 pt-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">Upload & Generate</TabsTrigger>
                <TabsTrigger value="history">File History</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="upload" className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upload Section */}
                <FileUploader onContentGenerated={handleContentGenerated} />

                {/* Recent Activity */}
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                    <i className="fas fa-history text-secondary-600 mr-3"></i>
                    Recent Activity
                  </h3>
                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse flex space-x-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : studySets.length === 0 ? (
                    <div className="text-center py-8">
                      <i className="fas fa-upload text-4xl text-gray-300 mb-4"></i>
                      <p className="text-gray-500">No study sets yet. Upload your first file to get started!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {studySets.slice(0, 3).map((studySet) => (
                        <div key={studySet.id} className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-plus text-primary-600 text-sm"></i>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              Created "{studySet.title}" study set
                            </p>
                            <p className="text-xs text-gray-500">{studySet.description}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(studySet.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="history" className="p-6">
              <FileHistory />
            </TabsContent>
          </Tabs>
        </div>

        {/* AI Generation Section */}
        {generatedContent && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <i className="fas fa-magic text-purple-600 mr-3"></i>
                    AI-Generated Study Content
                  </h3>
                  <p className="text-gray-600 mt-1">Review and edit your AI-generated flashcards and quizzes</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" onClick={() => setGeneratedContent(null)}>
                    <i className="fas fa-sync-alt mr-2"></i>
                    Regenerate
                  </Button>
                  <Button onClick={handleSave}>
                    <i className="fas fa-save mr-2"></i>
                    Save Set
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <Tabs defaultValue="flashcards" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="flashcards">
                    Flashcards ({generatedContent.flashcards.length})
                  </TabsTrigger>
                  <TabsTrigger value="quiz">
                    Quiz ({generatedContent.quizQuestions.length} questions)
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="flashcards" className="mt-6">
                  <FlashcardGrid 
                    flashcards={generatedContent.flashcards}
                    isGenerated={true}
                  />
                </TabsContent>
                
                <TabsContent value="quiz" className="mt-6">
                  <QuizView 
                    questions={generatedContent.quizQuestions}
                    isGenerated={true}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>

      {/* Save Dialog */}
      {showSaveDialog && generatedContent && (
        <SaveDialog
          content={generatedContent}
          onClose={() => setShowSaveDialog(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}