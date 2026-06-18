import React from 'react';
import { motion } from 'motion/react';
import { Utensils, Droplets, Footprints, Heart, Plus, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

interface QuickActionsProps {
  onAction: (type: string) => void;
}

export function QuickActions({ onAction }: QuickActionsProps) {
  const actions = [
    { id: 'food', label: 'Feeder', icon: Utensils, color: 'bg-orange-50 text-orange-600', border: 'border-orange-100' },
    { id: 'water', label: 'Hydrate', icon: Droplets, color: 'bg-blue-50 text-blue-600', border: 'border-blue-100' },
    { id: 'walk', label: 'Activity', icon: Footprints, color: 'bg-green-50 text-green-600', border: 'border-green-100' },
    { id: 'pee', label: 'Bathroom', icon: Zap, color: 'bg-yellow-50 text-yellow-500', border: 'border-yellow-100' },
    { id: 'play', label: 'Playtime', icon: Heart, color: 'bg-red-50 text-red-600', border: 'border-red-100' },
  ];

  return (
    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 px-1 snap-x snap-mandatory scroll-smooth">
      {actions.map((action) => (
        <motion.button
          key={action.id}
          whileHover={{ y: -4, scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onAction(action.id)}
          className={cn(
            "group flex flex-col items-center justify-center p-5 rounded-[2.5rem] min-w-[110px] h-[140px] border border-ruru-navy/5 transition-all bg-white shadow-sm hover:shadow-xl hover:shadow-ruru-navy/5 snap-center touch-manipulation",
          )}
        >
          <div className={cn("w-14 h-14 rounded-3xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-3 duration-500", action.color, action.border, "border shadow-sm")}>
            <action.icon size={24} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col items-center text-center mt-2">
            <span className="text-sm font-bold text-ruru-navy group-hover:text-ruru-navy-light transition-colors">{action.label}</span>
            <div className="w-1 h-1 bg-ruru-teal rounded-full mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </motion.button>
      ))}
      <motion.button
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        className="group flex flex-col items-center justify-center p-5 rounded-[2.5rem] min-w-[110px] h-[140px] border-2 border-dashed border-ruru-navy/5 bg-[#FDFBF7]/50 text-[#A8A29E] hover:border-ruru-navy/20 hover:bg-white transition-all shadow-sm snap-center touch-manipulation"
      >
        <div className="w-14 h-14 rounded-3xl flex items-center justify-center bg-white shadow-sm text-ruru-navy/30 group-hover:rotate-90 group-hover:bg-ruru-navy group-hover:text-white transition-all duration-500 border border-ruru-navy/5">
          <Plus size={24} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col items-center text-center mt-2">
          <span className="text-sm font-bold group-hover:text-ruru-navy transition-colors">{`More`}</span>
          <div className="w-1 h-1 bg-ruru-navy/10 rounded-full mt-1.5" />
        </div>
      </motion.button>
    </div>
  );
}
