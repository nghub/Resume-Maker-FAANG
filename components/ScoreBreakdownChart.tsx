import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CategoryScore } from '../types';

interface ScoreBreakdownChartProps {
  data: CategoryScore[];
}

const ScoreBreakdownChart: React.FC<ScoreBreakdownChartProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
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
             <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
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
               cursor={{ fill: '#f8fafc' }}
               contentStyle={{ 
                 borderRadius: '12px', 
                 border: '1px solid #e2e8f0', 
                 boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                 fontSize: '12px',
                 padding: '8px 12px'
               }}
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