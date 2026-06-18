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
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-soft-ink">System Nominal</span>
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

            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-soft-ink/30 ml-auto md:ml-0 hidden md:block">
              {new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h2 className="text-6xl font-display font-semibold text-soft-ink tracking-tight leading-[0.9]">
            {getGreeting()}, <br/>
            <span className="text-soft-ink/30">{userProfile?.name?.split(' ')[0] || 'Caregiver'}</span>
          </h2>
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab('profile')}
          className="relative group shrink-0"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-soft-blue/20 via-soft-purple/20 to-soft-pink/20 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-60 transition-opacity" />
          <div className="relative w-20 h-20 rounded-[2rem] overflow-hidden border-2 border-white shadow-xl shadow-soft-ink/10">
            <img 
              src={userProfile?.image || `https://api.dicebear.com/7.x/open-peeps/svg?seed=${userProfile?.uid}`} 
              alt="Avatar" 
              className="w-full h-full object-cover" 
            />
          </div>
        </motion.button>
      </section>

      {/* 2. Tactical Bento Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* RuRu Assistant - Large Span */}
        <motion.div 
          onClick={() => setActiveTab('ai')}
          className="lg:col-span-8 bg-[#0B192C]/90 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] flex flex-col justify-between min-h-[280px] xl:min-h-[320px] cursor-pointer group relative shadow-2xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 pointer-events-none mix-blend-overlay" />
          <div className="absolute top-0 right-0 p-8">
             <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white/50 group-hover:bg-white/20 group-hover:text-white transition-all backdrop-blur-md">
                <ChevronRight size={20} />
             </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
            <div className="w-28 h-28 shrink-0 transition-transform duration-500 group-hover:scale-110 drop-shadow-2xl">
              <RuRuIcon role={role} size={112} status="idle" />
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <Sparkles size={14} className="text-[#00ADB5]" />
                <span className="text-[10px] font-black tracking-[0.2em] text-[#00ADB5] uppercase">Core Intelligence</span>
              </div>
              <h3 className="text-4xl lg:text-5xl font-brand font-black text-white tracking-tighter leading-none">
                {t.home.ruruAssistant}
              </h3>
              <p className="text-white/60 font-medium text-lg tracking-tight">Your empathetic clinical companion.</p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-3xl p-5 flex items-center justify-between border border-white/10 relative z-10 mt-6 lg:mt-0 lg:w-2/3">
             <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-[#00ADB5] rounded-full shadow-[0_0_10px_#00ADB5] animate-pulse" />
                <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Awaiting clinical inquiries</p>
             </div>
             <motion.span whileHover={{ x: 3 }} className="text-sm font-black uppercase tracking-widest text-[#00ADB5]">Initialize</motion.span>
          </div>
        </motion.div>

        {/* Health Vault */}
        <motion.div 
          onClick={() => setActiveTab('health')}
          className="lg:col-span-4 bg-gradient-to-b from-[#FF758F] to-[#FF5252] backdrop-blur-lg border border-white/10 p-8 rounded-[2.5rem] flex flex-col justify-between min-h-[280px] xl:min-h-[320px] cursor-pointer group shadow-xl overflow-hidden relative"
        >
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/20 blur-3xl rounded-full" />
          <div className="w-16 h-16 bg-white/20 text-white rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 transition-transform backdrop-blur-sm shadow-inner relative z-10">
             <Activity size={32} />
          </div>
          <div className="space-y-2 relative z-10">
             <h3 className="text-3xl font-brand font-black text-white tracking-tighter leading-none">{t.home.petHub}</h3>
             <p className="text-sm text-white/80 font-medium tracking-tight">Detailed biometric health analytics.</p>
          </div>
          <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden relative z-10">
             <motion.div initial={{ width: 0 }} animate={{ width: '65%' }} className="h-full bg-white shadow-[0_0_10px_white]" />
          </div>
        </motion.div>

        {/* Action Tiles Grid Row - 6 items */}
        <div className="lg:col-span-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <motion.div 
            onClick={() => setActiveTab('services')}
            className="bg-white/80 backdrop-blur-xl border border-[#0B192C]/5 p-6 rounded-[2.5rem] flex flex-col justify-center gap-5 cursor-pointer group shadow-sm hover:shadow-xl transition-all hover:-translate-y-1"
          >
             <div className="w-14 h-14 bg-[#00ADB5]/10 text-[#00ADB5] rounded-[1.5rem] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <MapPin size={26} strokeWidth={2.5} />
             </div>
             <div>
                <h3 className="text-xl font-brand font-black text-[#0B192C] tracking-tight leading-tight">Agencies</h3>
                <p className="text-[11px] font-semibold text-[#0B192C]/50 uppercase tracking-widest mt-1">Local care experts</p>
             </div>
          </motion.div>

          <motion.div 
            onClick={() => setActiveTab('appointments')}
            className="bg-white/80 backdrop-blur-xl border border-[#0B192C]/5 p-6 rounded-[2.5rem] flex flex-col justify-center gap-5 cursor-pointer group shadow-sm hover:shadow-xl transition-all hover:-translate-y-1"
          >
             <div className="w-14 h-14 bg-[#FF758F]/10 text-[#FF758F] rounded-[1.5rem] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Calendar size={26} strokeWidth={2.5} />
             </div>
             <div>
                <h3 className="text-xl font-brand font-black text-[#0B192C] tracking-tight leading-tight">Bookings</h3>
                <p className="text-[11px] font-semibold text-[#0B192C]/50 uppercase tracking-widest mt-1">Schedule reviews</p>
             </div>
          </motion.div>

          <motion.div 
            onClick={() => setActiveTab('care')}
            className="bg-white/80 backdrop-blur-xl border border-[#0B192C]/5 p-6 rounded-[2.5rem] flex flex-col justify-center gap-5 cursor-pointer group shadow-sm hover:shadow-xl transition-all hover:-translate-y-1"
          >
             <div className="w-14 h-14 bg-[#8A2BE2]/10 text-[#8A2BE2] rounded-[1.5rem] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <ClipboardList size={26} strokeWidth={2.5} />
             </div>
             <div>
                <h3 className="text-xl font-brand font-black text-[#0B192C] tracking-tight leading-tight">Tracker</h3>
                <p className="text-[11px] font-semibold text-[#0B192C]/50 uppercase tracking-widest mt-1">Daily health logs</p>
             </div>
          </motion.div>

          <motion.div 
            onClick={() => setActiveTab('gov')}
            className="bg-white/80 backdrop-blur-xl border border-[#0B192C]/5 p-6 rounded-[2.5rem] flex flex-col justify-center gap-5 cursor-pointer group shadow-sm hover:shadow-xl transition-all hover:-translate-y-1"
          >
             <div className="w-14 h-14 bg-[#F2C94C]/10 text-[#F2C94C] rounded-[1.5rem] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Building size={26} strokeWidth={2.5} />
             </div>
             <div>
                <h3 className="text-xl font-brand font-black text-[#0B192C] tracking-tight leading-tight">Records</h3>
                <p className="text-[11px] font-semibold text-[#0B192C]/50 uppercase tracking-widest mt-1">Verify credentials</p>
             </div>
          </motion.div>

          <motion.div 
            onClick={() => setActiveTab('chat')}
            className="bg-white/80 backdrop-blur-xl border border-[#0B192C]/5 p-6 rounded-[2.5rem] flex flex-col justify-center gap-5 cursor-pointer group shadow-sm hover:shadow-xl transition-all hover:-translate-y-1"
          >
             <div className="w-14 h-14 bg-[#00ADB5]/10 text-[#00ADB5] rounded-[1.5rem] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <MessageSquare size={26} strokeWidth={2.5} />
             </div>
             <div>
                <h3 className="text-xl font-brand font-black text-[#0B192C] tracking-tight leading-tight">Vet Chat</h3>
                <p className="text-[11px] font-semibold text-[#0B192C]/50 uppercase tracking-widest mt-1">Secure consult</p>
             </div>
          </motion.div>

          <motion.div 
            onClick={() => setActiveTab('community')}
            className="bg-white/80 backdrop-blur-xl border border-[#0B192C]/5 p-6 rounded-[2.5rem] flex flex-col justify-center gap-5 cursor-pointer group shadow-sm hover:shadow-xl transition-all hover:-translate-y-1"
          >
             <div className="w-14 h-14 bg-[#8A2BE2]/10 text-[#8A2BE2] rounded-[1.5rem] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Users size={26} strokeWidth={2.5} />
             </div>
             <div>
                <h3 className="text-xl font-brand font-black text-[#0B192C] tracking-tight leading-tight">Community</h3>
                <p className="text-[11px] font-semibold text-[#0B192C]/50 uppercase tracking-widest mt-1">Connect with others</p>
             </div>
          </motion.div>
        </div>
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
              className="w-full bg-white border border-soft-blue/20 rounded-[1.5rem] pl-14 pr-12 py-4 text-base font-semibold shadow-sm focus:outline-none focus:border-ruru-teal focus:ring-2 focus:ring-ruru-teal/10 transition-all placeholder:text-soft-ink/30 text-ruru-navy"
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
            <h4 className="text-[10px] font-black text-soft-ink/30 uppercase tracking-[0.2em]">Active Profiles</h4>
            <button onClick={onAddPet} className="text-[10px] font-black text-soft-ink uppercase tracking-widest hover:text-soft-blue transition-all flex items-center gap-2">
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
                    ? "bg-soft-ink border-soft-ink text-white shadow-xl shadow-soft-ink/10" 
                    : "backdrop-blur-xl hover:border-soft-blue/50"
              )}
            >
              <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-md bg-soft-slate group-hover:scale-110 transition-transform duration-500">
                  <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
                </div>
                <div className="w-full space-y-0.5">
                  <h6 className={cn("text-xl font-display font-semibold truncate leading-tight", selectedPet?.id === pet.id ? "text-white" : "text-soft-ink")}>
                    {pet.name}
                  </h6>
                  <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-60", selectedPet?.id === pet.id ? "text-white/60" : "text-soft-ink/40")}>
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
            <h4 className="text-sm font-bold text-soft-ink/40 uppercase tracking-wider">Log Activity</h4>
            <button onClick={() => setActiveTab('care')} className="text-sm font-semibold text-soft-ink hover:text-soft-blue transition-all">View All</button>
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
                <h5 className="text-4xl font-display font-semibold text-soft-ink tracking-tight leading-none">{t.home.instantAction}</h5>
                <p className="text-sm text-soft-ink/60 font-medium pb-2">Easily log daily activities and health events.</p>
              </div>
              <QuickActions onAction={onQuickAction || (() => {})} />
            </div>
            
            <div className="bg-soft-ink rounded-[2.5rem] p-10 text-white shadow-xl relative overflow-hidden group">
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
                    className="w-14 h-14 rounded-2xl bg-white text-soft-ink flex items-center justify-center shadow-lg transition-all"
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
