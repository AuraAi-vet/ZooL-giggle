import { PartyPopper, ChevronRight, Plus, Trash2, BookOpen, MapPin, Sparkles, Calendar, Utensils, Droplets, Footprints, Zap, AlertTriangle, Heart, TrendingUp, MessageSquare, Bell, Users, Activity, Clock, Map, Search, Phone, Stethoscope, Building, ClipboardList, CheckCircle2, X } from 'lucide-react';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

import { Pet, QuickLog, HealthRecord, UserProfile } from '../types';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';
import { translations } from '../lib/translations';

import { HealthGraph } from '../components/HealthGraph';
import { QuickActions } from '../components/QuickActions';
import { PreventiveCare } from '../components/PreventiveCare';
import { ZoolInsights } from '../components/ZoolInsights';
import { RuRuIcon } from '../components/RuRuIcon';
import { BreedIntelligenceCard } from '../components/BreedIntelligenceCard';
import { RegionalAlertsBanner } from '../components/RegionalAlertsBanner';
import { AIReminderSuggestor } from '../components/AIReminderSuggestor';
import { PetHubMarketplace } from '../components/PetHubMarketplace';
import { SuggestedReminder } from '../services/geminiService';
import { AILimitIndicator } from '../components/AILimitIndicator';

interface HomeViewProps {
  pets: Pet[];
  quickLogs: QuickLog[];
  records: HealthRecord[];
  userProfile: UserProfile | null;
  setActiveTab: (t: any) => void;
  onAddPet: () => void;
  onDeletePet: (pet: Pet) => void;
  onPetClick: (pet: Pet) => void;
  onSOSClick: () => void;
  smartSummary?: string;
  onQuickAction?: (type: string) => void;
  onSearch?: (query: string) => void;
  onAddSuggestedRecord?: (suggestion: SuggestedReminder) => Promise<void>;
  syncStatus?: string;
  showSavedStatus?: boolean;
}

export function HomeView({ 
  pets, 
  quickLogs, 
  records, 
  userProfile, 
  setActiveTab, 
  onAddPet, 
  onDeletePet, 
  onPetClick, 
  onSOSClick,
  smartSummary,
  onQuickAction,
  onSearch,
  onAddSuggestedRecord,
  syncStatus,
  showSavedStatus
}: HomeViewProps) {
  const { language, role, communityPosts } = useStore();
  const t = translations[language];
  const [selectedPet, setSelectedPet] = React.useState<Pet | null>(pets[0] || null);

  // New states for type-based query filtering
  const [searchVal, setSearchVal] = React.useState('');
  const [searchType, setSearchType] = React.useState<'pets' | 'records' | 'posts'>('pets');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = React.useState(false);

  const matchedItems = React.useMemo(() => {
    const q = searchVal.trim().toLowerCase();
    if (!q) return [];

    if (searchType === 'pets') {
      return pets.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.breed && p.breed.toLowerCase().includes(q)) ||
        p.type.toLowerCase().includes(q)
      );
    } else if (searchType === 'records') {
      return records.filter(r => 
        r.title.toLowerCase().includes(q) || 
        r.description.toLowerCase().includes(q) ||
        (r.clinicalNotes && r.clinicalNotes.toLowerCase().includes(q)) ||
        r.type.toLowerCase().includes(q)
      );
    } else if (searchType === 'posts') {
      return (communityPosts || []).filter(post => 
        post.content.toLowerCase().includes(q) || 
        post.author.toLowerCase().includes(q) ||
        post.tags.some(tag => tag.toLowerCase().includes(q))
      );
    }
    return [];
  }, [searchVal, searchType, pets, records, communityPosts]);

  const handleResultClick = (item: any) => {
    if (searchType === 'pets') {
      setSelectedPet(item);
      onPetClick(item);
      setSearchVal('');
    } else if (searchType === 'records') {
      const matchingPet = pets.find(p => p.id === item.petId);
      if (matchingPet) {
        setSelectedPet(matchingPet);
        onPetClick(matchingPet);
      }
      setActiveTab('care');
      setSearchVal('');
    } else if (searchType === 'posts') {
      setActiveTab('community');
      setSearchVal('');
    }
  };

  React.useEffect(() => {
    if (!selectedPet && pets.length > 0) {
      setSelectedPet(pets[0]);
    }
  }, [pets]);

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return t.home.goodMorning;
    if (hours < 18) return t.home.goodAfternoon;
    return t.home.goodEvening;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="px-6 py-8 pb-32 space-y-10 max-w-5xl mx-auto"
    >
      {/* 1. Refined Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3 py-1 bg-soft-blue/20 border border-soft-blue/30 rounded-full flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-ruru-teal rounded-full animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-dark">System Nominal</span>
            </div>
            
            <AILimitIndicator />

            <AnimatePresence mode="wait">
              {syncStatus === 'syncing' && (
                <motion.div 
                  key="syncing"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="px-3 py-1 bg-ruru-navy/90 text-white rounded-full flex items-center gap-2 shadow-sm border border-ruru-navy/10"
                >
                  <div className="w-1.5 h-1.5 bg-ruru-teal rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Auto-saving...</span>
                </motion.div>
              )}
              {showSavedStatus && (
                <motion.div 
                  key="synced"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full flex items-center gap-2 shadow-sm border border-emerald-100"
                >
                  <CheckCircle2 size={10} className="text-emerald-500" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Cloud Synced</span>
                </motion.div>
              )}
            </AnimatePresence>

            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-dark/30 ml-auto md:ml-0 hidden md:block">
              {new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h2 className="text-6xl font-display font-semibold text-brand-dark tracking-tight leading-[0.9]">
            {getGreeting()}, <br/>
            <span className="text-brand-dark/30">{userProfile?.name?.split(' ')[0] || 'Caregiver'}</span>
          </h2>
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab('profile')}
          className="relative group shrink-0"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-soft-blue/20 via-soft-purple/20 to-soft-pink/20 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-60 transition-opacity" />
          <div className="relative w-20 h-20 rounded-[2rem] overflow-hidden border-2 border-white shadow-xl shadow-brand-dark/10">
            <img 
              src={userProfile?.image || `https://api.dicebear.com/7.x/open-peeps/svg?seed=${userProfile?.uid}`} 
              alt="Avatar" 
              className="w-full h-full object-cover" 
            />
          </div>
        </motion.button>
      </section>

      {/* 2. Tactical Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-6 gap-6">
        {/* RuRu Assistant - Large Span */}
        <motion.div 
          whileHover={{ scale: 1.01, y: -4 }}
          whileTap={{ scale: 0.99 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          onClick={() => setActiveTab('ai')}
          className="md:col-span-4 bg-slate-950 border border-slate-800/80 p-8 rounded-[2.5rem] flex flex-col justify-between min-h-[300px] cursor-pointer group relative shadow-xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 pointer-events-none mix-blend-overlay" />
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-gradient-to-tr from-ruru-teal/20 via-ruru-magenta/10 to-transparent rounded-full blur-3xl opacity-60 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <div className="absolute top-0 right-0 p-8">
             <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white/30 group-hover:bg-white/20 group-hover:text-white transition-all">
                <ChevronRight size={20} />
             </div>
          </div>
          
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-24 h-24 shrink-0 transition-transform duration-500 group-hover:scale-110">
              <RuRuIcon role={role} size={96} status="idle" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-ruru-teal" />
                <span className="text-xs font-bold tracking-wider text-ruru-teal/80 uppercase">AI Assistant</span>
              </div>
              <h3 className="text-4xl font-display font-semibold text-white tracking-tight leading-none">
                {t.home.ruruAssistant}
              </h3>
              <p className="text-white/60 font-medium text-lg">Your empathetic clinical companion.</p>
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-4 flex items-center justify-between border border-white/10 relative z-10 backdrop-blur-md">
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-ruru-teal rounded-full animate-pulse" />
                <p className="text-xs font-semibold text-white/70">Ready to assist with diagnostic inquiries.</p>
             </div>
             <motion.span whileHover={{ x: 3 }} className="text-sm font-bold text-white/50 group-hover:text-white transition-colors">Start Chat</motion.span>
          </div>
        </motion.div>

        {/* Health Vault */}
        <motion.div 
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          onClick={() => setActiveTab('health')}
          className="md:col-span-2 bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] flex flex-col justify-between min-h-[300px] cursor-pointer group shadow-xl overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-transparent opacity-40 group-hover:opacity-60 transition-opacity" />
          <div className="w-14 h-14 bg-white/10 text-pink-300 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform relative z-10">
             <Activity size={28} />
          </div>
          <div className="space-y-1 relative z-10">
             <h3 className="text-2xl font-display font-semibold text-white tracking-tight">{t.home.petHub}</h3>
             <p className="text-sm text-white/50 font-medium">Detailed biometric health analytics.</p>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden relative z-10">
             <motion.div initial={{ width: 0 }} animate={{ width: '65%' }} className="h-full bg-pink-400" />
          </div>
        </motion.div>

        {/* Services */}
        <motion.div 
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          onClick={() => setActiveTab('services')}
          className="md:col-span-2 bg-emerald-50/30 hover:bg-emerald-50/60 backdrop-blur-xl border border-emerald-500/10 p-6 rounded-[2.5rem] flex flex-col justify-between min-h-[180px] cursor-pointer group shadow-sm hover:shadow-md transition-all"
        >
           <div className="w-12 h-12 bg-emerald-500/10 text-emerald-700 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <MapPin size={24} />
           </div>
           <div className="space-y-1">
              <h3 className="text-xl font-display font-semibold text-slate-900 leading-tight">Services</h3>
              <p className="text-xs text-slate-500 font-medium">Discover local 24/7 care and clinics.</p>
           </div>
        </motion.div>

        {/* Bookings */}
        <motion.div 
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          onClick={() => setActiveTab('appointments')}
          className="md:col-span-2 bg-amber-50/30 hover:bg-amber-50/60 backdrop-blur-xl border border-amber-500/10 p-6 rounded-[2.5rem] flex flex-col justify-between min-h-[180px] cursor-pointer group shadow-sm hover:shadow-md transition-all"
        >
           <div className="w-12 h-12 bg-amber-500/10 text-amber-700 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Calendar size={24} />
           </div>
           <div className="space-y-1">
              <h3 className="text-xl font-display font-semibold text-slate-900 leading-tight">Bookings</h3>
              <p className="text-xs text-slate-500 font-medium">Manage telehealth appointments.</p>
           </div>
        </motion.div>

        {/* Tracker */}
        <motion.div 
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          onClick={() => setActiveTab('care')}
          className="md:col-span-2 bg-indigo-50/30 hover:bg-indigo-50/60 backdrop-blur-xl border border-indigo-500/10 p-6 rounded-[2.5rem] flex flex-col justify-between min-h-[180px] cursor-pointer group shadow-sm hover:shadow-md transition-all"
        >
           <div className="w-12 h-12 bg-indigo-500/10 text-indigo-700 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <ClipboardList size={24} />
           </div>
           <div className="space-y-1">
              <h3 className="text-xl font-display font-semibold text-slate-900 leading-tight">Tracker</h3>
              <p className="text-xs text-slate-500 font-medium">Log and visualize daily activities.</p>
           </div>
        </motion.div>

        {/* Vet Chat */}
        <motion.div 
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          onClick={() => setActiveTab('chat')}
          className="md:col-span-3 bg-sky-50/30 hover:bg-sky-50/60 backdrop-blur-xl border border-sky-500/10 p-6 rounded-[2.5rem] flex flex-col justify-between min-h-[180px] cursor-pointer group shadow-sm hover:shadow-md transition-all"
        >
           <div className="w-12 h-12 bg-sky-500/10 text-sky-700 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <MessageSquare size={24} />
           </div>
           <div className="space-y-1">
              <h3 className="text-xl font-display font-semibold text-slate-900 leading-tight">Vet Chat</h3>
              <p className="text-xs text-slate-500 font-medium">Secure messaging for expert opinions.</p>
           </div>
        </motion.div>

        {/* Gov Records */}
        <motion.div 
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          onClick={() => setActiveTab('gov')}
          className="md:col-span-3 bg-purple-50/30 hover:bg-purple-50/60 backdrop-blur-xl border border-purple-500/10 p-6 rounded-[2.5rem] flex flex-col justify-between min-h-[180px] cursor-pointer group shadow-sm hover:shadow-md transition-all"
        >
           <div className="w-12 h-12 bg-purple-500/10 text-purple-700 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Building size={24} />
           </div>
           <div className="space-y-1">
              <h3 className="text-xl font-display font-semibold text-slate-900 leading-tight">Gov Records</h3>
              <p className="text-xs text-slate-500 font-medium">Verify credentials and licenses.</p>
           </div>
        </motion.div>

        {/* Community Forum - Full Span Asymmetric bottom line */}
        <motion.div 
          whileHover={{ scale: 1.01, y: -4 }}
          whileTap={{ scale: 0.99 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          onClick={() => setActiveTab('community')}
          className="md:col-span-6 bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-transparent hover:from-pink-500/10 hover:via-purple-500/10 hover:to-transparent border border-pink-500/10 p-8 rounded-[2.5rem] flex flex-col sm:flex-row sm:items-center justify-between gap-6 cursor-pointer group shadow-sm hover:shadow-md transition-all relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-purple-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-14 h-14 bg-gradient-to-tr from-pink-500 to-purple-500 text-white rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-md">
               <Users size={28} />
            </div>
            <div className="space-y-1">
               <h3 className="text-2xl font-display font-semibold text-slate-900 tracking-tight">Community Feed</h3>
               <p className="text-sm text-slate-500 font-medium">Connect with fellow pet lovers, share stories, and seek advice.</p>
            </div>
          </div>
          <div className="bg-slate-900 text-white hover:bg-slate-800 rounded-full px-6 py-2.5 font-bold uppercase tracking-wider text-xs shrink-0 flex items-center gap-2 group-hover:translate-x-1 duration-300 shadow-md relative z-10">
            Enter Forum <ChevronRight size={14} />
          </div>
        </motion.div>
      </section>

      {/* 3. Universal Search */}
      <section id="global-search-bar" className="relative space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Dropdown Toggle for type */}
          <div className="relative shrink-0">
            <button
              id="search-filter-type-trigger"
              type="button"
              onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
              className="h-full w-full sm:w-48 bg-white/90 border border-soft-blue/20 hover:border-ruru-teal/30 rounded-[1.5rem] px-5 py-4 text-sm font-semibold text-ruru-navy flex items-center justify-between gap-2 shadow-sm focus:outline-none transition-all"
            >
              <div className="flex items-center gap-2">
                {searchType === 'pets' && <span className="text-base">🐕</span>}
                {searchType === 'records' && <span className="text-base">📋</span>}
                {searchType === 'posts' && <span className="text-base">💬</span>}
                <span className="capitalize">
                  {searchType === 'pets' ? 'Pets' : searchType === 'records' ? 'Records' : 'Community'}
                </span>
              </div>
              <ChevronRight size={16} className={cn("text-ruru-navy/40 transition-transform duration-300", isTypeDropdownOpen && "rotate-90")} />
            </button>

            <AnimatePresence>
              {isTypeDropdownOpen && (
                <>
                  {/* Backdrop list lock */}
                  <div className="fixed inset-0 z-10" onClick={() => setIsTypeDropdownOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 mt-2 bg-white/95 backdrop-blur-3xl border border-ruru-navy/10 rounded-2xl p-2.5 shadow-[0_12px_30px_rgba(0,0,0,0.08)] z-20 space-y-1"
                  >
                    {[
                      { type: 'pets', label: 'Pets', icon: '🐕', desc: 'Search profiles & breeds' },
                      { type: 'records', label: 'Medical Records', icon: '📋', desc: 'Search vaccines & checkups' },
                      { type: 'posts', label: 'Community Posts', icon: '💬', desc: 'Search forums & topics' }
                    ].map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => {
                          setSearchType(item.type as any);
                          setIsTypeDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full text-left p-2.5 rounded-xl transition-all flex items-center gap-3",
                          searchType === item.type 
                            ? "bg-ruru-navy text-white" 
                            : "hover:bg-ruru-teal/5 text-ruru-navy/80 hover:text-ruru-navy"
                        )}
                      >
                        <span className="text-lg shrink-0">{item.icon}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate leading-none mb-0.5">{item.label}</p>
                          <p className={cn("text-[9px] truncate font-medium", searchType === item.type ? "text-white/65" : "text-ruru-navy/40")}>
                            {item.desc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Actual Search input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
              <Sparkles size={18} className="text-ruru-teal/40" />
            </div>
            <input 
              type="text" 
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder={
                searchType === 'pets' ? "Enter pet name or breed..." : 
                searchType === 'records' ? "Enter medical title, description, notes..." :
                "Enter post description, tag, or author name..."
              }
              className="w-full bg-white border border-soft-blue/20 rounded-[1.5rem] pl-14 pr-12 py-4 text-base font-semibold shadow-sm focus:outline-none focus:border-ruru-teal focus:ring-2 focus:ring-ruru-teal/10 transition-all placeholder:text-brand-dark/30 text-ruru-navy"
            />
            {searchVal && (
              <button 
                onClick={() => setSearchVal('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 hover:scale-105 transition-transform text-[#A8A29E]/80 hover:text-ruru-navy"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Search Results Display Area */}
        <AnimatePresence>
          {searchVal.trim() !== '' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="bg-white/95 backdrop-blur-3xl border border-ruru-teal/20 p-6 rounded-[2rem] shadow-[0_15px_40px_-5px_rgba(0,173,181,0.06)] space-y-4 relative overflow-hidden text-left"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-ruru-teal animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#A8A29E]">
                    Real-time {searchType} search ({matchedItems.length} found)
                  </span>
                </div>
                <button 
                  onClick={() => setSearchVal('')}
                  className="text-[9px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-700 transition-colors bg-rose-50 px-2.5 py-0.5 rounded-lg"
                >
                  Clear search
                </button>
              </div>

              {matchedItems.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <p className="text-sm font-medium text-ruru-navy/60">No matching {searchType} found.</p>
                  <p className="text-xs text-[#A8A29E]">Try modifying your search criteria or keywords!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
                  {matchedItems.map((item: any) => (
                    <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4 group hover:bg-slate-50/40 px-2 rounded-xl transition-all">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {searchType === 'pets' && (
                          <>
                            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-semibold text-ruru-navy truncate text-sm">{item.name}</h5>
                              <p className="text-[10px] text-ruru-navy/50 truncate capitalize font-bold tracking-wider">{item.breed || 'Companion'} • {item.type}</p>
                            </div>
                          </>
                        )}
                        {searchType === 'records' && (
                          <>
                            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 font-bold text-xs uppercase text-center flex items-center justify-center">
                              {item.type.slice(0, 2)}
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-semibold text-ruru-navy truncate text-sm">{item.title}</h5>
                              <p className="text-xs text-ruru-navy/50 truncate font-light leading-relaxed">{item.description}</p>
                            </div>
                          </>
                        )}
                        {searchType === 'posts' && (
                          <>
                            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
                              <img src={item.authorImage} alt={item.author} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h5 className="font-semibold text-ruru-navy truncate text-sm">{item.author}</h5>
                              <p className="text-xs text-ruru-navy/70 line-clamp-1 font-light leading-normal">{item.content}</p>
                            </div>
                          </>
                        )}
                      </div>

                      <button
                        onClick={() => handleResultClick(item)}
                        className="px-3.5 py-1.5 bg-ruru-navy/5 hover:bg-ruru-navy text-ruru-navy hover:text-white rounded-xl text-[10px] tracking-wider uppercase font-black transition-all shrink-0 flex items-center gap-1 group-hover:translate-x-0.5 duration-300"
                      >
                        Select <ChevronRight size={10} strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* 4. Profiles Quick Switch */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
            <h4 className="text-[10px] font-black text-brand-dark/30 uppercase tracking-[0.2em]">Active Profiles</h4>
            <button onClick={onAddPet} className="text-[10px] font-black text-brand-dark uppercase tracking-widest hover:text-soft-blue transition-all flex items-center gap-2">
                <Plus size={14} strokeWidth={3} /> Register Pet
            </button>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x pb-4">
          {pets.map((pet) => (
            <motion.div
              key={pet.id}
              whileHover={{ y: -8 }}
              onClick={() => { setSelectedPet(pet); onPetClick(pet); }}
              className={cn(
                "flex-shrink-0 w-44 bg-white/70 backdrop-blur-xl border border-white/40 rounded-[2.5rem] p-6 shadow-sm transition-all cursor-pointer snap-center relative overflow-hidden group",
                selectedPet?.id === pet.id 
                    ? "bg-brand-dark border-brand-dark text-white shadow-xl shadow-brand-dark/10" 
                    : "backdrop-blur-xl hover:border-soft-blue/50"
              )}
            >
              <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-md bg-soft-slate group-hover:scale-110 transition-transform duration-500">
                  <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
                </div>
                <div className="w-full space-y-0.5">
                  <h6 className={cn("text-xl font-display font-semibold truncate leading-tight", selectedPet?.id === pet.id ? "text-white" : "text-brand-dark")}>
                    {pet.name}
                  </h6>
                  <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-60", selectedPet?.id === pet.id ? "text-white/60" : "text-brand-dark/40")}>
                    {pet.breed || 'Companion'}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* AI Insights Widget */}
      {pets.length > 0 && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <ZoolInsights pets={pets} records={records} />
        </section>
      )}

      {/* 5. Daily Activities */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
            <h4 className="text-sm font-bold text-brand-dark/40 uppercase tracking-wider">Log Activity</h4>
            <button onClick={() => setActiveTab('care')} className="text-sm font-semibold text-brand-dark hover:text-soft-blue transition-all">View All</button>
        </div>
        
        <div className="bg-white/70 backdrop-blur-xl border border-white/40 p-12 rounded-[2.5rem] relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-96 h-96 bg-soft-blue/5 rounded-full blur-3xl -mr-48 -mt-48" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-ruru-teal rounded-full" />
                  <p className="text-xs font-bold text-ruru-teal uppercase tracking-wider">Quick Actions</p>
                </div>
                <h5 className="text-4xl font-display font-semibold text-brand-dark tracking-tight leading-none">{t.home.instantAction}</h5>
                <p className="text-sm text-brand-dark/60 font-medium pb-2">Easily log daily activities and health events.</p>
              </div>
              <QuickActions onAction={onQuickAction || (() => {})} />
            </div>
            
            <div className="bg-brand-dark rounded-[2.5rem] p-10 text-white shadow-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_50%)]" />
              <div className="relative z-10 flex flex-col h-full justify-between min-h-[220px]">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                    <TrendingUp size={32} className="text-ruru-teal-light" />
                  </div>
                  <div>
                    <h6 className="text-2xl font-display font-semibold text-white tracking-tight leading-none">{t.home.healthVelocity}</h6>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mt-1">Stable Pattern Detected</p>
                  </div>
                </div>

                <div className="pt-8 flex items-center justify-between border-t border-white/10">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{t.home.lastLog}</p>
                    <p className="text-xl font-bold text-white tracking-tight">
                       {quickLogs[0] ? new Date(quickLogs[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Standby'}
                    </p>
                  </div>
                  <motion.button 
                    whileHover={{ x: 5, scale: 1.1 }}
                    onClick={() => setActiveTab('health')}
                    className="w-14 h-14 rounded-2xl bg-white text-brand-dark flex items-center justify-center shadow-lg transition-all"
                  >
                    <ChevronRight size={24} />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SOS Uplink */}
      <motion.section 
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onSOSClick}
        className="bg-pink-600 rounded-[2.5rem] p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 cursor-pointer shadow-xl shadow-pink-600/20 overflow-hidden relative group"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
        <div className="relative z-10 flex items-center gap-10">
          <div className="w-24 h-24 bg-white/10 text-white rounded-[2rem] flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg">
             <AlertTriangle size={48} strokeWidth={2} />
          </div>
          <div className="space-y-1">
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Emergency Link</p>
             <h3 className="text-5xl font-display font-semibold tracking-tight leading-none">{t.home.sosUplink}</h3>
             <p className="text-lg font-medium text-white/70">{t.home.tacticalSupport}</p>
          </div>
        </div>
        <div className="relative z-10 w-20 h-20 rounded-full border-2 border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-pink-600 transition-all">
          <ChevronRight size={40} />
        </div>
      </motion.section>
    </motion.div>
  );
}
