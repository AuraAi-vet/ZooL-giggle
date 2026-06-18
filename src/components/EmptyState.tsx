import React from 'react';
import { Search } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  buttonText: string;
  onAction: () => void;
}

export function EmptyState({ title, description, buttonText, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center space-y-6 bg-[#FDFBF7] rounded-[2.5rem] border border-dashed border-ruru-navy/10">
      <div className="w-24 h-24 bg-white/95 backdrop-blur-3xl rounded-[2rem] flex items-center justify-center text-[#A8A29E] shadow-sm shadow-[#A8A29E]/5 border border-ruru-navy/10">
        <Search size={40} strokeWidth={1.5} />
      </div>
      <div className="space-y-2">
        <h3 className="font-brand text-2xl text-ruru-navy">{title}</h3>
        <p className="text-sm text-ruru-navy/60 max-w-sm mx-auto leading-relaxed">{description}</p>
      </div>
      <button 
        onClick={onAction} 
        className="mt-4 flex items-center justify-center bg-ruru-navy text-white px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-[#2D2A26]/10 hover:shadow-[#2D2A26]/20 hover:-translate-y-1 transition-all duration-300"
      >
        {buttonText}
      </button>
    </div>
  );
}
