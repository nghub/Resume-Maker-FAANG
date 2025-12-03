
import React, { useState, useMemo } from 'react';
import { AlertCircle, TrendingUp, Sparkles, ArrowRight, Copy, Check, X } from 'lucide-react';
import { Improvement } from '../types';

interface ImprovementCardProps {
  improvement: Improvement;
  onFix?: (improvement: Improvement) => void;
}

const ImprovementCard: React.FC<ImprovementCardProps> = ({ improvement, onFix }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const { hasExamples, intro, before, after, content } = useMemo(() => {
    let text = improvement.recommendation || "";
    
    // Normalize text to strip markdown bolding from keys if present
    text = text
      .replace(/\*\*(Before:?)\*\*/gi, 'Before:')
      .replace(/\*\*(After:?)\*\*/gi, 'After:')
      .replace(/__(Before:?)__/gi, 'Before:')
      .replace(/__(After:?)__/gi, 'After:');

    // Regex to capture: (Intro) Before: (Before Content) After: (After Content)
    // Improved regex to handle newlines better
    const regex = /([\s\S]*?)(?:\n|\s|^)Before:\s*([\s\S]*?)(?:\n|\s)After:\s*([\s\S]*)/i;
    const match = text.match(regex);

    if (match) {
      const cleanStr = (s: string) => s.trim().replace(/^['"]|['"]$/g, '').trim();
      return {
        hasExamples: true,
        intro: match[1].trim(),
        before: cleanStr(match[2]),
        after: cleanStr(match[3]),
        content: text
      };
    }
    return { hasExamples: false, content: text, intro: '', before: '', after: '' };
  }, [improvement.recommendation]);

  const handleFixClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFix) {
      onFix(improvement);
    }
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (after) {
      navigator.clipboard.writeText(after);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-200 group">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer relative"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Left side: Icon & Text */}
        <div className="flex items-center gap-4 flex-1 min-w-0 mr-4">
          <div className={`
            p-2.5 rounded-xl flex items-center justify-center shrink-0 transition-colors relative
            ${improvement.impact === 'High' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}
          `}>
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate pr-2">
              {improvement.title}
            </h4>
            <p className="text-sm text-slate-500 line-clamp-1">
              {hasExamples ? intro : improvement.recommendation}
            </p>
          </div>
        </div>
        
        {/* Right side: Boost & Action */}
        <div className="flex items-center gap-3 shrink-0">
           {/* Score Boost Badge */}
           {improvement.scoreBoost && (
             <div className="hidden sm:flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                <TrendingUp className="w-3.5 h-3.5" />
                +{improvement.scoreBoost} pts
             </div>
           )}

           {onFix && (
             <button 
               onClick={handleFixClick}
               className="
                 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-100 hover:border-indigo-600
                 px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-all shadow-sm
               "
             >
               <Sparkles className="w-3.5 h-3.5" />
               ASK AI
             </button>
           )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 pl-4 sm:pl-[4.5rem] animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="text-sm text-slate-700 bg-slate-50/50 p-5 rounded-xl border border-slate-200 leading-relaxed">
            
            {hasExamples ? (
              <div className="space-y-4">
                {intro && <p className="text-slate-600 leading-relaxed pb-2">{intro}</p>}
                
                <div className="grid grid-cols-1 gap-4">
                   {/* Original (Before) */}
                   <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-2">
                         <div className="bg-red-100 p-1 rounded-full">
                            <X className="w-3 h-3 text-red-600" />
                         </div>
                         <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Original</span>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-red-100 text-slate-500 text-sm relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-200 rounded-l-lg"></div>
                        {before}
                      </div>
                   </div>

                   {/* Recommended (After) */}
                   <div className="flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                         <div className="flex items-center gap-2">
                            <div className="bg-emerald-100 p-1 rounded-full">
                               <Check className="w-3 h-3 text-emerald-600" />
                            </div>
                            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Recommended Fix</span>
                         </div>
                         <button 
                           onClick={handleCopy}
                           className={`
                             flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-md transition-all active:scale-95 border shadow-sm
                             ${copied 
                               ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                               : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-700'}
                           `}
                           title="Copy recommendation"
                         >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copied ? 'Copied' : 'Copy'}
                         </button>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-emerald-200 text-slate-800 text-sm font-medium relative shadow-sm">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-lg"></div>
                        {after}
                      </div>
                   </div>
                </div>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none text-slate-600">
                <div className="flex items-center gap-2 mb-2">
                   <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recommendation</span>
                   {improvement.scoreBoost && (
                     <span className="sm:hidden text-xs font-bold text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded-full">
                       +{improvement.scoreBoost} pts
                     </span>
                   )}
                </div>
                <p className="whitespace-pre-wrap">{content}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImprovementCard;
