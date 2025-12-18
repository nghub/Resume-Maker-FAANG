
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CategoryScore } from '../types';

interface ScoreBreakdownChartProps {
  data: CategoryScore[];
}

const ScoreBreakdownChart: React.FC<ScoreBreakdownChartProps> = ({ data }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm transition-colors">
      <h3 className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">
        Score Breakdown
      </h3>
      <div className="h-[220px] w-full font-sans">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            layout="vertical" 
            margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
            barCategoryGap={15}
          >
             <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
             <XAxis type="number" domain={[0, 100]} hide />
             <YAxis 
               dataKey="category" 
               type="category" 
               width={110} 
               tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} 
               tickLine={false}
               axisLine={false}
             />
             <Tooltip 
               cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
               contentStyle={{ 
                 borderRadius: '12px', 
                 border: '1px solid rgba(255,255,255,0.1)', 
                 boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                 fontSize: '12px',
                 padding: '8px 12px',
                 backgroundColor: '#1e293b', // Slate 800
                 color: '#f8fafc' // Slate 50
               }}
               itemStyle={{ color: '#f8fafc' }}
             />
             <Bar 
                dataKey="score" 
                radius={[0, 4, 4, 0]} 
                barSize={24}
                animationDuration={1500}
             >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.score >= 80 ? '#10b981' : entry.score >= 50 ? '#f59e0b' : '#ef4444'} 
                  />
                ))}
             </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ScoreBreakdownChart;
