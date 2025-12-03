
import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, X } from 'lucide-react';

const FeedbackWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = (type: 'like' | 'dislike') => {
    setFeedback(type);
    setSubmitted(true);
    setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setFeedback(null);
    }, 3000);
  };

  if (!isOpen && !submitted) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="text-[10px] font-medium text-slate-400 hover:text-indigo-600 transition-colors underline decoration-slate-300 hover:decoration-indigo-300"
      >
        Rate Analysis
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
      {submitted ? (
        <span className="text-xs text-emerald-600 font-medium px-2">Thanks for your feedback!</span>
      ) : (
        <>
          <span className="text-[10px] text-slate-500 font-medium mr-1">Helpful?</span>
          <button 
            onClick={() => handleFeedback('like')}
            className="p-1 rounded-full hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => handleFeedback('dislike')}
            className="p-1 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setIsOpen(false)} className="text-slate-300 hover:text-slate-500 ml-1">
            <X className="w-3 h-3" />
          </button>
        </>
      )}
    </div>
  );
};

export default FeedbackWidget;
