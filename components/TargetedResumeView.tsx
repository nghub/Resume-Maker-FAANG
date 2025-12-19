
import React, { useState, useEffect, useRef } from 'react';
import { AnalysisResult, HistoryItem, Improvement, VisualSettings } from '../types';
import { CheckCircle, AlertCircle, RefreshCw, Clock, Sparkles, FileUser, Briefcase, Download, Building2, ListChecks, RotateCcw, Pencil, Save, X, ToggleLeft, ToggleRight, History, ChevronDown, RotateCw, Wand2, Loader2, Copy, Check, Info, FileText, Palette, BookmarkPlus } from 'lucide-react';
import MarkdownViewer from './MarkdownViewer';
import ScoreBreakdownChart from './ScoreBreakdownChart';
import KeywordDensity from './KeywordDensity';
import ImprovementCard from './ImprovementCard';
import ResumeCustomizer from './ResumeCustomizer';

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
  onSaveToLibrary?: (content: string) => void;
}

interface ResumeVersion {
  id: string;
  timestamp: number;
  content: string;
  label: string;
  type: 'ai' | 'manual' | 'initial';
}

const DEFAULT_VISUAL_SETTINGS: VisualSettings = {
  fontFamily: 'inter',
  primaryColor: '#4f46e5',
  layout: 'classic',
  fontSize: 'base',
  lineHeight: 'normal',
};

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
  onDownloadPdf,
  onSaveToLibrary
}) => {
  const [activeTab, setActiveTab] = useState<'resume' | 'jd'>('resume');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showScoreInfo, setShowScoreInfo] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [visualSettings, setVisualSettings] = useState<VisualSettings>(() => {
    const saved = localStorage.getItem('ats_visual_settings');
    return saved ? JSON.parse(saved) : DEFAULT_VISUAL_SETTINGS;
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState(result.rewrittenResume);
  const [copied, setCopied] = useState(false);

  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [showVersionMenu, setShowVersionMenu] = useState(false);
  const versionMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('ats_visual_settings', JSON.stringify(visualSettings));
  }, [visualSettings]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (versionMenuRef.current && !versionMenuRef.current.contains(event.target as Node)) {
        setShowVersionMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  }, []);

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

  const handleRestoreVersion = (version: ResumeVersion) => {
    if (onUpdateResume) onUpdateResume(version.content);
    setEditableContent(version.content);
    setShowVersionMenu(false);
  };

  const handleCopyContent = () => {
    const text = isEditing ? editableContent : (result.rewrittenResume || "");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToLibraryLocal = () => {
    if (onSaveToLibrary) {
      onSaveToLibrary(isEditing ? editableContent : result.rewrittenResume);
    }
  };

  const circumference = 2 * Math.PI * 50;
  const offset = circumference - (result.overallScore / 100) * circumference;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
      <div className="xl:col-span-4 space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 relative overflow-hidden transition-colors">
          {showResetConfirm && (
            <div className="absolute inset-0 z-20 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
               <div className="bg-indigo-50 dark:bg-indigo-900/50 p-3 rounded-full mb-3">
                  <RefreshCw className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
               </div>
               <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">Start New Scan?</h4>
               <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-[200px]">Current scan results will be moved to history.</p>
               <div className="flex gap-2 w-full">
                  <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-lg">Cancel</button>
                  <button onClick={() => { onReEvaluate(); setShowResetConfirm(false); }} className="flex-1 py-2 text-sm font-bold text-white bg-indigo-600 rounded-lg">Confirm</button>
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
              className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-700 px-2.5 py-1.5 rounded-md transition-all border border-slate-100 dark:border-slate-700"
            >
              <RotateCcw className="w-3 h-3" />
              New Scan
            </button>
          </div>

          <div className="flex flex-col items-center mb-6">
            <div 
              className="relative w-40 h-40 group cursor-help focus:outline-none rounded-full" 
              onClick={() => setShowScoreInfo(!showScoreInfo)}
              role="progressbar"
              aria-valuenow={result.overallScore}
            >
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                <circle cx="64" cy="64" r="50" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-slate-700" />
                <circle cx="64" cy="64" r="50" stroke={result.overallScore >= 80 ? '#10b981' : result.overallScore >= 50 ? '#f59e0b' : '#ef4444'} strokeWidth="8" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-5xl font-bold text-slate-800 dark:text-slate-100">{result.overallScore}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Percent</span>
              </div>
            </div>
          </div>

          <div className="text-center mb-6">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">Analysis Complete</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
              {result.summary}
            </p>
          </div>

          <button onClick={onNavigateToRewriter} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95">
            <Sparkles className="w-4 h-4" />
            Open Resume Rewriter
          </button>
        </div>

        <ScoreBreakdownChart data={result.breakdown} />
        
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
          <button onClick={() => setShowCustomizer(!showCustomizer)} className="w-full px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
             <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Visual Customization</h3>
             </div>
             <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showCustomizer ? 'rotate-180' : ''}`} />
          </button>
          {showCustomizer && <div className="p-4"><ResumeCustomizer settings={visualSettings} onChange={setVisualSettings} /></div>}
        </div>

        <KeywordDensity jdText={jdText} resumeText={resumeText} />

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
             <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Prioritized Action Plan</h3>
             </div>
          </div>
          <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
             {result.improvements.map((imp) => (
                <ImprovementCard key={imp.id} improvement={imp} onFix={onFixRequest} />
             ))}
          </div>
        </div>
      </div>

      <div className="xl:col-span-8 h-full flex flex-col min-h-[800px]">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex-1 flex flex-col overflow-hidden h-full">
          <div className="flex items-center border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 pt-4 gap-2 sticky top-0 z-10">
            <button onClick={() => setActiveTab('resume')} className={`px-6 py-3 text-sm font-bold rounded-t-lg flex items-center gap-2 transition-all relative top-[1px] ${activeTab === 'resume' ? 'bg-white dark:bg-slate-800 text-indigo-600 border-t border-x border-slate-200 dark:border-slate-700' : 'text-slate-500'}`}>
              <FileUser className="w-4 h-4" /> Optimized Resume
            </button>
            <button onClick={() => setActiveTab('jd')} className={`px-6 py-3 text-sm font-bold rounded-t-lg flex items-center gap-2 transition-all relative top-[1px] ${activeTab === 'jd' ? 'bg-white dark:bg-slate-800 text-indigo-600 border-t border-x border-slate-200 dark:border-slate-700' : 'text-slate-500'}`}>
              <Briefcase className="w-4 h-4" /> Job Description
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-800 h-full relative">
             {activeTab === 'resume' ? (
               <div className="h-full flex flex-col">
                  <div className="p-4 bg-white dark:bg-slate-800 border-b border-indigo-50 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-0 z-20 shadow-sm">
                     <div className="flex items-center gap-3">
                       <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
                       <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{isEditing ? "Editing Mode" : "AI Optimized"}</p>
                     </div>
                     <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative" ref={versionMenuRef}>
                           <button onClick={() => setShowVersionMenu(!showVersionMenu)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 text-slate-600 dark:text-slate-300 rounded-md text-xs font-bold shadow-sm hover:bg-slate-50 transition-colors active:scale-95"><History className="w-3.5 h-3.5" /><span className="hidden sm:inline">Versions</span></button>
                           {showVersionMenu && (
                             <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="max-h-64 overflow-y-auto py-1">
                                   {versions.map((v) => (
                                      <button key={v.id} onClick={() => handleRestoreVersion(v)} className="w-full text-left px-4 py-2 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors flex items-start gap-3">
                                         <p className={`text-xs font-bold ${v.content === editableContent ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>{v.label}</p>
                                      </button>
                                   ))}
                                </div>
                             </div>
                           )}
                        </div>
                        <button onClick={() => setIsEditing(!isEditing)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 text-slate-600 dark:text-slate-300 rounded-md text-xs font-bold transition-all active:scale-95">{isEditing ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}{isEditing ? "Cancel" : "Edit"}</button>
                        {isEditing ? (
                          <button onClick={handleSaveEdit} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-md text-xs font-bold shadow-sm active:scale-95"><Save className="w-3.5 h-3.5" />Save</button>
                        ) : (
                          <>
                            <button onClick={handleSaveToLibraryLocal} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 rounded-md text-xs font-bold hover:bg-indigo-100 transition-all active:scale-95"><BookmarkPlus className="w-3.5 h-3.5" />To Library</button>
                            <button onClick={handleCopyContent} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 text-slate-600 dark:text-slate-300 rounded-md text-xs font-bold hover:text-indigo-600 transition-colors active:scale-95">{copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}Copy</button>
                            {onDownloadPdf && (
                              <button onClick={onDownloadPdf} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 rounded-md text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors active:scale-95"><FileText className="w-3.5 h-3.5" />PDF</button>
                            )}
                          </>
                        )}
                     </div>
                  </div>
                  <div className="flex-1 relative overflow-auto bg-white dark:bg-slate-800">
                    {isEditing ? (
                       <textarea value={editableContent} onChange={(e) => setEditableContent(e.target.value)} className="w-full h-full p-8 font-mono text-sm text-slate-800 dark:text-slate-200 bg-transparent resize-none focus:outline-none" spellCheck={false} />
                    ) : (
                       <div className="p-8 max-w-3xl mx-auto">
                          <MarkdownViewer 
                            content={result.rewrittenResume || "No content."} 
                            highlightKeys={result.criticalKeywords} 
                            visualSettings={visualSettings}
                          />
                       </div>
                    )}
                  </div>
               </div>
             ) : (
               <div className="p-8 prose prose-slate dark:prose-invert max-w-none">
                  <h3 className="text-slate-900 dark:text-slate-100 font-bold m-0 mb-4">Target Job Description</h3>
                  <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                    {jdText}
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
