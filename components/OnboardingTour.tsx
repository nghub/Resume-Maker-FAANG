
import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Check, HelpCircle } from 'lucide-react';

const OnboardingTour: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('ats_optima_tour_seen');
    if (!hasSeenTour) {
      // Small delay to allow app to load
      setTimeout(() => setIsOpen(true), 1000);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('ats_optima_tour_seen', 'true');
  };

  const steps = [
    {
      title: "Welcome to FAANG Resume IQ",
      content: "Your AI-powered assistant to optimize resumes for Applicant Tracking Systems.",
    },
    {
      title: "Step 1: Upload",
      content: "Paste or upload both the Job Description and your Resume to start the analysis.",
    },
    {
      title: "Step 2: Analyze",
      content: "We'll score your resume against the JD, identify critical keywords, and find gaps.",
    },
    {
      title: "Step 3: Optimize",
      content: "Use the Resume Rewriter and chat with the ATS Copilot to fix issues instantly and reach a 95%+ score.",
    }
  ];

  if (!isOpen) {
      return (
          <button 
            onClick={() => { setIsOpen(true); setStep(0); }}
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium flex items-center gap-1.5"
          >
            <HelpCircle className="w-4 h-4" />
            Take a tour
          </button>
      );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 relative border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200 transition-colors">
        <button 
            onClick={handleClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
        >
            <X className="w-5 h-5" />
        </button>

        <div className="mb-8">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-6 text-indigo-600 dark:text-indigo-400 font-bold text-xl shadow-sm border border-indigo-200 dark:border-indigo-800">
                {step + 1}
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{steps[step].title}</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{steps[step].content}</p>
        </div>

        <div className="flex items-center justify-between mt-8">
            <div className="flex gap-2">
                {steps.map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === step ? 'bg-indigo-600 dark:bg-indigo-500 w-6' : 'bg-slate-200 dark:bg-slate-700'}`} />
                ))}
            </div>
            
            <button
                onClick={() => {
                    if (step < steps.length - 1) {
                        setStep(step + 1);
                    } else {
                        handleClose();
                    }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-indigo-500/30 active:scale-95"
            >
                {step < steps.length - 1 ? (
                    <>Next <ArrowRight className="w-4 h-4" /></>
                ) : (
                    <>Get Started <Check className="w-4 h-4" /></>
                )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
