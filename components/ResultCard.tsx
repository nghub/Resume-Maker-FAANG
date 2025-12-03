import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Search } from 'lucide-react';

interface ResultCardProps {
  title: string;
  items: string[];
  type: 'success' | 'warning' | 'danger' | 'info';
}

const ResultCard: React.FC<ResultCardProps> = ({ title, items, type }) => {
  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'danger': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'info': return <Search className="w-5 h-5 text-blue-500" />;
    }
  };

  const getHeaderBg = () => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-100';
      case 'warning': return 'bg-yellow-50 border-yellow-100';
      case 'danger': return 'bg-red-50 border-red-100';
      case 'info': return 'bg-blue-50 border-blue-100';
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full">
      <div className={`px-4 py-3 border-b flex items-center gap-2 ${getHeaderBg()}`}>
        {getIcon()}
        <h3 className="font-semibold text-slate-800">{title}</h3>
      </div>
      <div className="p-4">
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ResultCard;