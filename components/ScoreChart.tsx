
import React from 'react';

interface ScoreChartProps {
  overallScore: number;
  projectedScore?: number;
}

const ScoreChart: React.FC<ScoreChartProps> = ({ overallScore, projectedScore = 95 }) => {
  const strokeWidth = 8;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (overallScore / 100) * circumference;
  
  // Calculate offset for potential score
  const potentialOffset = circumference - (projectedScore / 100) * circumference;

  const getColor = (score: number) => {
    if (score >= 90) return '#10b981'; // emerald-500
    if (score >= 70) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
  };

  const color = getColor(overallScore);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
      <div className="relative w-32 h-32">
        {/* Added viewBox to ensure the SVG scales correctly within the container without clipping */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
          {/* Background Track */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-slate-100 dark:text-slate-700"
          />
          
          {/* Projected/Potential Score (Ghost) */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={potentialOffset}
            strokeLinecap="round"
            className="opacity-50 text-slate-200 dark:text-slate-600"
          />

          {/* Current Score */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-slate-800 dark:text-slate-100">{overallScore}</span>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase mt-1">Score</span>
        </div>
      </div>
      
      <div className="mt-4 w-full space-y-2">
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
           <span>Current: {overallScore}</span>
           <span className="text-indigo-600 dark:text-indigo-400">Potential: {projectedScore}</span>
        </div>
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden relative">
           {/* Potential Bar */}
           <div 
              className="absolute h-full rounded-full bg-indigo-100 dark:bg-indigo-900/50"
              style={{ width: `${projectedScore}%` }}
           />
           {/* Current Bar */}
           <div 
              className="absolute h-full rounded-full transition-all duration-1000 z-10"
              style={{ width: `${overallScore}%`, backgroundColor: color }}
           />
        </div>
        <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 mt-1">
          Fix issues to reach {projectedScore}
        </p>
      </div>
    </div>
  );
};

export default ScoreChart;
