
import React, { useState, useRef, DragEvent } from 'react';
import { Upload, FileText, Cloud, HardDrive, AlertCircle, Briefcase, FileUser, CheckCircle2, Wand2, Loader2 } from 'lucide-react';
import { pickFromDrive, isDriveAvailable } from '../services/driveService';

interface InputAreaProps {
  type: 'jd' | 'resume';
  value: string;
  onChange: (value: string) => void;
  onFileSelect: (file: File) => void;
  parsing: boolean;
  formatting?: boolean;
  onAutoFormat?: () => void;
}

const InputArea: React.FC<InputAreaProps> = ({ type, value, onChange, onFileSelect, parsing, formatting = false, onAutoFormat }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isJD = type === 'jd';
  
  // Theme configurations with stronger distinction including Dark Mode
  const theme = {
    primary: isJD ? 'indigo' : 'emerald',
    step: isJD ? 'Step 1' : 'Step 2',
    gradient: isJD 
      ? 'bg-gradient-to-br from-indigo-50 via-white to-indigo-50/30 dark:from-indigo-900/20 dark:via-slate-800 dark:to-indigo-900/10' 
      : 'bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 dark:from-emerald-900/20 dark:via-slate-800 dark:to-emerald-900/10',
    borderTop: isJD ? 'border-t-indigo-500' : 'border-t-emerald-500',
    border: isJD ? 'border-indigo-100 dark:border-indigo-900/30' : 'border-emerald-100 dark:border-emerald-900/30',
    focusBorder: isJD ? 'focus:border-indigo-400 dark:focus:border-indigo-500' : 'focus:border-emerald-400 dark:focus:border-emerald-500',
    headerBorder: isJD ? 'border-indigo-100 dark:border-indigo-900/30' : 'border-emerald-100 dark:border-emerald-900/30',
    headerBg: isJD ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : 'bg-emerald-50/50 dark:bg-emerald-900/20',
    text: isJD ? 'text-indigo-900 dark:text-indigo-200' : 'text-emerald-900 dark:text-emerald-200',
    subText: isJD ? 'text-indigo-600/80 dark:text-indigo-400/80' : 'text-emerald-600/80 dark:text-emerald-400/80',
    iconColor: isJD ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400',
    ring: isJD ? 'focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20' : 'focus:ring-emerald-500/10 dark:focus:ring-emerald-500/20',
    uploadBtn: isJD 
      ? 'hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-600 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-300' 
      : 'hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300',
    iconBg: isJD ? 'bg-white dark:bg-slate-800 shadow-sm border border-indigo-100 dark:border-indigo-800' : 'bg-white dark:bg-slate-800 shadow-sm border border-emerald-100 dark:border-emerald-800',
  };

  const Icon = isJD ? Briefcase : FileUser;
  const title = isJD ? 'Job Description' : 'Your Resume';
  const subtitle = isJD ? 'Paste the job posting here' : 'Paste or upload your resume';
  const placeholder = isJD 
    ? "Paste Job Description text here, or drag & drop a file..." 
    : "Paste Resume text here, or drag & drop a PDF/DOCX...";

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleGoogleDrivePick = async () => {
    setDriveError(null);
    try {
      try {
        await pickFromDrive();
      } catch (result: any) {
        // The driveService throws an object { file: File } on success to pass the file object back
        if (result.file) {
          onFileSelect(result.file);
        } else if (result.message) {
            if (result.message.includes("Client ID")) {
               setDriveError("Missing Google Client ID config.");
            } else if (result.message !== "Selection cancelled") {
               setDriveError("Drive selection failed.");
            }
        }
      }
    } catch (error) {
      console.error("Drive Error:", error);
      setDriveError("Failed to connect to Drive.");
    }
  };

  return (
    <div 
      className={`
        relative rounded-2xl shadow-sm border-x border-b border-t-4 transition-all duration-300 h-[500px] flex flex-col overflow-hidden group
        ${theme.gradient} ${theme.borderTop} ${theme.border}
        ${isDragging ? `ring-4 ring-opacity-50 ${isJD ? 'ring-indigo-200 dark:ring-indigo-900' : 'ring-emerald-200 dark:ring-emerald-900'}` : 'hover:shadow-md dark:hover:shadow-none dark:hover:border-opacity-80'}
      `}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className={`px-6 py-5 border-b ${theme.headerBorder} ${theme.headerBg} flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl ${theme.iconBg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-6 h-6 ${theme.iconColor}`} />
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
          {/* Smart Format Button (Resume Only) */}
          {!isJD && onAutoFormat && value && !parsing && (
             <button
               onClick={onAutoFormat}
               disabled={formatting}
               className="
                 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border 
                 bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800 shadow-sm text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all active:scale-95 disabled:opacity-50
               "
               title="Validate & Auto-Format Resume"
             >
                <Wand2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Smart Format</span>
             </button>
          )}

          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept=".txt,.md,.pdf,.docx" 
            onChange={handleFileChange} 
            disabled={parsing || formatting}
          />
          
          {/* Enhanced Upload Button */}
          <button
            onClick={triggerFileUpload}
            disabled={parsing || formatting}
            className={`
              group/btn flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm 
              transition-all duration-200 disabled:opacity-50 active:scale-95
              ${theme.uploadBtn}
            `}
            title="Upload from Device"
          >
             <div className={`p-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover/btn:scale-105 transition-transform`}>
                <Upload className="w-3.5 h-3.5" />
             </div>
             <span className="mr-1">Upload</span>
          </button>

          {/* Google Drive Button - Only shown if configured */}
          {isDriveAvailable && (
            <button
              onClick={handleGoogleDrivePick}
              disabled={parsing || formatting}
              className="
                group/drive flex items-center justify-center p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm
                hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800 transition-all disabled:opacity-50
              "
              title="Select from Google Drive"
            >
              <div className="w-4 h-4 relative flex items-center justify-center grayscale group-hover/drive:grayscale-0 transition-all">
                  <HardDrive className="w-full h-full text-blue-600 dark:text-blue-400" /> 
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Drive Error Toast */}
      {driveError && (
        <div className="absolute top-20 right-4 z-40 bg-red-50 dark:bg-red-900/80 text-red-600 dark:text-red-200 px-3 py-2 rounded-lg text-xs font-medium border border-red-100 dark:border-red-800 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-3.5 h-3.5" />
          {driveError}
          <button onClick={() => setDriveError(null)} className="ml-2 hover:bg-red-100 dark:hover:bg-red-800/50 p-0.5 rounded">×</button>
        </div>
      )}

      {/* Content Area */}
      <div className="relative flex-1 flex flex-col">
        <textarea
          className={`
            flex-1 w-full p-6 resize-none focus:outline-none text-sm leading-relaxed text-slate-700 dark:text-slate-300 bg-transparent
            ${theme.ring} focus:ring-2 focus:z-10 transition-shadow font-medium
            placeholder:text-slate-400/70 dark:placeholder:text-slate-500/70
            ${isDragging ? 'opacity-50' : 'opacity-100'}
          `}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
        />

        {/* Loading / Parsing Overlay */}
        {(parsing || formatting) && (
          <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center animate-in fade-in duration-300">
            <div className="relative mb-6">
               {/* Document Icon */}
               <div className={`w-16 h-20 border-2 ${isJD ? 'border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-900/30' : 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/30'} rounded-lg flex items-center justify-center overflow-hidden shadow-sm`}>
                  {formatting ? (
                     <Wand2 className={`w-8 h-8 ${isJD ? 'text-indigo-300 dark:text-indigo-500' : 'text-emerald-300 dark:text-emerald-500'} animate-pulse`} />
                  ) : (
                     <FileText className={`w-8 h-8 ${isJD ? 'text-indigo-300 dark:text-indigo-500' : 'text-emerald-300 dark:text-emerald-500'}`} />
                  )}
                  
                  {/* Scanning Line */}
                  <div className={`absolute w-full h-1 ${isJD ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'} top-0 animate-[scan_2s_ease-in-out_infinite]`} />
               </div>
            </div>

            <div className="text-center space-y-1">
              <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                 {formatting ? "Smart Formatting..." : "Parsing Document..."}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                 {formatting ? "Standardizing layout & headers" : "Extracting text & structure"}
              </p>
            </div>
          </div>
        )}

        {/* Drag Overlay Message */}
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
             <div className="absolute inset-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-200">
              <div className={`p-3 rounded-full bg-white dark:bg-slate-700 shadow-md mb-3`}>
                <Cloud className={`w-8 h-8 ${theme.iconColor}`} />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-white text-lg">Drop file here</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">We'll extract the text automatically</p>
            </div>
          </div>
        )}

        {/* Empty State Hint */}
        {!value && !isDragging && !parsing && !formatting && (
          <div className="absolute bottom-4 right-6 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
             <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400/80 dark:text-slate-500 uppercase tracking-wider">
               <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
               Supports PDF, DOCX, TXT
             </div>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default InputArea;
