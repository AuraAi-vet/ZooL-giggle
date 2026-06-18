import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAILimit } from '../hooks/useAILimit';
import { Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';

export function AILimitIndicator() {
  const { usageCount, maxLimit, percentage, limitReached } = useAILimit();
  const { userProfile } = useStore();
  const isPremium = userProfile?.isPremium || false;

  // Determine color based on percentage
  const getColorClasses = () => {
    if (limitReached || percentage >= 100) return 'text-red-500 bg-red-50 border-red-200';
    if (percentage >= 80) return 'text-amber-500 bg-amber-50 border-amber-200';
    return isPremium ? 'text-amber-600 bg-amber-50/80 border-amber-200/50' : 'text-slate-500 bg-white/80 border-slate-200';
  };

  const getProgressColorClasses = () => {
    if (limitReached || percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-amber-500';
    return isPremium ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-emerald-400 to-teal-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="pointer-events-none"
    >
      <div className={cn("pointer-events-auto flex items-center gap-3 px-3 py-1 rounded-full shadow-sm border transition-colors duration-300", getColorClasses())}>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]">
          {limitReached ? (
            <AlertCircle size={12} className="animate-pulse" />
          ) : (
            <Sparkles size={12} className={isPremium ? "text-amber-500" : "text-emerald-500"} />
          )}
          <span>{isPremium ? 'Premium AI' : 'AI Access'}</span>
          <span className="font-mono text-[10px] opacity-70 ml-1">
            {Math.floor(usageCount)}/{maxLimit}
          </span>
        </div>
        
        {/* Progress Bar Track */}
        <div className="w-16 h-1 bg-black/10 rounded-full overflow-hidden shrink-0">
          {/* Progress Bar Fill */}
          <motion.div 
            className={cn("h-full rounded-full", getProgressColorClasses())}
            initial={{ width: 0 }}
            animate={{ width: percentage + '%' }}
            transition={{ type: 'spring', stiffness: 50, damping: 15 }}
          />
        </div>
      </div>
    </motion.div>
  );
}
