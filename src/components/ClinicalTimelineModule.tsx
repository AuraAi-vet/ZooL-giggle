import React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, CheckCircle2, FlaskConical, Calendar, AlertCircle, Sparkles } from 'lucide-react';

export type EventType = 'VISIT' | 'VACCINE' | 'LAB_RESULT' | 'UPCOMING';

export interface HealthEvent {
  id: string;
  date: string;
  type: EventType;
  title: string;
  summaryText: string;
  details?: string;
}

interface ClinicalTimelineModuleProps {
  events: HealthEvent[];
  className?: string;
}

export default function ClinicalTimelineModule({ events, className = "" }: ClinicalTimelineModuleProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [synthesis, setSynthesis] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  useEffect(() => {
    const fetchSynthesis = async () => {
      if (events.length === 0) return;
      setIsSynthesizing(true);
      try {
        const response = await fetch('/api/gemini/timeline-synthesis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events })
        });
        if (response.ok) {
          const data = await response.json();
          setSynthesis(data.response);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSynthesizing(false);
      }
    };
    
    // Only fetch if we haven't fetched yet for this render cycle
    if (!synthesis && !isSynthesizing) {
       fetchSynthesis();
    }
  }, [events]);

  const getTypeConfig = (type: EventType) => {
    switch (type) {
      case 'VISIT': return { icon: <CheckCircle2 size={16} />, color: "text-slate-600" };
      case 'VACCINE': return { icon: <AlertCircle size={16} />, color: "text-slate-600" };
      case 'LAB_RESULT': return { icon: <FlaskConical size={16} />, color: "text-slate-600" };
      case 'UPCOMING': return { icon: <Calendar size={16} />, color: "text-[#3B82F6]" };
    }
  };

  return (
    <div className={`bg-white rounded-3xl p-6 border border-slate-200 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-[#1E293B] font-display">Health Journey</h2>
      </div>

      {synthesis && (
        <div className="mb-6 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100/50 shadow-sm">
          <div className="flex gap-2 items-center text-indigo-700 font-bold text-xs uppercase tracking-wider mb-2">
            <Sparkles size={14} className="text-indigo-500" /> AI Snapshot
          </div>
          <p className="text-sm text-indigo-900/80 leading-relaxed font-medium">
            {synthesis}
          </p>
        </div>
      )}

      <div className="relative pl-6">
        {/* Timeline Spine */}
        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100" />

        <div className="flex flex-col gap-6">
          {events.map((event) => {
            const config = getTypeConfig(event.type);
            const isExpanded = expandedId === event.id;
            const isUpcoming = event.type === 'UPCOMING';

            return (
              <div key={event.id} className="relative">
                {/* Timeline Node */}
                <div className={`absolute -left-[30px] top-0 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center ${isUpcoming ? 'bg-[#3B82F6]' : 'bg-slate-300'}`}>
                  {React.cloneElement(config.icon, { size: 12, className: "text-white" })}
                </div>

                {/* Event Card */}
                <div 
                  className="bg-slate-50 rounded-2xl p-4 border border-slate-100 cursor-pointer hover:border-slate-200 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : event.id)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{event.date}</p>
                      <h3 className={`font-bold text-sm mt-1 ${isUpcoming ? 'text-[#3B82F6]' : 'text-[#1E293B]'}`}>{event.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">{event.summaryText}</p>
                    </div>
                    <motion.div 
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      className="text-slate-400"
                    >
                      <ChevronDown size={16} />
                    </motion.div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && event.details && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-600 leading-relaxed">
                          {event.details}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
