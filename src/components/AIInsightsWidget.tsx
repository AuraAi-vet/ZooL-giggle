import { useEffect, useState } from 'react';
import { Sparkles, Activity, ShieldCheck, Lightbulb, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PetProfile } from '../types';

interface AIInsights {
  summary: string;
  recommendations: string[];
  wellbeingTips: string[];
  statusColor: 'emerald' | 'amber' | 'rose';
}

interface AIInsightsWidgetProps {
  pet: PetProfile;
}

export default function AIInsightsWidget({ pet }: AIInsightsWidgetProps) {
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/gemini/health-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petData: {
            name: pet.name,
            breed: pet.breed,
            age: pet.age,
            context: "Checking for daily wellness optimization."
          }
        }),
      });

      if (!response.ok) throw new Error('Insights temporarily unavailable.');
      const data = await response.json();
      setInsights(data);
    } catch (err) {
      console.error('AI Insights Error:', err);
      setError('Could not refresh insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [pet.petId]);

  return (
    <div className="bg-white rounded-3xl shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] border border-slate-200/60 overflow-hidden relative group transition-all duration-300 hover:border-indigo-200">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-bl-full blur-3xl pointer-events-none -mr-10 -mt-10 group-hover:bg-indigo-100/50 transition-colors"></div>

      <div className="p-6 border-b border-slate-100/50 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shadow-sm border border-indigo-100/50">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
             <h2 className="font-bold text-xl text-slate-800 font-display">Gema Intelligence</h2>
             <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">Automated Analysis</p>
          </div>
        </div>
        <button 
          onClick={fetchInsights}
          disabled={loading}
          className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-xl transition-all disabled:opacity-50 border border-slate-100 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-6 relative z-10">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="h-24 bg-slate-100/50 rounded-2xl animate-pulse"></div>
              <div className="h-32 bg-slate-100/50 rounded-2xl animate-pulse"></div>
            </motion.div>
          ) : error ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-10 text-center"
            >
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4 border border-rose-100 shadow-inner">
                 <AlertCircle className="w-8 h-8 text-rose-500" />
              </div>
              <p className="text-slate-600 font-bold max-w-xs">{error}</p>
              <button 
                onClick={fetchInsights}
                className="mt-4 px-4 py-2 bg-white text-xs font-bold text-slate-700 hover:text-indigo-600 border border-slate-200 rounded-xl shadow-sm transition-all"
              >
                Retry Gema Analysis
              </button>
            </motion.div>
          ) : insights ? (
            <motion.div 
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Summary */}
              <div className="p-5 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden group-hover:border-indigo-100 transition-colors">
                <div className={`absolute top-0 left-0 w-1.5 h-full ${
                  insights.statusColor === 'emerald' ? 'bg-emerald-500' : 
                  insights.statusColor === 'amber' ? 'bg-amber-500' : 'bg-rose-500'
                }`}></div>
                <div className="flex items-start gap-4 ml-1">
                  <div className="mt-1 flex-shrink-0 p-1.5 bg-white rounded-lg shadow-sm border border-slate-100">
                     <Activity className="w-4 h-4 text-indigo-500" />
                  </div>
                  <p className="text-slate-800 leading-relaxed font-medium text-sm">
                    {insights.summary}
                  </p>
                </div>
              </div>

              {/* Advanced Recommendations Bento split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="bg-blue-50/40 border border-blue-100/50 rounded-2xl p-5 shadow-sm">
                   <h3 className="flex items-center gap-2 text-[10px] font-bold text-blue-800/60 uppercase tracking-widest mb-4">
                     <ShieldCheck className="w-4 h-4" />
                     Clinical Protocol
                   </h3>
                   <ul className="space-y-3">
                     {insights.recommendations.map((rec, idx) => (
                       <li key={idx} className="flex items-start gap-3 text-sm text-slate-800 font-bold leading-snug">
                         <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                         {rec}
                       </li>
                     ))}
                   </ul>
                 </div>

                 <div className="bg-emerald-50/40 border border-emerald-100/50 rounded-2xl p-5 shadow-sm">
                   <h3 className="flex items-center gap-2 text-[10px] font-bold text-emerald-800/60 uppercase tracking-widest mb-4">
                     <Lightbulb className="w-4 h-4" />
                     Home Wellbeing
                   </h3>
                   <div className="flex flex-col gap-3">
                     {insights.wellbeingTips.map((tip, idx) => (
                       <div key={idx} className="flex items-start gap-3 text-sm text-slate-800 font-bold leading-snug">
                         <div className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[9px] font-black uppercase tracking-widest mt-0.5 shadow-sm">TIP</div>
                         {tip}
                       </div>
                     ))}
                   </div>
                 </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
