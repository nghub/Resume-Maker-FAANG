
import React from 'react';
import { Type, Palette, Layout, TextSelect, AlignLeft, Settings2 } from 'lucide-react';
import { VisualSettings } from '../types';

interface ResumeCustomizerProps {
  settings: VisualSettings;
  onChange: (settings: VisualSettings) => void;
}

const FONTS = [
  { id: 'inter', name: 'Sans (Inter)', class: 'font-sans' },
  { id: 'roboto', name: 'Modern (Roboto)', class: 'font-sans' },
  { id: 'merriweather', name: 'Serif (Classic)', class: 'font-serif' },
  { id: 'jetbrains', name: 'Mono (Tech)', class: 'font-mono' },
];

const COLORS = [
  { id: '#4f46e5', name: 'Indigo' },
  { id: '#0f172a', name: 'Slate' },
  { id: '#059669', name: 'Emerald' },
  { id: '#2563eb', name: 'Blue' },
  { id: '#7c3aed', name: 'Violet' },
];

const LAYOUTS = [
  { id: 'classic', name: 'Classic' },
  { id: 'modern', name: 'Modern' },
  { id: 'minimal', name: 'Minimal' },
];

const ResumeCustomizer: React.FC<ResumeCustomizerProps> = ({ settings, onChange }) => {
  const updateSetting = (key: keyof VisualSettings, value: any) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="p-4 space-y-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-right-2">
      <div className="flex items-center gap-2 mb-2">
        <Settings2 className="w-4 h-4 text-indigo-600" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Appearance</h3>
      </div>

      {/* Font Family */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2 uppercase">
          <Type className="w-3.5 h-3.5" /> Typography
        </label>
        <div className="grid grid-cols-2 gap-2">
          {FONTS.map((font) => (
            <button
              key={font.id}
              onClick={() => updateSetting('fontFamily', font.id)}
              className={`px-3 py-2 text-xs rounded-lg border transition-all text-left ${
                settings.fontFamily === font.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300'
              } ${font.class}`}
            >
              {font.name}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Color */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2 uppercase">
          <Palette className="w-3.5 h-3.5" /> Accent Color
        </label>
        <div className="flex gap-2">
          {COLORS.map((color) => (
            <button
              key={color.id}
              onClick={() => updateSetting('primaryColor', color.id)}
              className={`w-8 h-8 rounded-full border-2 transition-transform active:scale-90 ${
                settings.primaryColor === color.id ? 'border-indigo-500 scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: color.id }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Layout Selection */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2 uppercase">
          <Layout className="w-3.5 h-3.5" /> Template
        </label>
        <div className="flex gap-2">
          {LAYOUTS.map((l) => (
            <button
              key={l.id}
              onClick={() => updateSetting('layout', l.id)}
              className={`flex-1 px-3 py-2 text-xs font-bold rounded-lg border transition-all ${
                settings.layout === l.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300'
              }`}
            >
              {l.name}
            </button>
          ))}
        </div>
      </div>

      {/* Font Size & Line Height */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2 uppercase">
            <TextSelect className="w-3.5 h-3.5" /> Size
          </label>
          <select
            value={settings.fontSize}
            onChange={(e) => updateSetting('fontSize', e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="sm">Small</option>
            <option value="base">Normal</option>
            <option value="lg">Large</option>
          </select>
        </div>
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2 uppercase">
            <AlignLeft className="w-3.5 h-3.5" /> Spacing
          </label>
          <select
            value={settings.lineHeight}
            onChange={(e) => updateSetting('lineHeight', e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="tight">Tight</option>
            <option value="normal">Standard</option>
            <option value="relaxed">Relaxed</option>
          </select>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
        <p className="text-[10px] text-slate-400 dark:text-slate-500 italic leading-tight">
          Visual settings are optimized for high-performance ATS readability and professional presentation.
        </p>
      </div>
    </div>
  );
};

export default ResumeCustomizer;
