import React from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, 
  ChevronRight, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  Activity,
  History
} from 'lucide-react';
import { HealthRecord, Pet } from '../types';
import { cn } from '../lib/utils';

interface PreventiveCareProps {
  records: HealthRecord[];
  pets: Pet[];
  onAction?: (record: HealthRecord) => void;
}

export function PreventiveCare({ records, pets, onAction }: PreventiveCareProps) {
  // Filter for upcoming items (reminders or future nextDueDate)
  const timelineItems = React.useMemo(() => {
    const now = new Date();
    
    const upcoming = records
      .filter(r => r.nextDueDate && new Date(r.nextDueDate) >= now)
      .sort((a, b) => new Date(a.nextDueDate!).getTime() - new Date(b.nextDueDate!).getTime());

    const recent = records
      .filter(r => new Date(r.date) <= now)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);

    return { upcoming, recent };
  }, [records]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
           <Activity size={18} className="text-ruru-navy-light" />
           <h3 className="font-brand text-xl text-ruru-navy">Care Timeline</h3>
        </div>
        <div className="flex gap-2">
           <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-ruru-teal-100">
             {timelineItems.upcoming.length} Upcoming
           </span>
        </div>
      </div>

      <div className="relative">
        {/* The Vertical Line */}
        <div className="absolute left-[21px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-ruru-navy-light/30 to-transparent dashed" style={{ backgroundImage: 'linear-gradient(to bottom, #EBEBE0 50%, transparent 50%)', backgroundSize: '1px 8px' }} />

        <div className="space-y-8">
          {timelineItems.upcoming.length > 0 ? (
            timelineItems.upcoming.map((item, idx) => {
              const pet = pets.find(p => p.id === item.petId);
              const daysLeft = Math.ceil((new Date(item.nextDueDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              
              return (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative pl-12 group cursor-pointer"
                  onClick={() => onAction?.(item)}
                >
                  {/* Timeline Dot */}
                  <div className="absolute left-0 top-1.5 w-11 h-11 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-white/95 backdrop-blur-3xl border-4 border-amber-500 shadow-sm z-10" />
                    <div className="absolute inset-0 bg-amber-500/10 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500" />
                  </div>

                  <div className="bg-white/95 backdrop-blur-3xl border border-ruru-navy/10 rounded-[2rem] p-6 shadow-sm group-hover:shadow-xl group-hover:border-amber-200 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <ShieldCheck size={14} className="text-amber-500" />
                           <p className="text-[10px] font-black uppercase tracking-widest text-ruru-navy/60">{item.type} Renewal</p>
                        </div>
                        <h4 className="font-bold text-ruru-navy">{item.title}</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-brand text-amber-600 font-black">{daysLeft}</p>
                        <p className="text-[8px] font-black uppercase text-[#A8A29E] tracking-widest">Days Left</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-[#F8F7F3]">
                      <div className="flex items-center gap-2">
                        <img src={pet?.image} alt={pet?.name} className="w-6 h-6 rounded-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                        <span className="text-xs font-bold text-ruru-navy-light">{pet?.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black text-[#A8A29E] uppercase tracking-widest">
                        <Calendar size={12} />
                        {new Date(item.nextDueDate!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="relative pl-12">
               <div className="absolute left-4 top-1.5 w-3 h-3 rounded-full bg-[#EBEBE0]" />
               <p className="text-sm text-ruru-navy/60 italic font-medium">All clinical protocols currently in sync.</p>
            </div>
          )}

          {/* Recent History Divider */}
          <div className="relative pl-12 py-4">
             <div className="flex items-center gap-3">
                <History size={14} className="text-[#A8A29E]" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#A8A29E]">Retrospective Core</span>
             </div>
          </div>

          {timelineItems.recent.map((item, idx) => {
            const pet = pets.find(p => p.id === item.petId);
            return (
              <div key={item.id} className="relative pl-12 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
                <div className="absolute left-[19px] top-6 w-1.5 h-1.5 rounded-full bg-[#A8A29E] border border-white" />
                <div className="bg-[#FDFBF7] border border-transparent rounded-[1.5rem] p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img src={pet?.image} alt={pet?.name} className="w-8 h-8 rounded-[1.25rem] object-cover shadow-sm" />
                    <div>
                      <h5 className="text-xs font-bold text-ruru-navy">{item.title}</h5>
                      <p className="text-[10px] text-[#A8A29E] font-medium uppercase tracking-widest">{item.date}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-[#A8A29E]" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
