import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { SlidePreview as SlidePreviewType } from '../types';

interface SlidePreviewProps {
  slides: SlidePreviewType[];
}

export const SlidePreview: React.FC<SlidePreviewProps> = ({ slides }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showNotes, setShowNotes] = useState(false);

  if (slides.length === 0) return null;

  const slide = slides[currentSlide];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevSlide}
          disabled={slides.length <= 1}
          className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium text-gray-600">
          {currentSlide + 1} of {slides.length}
        </span>
        <button
          onClick={nextSlide}
          disabled={slides.length <= 1}
          className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Slide Content */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 min-h-[200px]">
        <h3 className="font-bold text-lg text-gray-900 mb-3">
          {slide.title}
        </h3>
        <ul className="space-y-2">
          {slide.content.map((item, index) => (
            <li key={index} className="flex items-start">
              <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span className="text-gray-700 text-sm">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Speaker Notes */}
      {slide.speakerNotes && (
        <div>
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="flex items-center text-sm text-gray-600 hover:text-gray-800"
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            {showNotes ? 'Hide' : 'Show'} Speaker Notes
          </button>
          {showNotes && (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">{slide.speakerNotes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};