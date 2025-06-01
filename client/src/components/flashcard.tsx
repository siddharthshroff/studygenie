import { useState } from "react";
import type { Flashcard as FlashcardType } from "@shared/schema";

interface FlashcardProps {
  flashcard: FlashcardType;
  onEdit?: (flashcard: FlashcardType) => void;
  onDelete?: (id: number) => void;
}

export function Flashcard({ flashcard, onEdit, onDelete }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(flashcard);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(flashcard.id);
  };

  return (
    <div className="perspective-1000">
      <div 
        className={`relative w-full h-48 cursor-pointer transition-transform duration-500 transform-style-preserve-3d ${
          isFlipped ? "rotate-y-180" : ""
        }`}
        onClick={handleFlip}
      >
        {/* Front of card */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl shadow-lg p-6 flex flex-col justify-between backface-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-primary-100 bg-primary-600 px-2 py-1 rounded">Question</span>
            <div className="flex space-x-2">
              {onEdit && (
                <button
                  onClick={handleEdit}
                  className="p-1 text-primary-100 hover:text-white transition-colors"
                >
                  <i className="fas fa-edit text-sm"></i>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="p-1 text-primary-100 hover:text-red-200 transition-colors"
                >
                  <i className="fas fa-trash text-sm"></i>
                </button>
              )}
            </div>
          </div>
          
          <div className="flex-1 flex items-center justify-center">
            <p className="text-white font-medium text-center leading-relaxed">{flashcard.question}</p>
          </div>
          
          <div className="text-center">
            <span className="text-xs text-primary-100">Click to reveal answer</span>
          </div>
        </div>
        
        {/* Back of card */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-secondary-500 to-secondary-700 rounded-xl shadow-lg p-6 flex flex-col justify-between backface-hidden rotate-y-180">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-secondary-100 bg-secondary-600 px-2 py-1 rounded">Answer</span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleFlip();
              }}
              className="p-1 text-secondary-100 hover:text-white transition-colors"
            >
              <i className="fas fa-undo text-sm"></i>
            </button>
          </div>
          
          <div className="flex-1 flex items-center justify-center">
            <p className="text-white text-center leading-relaxed">{flashcard.answer}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
