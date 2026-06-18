import React, { useState, useEffect } from 'react';
import AnimatedLogo from './AnimatedLogo';
import { useCommerceStore } from '../store/useCommerceStore';
import { Bell, Search, User, MapPin, Sparkles } from 'lucide-react';

export default function GlobalHeader() {
  // We check if the pending mutations map has items, meaning a sync is queuing or active
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // A simple interval or listener to check your store's pending queue
    const checkSyncStatus = setInterval(() => {
      // Accessing the pending mutations logic we built in Phase 2
      const hasPendingWrites = useCommerceStore.getState().hasPendingMutations(); 
      setIsSyncing(hasPendingWrites);
    }, 500);

    return () => clearInterval(checkSyncStatus);
  }, []);

  return (
    <header className="sticky top-0 z-[100] flex h-16 w-full items-center justify-between border-b border-slate-100 bg-white/70 px-6 backdrop-blur-3xl shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-24 h-8 flex items-center">
          {/* Logo remains static until the user drags a card and triggers a save */}
          <AnimatedLogo variant="header" isSyncing={isSyncing} className="h-full" />
        </div>
        {isSyncing && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#0f766e] animate-pulse flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0f766e] animate-ping" />
            Saving...
          </span>
        )}
      </div>

      <div className="hidden sm:flex items-center gap-6">
        <div className="relative flex items-center bg-slate-100 rounded-full px-4 py-1.5 text-xs text-slate-500 hover:bg-slate-200 transition-colors w-64">
          <Search size={14} className="mr-2 text-slate-400" />
          <span>Search vets, records, services...</span>
        </div>
        
        <nav className="flex items-center gap-5 text-xs font-semibold tracking-wider uppercase text-slate-500">
          <a href="#services" className="hover:text-slate-900 transition-colors flex items-center gap-1">
            <MapPin size={12} />
            Services
          </a>
          <a href="#telemetry" className="hover:text-slate-900 transition-colors flex items-center gap-1">
            <Sparkles size={12} />
            Telemetry
          </a>
        </nav>
      </div>
      
      {/* User Profile Avatar & Alerts */}
      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all relative">
          <Bell size={18} />
          {isSyncing && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full" />
          )}
        </button>

        <div className="flex items-center gap-2 border border-slate-200/60 rounded-full p-1 pr-3 hover:shadow-xs hover:border-slate-300 transition-all cursor-pointer bg-white">
          <div className="w-7 h-7 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-700 font-bold text-xs">
            AZ
          </div>
          <span className="text-xs font-semibold text-slate-700 hidden sm:inline">Dr. Aura</span>
        </div>
      </div>
    </header>
  );
}
