import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ChevronRight, 
  Activity, 
  Apple, 
  Zap, 
  Heart,
  ChevronLeft,
  ArrowUpRight
} from 'lucide-react';
import { Pet, HealthRecord } from '../types';
import { geminiAIService } from '../services/GeminiAIService';
import { ZoolInsight } from '../types';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

import { RuRuIcon } from './RuRuIcon';
import { useStore } from '../store/useStore';

interface ZoolInsightsProps {
  pets: Pet[];
  records: HealthRecord[];
  onAction?: (insight: ZoolInsight) => void;
}

export function ZoolInsights({ pets, records, onAction }: ZoolInsightsProps) {
  const { role } = useStore();
  const [insights, setInsights] = useState<ZoolInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      try {
        const data = await geminiAIService.getZoolInsights(pets, records);
        setInsights(data);
      } catch (error) {
        console.error("Failed to fetch insights", error);
        toast.error("RuRu is experiencing elevated neural load. Insights temporarily unavailable.");
      } finally {
        setLoading(false);
      }
    };

    if (pets.length > 0) {
      fetchInsights();
    } else {
      setLoading(false);
      setInsights([]);
    }
  }, [pets, records]);

  const nextInsight = () => {
    setActiveIndex((prev) => (prev + 1) % insights.length);
  };

  const prevInsight = () => {
    setActiveIndex((prev) => (prev - 1 + insights.length) % insights.length);
  };

  const currentInsight = insights[activeIndex];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'health': return <Activity size={20} />;
      case 'nutrition': return <Apple size={20} />;
      case 'behavior': return <Zap size={20} />;
      case 'wellness': return <Heart size={20} />;
      default: return <Sparkles size={20} />;
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-ruru-navy rounded-[2.5rem] p-10 h-64 flex flex-col items-center justify-center space-y-6 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-tr from-ruru-teal/10 to-transparent opacity-50" />
        <div className="relative">
          <RuRuIcon role={role} size={32} status="listening" />
          <div className="absolute inset-0 blur-xl bg-ruru-teal/30 animate-pulse" />
        </div>
        <div className="space-y-2 text-center relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-ruru-teal">Neural Synthesis</p>
          <p className="text-ruru-teal-pale/70 text-xs italic font-brand">Analyzing biometric footprints...</p>
        </div>
      </div>
    );
  }

  if (insights.length === 0) return null;

  return (
    <div className="relative group">
      <div className="absolute -inset-4 bg-ruru-teal/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
      
      <div className="bg-ruru-navy/90 text-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] relative overflow-hidden border border-ruru-teal/20 backdrop-blur-3xl">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-ruru-teal/20 via-ruru-magenta/10 to-transparent blur-[80px] rounded-full -mr-48 -mt-48 pointer-events-none mix-blend-screen" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-ruru-magenta/15 blur-[100px] rounded-full -ml-32 -mb-32 pointer-events-none mix-blend-screen" />
        
        {/* Header Section */}
        <div className="flex items-center justify-between mb-12 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-[1.25rem] bg-ruru-teal/20 flex items-center justify-center text-ruru-teal border border-ruru-teal/30 shadow-lg shadow-ruru-teal/10">
              <RuRuIcon role={role} size={24} status="idle" />
            </div>
            <div>
              <h3 className="text-2xl mt-1 font-brand tracking-tight text-ruru-pink-pale">ZooL Insights</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-ruru-teal/80">Personal Care Optimization</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={prevInsight}
              className="p-3 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all border border-white/5"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={nextInsight}
              className="p-3 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all border border-white/5"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Content Section with Transition */}
        <div className="relative h-64 md:h-56">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex flex-col md:flex-row gap-10 items-start"
            >
              <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start w-full"
            >
              <div className="flex-1 space-y-8">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-3 rounded-[1.25rem] bg-ruru-teal/10 text-ruru-teal shadow-inner border border-ruru-teal/20 backdrop-blur-md",
                    currentInsight.category === 'nutrition' && "bg-orange-500/10 text-orange-400 border-orange-500/20",
                    currentInsight.category === 'behavior' && "bg-purple-500/10 text-ruru-magenta border-ruru-magenta/20",
                    currentInsight.category === 'wellness' && "bg-pink-500/10 text-ruru-pink border-ruru-pink/20"
                  )}>
                    {getCategoryIcon(currentInsight.category)}
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50 font-mono">
                    {currentInsight.category} • Insight
                  </span>
                </div>

                <div className="space-y-5">
                  <h4 className="text-3xl md:text-4xl font-brand text-white leading-tight tracking-tight">
                    {currentInsight.title}
                  </h4>
                  <p className="text-white/70 leading-relaxed text-sm md:text-[15px] max-w-2xl font-light">
                    {currentInsight.description}
                  </p>
                </div>
              </div>

              <div className="flex flex-row md:flex-col items-center md:items-end justify-between self-stretch w-full md:w-56 mt-4 md:mt-0 p-6 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-md shadow-xl">
                <div className="text-left md:text-right w-full mb-0 md:mb-6 flex flex-col md:items-end">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mb-3">Priority level</p>
                  <div className={cn(
                    "inline-flex items-center px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-inner",
                    currentInsight.priority === 'high' 
                      ? "bg-ruru-magenta/20 text-ruru-pink-pale border-ruru-magenta/30" 
                      : "bg-white/10 text-white border-white/20"
                  )}>
                    <div className={cn("w-2 h-2 rounded-full mr-2", currentInsight.priority === 'high' ? "bg-ruru-pink-pale animate-pulse" : "bg-white")} />
                    {currentInsight.priority}
                  </div>
                </div>

                <button 
                  onClick={() => onAction?.(currentInsight)}
                  className="group/btn w-full md:w-auto relative px-8 py-4 bg-ruru-teal text-ruru-navy rounded-full text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 overflow-hidden shadow-lg shadow-ruru-teal/20 transition-all hover:scale-105 active:scale-95"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                  <span className="relative z-10">{currentInsight.actionLabel || "Explore"}</span>
                  <ArrowUpRight size={16} className="relative z-10 group-hover/btn:rotate-45 transition-transform" />
                </button>
              </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots Navigation */}
        <div className="flex gap-2 mt-8 relative z-10">
          {insights.map((_, idx) => (
            <button 
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={cn(
                "h-1 rounded-full transition-all duration-500",
                activeIndex === idx ? "w-8 bg-ruru-teal shadow-[0_0_10px_rgba(52,181,199,0.5)]" : "w-2 bg-white/10"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
