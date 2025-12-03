
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { HistoryItem } from '../types';
import { TrendingUp } from 'lucide-react';

interface ScoreTrendChartProps {
  history: HistoryItem[];
}

const ScoreTrendChart: React.FC<ScoreTrendChartProps> = ({ history }) => {
  // Sort history by date ascending for the chart
  // Assuming history is stored [newest, ..., oldest], we reverse it.
  const data = [...history].reverse().map(item => ({
    date: item.date, // e.g. "10/24/2023"
    score: item.score,
    role: item.role
  }));

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-indigo-50 p-1.5 rounded-lg">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
        </div>
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Score Trend</h3>
      </div>
      <div className="h-[200px] w-full font-sans">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10 }} 
              dy={10}
            />
            <YAxis 
              domain={[0, 100]} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10 }} 
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '12px', 
                border: '1px solid #e2e8f0', 
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                fontSize: '12px',
                padding: '8px 12px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="#6366f1" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, fill: '#6366f1' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ScoreTrendChart;
