import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, FileText, Moon, Sun, CloudSnow, Building2, RotateCcw } from 'lucide-react';
import { analyzeResume, validateAndFormatResume } from './services/geminiService';
import { parseFile, validateDuplicateFile } from './services/fileParser';
import { AnalysisResult, LoadingState, Improvement, HistoryItem } from './types';
import InputArea from './components/InputArea';
import ChatAssistant from './components/ChatAssistant';
import LoadingScreen from './components/LoadingScreen';
import TargetedResumeView from './components/TargetedResumeView';
import Toast, { ToastType } from './components/Toast';
import Snowfall from './components/Snowfall';
import SantaHat from './components/SantaHat';
import MarkdownViewer from './components/MarkdownViewer';

const HISTORY_KEY = 'ats_optima_device_history';
const DRAFT_RESUME_KEY = 'ats_optima_draft_resume';

declare global {
  interface Window {
    html2pdf: any;
  }
}

const App: React.FC = () => {
  const [companyName, setCompanyName] = useState('');
  const [jdText, setJdText] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [jdFileName, setJdFileName] = useState<string | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadingState>(LoadingState.IDLE);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [parsingFile, setParsingFile] = useState<string | null>(null);
  const [isFormattingResume, setIsFormattingResume] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [errorState, setErrorState] = useState<{ message: string; type: ToastType } | null>(null);
  const [isSnowing, setIsSnowing] = useState(false);
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ats_optima_theme');
      if (saved) return saved as 'light' | 'dark';
      return 'light';
    }
    return 'light';
  });

  const [activeSection, setActiveSection] = useState<'dashboard' | 'resume' | 'coverLetter'>('dashboard');
  const [chatTriggerMessage, setChatTriggerMessage] = useState<string | undefined>(undefined);
  const [previousResume, setPreviousResume] = useState<string | undefined>(undefined);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('ats_optima_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const toggleSnow = () => {
    setIsSnowing(prev => !prev);
  };

  useEffect(() => {
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
        setHistory([]);
      }
    } else {
      setHistory([]);
    }

    const savedDraft = localStorage.getItem(DRAFT_RESUME_KEY);
    if (savedDraft && !resumeText) {
      setResumeText(savedDraft);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (resumeText) {
        localStorage.setItem(DRAFT_RESUME_KEY, resumeText);
      } else {
        localStorage.removeItem(DRAFT_RESUME_KEY);
      }
    }, 1000);
    return () => clearTimeout(handler);
  }, [resumeText]);

  const showToast = (message: string, type: ToastType = 'error') => {
    setErrorState({ message, type });
  };

  const handleNewScan = () => {
    setStatus(LoadingState.IDLE);
    setResult(null);
    setPreviousResume(undefined);
    setJdFileName(null);
    setResumeFileName(null);
    setCompanyName('');
    setJdText('');
    setResumeText('');
    setActiveSection('dashboard');
    setChatTriggerMessage(undefined);
    showToast("Application reset for new scan", 'info');
  };

  const saveToHistory = (newResult: AnalysisResult, jd: string, resume: string) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      score: newResult.overallScore,
      role: newResult.personalInfo.title || 'Resume Scan',
      result: newResult,
      jdPreview: jd.substring(0, 200),
      resumePreview: resume.substring(0, 200),
      fullJd: jd,
      fullResume: resume
    };

    const updatedHistory = [newItem, ...history].slice(0, 5);
    setHistory(updatedHistory);
    
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (e) {
      const reducedHistory = updatedHistory.slice(0, 3);
      setHistory(reducedHistory);
    }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    if (status !== LoadingState.IDLE && !window.confirm("You have unsaved changes or an active analysis. Are you sure you want to load this history item? Current progress will be lost.")) {
      return;
    }

    setResult(item.result);
    setJdText(item.fullJd || item.jdPreview);
    setResumeText(item.fullResume || item.resumePreview);
    setCompanyName(item.result.cultureFit?.companyName || '');
    setJdFileName(null);
    setResumeFileName(null);
    setStatus(LoadingState.COMPLETE);
    setActiveSection('dashboard');
    showToast("Scan loaded from history", 'info');
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    showToast("Scan removed from history", 'info');
  };

  const handleValidateAndFormat = async (text: string) => {
    if (!text.trim()) return;
    
    setIsFormattingResume(true);
    try {
      const result = await validateAndFormatResume(text);
      if (result.isValidResume) {
        setResumeText(result.formattedContent);
        showToast("Resume validated and formatted successfully", 'success');
      } else {
        setResumeText(text);
        showToast(`Warning: This may not be a valid resume. ${result.reason}`, 'error');
      }
    } catch (error) {
      setResumeText(text);
      showToast("Smart formatting unavailable. Using raw text.", 'info');
    } finally {
      setIsFormattingResume(false);
    }
  };

  const handleFileSelect = async (file: File, type: 'jd' | 'resume') => {
    setParsingFile(type);
    try {
      const currentName = type === 'jd' ? jdFileName : resumeFileName;
      validateDuplicateFile(file, currentName);
      const text = await parseFile(file);
      
      if (type === 'jd') {
        setJdText(text);
        setJdFileName(file.name);
      } else {
        setResumeText(text);
        setResumeFileName(file.name);
      }
      
      showToast(`${file.name} parsed successfully`, 'success');
    } catch (error) {
      showToast((error as Error).message, 'error');
    } finally {
      setParsingFile(null);
    }
  };

  const handleAnalyze = async () => {
    if (!jdText.trim() || !resumeText.trim()) {
      showToast("Please provide both Job Description and Resume text.", 'error');
      return;
    }
    
    setStatus(LoadingState.ANALYZING);
    setResult(null);
    setPreviousResume(undefined);
    
    try {
      const data = await analyzeResume(resumeText, jdText, companyName);
      setResult(data);
      setStatus(LoadingState.COMPLETE);
      saveToHistory(data, jdText, resumeText);
    } catch (error) {
      setStatus(LoadingState.ERROR);
      showToast((error as Error).message, 'error');
      setTimeout(() => setStatus(LoadingState.IDLE), 3000);
    }
  };

  const handleAutoRewrite = () => {
    setChatTriggerMessage("ACTION_REWRITE_RESUME");
    setActiveSection('resume');
  };

  const handleFixRequest = (improvement: Improvement, context?: { before: string; after: string }) => {
    let prompt = "";
    if (context) {
       prompt = `Apply this specific improvement: Find "${context.before}" and replace it with "${context.after}".`;
    } else {
       prompt = `Help me fix the ${improvement.title} issue in ${improvement.section}. Recommendation: ${improvement.recommendation}`;
    }
    setChatTriggerMessage(prompt);
    setActiveSection('resume');
  };
  
  const handleResumeUpdate = (newResumeContent: string) => {
    if (result) {
      setPreviousResume(result.rewrittenResume);
      setResult({ ...result, rewrittenResume: newResumeContent });
    }
  };
  
  const handleScoreUpdate = (newScore: number) => {
    if (result) {
        setResult({ ...result, overallScore: newScore });
    }
  };

  const handleDownloadPdf = () => {
    const element = document.getElementById('printable-resume-area');
    if (!element || !window.html2pdf) {
      window.print();
      return;
    }
    const opt = {
      margin: 10,
      filename: `${result?.personalInfo.name || 'Optimized'}_Resume.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    element.style.display = 'block';
    window.html2pdf().from(element).set(opt).save().then(() => {
      element.style.display = '';
      showToast("PDF Downloaded", 'success');
    });
  };

  if (status === LoadingState.ANALYZING) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#1A1A1A] font-sans text-slate-900 dark:text-slate-200 relative overflow-x-hidden transition-colors duration-300">
      {isSnowing && <Snowfall />}
      
      <div id="printable-resume-area" className="hidden print:block font-sans bg-white text-black">
        {result && <MarkdownViewer content={result.rewrittenResume || ""} />}
      </div>

      {errorState && (
        <Toast message={errorState.message} type={errorState.type} onClose={() => setErrorState(null)} />
      )}

      <header className="bg-white/80 dark:bg-[#1A1A1A]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 sticky top-0 z-30 print:hidden transition-colors">
        <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleNewScan}>
            <div className="bg-gradient-to-r from-blue-600 to-violet-600 p-1.5 rounded-lg shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
              <span className="relative">A<SantaHat className="absolute -top-[0.9rem] -left-[0.85rem] w-9 h-9" /></span>pply IQ
            </h1>
          </div>
          
          {status === LoadingState.COMPLETE && (
             <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-lg">
                <button onClick={() => setActiveSection('dashboard')} className={`px-4 py-1.5 rounded-md text-sm font-medium ${activeSection === 'dashboard' ? 'bg-white dark:bg-white/10 text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Dashboard</button>
                <button onClick={() => setActiveSection('resume')} className={`px-4 py-1.5 rounded-md text-sm font-medium ${activeSection === 'resume' ? 'bg-white dark:bg-white/10 text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Rewriter</button>
             </div>
          )}
          
          <div className="flex items-center gap-4">
             <button onClick={toggleSnow} className={`p-2 rounded-full ${isSnowing ? 'text-blue-400' : 'text-slate-500'}`} title="Toggle Snowfall"><CloudSnow className="w-5 h-5" /></button>
             <button onClick={toggleTheme} className="p-2 text-slate-500" title="Toggle Dark Mode">{theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 py-8 print:hidden relative z-10">
        {status !== LoadingState.COMPLETE && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-10 max-w-3xl mx-auto flex flex-col items-center">
              {/* Removed the Sparkles icon box as requested */}
              <h2 className="text-5xl font-extrabold mb-3 tracking-tight text-slate-900 dark:text-white">
                <span className="relative inline-block">
                  A
                  <SantaHat className="absolute -top-[1.6rem] -left-[1.4rem] w-16 h-16 pointer-events-none" />
                </span>
                pply IQ
              </h2>
              <p className="text-indigo-600 dark:text-indigo-400 text-xl font-bold tracking-tight mb-2 uppercase text-[12px] px-4 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 inline-block">Built to pass the ATS. Designed to pass the bar.</p>
              <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium">Upload your resume and JD for FAANG-level optimization and an instant recruiter score</p>
            </div>

            <div className="max-w-2xl mx-auto mb-8">
              <div className="bg-white/80 dark:bg-white/5 p-5 rounded-2xl border-4 border-indigo-500/30 dark:border-indigo-500/50 shadow-2xl backdrop-blur-xl ring-4 ring-indigo-500/10 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                    <Building2 className="w-4 h-4 text-indigo-600" /> Target Company
                  </label>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Optional</span>
                </div>
                <input 
                  value={companyName} 
                  onChange={(e) => setCompanyName(e.target.value)} 
                  placeholder="Enter Company Name (e.g. Amazon, Google, Netflix)..." 
                  className="w-full px-5 py-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800 dark:text-indigo-300 placeholder:text-slate-400 dark:placeholder:text-slate-600" 
                />
                <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 font-medium italic">We'll analyze cultural fit based on this company's known values.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              <InputArea type="jd" value={jdText} onChange={setJdText} onFileSelect={(file) => handleFileSelect(file, 'jd')} parsing={parsingFile === 'jd'} />
              <InputArea type="resume" value={resumeText} onChange={setResumeText} onFileSelect={(file) => handleFileSelect(file, 'resume')} parsing={parsingFile === 'resume'} formatting={isFormattingResume} onAutoFormat={() => handleValidateAndFormat(resumeText)} />
            </div>

            <div className="flex justify-center mb-16">
               <button onClick={handleAnalyze} disabled={!jdText || !resumeText} className="flex items-center gap-3 px-12 py-5 rounded-2xl font-bold text-xl shadow-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white disabled:opacity-40 hover:scale-[1.03] active:scale-95 transition-all group">
                  <Sparkles className="w-6 h-6 group-hover:animate-pulse" /> Scan & Optimize <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
          </div>
        )}

        {status === LoadingState.COMPLETE && result && activeSection === 'dashboard' && (
           <TargetedResumeView 
            result={result} 
            onReEvaluate={handleNewScan} 
            history={history} 
            onLoadHistory={loadHistoryItem} 
            onDeleteHistory={deleteHistoryItem} 
            onNavigateToRewriter={() => setActiveSection('resume')} 
            onAutoRewrite={handleAutoRewrite} 
            onFixRequest={handleFixRequest} 
            jdText={jdText} 
            resumeText={resumeText} 
            previousResume={previousResume} 
            onUpdateResume={handleResumeUpdate} 
            onDownloadPdf={handleDownloadPdf} 
          />
        )}

        {status === LoadingState.COMPLETE && result && activeSection === 'resume' && (
           <div className="h-[calc(100vh-140px)] max-w-6xl mx-auto flex flex-col">
              <div className="w-full flex-1 flex flex-col">
                 <div className="flex items-center justify-between mb-4 px-2">
                   <h2 className="text-xl font-bold flex items-center gap-2"><Sparkles className="w-6 h-6 text-indigo-600" /> Resume Rewriter & Copilot</h2>
                   <div className="flex items-center gap-2">
                      <button onClick={() => setActiveSection('dashboard')} className="text-sm px-4 py-2 text-slate-500 hover:text-slate-800 font-bold">Back to Dashboard</button>
                      <button onClick={handleAutoRewrite} className="text-sm px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 font-bold">Full Re-optimization</button>
                   </div>
                 </div>
                 <ChatAssistant 
                  jdText={jdText} 
                  resumeText={resumeText} 
                  analysisResult={result} 
                  variant="sidebar" 
                  triggerMessage={chatTriggerMessage} 
                  onClearTrigger={() => setChatTriggerMessage(undefined)} 
                  onUpdateResume={handleResumeUpdate} 
                  onUpdateScore={handleScoreUpdate} 
                  onDownloadPdf={handleDownloadPdf} 
                  onNewScan={handleNewScan}
                />
              </div>
           </div>
        )}
      </main>
    </div>
  );
};

export default App;