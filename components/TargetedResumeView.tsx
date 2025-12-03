import React, { useState } from 'react';
import { AnalysisResult, HistoryItem, Improvement } from '../types';
import { FileText, CheckCircle, AlertCircle, ArrowRight, RefreshCw, Trash2, Clock, ChevronRight, Star, Sparkles, FileUser, Briefcase, Copy, RotateCcw, Download, Zap, Building2, ListChecks } from 'lucide-react';
import MarkdownViewer from './MarkdownViewer';
import ScoreBreakdownChart from './ScoreBreakdownChart';
import KeywordDensity from './KeywordDensity';
import ImprovementCard from './ImprovementCard';

interface TargetedResumeViewProps {
  result: AnalysisResult;
  onReEvaluate: () => void;
  history: HistoryItem[];
  onLoadHistory: (item: HistoryItem) => void;
  onDeleteHistory: (id: string, e: React.MouseEvent) => void;
  onNavigateToRewriter: () => void;
  onAutoRewrite: () => void;
  onFixRequest: (improvement: Improvement) => void;
  jdText: string;
  resumeText: string;
}

const TargetedResumeView: React.FC<TargetedResumeViewProps> = ({
  result,
  onReEvaluate,
  history,
  onLoadHistory,
  onDeleteHistory,
  onNavigateToRewriter,
  onAutoRewrite,
  onFixRequest,
  jdText,
  resumeText
}) => {
  const [activeTab, setActiveTab] = useState<'resume' | 'jd'>('resume');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Separate Keywords
  const criticalKeywords = result.criticalKeywords.map(k => ({ name: k, found: true }));
  const missingKeywords = result.missingKeywords.map(k => ({ name: k, found: false }));

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (result.overallScore / 100) * circumference;
  
  // Potential Score (Projected)
  const projectedScore = result.projectedScore || 95;
  const potentialOffset = circumference - (projectedScore / 100) * circumference;

  const renderJdWithHighlights = (text: string) => {
    if (!text) return "Job Description not found.";
    
    const keywordsToHighlight = result.missingKeywords;
    if (!keywordsToHighlight || keywordsToHighlight.length === 0) return text;

    const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`\\b(${keywordsToHighlight.map(k => escapeRegExp(k)).join('|')})\\b`, 'gi');
    const parts = text.split(pattern);

    return parts.map((part, i) => {
       const isMatch = keywordsToHighlight.some(k => k.toLowerCase() === part.toLowerCase());
       if (isMatch) {
         return (
           <span key={i} className="bg-rose-100 text-rose-800 border border-rose-200 px-1 rounded font-medium" title="Missing Keyword">
             {part}
           </span>
         );
       }
       return part;
    });
  };

  const downloadResumeTxt = () => {
    if (!result.rewrittenResume) return;
    const blob = new Blob([result.rewrittenResume], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'optimized_resume.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
      {/* LEFT COLUMN - Score & Analysis */}
      <div className="xl:col-span-4 space-y-6">
        
        {/* Score Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative overflow-hidden">
          {/* Confirmation Overlay */}
          {showResetConfirm && (
            <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
               <div className="bg-indigo-50 p-3 rounded-full mb-3">
                  <RefreshCw className="w-6 h-6 text-indigo-600" />
               </div>
               <h4 className="font-bold text-slate-800 mb-1">Start New Scan?</h4>
               <p className="text-xs text-slate-500 mb-4 max-w-[200px]">Current results will be saved to history, but you'll need to re-upload files.</p>
               <div className="flex gap-2 w-full">
                  <button 
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={onReEvaluate}
                    className="flex-1 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-md shadow-indigo-200"
                  >
                    Confirm
                  </button>
               </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-50 p-1.5 rounded-lg">
                 <Sparkles className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase">Relevancy Score</span>
            </div>
            
            <button 
              onClick={() => setShowResetConfirm(true)}
              className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1.5 bg-slate-50 hover:bg-indigo-50 px-2.5 py-1.5 rounded-md transition-all border border-slate-100 hover:border-indigo-100"
              title="Start a new analysis"
            >
              <RotateCcw className="w-3 h-3" />
              Re-Evaluate
            </button>
          </div>

          <div className="flex flex-col items-center mb-6">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                <circle cx="64" cy="64" r="50" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                <circle
                  cx="64"
                  cy="64"
                  r="50"
                  stroke="#e2e8f0"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={potentialOffset}
                  strokeLinecap="round"
                  className="opacity-40"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="50"
                  stroke={result.overallScore >= 80 ? '#10b981' : result.overallScore >= 50 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold text-slate-800">{result.overallScore}</span>
                {result.projectedScore && (
                   <span className="text-[10px] text-indigo-500 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded-full mt-1">
                     Potential: {result.projectedScore}
                   </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-center mb-6">
            <h3 className="font-bold text-slate-800 mb-2">
              {result.overallScore >= 80 ? 'Great Match!' : 'Needs Improvement'}
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">
              {result.summary}
            </p>
          </div>

          <div className="space-y-3">
            <button 
              onClick={onNavigateToRewriter}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              Open Resume Rewriter
            </button>
          </div>
        </div>

        {/* Action Plan / Top Improvements */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
             <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-slate-600" />
                <h3 className="font-bold text-slate-800 text-sm">Prioritized Action Plan</h3>
             </div>
             <span className="text-xs font-medium text-slate-500">{result.improvements.length} items</span>
          </div>
          <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
             {result.improvements.map((imp) => (
                <ImprovementCard key={imp.id} improvement={imp} onFix={onFixRequest} />
             ))}
          </div>
        </div>

        {/* Company Culture Fit Card */}
        {result.cultureFit && (
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-2">
                   <Building2 className="w-4 h-4 text-slate-600" />
                   <h3 className="font-bold text-slate-800 text-sm">Company Culture Fit</h3>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                   result.cultureFit.alignmentScore >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                   {result.cultureFit.alignmentScore}% Aligned
                </span>
             </div>
             <div className="p-5">
                <div className="mb-3">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target: {result.cultureFit.companyName}</p>
                   <div className="flex flex-wrap gap-2">
                      {result.cultureFit.inferredValues.map((val, i) => (
                         <span key={i} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200 font-medium">
                            {val}
                         </span>
                      ))}
                   </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                   {result.cultureFit.analysis}
                </p>
             </div>
           </div>
        )}

        <ScoreBreakdownChart data={result.breakdown} />
        <KeywordDensity jdText={jdText} resumeText={resumeText} />

        {/* Keywords Analysis */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-sm">Keywords Analysis</h3>
            <span className="text-xs font-medium text-slate-500">{criticalKeywords.length + missingKeywords.length} total</span>
          </div>
          <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 font-medium">Keyword</th>
                  <th className="px-6 py-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Found Keywords */}
                {criticalKeywords.length > 0 && (
                  <>
                    <tr className="bg-emerald-50/30">
                      <td colSpan={2} className="px-6 py-2 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                        Matched Keywords ({criticalKeywords.length})
                      </td>
                    </tr>
                    {criticalKeywords.map((k, i) => (
                      <tr key={`found-${i}`} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-2.5 font-medium text-slate-700 flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          {k.name}
                        </td>
                        <td className="px-6 py-2.5 text-right">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                            FOUND
                          </span>
                        </td>
                      </tr>
                    ))}
                  </>
                )}

                {/* Missing Keywords */}
                {missingKeywords.length > 0 && (
                   <>
                    <tr className="bg-rose-50/30">
                      <td colSpan={2} className="px-6 py-2 text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                        Missing Keywords ({missingKeywords.length})
                      </td>
                    </tr>
                    {missingKeywords.map((k, i) => (
                      <tr key={`missing-${i}`} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-2.5 font-medium text-slate-700 flex items-center gap-2">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                          {k.name}
                        </td>
                        <td className="px-6 py-2.5 text-right">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                            MISSING
                          </span>
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN - Tabs & Preview */}
      <div className="xl:col-span-8 h-full flex flex-col min-h-[800px]">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden h-full">
          {/* Tabs Header */}
          <div className="flex items-center border-b border-slate-200 bg-slate-50 px-4 pt-4 gap-2 sticky top-0 z-10">
            <button
              onClick={() => setActiveTab('resume')}
              className={`
                px-6 py-3 text-sm font-bold rounded-t-lg flex items-center gap-2 transition-all relative top-[1px]
                ${activeTab === 'resume' 
                  ? 'bg-white text-indigo-600 border-t border-x border-slate-200 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 border-transparent'}
              `}
            >
              <FileUser className="w-4 h-4" />
              Your Resume
            </button>
            <button
              onClick={() => setActiveTab('jd')}
              className={`
                px-6 py-3 text-sm font-bold rounded-t-lg flex items-center gap-2 transition-all relative top-[1px]
                ${activeTab === 'jd' 
                  ? 'bg-white text-indigo-600 border-t border-x border-slate-200 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 border-transparent'}
              `}
            >
              <Briefcase className="w-4 h-4" />
              Job Description
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-8 overflow-y-auto bg-white h-full">
             {activeTab === 'resume' ? (
               <div className="max-w-3xl mx-auto relative">
                  <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center gap-3 text-sm text-indigo-900 justify-between">
                     <div className="flex items-center gap-3">
                       <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
                       <div>
                         <p className="font-bold mb-0.5">AI Optimized Resume Preview</p>
                         <p className="text-indigo-700/80 text-xs">
                           Keywords matched in <span className="bg-emerald-100 text-emerald-800 px-1 rounded border border-emerald-200 font-medium mx-0.5">Green</span> 
                           are found in your resume.
                         </p>
                       </div>
                     </div>
                     <div className="flex items-center gap-2">
                        <button 
                          onClick={onAutoRewrite}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-md text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Rewrite with AI
                        </button>
                        <button 
                            onClick={downloadResumeTxt}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-indigo-200 rounded-md text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm"
                            title="Download as .txt"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Download
                        </button>
                     </div>
                  </div>
                  <MarkdownViewer 
                    content={result.rewrittenResume || "No resume content available."} 
                    highlightKeys={result.criticalKeywords} 
                  />
               </div>
             ) : (
               <div className="prose prose-slate max-w-none prose-sm">
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="text-slate-900 font-bold m-0">Job Description</h3>
                     <div className="text-xs text-rose-600 font-medium bg-rose-50 px-2 py-1 rounded border border-rose-100">
                        Missing keywords highlighted in red
                     </div>
                  </div>
                  <div className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed">
                    {renderJdWithHighlights(jdText)}
                  </div>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TargetedResumeView;