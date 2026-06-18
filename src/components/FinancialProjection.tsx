import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Sparkles, TrendingUp, DollarSign } from 'lucide-react';

const mockHistoricalData = [
  { month: 'Jan', revenue: 4200 },
  { month: 'Feb', revenue: 4800 },
  { month: 'Mar', revenue: 5100 },
  { month: 'Apr', revenue: 5400 },
  { month: 'May', revenue: 5900 },
];

const mockProjectionData = [
  ...mockHistoricalData,
  { month: 'Jun', revenue: 6400, isProjection: true },
  { month: 'Jul', revenue: 7100, isProjection: true },
  { month: 'Aug', revenue: 7600, isProjection: true },
];

export default function FinancialProjection() {
  const [data, setData] = useState(mockHistoricalData);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProjected, setIsProjected] = useState(false);

  const simulateAiAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setData(mockProjectionData);
      setIsAnalyzing(false);
      setIsProjected(true);
    }, 1500);
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            Financial Projections
          </h2>
          <p className="text-sm text-slate-500">Analyze booking history to predict future revenue trends.</p>
        </div>
        {!isProjected ? (
          <button 
            onClick={simulateAiAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
          >
            {isAnalyzing ? (
               <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
               <Sparkles className="w-4 h-4" />
            )}
            {isAnalyzing ? 'Analyzing Data...' : 'Run AI Projection'}
          </button>
        ) : (
          <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            AI Optimized
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3 flex flex-col gap-4">
           {isProjected && (
             <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 animate-in fade-in duration-500">
               <h3 className="text-sm font-bold text-slate-700 mb-2">AI Revenue Insights</h3>
               <p className="text-sm text-slate-600 mb-4">
                 Based on current booking velocities and seasonal trends, your expected revenue is projected to grow by <strong className="text-emerald-600">28%</strong> over the next quarter.
               </p>
               <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-indigo-50">
                 <span className="text-xs font-bold text-slate-500 uppercase">Q3 Projection</span>
                 <span className="font-bold text-indigo-700 flex items-center"><DollarSign className="w-4 h-4"/>21,100</span>
               </div>
             </div>
           )}
           
           <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-slate-700 mb-2">Current Quarter (Q2)</h3>
              <div className="text-2xl font-bold text-slate-900 flex items-center">
                <DollarSign className="w-6 h-6 text-slate-400" />16,400
              </div>
              <div className="text-xs font-medium text-emerald-600 mt-1">+14% compared to previous quarter</div>
           </div>
        </div>

        <div className="w-full md:w-2/3 h-[250px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
              <YAxis hide domain={['dataMin - 1000', 'dataMax + 1000']} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number, name: string, props: any) => [`$${value}`, props.payload.isProjection ? 'Projected Revenue' : 'Actual Revenue']}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#6366f1" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
