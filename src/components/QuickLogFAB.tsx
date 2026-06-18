import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  MapPin, 
  Utensils, 
  Droplets, 
  Footprints, 
  Zap, 
  Heart,
  Trash2,
  ListPlus
} from 'lucide-react';
import { Pet } from '../types';
import { cn } from '../lib/utils';
import { EdgeTrigger } from './EdgeTrigger';
import { vibrateLight, vibrateSuccess } from '../utils/vibrator';

interface QuickLogFABProps {
  pets: Pet[];
  onLog: (type: string, petId: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onNavigate: (tab: any) => void;
}

export function QuickLogFAB({ pets, onLog, isOpen, setIsOpen, onNavigate }: QuickLogFABProps) {
  const [selectedPetId, setSelectedPetId] = useState(pets[0]?.id || '');

  const logTypes = [
    { type: 'food', icon: <Utensils size={20} />, label: 'Feeder', color: 'bg-orange-50 text-orange-500' },
    { type: 'water', icon: <Droplets size={20} />, label: 'Hydrate', color: 'bg-blue-50 text-blue-500' },
    { type: 'walk', icon: <Footprints size={20} />, label: 'Activity', color: 'bg-green-50 text-green-500' },
    { type: 'pee', icon: <Zap size={20} />, label: 'Bathroom', color: 'bg-yellow-50 text-yellow-500' },
    { type: 'play', icon: <Heart size={20} />, label: 'Playtime', color: 'bg-red-50 text-red-500' },
  ];

  return (
    <EdgeTrigger
      side="right"
      isOpen={isOpen}
      onToggle={setIsOpen}
      label="Quick Log"
      icon={<ListPlus size={20} />}
      className="top-[60%] md:top-[70%]"
    >
      <div className="w-64 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-brand text-2xl text-ruru-navy tracking-tight">Quick Log</h3>
        </div>
        
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1 snap-x snap-mandatory scroll-smooth">
          {pets.map(pet => (
            <motion.button 
              key={pet.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => { vibrateLight(); setSelectedPetId(pet.id); }}
              className={cn(
                "flex-shrink-0 w-10 h-10 rounded-[0.75rem] border-[3px] transition-all overflow-hidden snap-center touch-manipulation",
                selectedPetId === pet.id ? "border-ruru-navy shadow-lg scale-110" : "border-transparent opacity-60 hover:opacity-100 hover:scale-105 bg-[#FDFBF7]"
              )}
            >
              <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
            </motion.button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {logTypes.map(log => (
            <button 
              key={log.type}
              onClick={() => { vibrateSuccess(); onLog(log.type, selectedPetId); setIsOpen(false); }}
              className="flex flex-col items-center gap-2 group"
            >
              <div className={cn("w-12 h-12 rounded-[1.25rem] flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:shadow-lg border border-transparent hover:border-black/5 shadow-sm", log.color)}>
                {React.cloneElement(log.icon as React.ReactElement<any>, { size: 18, strokeWidth: 2.5 })}
              </div>
              <span className="text-sm font-semibold text-slate-700 group-hover:text-ruru-navy transition-colors">{log.label}</span>
            </button>
          ))}
        </div>

        <div className="pt-4 border-t border-ruru-navy/10">
          <button 
            onClick={() => { onNavigate('services'); setIsOpen(false); }}
            className="w-full py-3 bg-[#FDFBF7] text-ruru-navy rounded-[1.25rem] text-sm font-bold flex items-center justify-center gap-2 hover:bg-ruru-navy hover:text-white transition-all duration-500"
          >
            <MapPin size={18} />
            Find Services
          </button>
        </div>
      </div>
    </EdgeTrigger>
  );
}
