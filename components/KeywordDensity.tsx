
import React, { useMemo } from 'react';
import { BarChart2 } from 'lucide-react';

interface KeywordDensityProps {
  jdText: string;
  resumeText: string;
}

const STOP_WORDS = new Set([
  'and', 'the', 'to', 'of', 'a', 'in', 'for', 'is', 'on', 'with', 'as', 'by', 'at', 'an', 'be', 'this', 'that', 'it', 'from', 'or', 'are', 'have', 'has', 'was', 'but', 'not', 'will', 'can', 'my', 'your', 'we', 'they', 'he', 'she', 'if', 'their', 'what', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'know', 'take', 'person', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
  // Common Resume/JD headers/words that might not be keywords
  'experience', 'skills', 'education', 'summary', 'responsibilities', 'requirements', 'qualifications', 'job', 'position', 'role', 'company', 'candidate', 'description'
]);

const KeywordDensity: React.FC<KeywordDensityProps> = ({ jdText, resumeText }) => {
  const analyzeText = (text: string) => {
    if (!text) return [];
    // Remove punctuation, lowercase, split by whitespace
    const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    const frequency: Record<string, number> = {};
    let total = 0;

    words.forEach(word => {
      if (word.length > 2 && !STOP_WORDS.has(word) && !/^\d+$/.test(word)) {
        frequency[word] = (frequency[word] || 0) + 1;
        total++;
      }
    });

    return Object.entries(frequency)
      .map(([word, count]) => ({ word, count, density: total > 0 ? (count / total) * 100 : 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6); // Top 6 keywords
  };

  const jdKeywords = useMemo(() => analyzeText(jdText), [jdText]);
  const resumeKeywords = useMemo(() => analyzeText(resumeText), [resumeText]);

  // Create a map for easy lookup of resume stats based on JD top words
  const resumeMap = new Map(resumeKeywords.map(k => [k.word, k]));

  // Create comparison data based on top JD keywords
  const comparison = jdKeywords.map(jd => {
    // We calculate resume stats for this specific word even if it's not in the top resume words
    const resumeCount = (resumeText.toLowerCase().match(new RegExp(`\\b${jd.word}\\b`, 'gi')) || []).length;
    // Approximate total significant words for density calc (simplified)
    const resumeTotalWords = resumeText.split(/\s+/).length * 0.6; 
    const resumeDensity = resumeTotalWords > 0 ? (resumeCount / resumeTotalWords) * 100 : 0;

    return {
      word: jd.word,
      jdCount: jd.count,
      resumeCount: resumeCount,
      jdDensity: jd.density,
      resumeDensity: resumeDensity
    };
  });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/50">
        <BarChart2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Keyword Density</h3>
      </div>
      <div className="p-4">
        <div className="space-y-4">
          {comparison.map((item) => (
            <div key={item.word} className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                <span className="capitalize font-bold">{item.word}</span>
                <span className="text-slate-400 dark:text-slate-500">
                   JD: {item.jdCount} | You: {item.resumeCount}
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
                {/* JD Bar - Target */}
                <div 
                  className="h-full bg-indigo-400/40 dark:bg-indigo-500/30 relative group" 
                  style={{ width: `${Math.min(item.jdDensity * 8, 50)}%` }} 
                >
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                        JD Density: {item.jdDensity.toFixed(1)}%
                    </div>
                </div>
                
                {/* Resume Bar - Actual */}
                <div 
                  className={`h-full relative group ${item.resumeCount >= item.jdCount ? 'bg-emerald-500' : item.resumeCount > 0 ? 'bg-amber-500' : 'bg-red-400'}`}
                  style={{ width: `${Math.min(item.resumeDensity * 8, 50)}%` }}
                >
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                        Your Density: {item.resumeDensity.toFixed(1)}%
                    </div>
                </div>
              </div>
            </div>
          ))}
          {comparison.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-2">Add more text to analyze density patterns.</p>
          )}
        </div>
        <div className="mt-4 flex items-center justify-center gap-3 text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-50 dark:border-slate-700/50 pt-3">
            <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-indigo-300 opacity-50 rounded-sm"></div>
                <span>Target (JD)</span>
            </div>
            <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-sm"></div>
                <span>Good Match</span>
            </div>
            <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-amber-500 rounded-sm"></div>
                <span>Low Count</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default KeywordDensity;
