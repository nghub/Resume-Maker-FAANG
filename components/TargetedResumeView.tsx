import React, { useState, useEffect, useRef } from 'react';
import { AnalysisResult, HistoryItem, Improvement } from '../types';
import { CheckCircle, AlertCircle, RefreshCw, Clock, Sparkles, FileUser, Briefcase, Download, Building2, ListChecks, RotateCcw, Pencil, Save, X, ToggleLeft, ToggleRight, History, ChevronDown, RotateCw, Wand2, Loader2, Copy, Check, Info, FileText } from 'lucide-react';
import MarkdownViewer from './MarkdownViewer';
import ScoreBreakdownChart from './ScoreBreakdownChart';
import KeywordDensity from './KeywordDensity';
import ImprovementCard from './ImprovementCard';
import { quickFixResume } from '../services/geminiService';

interface TargetedResumeViewProps {
  result: AnalysisResult;
  onReEvaluate: () => void;
  history: HistoryItem[];
  onLoadHistory: (item: HistoryItem) => void;
  onDeleteHistory: (id: string, e: React.MouseEvent) => void;
  onNavigateToRewriter: () => void;
  onAutoRewrite: () => void;
  onFixRequest: (improvement: Improvement, context?: { before: string; after: string }) => void;
  jdText: string;
  resumeText: string;
  previousResume?: string;
  onUpdateResume?: (newResume: string) => void;
  onDownloadPdf?: () => void;
}

interface ResumeVersion {
  id: string;
  timestamp: number;
  content: string;
  label: string;
  type: 'ai' | 'manual' | 'initial';
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
  resumeText,
  previousResume,
  onUpdateResume,
  onDownloadPdf
}) => {
  const [activeTab, setActiveTab] = useState<'resume' | 'jd'>('resume');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showScoreInfo, setShowScoreInfo] = useState(false);
  
  // Diff & Edit State
  const [showDiff, setShowDiff] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState(result.rewrittenResume);
  const [isFixing, setIsFixing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Version Control State
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [showVersionMenu, setShowVersionMenu] = useState(false);
  const versionMenuRef = useRef<HTMLDivElement>(null);

  // Close version menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (versionMenuRef.current && !versionMenuRef.current.contains(event.target as Node)) {
        setShowVersionMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize versions with the first result
  useEffect(() => {
    if (versions.length === 0 && result.rewrittenResume) {
      setVersions([{
        id: Date.now().toString(),
        timestamp: Date.now(),
        content: result.rewrittenResume,
        label: 'Initial Scan Result',
        type: 'initial'
      }]);
    }
  }, []); // Only on mount

  // Sync editable content when result changes
  useEffect(() => {
    setEditableContent(result.rewrittenResume);
    
    const lastVersion = versions[0];
    if (lastVersion && lastVersion.content !== result.rewrittenResume) {
      const newVersion: ResumeVersion = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        content: result.rewrittenResume,
        label: `AI Update ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        type: 'ai'
      };
      setVersions(prev => [newVersion, ...prev]);
    }
  }, [result.rewrittenResume]);

  const handleSaveEdit = () => {
    if (onUpdateResume) {
      onUpdateResume(editableContent);
      
      const newVersion: ResumeVersion = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        content: editableContent,
        label: `Manual Edit ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        type: 'manual'
      };
      setVersions(prev => [newVersion, ...prev]);
    }
    setIsEditing(false);
  };

  const handleQuickFix = async () => {
    if (!editableContent.trim()) return;
    
    setIsFixing(true);
    try {
       const fixed = await quickFixResume(editableContent);
       setEditableContent(fixed);
    } catch (e) {
       console.error("Quick fix failed", e);
    } finally {
       setIsFixing(false);
    }
  };

  const handleRestoreVersion = (version: ResumeVersion) => {
    if (onUpdateResume) {
      onUpdateResume(version.content);
    }
    setEditableContent(version.content);
    setShowVersionMenu(false);
  };

  const handleCancelEdit = () => {
    setEditableContent(result.rewrittenResume);
    setIsEditing(false);
  };
  
  const handleCopyContent = () => {
    const text = isEditing ? editableContent : (result.rewrittenResume || "");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const criticalKeywords = result.criticalKeywords.map(k => ({ name: k, found: true }));
  const missingKeywords = result.missingKeywords.map(k => ({ name: k, found: false }));

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (result.overallScore / 100) * circumference;
  
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
           <span key={i} className="bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-900/50 dark:text-rose-200 dark:border-rose-800 px-1 rounded font-medium" title="Missing Keyword">
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
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 relative overflow-hidden transition-colors">
          {/* Reset Confirmation Overlay */}
          {showResetConfirm && (
            <div className="absolute inset-0 z-20 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
               <div className="bg-indigo-50 dark:bg-indigo-900/50 p-3 rounded-full mb-3">
                  <RefreshCw className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
               </div>
               <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">Start New Scan?</h4>
               <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-[200px]">Current results will be saved to history. JD and Resume text will be cleared.</p>
               <div className="flex gap-2 w-full">
                  <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-lg">Cancel</button>
                  <button onClick={() => { onReEvaluate(); setShowResetConfirm(false); }} className="flex-1 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg shadow-md">Confirm</button>
               </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-50 dark:bg-indigo-900/30 p-1.5 rounded-lg">
                 <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">Relevancy Score</span>
            </div>
            
            <button 
              onClick={() => setShowResetConfirm(true)}
              className="text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-2.5 py-1.5 rounded-md transition-all border border-slate-100 dark:border-slate-700"
            >
              <RotateCcw className="w-3 h-3" />
              New Scan
            </button>
          </div>

          <div className="flex flex-col items-center mb-6">
            <div className="relative w-40 h-40 group cursor-help" onClick={() => setShowScoreInfo(!showScoreInfo)}>
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                <circle cx="64" cy="64" r="50" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-slate-700" />
                <circle cx="64" cy="64" r="50" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={circumference} strokeDashoffset={potentialOffset} strokeLinecap="round" className="opacity-40 text-slate-200 dark:text-slate-600" />
                <circle cx="64" cy="64" r="50" stroke={result.overallScore >= 80 ? '#10b981' : result.overallScore >= 50 ? '#f59e0b' : '#ef4444'} strokeWidth="8" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold text-slate-800 dark:text-slate-100">{result.overallScore}</span>
                {result.projectedScore && (
                   <span className="text-[10px] text-indigo-500 dark:text-indigo-300 font-semibold bg-indigo-50 dark:bg-indigo-900/50 px-1.5 py-0.5 rounded-full mt-1">
                     Potential: {result.projectedScore}
                   </span>
                )}
              </div>
              <div className="absolute -bottom-2 right-0 bg-white dark:bg-slate-700 p-1.5 rounded-full shadow-md border border-slate-100 dark:border-slate-600 text-indigo-500">
                <Info className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Score Info Dropdown */}
          {showScoreInfo && (
            <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
              <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase mb-2">How we calculate your {result.overallScore}%</h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
                Your score is a weighted analysis of:
                <br/>• <span className="font-bold">Skills Match:</span> Presence of technical and soft skills.
                <br/>• <span className="font-bold">Experience Relevance:</span> Similarity of past roles to target JD.
                <br/>• <span className="font-bold">Keywords:</span> Exact matches of ATS critical keywords.
                <br/>• <span className="font-bold">Role Alignment:</span> Seniority and title consistency.
              </p>
              <button onClick={() => setShowScoreInfo(false)} className="mt-3 text-[10px] font-bold text-indigo-600 hover:underline">Got it</button>
            </div>
          )}

          <div className="text-center mb-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">
              {result.overallScore >= 80 ? 'Great Match!' : 'Needs Improvement'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
              {result.summary}
            </p>
          </div>

          <button onClick={onNavigateToRewriter} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg">
            <Sparkles className="w-4 h-4" />
            Open Resume Rewriter
          </button>
        </div>

        <ScoreBreakdownChart data={result.breakdown} />
        <KeywordDensity jdText={jdText} resumeText={resumeText} />

        {/* Action Plan */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
             <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Prioritized Action Plan</h3>
             </div>
             <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{result.improvements.length} items</span>
          </div>
          <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
             {result.improvements.map((imp) => (
                <ImprovementCard key={imp.id} improvement={imp} onFix={onFixRequest} />
             ))}
          </div>
        </div>

        {/* Culture Fit */}
        {result.cultureFit && (
           <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                   <Building2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                   <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Company Culture Fit</h3>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${result.cultureFit.alignmentScore >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                   {result.cultureFit.alignmentScore}% Aligned
                </span>
             </div>
             <div className="p-5">
                <div className="mb-3">
                   <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Target: {result.cultureFit.companyName}</p>
                   <div className="flex flex-wrap gap-2">
                      {result.cultureFit.inferredValues.map((val, i) => (
                         <span key={i} className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded border border-slate-200 font-medium">{val}</span>
                      ))}
                   </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{result.cultureFit.analysis}</p>
             </div>
           </div>
        )}
      </div>

      {/* RIGHT COLUMN - Tabs & Preview */}
      <div className="xl:col-span-8 h-full flex flex-col min-h-[800px]">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex-1 flex flex-col overflow-hidden h-full">
          {/* Tabs Header */}
          <div className="flex items-center border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 pt-4 gap-2 sticky top-0 z-10">
            <button onClick={() => setActiveTab('resume')} className={`px-6 py-3 text-sm font-bold rounded-t-lg flex items-center gap-2 transition-all relative top-[1px] ${activeTab === 'resume' ? 'bg-white dark:bg-slate-800 text-indigo-600 border-t border-x border-slate-200 dark:border-slate-700 shadow-sm' : 'text-slate-500'}`}><FileUser className="w-4 h-4" />Your Resume</button>
            <button onClick={() => setActiveTab('jd')} className={`px-6 py-3 text-sm font-bold rounded-t-lg flex items-center gap-2 transition-all relative top-[1px] ${activeTab === 'jd' ? 'bg-white dark:bg-slate-800 text-indigo-600 border-t border-x border-slate-200 dark:border-slate-700 shadow-sm' : 'text-slate-50'}`}><Briefcase className="w-4 h-4" />Job Description</button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-800 h-full relative">
             {activeTab === 'resume' ? (
               <div className="h-full flex flex-col">
                  {/* Toolbar */}
                  <div className="p-4 bg-white dark:bg-slate-800 border-b border-indigo-50 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-0 z-20 shadow-sm">
                     <div className="flex items-center gap-3">
                       <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
                       <div><p className="font-bold text-sm text-slate-800 dark:text-slate-200">{isEditing ? "Editing Resume" : "AI Optimized Resume"}</p></div>
                     </div>
                     <div className="flex items-center gap-2 flex-wrap">
                        {/* Versioning and tools... */}
                        <div className="relative" ref={versionMenuRef}>
                           <button onClick={() => setShowVersionMenu(!showVersionMenu)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 text-slate-600 rounded-md text-xs font-bold shadow-sm"><History className="w-3.5 h-3.5" /><span className="hidden sm:inline">Versions</span><ChevronDown className="w-3 h-3 text-slate-400" /></button>
                           {showVersionMenu && (
                             <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 z-50">
                                <div className="p-2 border-b bg-slate-50 dark:bg-slate-900 rounded-t-lg"><h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Version History</h4></div>
                                <div className="max-h-64 overflow-y-auto py-1">
                                   {versions.map((v) => (
                                      <button key={v.id} onClick={() => handleRestoreVersion(v)} className="w-full text-left px-4 py-2 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors flex items-start gap-3 group">
                                         <div className={`mt-0.5 p-1 rounded-full shrink-0 ${v.type === 'ai' ? 'bg-indigo-100 text-indigo-600' : v.type === 'manual' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>{v.type === 'ai' ? <Sparkles className="w-3 h-3" /> : v.type === 'manual' ? <Pencil className="w-3 h-3" /> : <RotateCw className="w-3 h-3" />}</div>
                                         <div><p className={`text-xs font-bold ${v.content === editableContent ? 'text-indigo-700' : 'text-slate-700 dark:text-slate-300'}`}>{v.label} {v.content === editableContent && '(Current)'}</p></div>
                                      </button>
                                   ))}
                                </div>
                             </div>
                           )}
                        </div>
                        <button onClick={() => setIsEditing(!isEditing)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 text-slate-600 rounded-md text-xs font-bold shadow-sm">{isEditing ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}{isEditing ? "Cancel" : "Edit"}</button>
                        {isEditing ? (
                          <button onClick={handleSaveEdit} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-md text-xs font-bold shadow-sm"><Save className="w-3.5 h-3.5" />Save</button>
                        ) : (
                          <>
                            <button onClick={handleCopyContent} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 text-slate-600 rounded-md text-xs font-bold hover:text-indigo-600 transition-colors shadow-sm">{copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}Copy</button>
                            {onDownloadPdf && (
                              <button onClick={onDownloadPdf} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 rounded-md text-xs font-bold text-slate-600 hover:text-indigo-600 shadow-sm" title="Download as PDF"><FileText className="w-3.5 h-3.5" />PDF</button>
                            )}
                            <button onClick={downloadResumeTxt} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 rounded-md text-xs font-bold text-slate-600 hover:text-indigo-600 shadow-sm" title="Download as Text"><Download className="w-3.5 h-3.5" /></button>
                          </>
                        )}
                     </div>
                  </div>

                  <div className="flex-1 relative overflow-auto bg-white dark:bg-slate-800">
                    {isEditing ? (
                       <textarea value={editableContent} onChange={(e) => setEditableContent(e.target.value)} className="w-full h-full p-8 font-mono text-sm text-slate-800 dark:text-slate-200 bg-transparent resize-none focus:outline-none" spellCheck={false} placeholder="Edit your resume content here..." />
                    ) : (
                       <div className="p-8 max-w-3xl mx-auto">
                          <MarkdownViewer content={result.rewrittenResume || "No resume content available."} highlightKeys={result.criticalKeywords} />
                       </div>
                    )}
                  </div>
               </div>
             ) : (
               <div className="p-8 prose prose-slate dark:prose-invert max-w-none prose-sm">
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="text-slate-900 dark:text-slate-100 font-bold m-0">Job Description</h3>
                     <div className="text-xs text-rose-600 font-medium bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded border border-rose-100">Missing keywords highlighted in red</div>
                  </div>
                  <div className="whitespace-pre-wrap font-sans text-slate-700 dark:text-slate-300 leading-relaxed">{renderJdWithHighlights(jdText)}</div>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TargetedResumeView;