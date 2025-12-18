import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, User, Sparkles, Loader2, ChevronDown, Bot, ArrowRight, CheckCircle2, TrendingUp, Download, Printer, Copy, Check, RotateCcw } from 'lucide-react';
import { Chat, GenerateContentResponse } from '@google/genai';
import { createChatSession } from '../services/geminiService';
import { AnalysisResult } from '../types';
import MarkdownViewer from './MarkdownViewer';

interface ChatAssistantProps {
  jdText: string;
  resumeText: string;
  analysisResult: AnalysisResult | null;
  variant?: 'floating' | 'sidebar';
  triggerMessage?: string;
  onClearTrigger?: () => void;
  onClose?: () => void;
  onUpdateResume?: (newResume: string) => void;
  onUpdateScore?: (newScore: number) => void;
  onDownloadPdf?: () => void;
  onDownloadDoc?: () => void;
  onNewScan?: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

const INITIAL_PROMPTS = [
  "Rewrite resume (Target 95%)",
  "Add metrics to experience",
  "Write a cover letter",
  "Fix grammar errors"
];

const FOLLOW_UP_PROMPTS = [
  "Make it more concise",
  "Highlight leadership",
  "Use stronger verbs",
  "Check for keywords",
  "New Scan",
  "Copy Resume",
  "Download PDF",
  "Download Word"
];

const ChatAssistant: React.FC<ChatAssistantProps> = ({ 
  jdText, 
  resumeText, 
  analysisResult,
  variant = 'floating',
  triggerMessage,
  onClearTrigger,
  onClose,
  onUpdateResume,
  onUpdateScore,
  onDownloadPdf,
  onDownloadDoc,
  onNewScan
}) => {
  const isSidebar = variant === 'sidebar';
  const [isOpen, setIsOpen] = useState(isSidebar);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [isResumeUpdated, setIsResumeUpdated] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [localResumeUpdated, setLocalResumeUpdated] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastTriggerRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (triggerMessage && chatSession) {
      if (lastTriggerRef.current !== triggerMessage) {
        lastTriggerRef.current = triggerMessage;
        if (!isOpen) setIsOpen(true);
        handleSend(triggerMessage);
        onClearTrigger?.();
      }
    } else if (!triggerMessage) {
       lastTriggerRef.current = undefined;
    }
  }, [triggerMessage, chatSession, isOpen, onClearTrigger]);

  useEffect(() => {
    if ((isOpen || isSidebar) && !chatSession) {
      initializeChat();
    }
  }, [isOpen, isSidebar, chatSession]);

  const initializeChat = () => {
    try {
      const chat = createChatSession(resumeText, jdText, analysisResult);
      setChatSession(chat);
      if (messages.length === 0) {
        setMessages([
          {
            id: 'welcome',
            role: 'model',
            text: "Hi! I'm your Apply IQ Copilot. I've analyzed your resume against a job description. \n\n**How can I help you improve your score today?**",
            timestamp: new Date()
          }
        ]);
      }
    } catch (error) {
      console.error("Failed to init chat:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleSend = async (textOverride?: string) => {
    let textToSend = textOverride || input;
    let displayText = textToSend;
    
    if (textToSend === "New Scan" && onNewScan) {
      onNewScan();
      return;
    }

    if (textToSend === "Download PDF" && onDownloadPdf) {
      onDownloadPdf();
      setInput('');
      return;
    }
    if (textToSend === "Download Word" && onDownloadDoc) {
      onDownloadDoc();
      setInput('');
      return;
    }

    if (textToSend === "Copy Resume") {
      const textToCopy = analysisResult?.rewrittenResume || resumeText;
      navigator.clipboard.writeText(textToCopy);
      setInput('Resume copied to clipboard!');
      setTimeout(() => setInput(''), 2500);
      return;
    }
    
    if (textToSend === "ACTION_REWRITE_RESUME" || textToSend === "Rewrite resume (Target 95%)") {
      displayText = "Rewrite resume (Target 95%)";
      const currentResumeContent = analysisResult?.rewrittenResume || resumeText;
      textToSend = `You are an expert Resume Editor and Optimization AI. Revise the provided resume to maximize ATS score. 
                    Structure preservation is key. 
                    Full Resume to optimize:
                    ---
                    ${currentResumeContent}
                    ---
                    Target JD:
                    ---
                    ${jdText}
                    ---
                    Return the full optimized resume within <updated_resume> tags. Include [[SCORE:XX]] in your response.`;
    }

    if (!textToSend.trim()) return;
    
    let activeSession = chatSession;
    if (!activeSession) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: displayText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsResumeUpdated(false);
    setLocalResumeUpdated(false);

    try {
      const response = await activeSession.sendMessageStream({ message: textToSend });
      let fullText = '';
      const botMessageId = (Date.now() + 1).toString();
      
      setMessages(prev => [...prev, {
        id: botMessageId,
        role: 'model',
        text: '',
        timestamp: new Date()
      }]);

      for await (const chunk of response) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
          fullText += c.text;
          let displayableText = fullText.replace(/<\/?updated_resume>/g, '');
          displayableText = displayableText.replace(/\[\[SCORE:\d+\]\]/g, '');
          
          setMessages(prev => prev.map(msg => 
            msg.id === botMessageId ? { ...msg, text: displayableText || "Thinking..." } : msg
          ));

          if (!localResumeUpdated && onUpdateResume) {
             const resumeMatch = fullText.match(/<updated_resume>\s*([\s\S]*?)\s*<\/updated_resume>/i);
             if (resumeMatch && resumeMatch[1]) {
                const newResumeContent = resumeMatch[1].trim();
                if (newResumeContent.length > 50) {
                    onUpdateResume(newResumeContent);
                    setIsResumeUpdated(true);
                    setLocalResumeUpdated(true);
                    setTimeout(() => setIsResumeUpdated(false), 3000);
                }
             }
          }
        }
      }

      if (!localResumeUpdated && onUpdateResume) {
        const resumeMatch = fullText.match(/<updated_resume>\s*([\s\S]*?)\s*<\/updated_resume>/i);
        let newResumeContent = "";
        if (resumeMatch && resumeMatch[1]) {
           newResumeContent = resumeMatch[1].trim();
        } else if (fullText.length > 100 && (fullText.includes("Summary") || fullText.includes("Experience"))) {
           newResumeContent = fullText.trim();
        }

        if (newResumeContent.length > 50) {
            onUpdateResume(newResumeContent);
            setIsResumeUpdated(true);
            setTimeout(() => setIsResumeUpdated(false), 3000);
        }
      }

      const scoreMatch = fullText.match(/\[\[SCORE:(\d+)\]\]/);
      if (scoreMatch && scoreMatch[1] && onUpdateScore) {
        const newScore = parseInt(scoreMatch[1], 10);
        setLastScore(newScore);
        onUpdateScore(newScore);
      }

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "I'm sorry, I encountered an error processing your request.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleChat = () => {
    if (isSidebar) return;
    const newState = !isOpen;
    setIsOpen(newState);
    if (!newState && onClose) onClose();
  };

  const showSuggestions = !isLoading;
  const visiblePrompts = messages.length <= 1 ? INITIAL_PROMPTS : FOLLOW_UP_PROMPTS;

  const renderHeader = () => (
    <div className={`
      flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700 shrink-0 transition-colors
      ${isSidebar ? 'bg-white dark:bg-slate-800' : 'bg-slate-900 dark:bg-slate-800 text-white rounded-t-2xl'}
    `}>
      <div className="flex items-center gap-3">
        <div className={`
          p-2 rounded-lg flex items-center justify-center
          ${isSidebar ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-white/10 text-indigo-300'}
        `}>
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <h3 className={`font-bold text-sm ${isSidebar ? 'text-slate-800 dark:text-white' : 'text-white'}`}>
            Apply IQ Copilot
          </h3>
          <p className={`text-xs flex items-center gap-1.5 ${isSidebar ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Online
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
         {isSidebar && onNewScan && (
           <button 
             onClick={onNewScan}
             className="mr-2 text-[10px] font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1 bg-slate-50 dark:bg-slate-700 px-2 py-1 rounded transition-colors"
             title="Start a fresh scan"
           >
             <RotateCcw className="w-3 h-3" />
             NEW SCAN
           </button>
         )}
         {!isSidebar && (
           <button onClick={toggleChat} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
             <ChevronDown className="w-5 h-5" />
           </button>
         )}
      </div>
    </div>
  );

  const renderMessages = () => (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50 dark:bg-slate-900/50 transition-colors">
      {messages.map((msg) => (
        <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.role === 'user' ? 'bg-slate-200 dark:bg-slate-700' : 'bg-indigo-600 dark:bg-indigo-500'}`}>
            {msg.role === 'user' ? <User className="w-4 h-4 text-slate-600 dark:text-slate-300" /> : <Sparkles className="w-4 h-4 text-white" />}
          </div>
          <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm relative group ${msg.role === 'user' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-indigo-100 dark:border-slate-700 rounded-tl-none'}`}>
            {msg.role === 'model' ? <MarkdownViewer content={msg.text} /> : <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>}
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 text-right opacity-70">
              {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </p>
            {msg.role === 'model' && (
               <button onClick={() => copyToClipboard(msg.text, msg.id)} className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-slate-800/80 rounded-md backdrop-blur-sm">
                  {copiedMessageId === msg.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
               </button>
            )}
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex gap-3">
           <div className="w-8 h-8 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center shrink-0 mt-1">
              <Sparkles className="w-4 h-4 text-white" />
           </div>
           <div className="bg-white dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2">
             <div className="flex gap-1">
               <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
               <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
               <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
             </div>
           </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );

  const renderSuggestions = () => (
    showSuggestions && (
      <div className="px-4 pb-2 pt-2 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 transition-colors">
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">
          {messages.length <= 1 ? "Suggested Actions" : "What would you like to do next?"}
        </p>
        <div className="flex flex-wrap gap-2">
          {visiblePrompts.map((prompt, idx) => {
             const isDownload = prompt.startsWith("Download");
             const isCopy = prompt === "Copy Resume";
             const isNewScan = prompt === "New Scan";
             return (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  disabled={isLoading}
                  className={`text-xs border px-3 py-1.5 rounded-full transition-all shadow-sm active:scale-95 flex items-center gap-1.5 ${isNewScan ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-100' : isDownload || isCopy ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-600 dark:text-slate-300'}`}
                >
                  {isDownload && (prompt.includes("PDF") ? <Printer className="w-3 h-3" /> : <Download className="w-3 h-3" />)}
                  {isCopy && <Copy className="w-3 h-3" />}
                  {isNewScan && <RotateCcw className="w-3 h-3" />}
                  {prompt}
                </button>
             );
          })}
        </div>
      </div>
    )
  );

  const renderInput = () => (
    <div className={`p-4 bg-white dark:bg-slate-800 shrink-0 relative transition-colors ${showSuggestions ? '' : 'border-t border-slate-100 dark:border-slate-700'}`}>
      {isResumeUpdated && (
        <div className="absolute -top-10 left-0 right-0 flex justify-center animate-in fade-in slide-in-from-bottom-2 pointer-events-none">
          <div className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Resume Preview Updated
          </div>
        </div>
      )}
      {lastScore && isResumeUpdated && (
         <div className="absolute -top-20 left-0 right-0 flex justify-center animate-in fade-in slide-in-from-bottom-2 pointer-events-none" style={{ animationDelay: '100ms'}}>
           <div className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
             <TrendingUp className="w-3.5 h-3.5" /> Score Updated: {lastScore}
           </div>
         </div>
      )}
      <div className="relative flex items-end gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me to rewrite something..."
          className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 pr-12 text-sm focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/30 focus:border-indigo-500 dark:focus:border-indigo-500 focus:outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400 transition-all"
          disabled={isLoading}
        />
        <button 
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading}
          className="absolute right-2 bottom-2 p-1.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
      <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 mt-2">AI can make mistakes.</p>
    </div>
  );

  if (isSidebar) {
    return (
      <div className="flex flex-col h-[600px] lg:h-[calc(100vh-140px)] bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden sticky top-24 transition-colors">
        {renderHeader()}
        {renderMessages()}
        {renderSuggestions()}
        {renderInput()}
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300 mb-4 pointer-events-auto flex flex-col ${isOpen ? 'opacity-100 translate-y-0 w-[350px] sm:w-[400px] h-[600px]' : 'opacity-0 translate-y-10 w-[350px] h-0 pointer-events-none'}`}>
        {renderHeader()}
        {renderMessages()}
        {renderSuggestions()}
        {renderInput()}
      </div>
      <button onClick={toggleChat} className={`pointer-events-auto group bg-slate-900 dark:bg-white hover:bg-indigo-600 dark:hover:bg-indigo-400 text-white dark:text-slate-900 rounded-full p-4 shadow-xl transition-all duration-300 transform hover:scale-105 ${isOpen ? 'rotate-90 opacity-0 scale-0 w-0 h-0 p-0 overflow-hidden' : 'rotate-0 opacity-100 w-14 h-14'}`}>
        <MessageSquare className="w-6 h-6 group-hover:animate-pulse" />
      </button>
    </div>
  );
};

export default ChatAssistant;