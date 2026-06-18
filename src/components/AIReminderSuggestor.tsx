import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Plus, 
  Calendar, 
  Activity, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  X,
  ChevronRight,
  Info
} from 'lucide-react';
import { Pet, HealthRecord } from '../types';
import { getAIReminderSuggestions, SuggestedReminder } from '../services/geminiService';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface AIReminderSuggestorProps {
  pets: Pet[];
  records: HealthRecord[];
  onAccept: (reminder: SuggestedReminder) => Promise<void>;
}

export function AIReminderSuggestor({ pets, records, onAccept }: AIReminderSuggestorProps) {
  const [suggestions, setSuggestions] = useState<SuggestedReminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAIReminderSuggestions(pets, records);
      setSuggestions(data);
    } catch (err) {
      console.error("Failed to get suggestions", err);
      setError("Unable to generate suggestions at this moment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pets.length > 0 && suggestions.length === 0) {
      fetchSuggestions();
    }
  }, [pets.length]);

  const handleAccept = async (reminder: SuggestedReminder) => {
    try {
      await onAccept(reminder);
      setSuggestions(prev => prev.filter(s => !(s.petId === reminder.petId && s.title === reminder.title)));
      toast.success(`Reminder set for ${reminder.petName}: ${reminder.title}`);
    } catch (err) {
      toast.error("Failed to set reminder.");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'vaccination': return <ShieldCheck size={18} />;
      case 'checkup': return <Activity size={18} />;
      case 'medication': return <CheckCircle2 size={18} />;
      default: return <AlertCircle size={18} />;
    }
  };

  if (loading) {
    return (
      <div className="bg-ruru-navy rounded-[2.5rem] p-8 flex flex-col items-center justify-center space-y-4 h-48 relative overflow-hidden">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-ruru-teal-light"
        >
          <Sparkles size={32} />
        </motion.div>
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-ruru-teal-light/80">Processing Biometrics</p>
          <p className="text-white/40 text-xs mt-1">Calculating optimal health windows...</p>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0 && !loading) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-ruru-teal/20 flex items-center justify-center text-ruru-teal-light border border-ruru-teal-500/20">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-lg font-brand tracking-tight text-ruru-navy">AI Health Roadmap</h3>
            <p className="text-[9px] font-black uppercase tracking-widest text-ruru-navy/60">Proactive Prevention Suite</p>
          </div>
        </div>
        <button 
          onClick={fetchSuggestions}
          className="text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          Refresh Analysis
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {suggestions.map((suggestion, idx) => (
            <motion.div
              key={`${suggestion.petId}-${suggestion.title}`}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: idx * 0.1 }}
              className="group relative bg-white/95 backdrop-blur-3xl border border-ruru-navy/10 rounded-[2rem] p-6 pb-20 shadow-sm hover:shadow-xl transition-all duration-500"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={cn(
                  "w-12 h-12 rounded-[1.5rem] flex items-center justify-center shrink-0",
                  suggestion.priority === 'high' ? "bg-red-50 text-red-500" : "bg-emerald-50 text-ruru-teal"
                )}>
                  {getTypeIcon(suggestion.type)}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-[#FDFBF7] border border-ruru-navy/10 rounded-full text-ruru-navy/60">
                    {suggestion.petName}
                  </span>
                  {suggestion.priority === 'high' && (
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-red-500 flex items-center gap-1">
                      <Info size={10} /> Priority High
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-lg font-brand text-ruru-navy leading-tight">{suggestion.title}</h4>
                <p className="text-xs text-ruru-navy/60 leading-relaxed line-clamp-2 italic font-medium opacity-80">
                   {suggestion.reason}
                </p>
              </div>

              <div className="mt-4 flex items-center gap-3 text-[10px] font-black text-ruru-navy-light uppercase tracking-widest">
                <Calendar size={14} className="opacity-50" />
                Suggested: {suggestion.suggestedDate}
              </div>

              <div className="absolute bottom-6 left-6 right-6">
                <button 
                  onClick={() => handleAccept(suggestion)}
                  className="w-full h-12 bg-ruru-navy text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-[#141414] transition-all transform group-hover:scale-[1.02]"
                >
                  <Plus size={16} /> Set Reminder
                </button>
              </div>

              <button 
                onClick={() => setSuggestions(prev => prev.filter(s => s !== suggestion))}
                className="absolute top-4 right-[-8px] w-8 h-8 bg-white/95 backdrop-blur-3xl border border-ruru-navy/10 rounded-full flex items-center justify-center text-[#A8A29E] opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all translate-x-2 group-hover:translate-x-0"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
