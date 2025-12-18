
import React, { useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'error', onClose, duration = 5000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-slate-800 dark:border-emerald-500/50 dark:text-emerald-400';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-slate-800 dark:border-blue-500/50 dark:text-blue-400';
      case 'error':
      default:
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-slate-800 dark:border-red-500/50 dark:text-red-400';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />;
      case 'info': return <Info className="w-5 h-5 text-blue-500 dark:text-blue-400" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />;
    }
  };

  return (
    <div className={`fixed top-24 right-4 z-[100] max-w-md w-full flex items-start gap-3 p-4 rounded-xl border shadow-lg shadow-slate-200/50 dark:shadow-black/50 animate-in slide-in-from-right-5 duration-300 backdrop-blur-sm ${getStyles()}`}>
      <div className="shrink-0 mt-0.5">{getIcon()}</div>
      <div className="flex-1 text-sm font-medium leading-relaxed dark:text-slate-200">{message}</div>
      <button 
        onClick={onClose}
        className="shrink-0 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
