
import React, { useMemo } from 'react';
import { computeLineDiff } from '../services/diffService';

interface MarkdownViewerProps {
  content: string;
  previousContent?: string; // New prop to enable diffing
  highlightKeys?: string[];
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, previousContent, highlightKeys = [] }) => {
  
  // Memoize the diff computation so it doesn't run on every render unless text changes
  const linesToRender = useMemo(() => {
    if (!previousContent || previousContent === content) {
      // If no previous content or identical, return as is with no highlights
      return content.split('\n').map(line => ({ value: line, added: false }));
    }
    return computeLineDiff(previousContent, content);
  }, [content, previousContent]);

  // Helper to process text: handles markdown bolding (**text**) AND keyword highlighting
  const processText = (text: string) => {
    if (!text) return null;

    // 1. Split by Markdown Bold (**...**)
    const parts = text.split(/(\*\*.*?\*\*)/g);

    return parts.map((part, index) => {
      // Handle Bold
      if (part.startsWith('**') && part.endsWith('**')) {
        const innerText = part.slice(2, -2);
        return (
          <strong key={index} className="font-bold text-slate-900 dark:text-slate-100">
            {highlightKeywordsInText(innerText)}
          </strong>
        );
      }
      
      // Handle Normal Text
      return <span key={index}>{highlightKeywordsInText(part)}</span>;
    });
  };

  // Helper to highlight keywords within a string segment
  const highlightKeywordsInText = (textSegments: string): React.ReactNode[] => {
    if (!highlightKeys || highlightKeys.length === 0) return [textSegments];

    // Escape special regex characters
    const escapedKeys = highlightKeys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    // Create regex to match keywords bounded by word boundaries
    const pattern = new RegExp(`\\b(${escapedKeys.join('|')})\\b`, 'gi');
    
    const parts = textSegments.split(pattern);
    
    return parts.map((part, i) => {
      // Check if this part matches one of our keywords (case-insensitive)
      const isMatch = highlightKeys.some(k => k.toLowerCase() === part.toLowerCase());
      if (isMatch) {
        return (
          <span key={i} className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 px-1 rounded border border-emerald-200 dark:border-emerald-800 font-medium mx-0.5">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const renderLine = (line: string, i: number, isAdded: boolean) => {
    let content: React.ReactNode = null;
    const processedContent = processText(line.replace(/^#+\s|^-\s|^\*\s/, '')); // Strip markdown markers for processing
    
    // Basic Markdown Parsing Logic
    if (line.startsWith('# ')) {
      content = <h1 key={i} className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 mt-6 leading-tight">{processedContent}</h1>;
    } else if (line.startsWith('## ')) {
      content = <h2 key={i} className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3 mt-5 border-b border-slate-100 dark:border-slate-700 pb-1 leading-tight">{processedContent}</h2>;
    } else if (line.startsWith('### ')) {
      content = <h3 key={i} className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2 mt-4 leading-tight">{processedContent}</h3>;
    } else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      content = (
        <div key={i} className="flex items-start gap-2 mb-2 ml-1">
          <span className="mt-2 w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full shrink-0" />
          <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{processedContent}</span>
        </div>
      );
    } else if (!line.trim()) {
      content = <div key={i} className="h-3" />;
    } else {
      content = <p key={i} className="mb-2 text-slate-700 dark:text-slate-300 leading-relaxed">{processText(line)}</p>;
    }

    // Apply Highlight Wrapper ONLY if the line is marked as 'Added' (Modified)
    if (isAdded) {
      return (
        <div key={`diff-${i}`} className="bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500 pl-3 -ml-4 pr-2 py-1 rounded-r my-1 animate-in fade-in slide-in-from-left-1 duration-500 shadow-sm relative group">
           <div className="absolute left-[-24px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500 dark:text-emerald-400 text-xs font-bold px-1">
             NEW
           </div>
          {content}
        </div>
      );
    }

    return content;
  };

  return (
    <div className="prose prose-slate dark:prose-invert max-w-none text-sm md:text-base font-sans">
      {linesToRender.map((item, index) => renderLine(item.value, index, !!item.added))}
    </div>
  );
};

export default MarkdownViewer;
