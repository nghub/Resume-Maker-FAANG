
import React from 'react';
import { X, FileText, Trash2, Clock, Check, Plus } from 'lucide-react';
import { SavedResume } from '../types';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumes: SavedResume[];
  onSelect: (resume: SavedResume) => void;
  onDelete: (id: string) => void;
}

const LibraryModal: React.FC<LibraryModalProps> = ({ isOpen, onClose, resumes, onSelect, onDelete }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">My Resume Library</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select a version to reuse</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {resumes.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-300" />
              </div>
              <h4 className="font-bold text-slate-600 dark:text-slate-300">Your library is empty</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[200px] mx-auto">
                Save an optimized resume from the dashboard to see it here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {resumes.map((resume) => (
                <div 
                  key={resume.id}
                  className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-[0.99]"
                  onClick={() => onSelect(resume)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors truncate pr-8">
                      {resume.name}
                    </h4>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(resume.id); }}
                      className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {resume.updatedAt}
                    </div>
                    <div className="flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-500" />
                      Ready to Use
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700">
          <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
            Selected resumes will replace current input in Step 2.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LibraryModal;
