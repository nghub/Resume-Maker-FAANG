import React, { useEffect, useState } from 'react';
import { CheckCircle2, Search, Cpu, FileText, Database, Zap } from 'lucide-react';

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
    const duration = 10000; // Total estimated time 10s
    const intervalTime = 100;
    const stepsCount = duration / intervalTime;
    let currentStepCount = 0;

    const timer = setInterval(() => {
      currentStepCount++;
      const newProgress = Math.min(Math.round((currentStepCount / stepsCount) * 95), 99); // Cap at 99% until done
      setProgress(newProgress);
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  // Step transition
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = steps[currentStep].icon;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }}></div>
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl px-8 flex flex-col items-center">
        
        {/* Central Scanner Animation */}
        <div className="relative mb-12">
          {/* Outer Rings */}
          <div className="absolute inset-0 rounded-full border border-indigo-500/30 animate-[spin_10s_linear_infinite]"></div>
          <div className="absolute -inset-4 rounded-full border border-indigo-400/10 animate-[spin_15s_linear_infinite_reverse]"></div>
          
          {/* Pulsing Core */}
          <div className="w-32 h-32 bg-slate-800 rounded-full border-2 border-indigo-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)] relative overflow-hidden">
            
            {/* Scanning Beam */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent h-full w-full animate-[scan_2s_linear_infinite]"></div>
            
            <div className="relative flex flex-col items-center">
              <CurrentIcon className="w-8 h-8 text-indigo-400 animate-in zoom-in duration-500 mb-1" key={currentStep} />
              <span className="text-2xl font-bold text-white tracking-tighter">{progress}%</span>
            </div>
          </div>
          
          {/* Orbiting Particle */}
          <div className="absolute inset-0 animate-[spin_3s_linear_infinite]">
             <div className="h-3 w-3 bg-emerald-400 rounded-full shadow-[0_0_10px_#34d399] absolute -top-1.5 left-1/2 -translate-x-1/2"></div>
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-8 w-full max-w-md">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">FAANG Resume IQ</h2>
            <p className="text-indigo-300/80 text-sm">FAANG Resume IQ is processing your data</p>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-6">
             <div 
               className="h-full bg-indigo-500 shadow-[0_0_10px_#6366f1] transition-all duration-300 ease-out"
               style={{ width: `${progress}%` }}
             />
          </div>

          {/* Steps List */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className={`flex items-center gap-4 transition-all duration-700 ease-out ${
                  index <= currentStep ? 'opacity-100 translate-x-0' : 'opacity-30 translate-x-4'
                }`}
              >
                <div className="shrink-0">
                  {index < currentStep ? (
                    <div className="bg-emerald-500/20 p-1 rounded-full animate-in zoom-in duration-300">
                       <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                  ) : index === currentStep ? (
                    <div className="w-7 h-7 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                  ) : (
                    <div className="w-7 h-7 rounded-full border-2 border-slate-700" />
                  )}
                </div>
                <span className={`text-base tracking-wide ${index === currentStep ? 'text-white font-medium' : 'text-slate-400'}`}>
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
          100% { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;