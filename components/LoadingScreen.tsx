import React, { useEffect, useState } from 'react';
import { CheckCircle2, Search, Cpu, FileText, Database, Zap } from 'lucide-react';
import SantaHat from './SantaHat';

const steps = [
  { text: "Parsing document structure...", icon: FileText },
  { text: "Extracting candidate profile...", icon: Search },
  { text: "Matching skills against JD...", icon: Database },
  { text: "Analyzing ATS keywords...", icon: Cpu },
  { text: "Calculating score impact...", icon: Zap },
];

const LoadingScreen: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  // Progress simulation
  useEffect(() => {
    const duration = 4000; // Accelerated duration for Gemini 3 performance
    const intervalTime = 50; // Faster tick for smoother animation
    const stepsCount = duration / intervalTime;
    let currentStepCount = 0;

    const timer = setInterval(() => {
      currentStepCount++;
      // Add easing for more natural loading feel
      const progressPercent = currentStepCount / stepsCount;
      // Ease-out cubic function: start fast, slow down at end
      const easedProgress = 1 - Math.pow(1 - progressPercent, 3);
      
      const newProgress = Math.min(Math.round(easedProgress * 98), 99);
      setProgress(newProgress);
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  // Step transition - synced roughly with progress
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 800); // Swifter step transitions (4000ms / 5 steps = 800ms)
    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = steps[currentStep].icon;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center overflow-hidden font-sans">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/5 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }}></div>
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl px-8 flex flex-col items-center">
        
        {/* Central Scanner Animation */}
        <div className="relative mb-16 scale-110">
          {/* Outer Rings - Slowed significantly */}
          <div className="absolute inset-0 rounded-full border border-indigo-500/20 animate-[spin_20s_linear_infinite]"></div>
          <div className="absolute -inset-4 rounded-full border border-indigo-400/5 animate-[spin_30s_linear_infinite_reverse]"></div>
          
          {/* Pulsing Core */}
          <div className="w-36 h-36 bg-slate-900/80 backdrop-blur-sm rounded-full border border-indigo-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.15)] relative overflow-hidden">
            
            {/* Scanning Beam - Slowed */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/10 to-transparent h-full w-full animate-[scan_3s_ease-in-out_infinite]"></div>
            
            <div className="relative flex flex-col items-center z-10">
              <CurrentIcon className="w-10 h-10 text-indigo-400 animate-in zoom-in fade-in duration-700 mb-2 drop-shadow-lg" key={currentStep} />
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-white tracking-tighter tabular-nums">{progress}</span>
                <span className="text-indigo-400/70 text-sm ml-0.5">%</span>
              </div>
            </div>
          </div>
          
          {/* Orbiting Particle - Slowed */}
          <div className="absolute inset-0 animate-[spin_8s_linear_infinite]">
             <div className="h-3 w-3 bg-emerald-400 rounded-full shadow-[0_0_15px_#34d399] absolute -top-1.5 left-1/2 -translate-x-1/2 border border-emerald-200/50"></div>
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-10 w-full max-w-md">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-extrabold text-white tracking-tight">
              <span className="relative inline-block">
                A
                <SantaHat className="absolute -top-[1.3rem] -left-[1.2rem] w-14 h-14 pointer-events-none animate-hat-wobble-once" />
              </span>
              pply IQ
            </h2>
            <p className="text-indigo-200/60 text-sm font-medium tracking-wide uppercase">AI Analysis in Progress</p>
          </div>

          {/* Enhanced Progress Bar */}
          <div className="relative">
            <div className="w-full h-2 bg-slate-800/50 rounded-full overflow-hidden border border-slate-700/50 backdrop-blur-sm">
              <div 
                className="h-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-300 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                {/* Shimmer effect on bar */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
              </div>
            </div>
            <div className="absolute top-4 right-0 text-xs font-mono text-indigo-300/50">
               {(4 - (progress / 100 * 4)).toFixed(1)}s remaining
            </div>
          </div>

          {/* Steps List */}
          <div className="space-y-5 pl-4">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className={`flex items-center gap-4 transition-all duration-700 ease-out ${
                  index <= currentStep ? 'opacity-100 translate-x-0' : 'opacity-20 translate-x-4 grayscale'
                }`}
              >
                <div className="shrink-0 relative">
                  {index < currentStep ? (
                    <div className="bg-emerald-500/10 p-1 rounded-full animate-in zoom-in duration-300 border border-emerald-500/20">
                       <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                  ) : index === currentStep ? (
                    <div className="relative">
                      <div className="w-7 h-7 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                      <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-md animate-pulse"></div>
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full border-2 border-slate-800 bg-slate-800/50" />
                  )}
                  
                  {/* Vertical connector line */}
                  {index < steps.length - 1 && (
                    <div className={`absolute top-8 left-1/2 -translate-x-1/2 w-0.5 h-6 -mb-4 ${
                      index < currentStep ? 'bg-indigo-500/30' : 'bg-slate-800'
                    }`} />
                  )}
                </div>
                <span className={`text-sm tracking-wide transition-colors duration-300 ${index === currentStep ? 'text-white font-medium scale-105 origin-left' : 'text-slate-400'}`}>
                  {step.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          50% { transform: translateY(100%); }
          50.1% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes hat-wobble {
          0% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-3px) rotate(-8deg); }
          75% { transform: translateY(-3px) rotate(8deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }
        .animate-hat-wobble-once {
          animation: hat-wobble 2s ease-in-out 1;
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;