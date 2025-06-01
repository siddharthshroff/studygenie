import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";

export default function AllFlashcards() {
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());

  const { data: studySets, isLoading } = useQuery({
    queryKey: ["/api/study-sets"],
  });

  const toggleFlippedCard = (cardId: string) => {
    const newFlipped = new Set(flippedCards);
    if (newFlipped.has(cardId)) {
      newFlipped.delete(cardId);
    } else {
      newFlipped.add(cardId);
    }
    setFlippedCards(newFlipped);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading flashcards...</div>
      </div>
    );
  }

  const allFlashcards = studySets ? studySets.reduce((acc: any[], studySet: any) => {
    if (studySet.flashcards && Array.isArray(studySet.flashcards)) {
      const flashcardsWithStudySet = studySet.flashcards.map((flashcard: any) => ({
        ...flashcard,
        studySetTitle: studySet.title
      }));
      return [...acc, ...flashcardsWithStudySet];
    }
    return acc;
  }, []) : [];

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
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Flashcards</h1>
            <p className="text-gray-600 mt-1">
              {allFlashcards.length} flashcards across all study sets
            </p>
          </div>
        </div>

        {allFlashcards.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No flashcards found</h3>
              <p className="text-gray-500 mb-4">
                Upload some documents and generate flashcards to get started.
              </p>
              <Link href="/">
                <Button>Go to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {allFlashcards.map((flashcard: any) => {
              const cardId = `flashcard-${flashcard.id}`;
              const isFlipped = flippedCards.has(cardId);
              
              return (
                <div 
                  key={flashcard.id}
                  className="relative h-48 cursor-pointer perspective-1000"
                  onClick={() => toggleFlippedCard(cardId)}
                >
                  <div className={`absolute inset-0 w-full h-full transition-transform duration-600 transform-style-preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                    {/* Front of card - Question */}
                    <div className="absolute inset-0 w-full h-full bg-white border-2 border-blue-200 rounded-lg p-4 backface-hidden flex flex-col">
                      <div className="flex justify-between items-start mb-3">
                        <Badge variant="secondary" className="text-xs">
                          {flashcard.studySetTitle}
                        </Badge>
                        <div className="text-xs text-blue-600 font-semibold">QUESTION</div>
                      </div>
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-sm font-medium text-gray-900 text-center">
                          {flashcard.question}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 text-center">Click to reveal answer</div>
                    </div>
                    
                    {/* Back of card - Answer */}
                    <div className="absolute inset-0 w-full h-full bg-blue-50 border-2 border-blue-300 rounded-lg p-4 backface-hidden rotate-y-180 flex flex-col">
                      <div className="flex justify-between items-start mb-3">
                        <Badge variant="secondary" className="text-xs">
                          {flashcard.studySetTitle}
                        </Badge>
                        <div className="text-xs text-blue-600 font-semibold">ANSWER</div>
                      </div>
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-sm text-gray-700 text-center">
                          {flashcard.answer}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 text-center">Click to see question</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}