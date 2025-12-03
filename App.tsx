
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ArrowRight, Copy, RefreshCw, AlertCircle, FileText, LayoutDashboard, ChevronRight, Star, MessageSquare, RotateCcw, History, Trash2, X, TrendingUp, LogOut, User as UserIcon, Download, Printer, FileJson, Building2, SplitSquareHorizontal } from 'lucide-react';
import { analyzeResume } from './services/geminiService';
import { parseFile, validateDuplicateFile } from './services/fileParser';
import { initGoogleAuth } from './services/authService';
import { AnalysisResult, LoadingState, Improvement, HistoryItem, User } from './types';
import ScoreChart from './components/ScoreChart';
import ResultCard from './components/ResultCard';
import MarkdownViewer from './components/MarkdownViewer';
import InputArea from './components/InputArea';
import ChatAssistant from './components/ChatAssistant';
import LoadingScreen from './components/LoadingScreen';
import ImprovementCard from './components/ImprovementCard';
import ProfileSidebar from './components/ProfileSidebar';
import Tooltip from './components/Tooltip';
import FeedbackWidget from './components/FeedbackWidget';
import ScoreBreakdownChart from './components/ScoreBreakdownChart';
import OnboardingTour from './components/OnboardingTour';
import TargetedResumeView from './components/TargetedResumeView';
import Toast, { ToastType } from './components/Toast';

const App: React.FC = () => {
  const [companyName, setCompanyName] = useState('');
  const [jdText, setJdText] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [jdFileName, setJdFileName] = useState<string | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [status, setStatus] = useState<LoadingState>(LoadingState.IDLE);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [parsingFile, setParsingFile] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [errorState, setErrorState] = useState<{ message: string; type: ToastType } | null>(null);
  
  // Navigation State
  const [activeSection, setActiveSection] = useState<'dashboard' | 'resume' | 'coverLetter'>('dashboard');

  // Chat Integration State
  const [chatTriggerMessage, setChatTriggerMessage] = useState<string | undefined>(undefined);
  
  // Resume Diffing State
  const [previousResume, setPreviousResume] = useState<string | undefined>(undefined);

  // Export Menu State
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Initialize Auth & History
  useEffect(() => {
    // Load User
    const savedUser = localStorage.getItem('ats_optima_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }

    // Initialize Google Auth (renders button if container exists)
    initGoogleAuth((newUser) => {
      setUser(newUser);
      localStorage.setItem('ats_optima_user', JSON.stringify(newUser));
      setIsProfileMenuOpen(false);
      showToast(`Welcome back, ${newUser.name}!`, 'success');
    });

    // Load History
    const savedHistory = localStorage.getItem('ats_optima_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Re-render Google Button when user state changes (if logged out)
  useEffect(() => {
    if (!user) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
         initGoogleAuth((newUser) => {
          setUser(newUser);
          localStorage.setItem('ats_optima_user', JSON.stringify(newUser));
          showToast(`Welcome, ${newUser.name}!`, 'success');
        });
      }, 100);
    }
  }, [user]);

  const showToast = (message: string, type: ToastType = 'error') => {
    setErrorState({ message, type });
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('ats_optima_user');
    setIsProfileMenuOpen(false);
    showToast("Signed out successfully", 'info');
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

    const updatedHistory = [newItem, ...history].slice(0, 5); // Keep last 5
    setHistory(updatedHistory);
    localStorage.setItem('ats_optima_history', JSON.stringify(updatedHistory));
  };

  const loadHistoryItem = (item: HistoryItem) => {
    // Confirmation before overwriting current state
    if (status !== LoadingState.IDLE && !window.confirm("You have unsaved changes or an active analysis. Are you sure you want to load this history item? Current progress will be lost.")) {
      return;
    }

    setResult(item.result);
    setJdText(item.fullJd || item.jdPreview);
    setResumeText(item.fullResume || item.resumePreview);
    setCompanyName(item.result.cultureFit?.companyName || '');
    setJdFileName(null); // Clear filenames as it's loaded from text history
    setResumeFileName(null);
    setStatus(LoadingState.COMPLETE);
    setActiveSection('dashboard');
    showToast("Scan loaded from history", 'info');
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem('ats_optima_history', JSON.stringify(updated));
    showToast("Scan removed from history", 'info');
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('ats_optima_history');
    showToast("History cleared", 'info');
  };

  const handleFileSelect = async (file: File, type: 'jd' | 'resume') => {
    setParsingFile(type);
    try {
      // Check for duplicates
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
    
    // Company name is optional now, defaults handled in service if empty

    setStatus(LoadingState.ANALYZING);
    setResult(null);
    setPreviousResume(undefined);
    
    try {
      const data = await analyzeResume(resumeText, jdText, companyName);
      setResult(data);
      setStatus(LoadingState.COMPLETE);
      saveToHistory(data, jdText, resumeText);
    } catch (error) {
      console.error(error);
      setStatus(LoadingState.ERROR);
      showToast((error as Error).message, 'error');
      setTimeout(() => setStatus(LoadingState.IDLE), 2000);
    }
  };

  const handleAutoRewrite = () => {
    const prompt = "Please rewrite my entire resume to align perfectly with the Job Description and achieve a 95% ATS match score. Fix all keywords, metrics, and formatting.";
    setChatTriggerMessage(prompt);
    setTimeout(() => setChatTriggerMessage(undefined), 1000);
    setActiveSection('resume');
    showToast("Auto-Rewrite initiated...", 'success');
  };

  const handleFixRequest = (improvement: Improvement) => {
    const prompt = `Help me fix the **${improvement.title}** issue in the **${improvement.section}** section. 
    
The recommendation was: "${improvement.recommendation}".

Please rewrite this part of my resume to improve it.`;
    
    setChatTriggerMessage(prompt);
    setTimeout(() => setChatTriggerMessage(undefined), 1000);
    setActiveSection('resume'); // Switch to resume rewriter view
  };
  
  const handleResumeUpdate = (newResumeContent: string) => {
    if (result) {
      // Save the current version as "previous" before updating
      setPreviousResume(result.rewrittenResume);
      
      setResult({
        ...result,
        rewrittenResume: newResumeContent
      });
    }
  };
  
  const handleScoreUpdate = (newScore: number) => {
    if (result) {
        setResult({
            ...result,
            overallScore: newScore
        });
    }
  };

  // Helper to download text files
  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsExportMenuOpen(false);
    showToast(`Downloaded ${filename}`, 'success');
  };

  // Helper to generate and download a Word-compatible DOC file
  const handleDownloadDoc = () => {
    if (!result) return;
    
    // Basic HTML wrapper to ensure formatting in Word
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Optimized Resume</title>
        <style>
          body { font-family: Calibri, sans-serif; font-size: 11pt; }
          h1 { font-size: 16pt; font-weight: bold; }
          h2 { font-size: 14pt; font-weight: bold; margin-top: 12pt; border-bottom: 1px solid #ddd; }
          p { margin-bottom: 8pt; }
          ul { margin-bottom: 8pt; }
        </style>
      </head>
      <body>
        ${result.rewrittenResume
          .replace(/\n/g, '<br/>')
          .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // Bold
          .replace(/# (.*?)(<br\/>|$)/g, '<h1>$1</h1>') // H1
          .replace(/## (.*?)(<br\/>|$)/g, '<h2>$1</h2>') // H2
          .replace(/- (.*?)(<br\/>|$)/g, '<li>$1</li>')}
      </body>
      </html>
    `;
    
    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Optimized_Resume.doc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setIsExportMenuOpen(false);
    showToast("Downloaded as Word Document", 'success');
  };

  const handlePrint = () => {
    setIsExportMenuOpen(false);
    window.print();
  };

  if (status === LoadingState.ANALYZING) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Print Styles & Print Only Content */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
            height: 0;
            overflow: hidden;
          }
          #printable-resume-area, #printable-resume-area * {
            visibility: visible;
            height: auto;
            overflow: visible;
          }
          #printable-resume-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 40px;
            background: white;
            color: black;
            font-size: 12pt;
          }
          /* Hide highlights for clean print */
          #printable-resume-area .bg-indigo-50 {
             background-color: transparent !important;
             border-left: none !important;
             padding-left: 0 !important;
             margin-left: 0 !important;
          }
          #printable-resume-area .bg-emerald-100 {
             background-color: transparent !important;
             border: none !important;
          }
        }
      `}</style>

      {/* Hidden Printable Area - Contains Latest Rewritten Resume */}
      <div id="printable-resume-area" className="hidden">
        {result && (
           <MarkdownViewer 
              content={result.rewrittenResume || ""} 
           />
        )}
      </div>

      {/* Toast Notification Container */}
      {errorState && (
        <Toast 
          message={errorState.message} 
          type={errorState.type}
          onClose={() => setErrorState(null)} 
        />
      )}

      {/* Conditional Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 print:hidden">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setStatus(LoadingState.IDLE)}>
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">FAANG Resume IQ</h1>
          </div>
          
          {status === LoadingState.COMPLETE && (
             <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                <button 
                  onClick={() => setActiveSection('dashboard')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeSection === 'dashboard' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => setActiveSection('resume')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeSection === 'resume' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Resume Rewriter
                </button>
             </div>
          )}
          
          <div className="flex items-center gap-4">
             {status === LoadingState.COMPLETE && (
               <div className="flex items-center gap-4">
                 <div className="hidden sm:block">
                   <FeedbackWidget />
                 </div>
                 <div className="h-6 w-px bg-slate-200 hidden sm:block" />
                 <Tooltip content="Start a new analysis" position="left">
                   <button 
                     onClick={() => { 
                        if (window.confirm("Start a new scan? Current results will be saved to history.")) {
                          setStatus(LoadingState.IDLE); setResult(null); setPreviousResume(undefined); 
                          setJdFileName(null); setResumeFileName(null); setCompanyName('');
                          setJdText(''); setResumeText('');
                        }
                     }}
                     className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-1.5 font-medium"
                   >
                     <RefreshCw className="w-4 h-4" />
                     New Scan
                   </button>
                 </Tooltip>
                 <OnboardingTour />
                 <div className="h-6 w-px bg-slate-200 hidden sm:block" />
               </div>
             )}

             {/* User Auth Section */}
             {user ? (
               <div className="relative">
                 <button 
                   onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                   className="flex items-center gap-2 hover:bg-slate-50 p-1.5 rounded-full pr-3 transition-colors border border-transparent hover:border-slate-200"
                 >
                   {user.picture ? (
                     <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border border-slate-200" />
                   ) : (
                     <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                       {user.name.charAt(0)}
                     </div>
                   )}
                   <span className="text-sm font-medium text-slate-700 hidden md:block">{user.name.split(' ')[0]}</span>
                 </button>

                 {isProfileMenuOpen && (
                   <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 animate-in fade-in zoom-in-95 duration-200">
                     <div className="px-4 py-2 border-b border-slate-50 mb-1">
                       <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                       <p className="text-xs text-slate-500 truncate">{user.email}</p>
                     </div>
                     <button 
                       onClick={handleLogout}
                       className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                     >
                       <LogOut className="w-4 h-4" /> Sign Out
                     </button>
                   </div>
                 )}
               </div>
             ) : (
               <div id="google-signin-btn" className="h-10"></div>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 print:hidden">
        
        {/* Input Mode */}
        {status !== LoadingState.COMPLETE && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="text-center mb-10 max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-slate-900 mb-3">FAANG Resume IQ</h2>
              <p className="text-slate-600 text-lg">
                Upload your resume and the job description to get a detailed match score and actionable fixes.
              </p>
            </div>

            <div className="max-w-2xl mx-auto mb-8">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                   <div className="flex items-center justify-between mb-2">
                       <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                          <Building2 className="w-4 h-4 text-indigo-600" />
                          Target Company
                       </label>
                       <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full">Optional</span>
                   </div>
                   <input 
                     type="text" 
                     value={companyName}
                     onChange={(e) => setCompanyName(e.target.value)}
                     placeholder="Enter Company Name (e.g. Amazon, Google, Netflix)..."
                     className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-slate-800 placeholder-slate-400 font-medium transition-all"
                   />
                   <p className="text-xs text-slate-500 mt-2 ml-1">We'll analyze cultural fit based on this company's known values.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              <InputArea 
                type="jd"
                value={jdText}
                onChange={setJdText}
                onFileSelect={(file) => handleFileSelect(file, 'jd')}
                parsing={parsingFile === 'jd'}
              />
              <InputArea 
                type="resume"
                value={resumeText}
                onChange={setResumeText}
                onFileSelect={(file) => handleFileSelect(file, 'resume')}
                parsing={parsingFile === 'resume'}
              />
            </div>

            <div className="flex justify-center mb-16 relative z-10">
              <Tooltip content="Start AI Analysis" position="top">
               <button
                  onClick={handleAnalyze}
                  disabled={!jdText || !resumeText || !!parsingFile}
                  className="
                    flex items-center gap-2 px-10 py-4 rounded-xl font-bold text-lg shadow-xl shadow-indigo-500/20 transition-all transform hover:scale-105 hover:shadow-indigo-500/40
                    bg-indigo-600 text-white disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed ring-4 ring-indigo-50
                  "
                >
                  <Sparkles className="w-5 h-5" />
                  Scan & Optimize
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Tooltip>
            </div>

            {/* Recent Scans (Input Mode) */}
            {history.length > 0 && (
              <div className="max-w-4xl mx-auto mb-12 border-t border-slate-200 pt-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <History className="w-4 h-4" /> Recent Scans
                  </h3>
                  <button onClick={clearHistory} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Clear All
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {history.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => loadHistoryItem(item)}
                      className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all group relative flex flex-col"
                    >
                      <div className="flex justify-between items-start mb-2 gap-4">
                        <span className="font-bold text-slate-800 group-hover:text-indigo-700 truncate">{item.role}</span>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${item.score >= 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {item.score}% Match
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
                         <p className="text-xs text-slate-400">{item.date}</p>
                         <span className="text-xs font-medium text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            View Results <ArrowRight className="w-3 h-3" />
                         </span>
                      </div>
                      
                      {/* Delete Button */}
                      <button 
                        onClick={(e) => deleteHistoryItem(item.id, e)}
                        className="absolute -top-2 -right-2 bg-white p-1 text-slate-300 hover:text-red-500 shadow-sm border border-slate-100 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                        title="Remove from history"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dashboard Mode - Targeted View */}
        {status === LoadingState.COMPLETE && result && activeSection === 'dashboard' && (
           <TargetedResumeView 
             result={result}
             onReEvaluate={() => { setStatus(LoadingState.IDLE); setResult(null); setPreviousResume(undefined); setJdFileName(null); setResumeFileName(null); setCompanyName(''); setJdText(''); setResumeText(''); }}
             history={history}
             onLoadHistory={loadHistoryItem}
             onDeleteHistory={deleteHistoryItem}
             onNavigateToRewriter={() => setActiveSection('resume')}
             onAutoRewrite={handleAutoRewrite}
             onFixRequest={handleFixRequest}
             jdText={jdText}
             resumeText={resumeText}
           />
        )}

        {/* Resume Rewriter Mode - FAANG Copilot Only */}
        {status === LoadingState.COMPLETE && result && activeSection === 'resume' && (
           <div className="h-[calc(100vh-140px)] max-w-6xl mx-auto">
              <div className="w-full h-full flex flex-col">
                 <div className="flex items-center justify-between mb-2">
                   <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                     <Sparkles className="w-5 h-5 text-indigo-600" />
                     Resume Rewriter & Copilot
                   </h2>
                   <div className="flex gap-2">
                      <button 
                        onClick={handleAutoRewrite}
                        className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-bold transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Rewrite Full Resume (95%)
                      </button>
                   </div>
                 </div>
                 <ChatAssistant 
                    jdText={jdText} 
                    resumeText={resumeText} 
                    analysisResult={result} 
                    variant="sidebar"
                    triggerMessage={chatTriggerMessage}
                    onUpdateResume={handleResumeUpdate}
                    onUpdateScore={handleScoreUpdate}
                    onDownloadPdf={handlePrint}
                    onDownloadDoc={handleDownloadDoc}
                 />
              </div>
           </div>
        )}

      </main>
    </div>
  );
};

export default App;
