import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAILimit } from '../hooks/useAILimit';
import { Sparkles, AlertTriangle, Zap, Activity, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { AILogBatch } from '../services/geminiService';

export const AICostDashboard = () => {
  const { limitReached, usageCount, maxLimit, percentage, tokensUsed, history } = useAILimit();
  const isNearLimit = percentage > 80;

  return (
    <div className="bg-white/95 backdrop-blur-3xl border border-ruru-navy/10 rounded-[2rem] p-6 shadow-sm flex flex-col gap-6 max-h-[80vh] overflow-y-auto no-scrollbar">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-ruru-teal/10 flex items-center justify-center text-ruru-teal">
            <Sparkles size={20} />
          </div>
          <div>
            <h4 className="text-lg font-display font-semibold text-ruru-navy leading-tight">AI Telemetry</h4>
            <p className="text-xs text-ruru-navy/60 font-medium tracking-wide">Optimization & Usage Data</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#FDFBF7] p-4 rounded-[1.5rem] border border-ruru-navy/5 flex flex-col gap-1">
          <div className="flex items-center justify-between text-ruru-navy/50">
            <Zap size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Tokens</span>
          </div>
          <p className="text-2xl font-display font-semibold text-ruru-navy mt-1">{(tokensUsed || 0).toLocaleString()}</p>
          <p className="text-xs font-semibold text-ruru-navy/40">Estimated usage</p>
        </div>
        
        <div className="bg-[#FDFBF7] p-4 rounded-[1.5rem] border border-ruru-navy/5 flex flex-col gap-1">
          <div className="flex items-center justify-between text-ruru-navy/50">
            <Activity size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Credits</span>
          </div>
          <p className="text-2xl font-display font-semibold text-ruru-navy mt-1">
            {usageCount.toLocaleString()} <span className="text-sm text-ruru-navy/40">/ {maxLimit.toLocaleString()}</span>
          </p>
          <p className="text-xs font-semibold text-ruru-navy/40">Daily Budget</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-ruru-navy/60">Daily Limit Status</p>
          <span className={cn("text-xs font-bold", limitReached || isNearLimit ? "text-amber-600" : "text-emerald-600")}>
            {percentage}% Used
          </span>
        </div>
        
        <div className="w-full bg-[#F5F5F0] h-2.5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ type: 'spring', stiffness: 50, damping: 15 }}
            className={cn("h-full", limitReached || isNearLimit ? "bg-amber-500" : "bg-gradient-to-r from-emerald-400 to-teal-500")}
          />
        </div>

        <AnimatePresence>
          {(limitReached || isNearLimit) && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex items-start gap-3 text-amber-600 bg-amber-50 p-4 rounded-[1.5rem] border border-amber-200/50"
            >
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-800">Approaching Daily Limit</p>
                <p className="text-xs font-medium text-amber-700/80 mt-1">Cost optimization protocol engaged. Some AI features may gracefully degrade to rules-based fallback until reset.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-4 mt-2">
        <h5 className="text-[10px] font-black text-ruru-navy/40 uppercase tracking-[0.2em] px-1">Interaction History</h5>
        {history && history.length > 0 ? (
          <div className="flex flex-col gap-3">
            {history.slice(0, 8).map((log: AILogBatch, i: number) => (
              <div key={i} className="flex justify-between items-center bg-[#FDFBF7] border border-ruru-navy/5 p-3.5 rounded-[1.25rem]">
                 <div>
                    <p className="text-sm font-bold text-ruru-navy truncate max-w-[150px] sm:max-w-[200px]">{log.feature}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="text-[9px] font-semibold text-ruru-navy/40 uppercase tracking-widest bg-ruru-navy/5 px-2 py-0.5 rounded-lg">{(log.model || '').replace('gemini-2.5-', '')}</span>
                      <span className="text-[9px] font-semibold text-ruru-navy/40 uppercase tracking-widest flex items-center gap-1">
                        <Clock size={8} /> 
                        {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                      </span>
                    </div>
                 </div>
                 <div className="text-right flex flex-col items-end">
                    <span className="text-xs font-bold text-ruru-teal bg-ruru-teal/10 px-2.5 py-1 rounded-xl">~{log.tokensEstimated} t</span>
                    {log.costCredits && (
                      <span className="text-[10px] font-bold text-amber-600 mt-1">{log.costCredits} c</span>
                    )}
                 </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-ruru-navy/40">
            <Activity size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-xs font-semibold">No recent interactions.</p>
          </div>
        )}
      </div>
    </div>
  );
};
