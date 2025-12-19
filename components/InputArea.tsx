
import React, { useState, useRef, DragEvent } from 'react';
import { Upload, FileText, Cloud, HardDrive, AlertCircle, Briefcase, FileUser, CheckCircle2, Wand2, BookMarked } from 'lucide-react';
import { pickFromDrive, isDriveAvailable } from '../services/driveService';

interface InputAreaProps {
  type: 'jd' | 'resume';
  value: string;
  onChange: (value: string) => void;
  onFileSelect: (file: File) => void;
  parsing: boolean;
  formatting?: boolean;
  onAutoFormat?: () => void;
  onOpenLibrary?: () => void;
}

const InputArea: React.FC<InputAreaProps> = ({ type, value, onChange, onFileSelect, parsing, formatting = false, onAutoFormat, onOpenLibrary }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isJD = type === 'jd';
  const theme = {
    primary: isJD ? 'indigo' : 'emerald',
    step: isJD ? 'Step 1' : 'Step 2',
    gradient: isJD 
      ? 'bg-gradient-to-br from-indigo-50 via-white to-indigo-50/30 dark:from-indigo-900/20 dark:via-slate-800 dark:to-indigo-900/10' 
      : 'bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 dark:from-emerald-900/20 dark:via-slate-800 dark:to-emerald-900/10',
    borderTop: isJD ? 'border-t-indigo-500' : 'border-t-emerald-500',
    border: isJD ? 'border-indigo-100 dark:border-indigo-900/30' : 'border-emerald-100 dark:border-emerald-900/30',
    headerBorder: isJD ? 'border-indigo-100 dark:border-indigo-900/30' : 'border-emerald-100 dark:border-emerald-900/30',
    headerBg: isJD ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : 'bg-emerald-50/50 dark:bg-emerald-900/20',
    text: isJD ? 'text-indigo-900 dark:text-indigo-200' : 'text-emerald-900 dark:text-emerald-200',
    iconColor: isJD ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400',
    ring: isJD ? 'focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20' : 'focus:ring-emerald-500/10 dark:focus:ring-emerald-500/20',
    uploadBtn: isJD 
      ? 'hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-600 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-300' 
      : 'hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300',
    iconBg: isJD ? 'bg-white dark:bg-slate-800 shadow-sm border border-indigo-100 dark:border-indigo-800' : 'bg-white dark:bg-slate-800 shadow-sm border border-emerald-100 dark:border-emerald-800',
  };

  const Icon = isJD ? Briefcase : FileUser;
  const title = isJD ? 'Job Description' : 'Your Resume';
  
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    if (e.dataTransfer.files?.length > 0) onFileSelect(e.dataTransfer.files[0]);
  };

  return (
    <div 
      className={`relative rounded-2xl shadow-sm border-x border-b border-t-4 transition-all duration-300 h-[500px] flex flex-col overflow-hidden group ${theme.gradient} ${theme.borderTop} ${theme.border} ${isDragging ? 'ring-4 ring-indigo-500/30' : ''}`}
      onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }} onDrop={handleDrop}
    >
      <div className={`px-6 py-5 border-b ${theme.headerBorder} ${theme.headerBg} flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl ${theme.iconBg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-6 h-6 ${theme.iconColor}`} aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${isJD ? 'bg-indigo-200/50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'bg-emerald-200/50 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'}`}>
                    {theme.step}
                </span>
                {value && <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-in zoom-in" />}
            </div>
            <h3 className={`font-bold text-base tracking-tight ${theme.text}`}>{title}</h3>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isJD && onOpenLibrary && (
             <button
               onClick={onOpenLibrary}
               aria-label="Load from your resume library"
               className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800 shadow-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-indigo-500"
             >
                <BookMarked className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">My Library</span>
             </button>
          )}

          {!isJD && onAutoFormat && value && !parsing && (
             <button
               onClick={onAutoFormat}
               disabled={formatting}
               aria-label="Format your resume using AI"
               className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800 shadow-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 transition-all active:scale-95 disabled:opacity-50"
             >
                <Wand2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Format</span>
             </button>
          )}

          <input type="file" ref={fileInputRef} className="hidden" accept=".txt,.md,.pdf,.docx" onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])} />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={parsing || formatting}
            className={`group/btn flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm transition-all active:scale-95 ${theme.uploadBtn}`}
          >
             <Upload className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
             <span>Upload</span>
          </button>

          {isDriveAvailable && (
            <button
              onClick={async () => { try { await pickFromDrive(); } catch(e: any) { if (e.file) onFileSelect(e.file); } }}
              disabled={parsing || formatting}
              className="group/drive p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:bg-blue-50 transition-all active:scale-95"
            >
              <HardDrive className="w-4 h-4 text-blue-600 group-hover/drive:scale-110 transition-transform" />
            </button>
          )}
        </div>
      </div>

      <div className="relative flex-1 flex flex-col">
        <textarea
          className={`flex-1 w-full p-6 resize-none focus:outline-none text-sm leading-relaxed text-slate-700 dark:text-slate-300 bg-transparent ${theme.ring} focus:ring-2 font-medium placeholder:text-slate-400/70`}
          placeholder={isJD ? "Paste JD here..." : "Paste Resume here..."}
          aria-label={title}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
        />

        {(parsing || formatting) && (
          <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center animate-in fade-in">
            <div className={`w-12 h-12 border-4 border-t-indigo-500 border-slate-200 dark:border-slate-700 rounded-full animate-spin`} />
            <p className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-200">{formatting ? "Formatting..." : "Parsing..."}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InputArea;
