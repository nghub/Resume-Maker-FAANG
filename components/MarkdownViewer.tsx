
import React, { useMemo } from 'react';
import { computeLineDiff } from '../services/diffService';
import { VisualSettings } from '../types';

interface MarkdownViewerProps {
  content: string;
  previousContent?: string;
  highlightKeys?: string[];
  visualSettings?: VisualSettings;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ 
  content, 
  previousContent, 
  highlightKeys = [], 
  visualSettings 
}) => {
  
  const linesToRender = useMemo(() => {
    if (!previousContent || previousContent === content) {
      return content.split('\n').map(line => ({ value: line, added: false }));
    }
    return computeLineDiff(previousContent, content);
  }, [content, previousContent]);

  const fontClass = useMemo(() => {
    switch(visualSettings?.fontFamily) {
      case 'inter': return 'font-sans';
      case 'roboto': return 'font-sans'; // Using standard sans as placeholder
      case 'merriweather': return 'font-serif';
      case 'jetbrains': return 'font-mono';
      default: return 'font-sans';
    }
  }, [visualSettings?.fontFamily]);

  const sizeClass = useMemo(() => {
    switch(visualSettings?.fontSize) {
      case 'sm': return 'text-xs md:text-sm';
      case 'base': return 'text-sm md:text-base';
      case 'lg': return 'text-base md:text-lg';
      default: return 'text-sm md:text-base';
    }
  }, [visualSettings?.fontSize]);

  const leadingClass = useMemo(() => {
    switch(visualSettings?.lineHeight) {
      case 'tight': return 'leading-tight';
      case 'normal': return 'leading-normal';
      case 'relaxed': return 'leading-relaxed';
      default: return 'leading-normal';
    }
  }, [visualSettings?.lineHeight]);

  const accentColor = visualSettings?.primaryColor || '#4f46e5';

  const processText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const innerText = part.slice(2, -2);
        return (
          <strong key={index} className="font-bold text-slate-900 dark:text-slate-100">
            {highlightKeywordsInText(innerText)}
          </strong>
        );
      }
      return <span key={index}>{highlightKeywordsInText(part)}</span>;
    });
  };

  const highlightKeywordsInText = (textSegments: string): React.ReactNode[] => {
    if (!highlightKeys || highlightKeys.length === 0) return [textSegments];
    const escapedKeys = highlightKeys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = new RegExp(`\\b(${escapedKeys.join('|')})\\b`, 'gi');
    const parts = textSegments.split(pattern);
    return parts.map((part, i) => {
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
    const processedContent = processText(line.replace(/^#+\s|^-\s|^\*\s/, ''));
    
    if (line.startsWith('# ')) {
      content = (
        <h1 
          key={i} 
          className="text-2xl font-black mb-6 mt-8 tracking-tighter uppercase border-b-4 pb-2"
          style={{ borderColor: accentColor, color: visualSettings?.layout === 'modern' ? accentColor : 'inherit' }}
        >
          {processedContent}
        </h1>
      );
    } else if (line.startsWith('## ')) {
      content = (
        <h2 
          key={i} 
          className={`text-lg font-bold mb-4 mt-6 border-b border-slate-200 dark:border-slate-700 pb-1 ${visualSettings?.layout === 'minimal' ? '' : 'tracking-wide uppercase'}`}
          style={{ color: visualSettings?.layout === 'minimal' ? 'inherit' : accentColor }}
        >
          {processedContent}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      content = <h3 key={i} className="text-base font-bold text-slate-800 dark:text-slate-200 mb-2 mt-4">{processedContent}</h3>;
    } else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      content = (
        <div key={i} className="flex items-start gap-3 mb-2 ml-1">
          <span className="mt-2 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: accentColor }} />
          <span className="text-slate-700 dark:text-slate-300">{processedContent}</span>
        </div>
      );
    } else if (!line.trim()) {
      content = <div key={i} className="h-4" />;
    } else {
      content = <p key={i} className="mb-3 text-slate-700 dark:text-slate-300">{processText(line)}</p>;
    }

    if (isAdded) {
      return (
        <div key={`diff-${i}`} className="bg-emerald-50 dark:bg-emerald-900/10 border-l-2 border-emerald-500 pl-4 -ml-4 py-0.5 my-1 animate-in fade-in slide-in-from-left-1 duration-500">
          {content}
        </div>
      );
    }

    return content;
  };

  return (
    <div className={`max-w-none font-sans ${fontClass} ${sizeClass} ${leadingClass}`}>
      {linesToRender.map((item, index) => renderLine(item.value, index, !!item.added))}
    </div>
  );
};

export default MarkdownViewer;
