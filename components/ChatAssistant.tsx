
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, User, Sparkles, Loader2, ChevronDown, Bot, ArrowRight, CheckCircle2, TrendingUp, Download, Printer } from 'lucide-react';
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
  onClose?: () => void;
  onUpdateResume?: (newResume: string) => void;
  onUpdateScore?: (newScore: number) => void;
  onDownloadPdf?: () => void;
  onDownloadDoc?: () => void;
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
  "Download PDF",
  "Download Word"
];

const ChatAssistant: React.FC<ChatAssistantProps> = ({ 
  jdText, 
  resumeText, 
  analysisResult,
  variant = 'floating',
  triggerMessage,
  onClose,
  onUpdateResume,
  onUpdateScore,
  onDownloadPdf,
  onDownloadDoc
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle external triggers
  useEffect(() => {
    if (triggerMessage) {
      if (!isOpen) setIsOpen(true);
      // If chat session exists, process immediately. If not, rely on initialization effect.
      if (chatSession) {
         handleSend(triggerMessage);
      }
    }
  }, [triggerMessage]);

  // Re-trigger logic when chat session initializes and we have a pending trigger
  useEffect(() => {
     if (chatSession && triggerMessage && messages.length <= 1) { // <=1 because welcome message is 0 or 1
        // We check if we already processed this trigger to avoid loop
        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
        if (!lastUserMsg || lastUserMsg.text !== triggerMessage) {
           handleSend(triggerMessage);
        }
     }
  }, [chatSession, triggerMessage]);

  useEffect(() => {
    if (isSidebar && !isOpen) setIsOpen(true);
  }, [isSidebar, isOpen]);

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
            text: "Hi! I'm your FAANG Resume IQ Copilot. I've analyzed your resume against a job description. \n\n**How can I help you improve your score today?**",
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

  const handleSend = async (textOverride?: string) => {
    let textToSend = textOverride || input;
    
    // Intercept Download Actions
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
    
    // Map specific button label to full prompt
    if (textToSend === "Rewrite resume (Target 95%)") {
      textToSend = "Please rewrite my entire resume to align perfectly with the Job Description and achieve a 95% ATS match score. Fix all keywords, metrics, and formatting.";
    }

    if (!textToSend.trim()) return;
    
    // Race condition guard: if chat isn't ready, init it now
    let activeSession = chatSession;
    if (!activeSession) {
       try {
         activeSession = createChatSession(resumeText, jdText, analysisResult);
         setChatSession(activeSession);
       } catch (e) {
         console.error("Failed to auto-init chat on send:", e);
         return;
       }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsResumeUpdated(false);
    setLocalResumeUpdated(false);

    try {
      const response = await activeSession.sendMessageStream({ message: userMessage.text });
      
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
          
          // 1. Remove tags BUT KEEP CONTENT for display in chat since there is no preview pane
          // We strictly remove the XML tags themselves, not the content between them
          let displayableText = fullText.replace(/<\/?updated_resume>/g, '');
          
          // 2. Remove [[SCORE:XX]] tag for display
          displayableText = displayableText.replace(/\[\[SCORE:\d+\]\]/g, '');
          
          setMessages(prev => prev.map(msg => 
            msg.id === botMessageId ? { ...msg, text: displayableText || "Thinking..." } : msg
          ));

          // Check for resume completion tag inside stream for faster updates
          // Use a flag so we don't repeatedly trigger updates for the same block
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

      // --- Post-processing full text ---

      // A. Handle Resume Update (Safety check if missed during stream)
      if (!localResumeUpdated && onUpdateResume) {
        const resumeMatch = fullText.match(/<updated_resume>\s*([\s\S]*?)\s*<\/updated_resume>/i);
        if (resumeMatch && resumeMatch[1]) {
           const newResumeContent = resumeMatch[1].trim();
           if (newResumeContent.length > 50) {
              onUpdateResume(newResumeContent);
              setIsResumeUpdated(true);
              setTimeout(() => setIsResumeUpdated(false), 3000);
           }
        }
      }

      // B. Handle Score Update
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
        text: "I'm sorry, I encountered an error processing your request. Please check your connection and try again.",
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
      flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0
      ${isSidebar ? 'bg-white' : 'bg-slate-900 text-white rounded-t-2xl'}
    `}>
      <div className="flex items-center gap-3">
        <div className={`
          p-2 rounded-lg flex items-center justify-center
          ${isSidebar ? 'bg-indigo-50 text-indigo-600' : 'bg-white/10 text-indigo-300'}
        `}>
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <h3 className={`font-bold text-sm ${isSidebar ? 'text-slate-800' : 'text-white'}`}>
            FAANG Resume IQ Copilot
          </h3>
          <p className={`text-xs flex items-center gap-1.5 ${isSidebar ? 'text-slate-500' : 'text-slate-400'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Online
          </p>
        </div>
      </div>
      
      {!isSidebar && (
        <div className="flex items-center gap-1">
           <button 
             onClick={toggleChat}
             className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
           >
             <ChevronDown className="w-5 h-5" />
           </button>
        </div>
      )}
    </div>
  );

  const renderMessages = () => (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50">
      {messages.map((msg) => (
        <div 
          key={msg.id} 
          className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
        >
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1
            ${msg.role === 'user' ? 'bg-slate-200' : 'bg-indigo-600'}
          `}>
            {msg.role === 'user' ? (
              <User className="w-4 h-4 text-slate-600" />
            ) : (
              <Sparkles className="w-4 h-4 text-white" />
            )}
          </div>

          <div className={`
            max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm
            ${msg.role === 'user' 
              ? 'bg-white text-slate-800 border border-slate-200 rounded-tr-none' 
              : 'bg-white text-slate-700 border border-indigo-100 rounded-tl-none'}
          `}>
            {msg.role === 'model' ? (
              <MarkdownViewer content={msg.text} />
            ) : (
              <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
            )}
            <p className="text-[10px] text-slate-400 mt-2 text-right opacity-70">
              {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </p>
          </div>
        </div>
      ))}
      
      {isLoading && (
        <div className="flex gap-3">
           <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mt-1">
              <Sparkles className="w-4 h-4 text-white" />
           </div>
           <div className="bg-white border border-indigo-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2">
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
      <div className="px-4 pb-2 pt-2 bg-slate-50/50 border-t border-slate-100">
        <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
          {messages.length <= 1 ? "Suggested Actions" : "What would you like to do next?"}
        </p>
        <div className="flex flex-wrap gap-2">
          {visiblePrompts.map((prompt, idx) => {
             // Styling for download buttons to look distinct
             const isDownload = prompt.startsWith("Download");
             return (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  disabled={isLoading}
                  className={`
                    text-xs border px-3 py-1.5 rounded-full transition-all shadow-sm active:scale-95 flex items-center gap-1.5
                    ${isDownload 
                       ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100' 
                       : 'bg-white border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-600'}
                  `}
                >
                  {isDownload && (prompt.includes("PDF") ? <Printer className="w-3 h-3" /> : <Download className="w-3 h-3" />)}
                  {prompt}
                </button>
             );
          })}
        </div>
      </div>
    )
  );

  const renderInput = () => (
    <div className={`p-4 bg-white shrink-0 relative ${showSuggestions ? '' : 'border-t border-slate-100'}`}>
      
      {/* Resume Updated Notification */}
      {isResumeUpdated && (
        <div className="absolute -top-10 left-0 right-0 flex justify-center animate-in fade-in slide-in-from-bottom-2 pointer-events-none">
          <div className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Resume Preview Updated
          </div>
        </div>
      )}

      {/* Score Updated Notification (if we just got a score) */}
      {lastScore && isResumeUpdated && (
         <div className="absolute -top-20 left-0 right-0 flex justify-center animate-in fade-in slide-in-from-bottom-2 pointer-events-none" style={{ animationDelay: '100ms'}}>
           <div className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
             <TrendingUp className="w-3.5 h-3.5" />
             Score Updated: {lastScore}
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
          className="
            flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm 
            focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none 
            text-slate-700 placeholder-slate-400 transition-all
          "
          disabled={isLoading}
        />
        <button 
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading}
          className="
            absolute right-2 bottom-2 p-1.5 bg-indigo-600 text-white rounded-lg 
            hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm
          "
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
      <p className="text-[10px] text-center text-slate-400 mt-2">
        AI can make mistakes. Please review the output.
      </p>
    </div>
  );

  if (isSidebar) {
    return (
      <div className="flex flex-col h-[600px] lg:h-[calc(100vh-140px)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
        {renderHeader()}
        {renderMessages()}
        {renderSuggestions()}
        {renderInput()}
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      <div 
        className={`
          bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transition-all duration-300 mb-4 pointer-events-auto flex flex-col
          ${isOpen ? 'opacity-100 translate-y-0 w-[350px] sm:w-[400px] h-[600px]' : 'opacity-0 translate-y-10 w-[350px] h-0 pointer-events-none'}
        `}
      >
        {renderHeader()}
        {renderMessages()}
        {renderSuggestions()}
        {renderInput()}
      </div>

      <button
        onClick={toggleChat}
        className={`
          pointer-events-auto group
          bg-slate-900 hover:bg-indigo-600 text-white rounded-full p-4 shadow-xl transition-all duration-300 transform hover:scale-105
          ${isOpen ? 'rotate-90 opacity-0 scale-0 w-0 h-0 p-0 overflow-hidden' : 'rotate-0 opacity-100 w-14 h-14'}
        `}
        title="Open AI Assistant"
      >
        <MessageSquare className="w-6 h-6 group-hover:animate-pulse" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
      </button>
    </div>
  );
};

export default ChatAssistant;
