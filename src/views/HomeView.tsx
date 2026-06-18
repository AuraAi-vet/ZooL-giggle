import { PartyPopper, ChevronRight, Plus, Trash2, BookOpen, MapPin, Sparkles, Calendar, Utensils, Droplets, Footprints, Zap, AlertTriangle, Heart, TrendingUp, MessageSquare, Bell, Users, Activity, Clock, Map, Search, Phone, Stethoscope, Building, ClipboardList, CheckCircle2, X, RefreshCw, Check, FileText } from 'lucide-react';
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
import { CalmSound } from '../components/CalmSound';

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

const BentoGrid = React.memo(({ setActiveTab, role, pets, records }: any) => {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* RuRu Intelligence Hub - Hero Span */}
        <motion.div 
          layout
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 180, damping: 25 }}
          onClick={() => setActiveTab('ai')}
          className="lg:col-span-8 rounded-[2.5rem] p-10 flex flex-col justify-between min-h-[360px] cursor-pointer group bg-[#0B1424] text-white overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#C5A572]/10 to-transparent pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#C5A572]/5 blur-[100px] rounded-full" />
          
          <div className="flex flex-col sm:flex-row items-center gap-10 relative z-10">
            <div className="w-36 h-36 shrink-0 transition-all duration-1000 group-hover:scale-110 group-hover:rotate-3">
              <RuRuIcon role={role} size={144} status="idle" />
            </div>
            <div className="space-y-4 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-3">
                <div className="px-3 py-1 bg-[#C5A572]/20 border border-[#C5A572]/30 rounded-full">
                  <span className="text-[10px] font-black tracking-[0.3em] text-[#C5A572] uppercase">Neural Hub Active</span>
                </div>
                <div className="flex gap-1">
                   <div className="w-1 h-1 bg-[#C5A572] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                   <div className="w-1 h-1 bg-[#C5A572] rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                   <div className="w-1 h-1 bg-[#C5A572] rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
                </div>
              </div>
              <h3 className="text-5xl lg:text-6xl font-display font-black text-white tracking-tighter leading-none">
                RuRu Intelligence
              </h3>
              <p className="text-white/60 font-medium text-xl tracking-tight max-w-lg italic">
                Superior clinical synthesis and empathetic care guidance.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 relative z-10 mt-8">
            <div className="flex-1 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 flex items-center justify-between group-hover:border-[#C5A572]/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#C5A572]">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Next Step</p>
                  <p className="text-sm font-bold text-white uppercase tracking-wider">Start Triage</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-white/20 group-hover:text-[#C5A572]" />
            </div>
            
            <div className="flex-1 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 flex items-center justify-between group-hover:border-[#C5A572]/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#C5A572]">
                  <Sparkles size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Insight</p>
                  <p className="text-sm font-bold text-white uppercase tracking-wider">Daily Scan Ready</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-white/20 group-hover:text-[#C5A572]" />
            </div>
          </div>
        </motion.div>

        {/* Global Statistics / Health Trends */}
        <motion.div 
          layout
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 180, damping: 25 }}
          onClick={() => setActiveTab('health')}
          className="lg:col-span-4 rounded-[2.5rem] p-10 flex flex-col justify-between min-h-[360px] bg-white border border-slate-200 cursor-pointer group overflow-hidden relative"
        >
          <div className="space-y-1 relative z-10">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Biological Metrics</h4>
            <h3 className="text-3xl font-display font-black text-[#0B1424] tracking-tighter">Wellness Pulse</h3>
          </div>
          
          <div className="flex-1 flex items-center justify-center py-6 relative z-10">
            <div className="w-full h-32 flex items-end gap-2 group-hover:gap-3 transition-all">
               {[40, 70, 45, 90, 65, 80, 50, 85, 95].map((h, i) => (
                 <motion.div 
                   key={i}
                   initial={{ height: 0 }}
                   animate={{ height: `${h}%` }}
                   transition={{ delay: i * 0.1, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                   className={cn(
                     "flex-1 rounded-t-xl transition-all duration-500",
                     h > 80 ? "bg-[#C5A572] shadow-[0_0_15px_#C5A572]/30" : "bg-[#0B1424]/10"
                   )}
                 />
               ))}
            </div>
          </div>

          <div className="space-y-4 relative z-10 border-t border-slate-100 pt-6">
            <div className="flex items-center justify-between">
               <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Aggregate Score</span>
               <span className="text-2xl font-black text-[#0B1424]">92.8</span>
            </div>
            <button className="w-full btn-gold py-3 text-[10px]">Optimize Health</button>
          </div>
        </motion.div>

        {/* Physiological Calm Sound Generator */}
        <motion.div 
          layout
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 180, damping: 25 }}
          className="lg:col-span-5 rounded-[2.5rem] overflow-hidden border border-[#C5A572]/10 bg-[#0B1424] shadow-xl"
        >
          <CalmSound />
        </motion.div>

        {/* Clinical Insights Hub */}
        <motion.div 
          layout
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 180, damping: 25 }}
          className="lg:col-span-7 rounded-[2.5rem] overflow-hidden"
        >
          <ZoolInsights pets={pets} records={records} />
        </motion.div>

        {/* Tactical Services Row */}
        <div className="lg:col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { id: 'services', icon: MapPin, label: 'Medical Map', desc: 'Clinical locations', color: 'bg-indigo-50 text-indigo-600' },
            { id: 'appointments', icon: Calendar, label: 'Clinical Log', desc: 'Secure Bookings', color: 'bg-amber-50 text-[#C5A572]' },
            { id: 'gov', icon: Building, label: 'Credential Hub', desc: 'Passport & License', color: 'bg-slate-50 text-slate-600' },
            { id: 'chat', icon: MessageSquare, label: 'Vet Direct', desc: 'Surgical Consults', color: 'bg-emerald-50 text-emerald-600' }
          ].map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => setActiveTab(item.id)}
              className="bento-card p-8 flex items-center gap-6 cursor-pointer group bg-white/50 backdrop-blur-xl border-slate-200/40"
            >
              <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-sm", item.color)}>
                 <item.icon size={28} strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                 <h3 className="text-xl font-display font-black text-[#0B1424] tracking-tight truncate uppercase leading-tight">{item.label}</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 truncate">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
  );
});

export const HomeView = React.memo(function HomeView({ 
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
  const language = useStore(state => state.language);
  const role = useStore(state => state.role);
  const communityPosts = useStore(state => state.communityPosts);
  const t = translations[language];

  // New states for type-based query filtering
  const [searchVal, setSearchVal] = React.useState('');
  const [searchType, setSearchType] = React.useState<'pets' | 'records' | 'posts'>('pets');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = React.useState(false);
  const [selectedPet, setSelectedPet] = React.useState<Pet | null>(pets[0] || null);

  React.useEffect(() => {
    if (!selectedPet && pets.length > 0) {
      setSelectedPet(pets[0]);
    }
  }, [pets, selectedPet]);

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
      onPetClick(item);
      setSearchVal('');
    } else if (searchType === 'records') {
      const matchingPet = pets.find(p => p.id === item.petId);
      if (matchingPet) {
        onPetClick(matchingPet);
      }
      setActiveTab('care');
      setSearchVal('');
    } else if (searchType === 'posts') {
      setActiveTab('community');
      setSearchVal('');
    }
  };

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
      className="px-6 py-12 pb-32 space-y-12 max-w-7xl mx-auto"
    >
      {/* 1. Ultimate Platform Header */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-8 border-b border-slate-200/60">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-1.5 bg-[#0B1424] text-[#C5A572] rounded-full flex items-center gap-3 shadow-lg shadow-indigo-950/10">
              <div className="w-2 h-2 bg-[#C5A572] rounded-full animate-pulse shadow-[0_0_8px_#C5A572]" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em]">Ultimate Care Protocol Active</span>
            </div>
            
            <AILimitIndicator />

            <AnimatePresence mode="wait">
              {(syncStatus === 'syncing' || showSavedStatus) && (
                <motion.div 
                  key={syncStatus === 'syncing' ? 'syncing' : 'synced'}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className={cn(
                    "px-4 py-1.5 rounded-full flex items-center gap-2 border shadow-sm",
                    syncStatus === 'syncing' 
                      ? "bg-indigo-50 text-indigo-700 border-indigo-100" 
                      : "bg-emerald-50 text-emerald-700 border-emerald-100"
                  )}
                >
                  {syncStatus === 'syncing' ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={12} />
                  )}
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                    {syncStatus === 'syncing' ? 'Vault Syncing' : 'Cloud Secure'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="space-y-1">
            <h2 className="text-7xl font-display font-black text-[#0B1424] tracking-tight leading-[0.85]">
              {getGreeting()}, <br/>
              <span className="text-[#C5A572] italic">{userProfile?.name?.split(' ')[0] || 'Caregiver'}</span>
            </h2>
            <p className="text-xl text-slate-500 font-medium tracking-tight mt-4">
              Orchestrating premium wellness for your companions.
            </p>
          </div>
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab('profile')}
          className="relative group shrink-0"
        >
          <div className="absolute inset-0 bg-[#C5A572]/20 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="relative w-32 h-32 rounded-[3rem] overflow-hidden border-[6px] border-white shadow-2xl">
            <img 
              src={userProfile?.image || `https://api.dicebear.com/7.x/open-peeps/svg?seed=${userProfile?.uid}`} 
              alt="Avatar" 
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" 
            />
          </div>
        </motion.button>
      </section>

      {/* 2. Premium Bento Grid Matrix (Asymmetric Squircles) */}
      <BentoGrid setActiveTab={setActiveTab} role={role} pets={pets} records={records} />

      {/* Profiles Carousel */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-8 h-1 bg-[#C5A572] rounded-full" />
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.35em]">Clinical Roster</h4>
            </div>
            <button onClick={onAddPet} className="btn-emerald py-2.5 px-6">
                <Plus size={16} strokeWidth={3} /> Register New Pet
            </button>
        </div>

        <div className="flex gap-8 overflow-x-auto no-scrollbar snap-x pb-8">
          {pets.map((pet) => (
            <motion.div
              key={pet.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => { setSelectedPet(pet); onPetClick(pet); }}
              className={cn(
                "flex-shrink-0 w-64 bento-card p-8 snap-center relative group backdrop-blur-3xl",
                selectedPet?.id === pet.id 
                    ? "bg-[#0B1424] border-[#0B1424] text-white" 
                    : "hover:border-[#C5A572]/40"
              )}
            >
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="relative">
                  <div className={cn(
                    "w-32 h-32 rounded-[2.5rem] overflow-hidden border-[4px] shadow-2xl transition-all duration-700",
                    selectedPet?.id === pet.id ? "border-[#C5A572] scale-110" : "border-slate-100 group-hover:scale-105"
                  )}>
                    <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
                  </div>
                  {selectedPet?.id === pet.id && (
                    <div className="absolute -top-3 -right-3 w-10 h-10 bg-[#C5A572] text-[#0B1424] rounded-full flex items-center justify-center shadow-lg animate-in zoom-in-0 duration-500">
                       <Check size={20} strokeWidth={4} />
                    </div>
                  )}
                </div>
                <div className="w-full space-y-1">
                  <h6 className={cn("text-3xl font-display font-black leading-tight", selectedPet?.id === pet.id ? "text-white" : "text-[#0B1424]")}>
                    {pet.name}
                  </h6>
                  <p className={cn("text-[10px] font-black uppercase tracking-widest", selectedPet?.id === pet.id ? "text-[#C5A572]" : "text-slate-400")}>
                    {pet.breed || 'Companion'} • {pet.age} Years
                  </p>
                  
                  {selectedPet?.id === pet.id && (
                    <motion.button
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#C5A572] bg-white/10 px-4 py-2 rounded-full border border-[#C5A572]/30 hover:bg-[#C5A572] hover:text-[#0B1424] transition-all"
                    >
                      <FileText size={12} />
                      Passport
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. Global Discovery Scribe */}
      <section className="relative bento-card p-1 pb-1 flex flex-col sm:flex-row gap-1 bg-[#0B1424]/5 border-none">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-10 flex items-center pointer-events-none">
              <Search size={22} className="text-[#0B1424]/20" />
            </div>
            <input 
              type="text" 
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Deep scan clinical records, breeds, or community insights..."
              className="w-full bg-white border-none rounded-[2.4rem] pl-20 pr-12 py-7 text-xl font-bold focus:outline-none focus:ring-0 placeholder:text-slate-300 text-[#0B1424] shadow-inner"
            />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
               <div className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black uppercase text-slate-400 tracking-widest">Ctrl + K</div>
            </div>
          </div>
          <button 
            onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
            className="px-10 bg-[#0B1424] text-[#C5A572] rounded-[2.4rem] font-black uppercase tracking-widest text-xs hover:bg-[#1E293B] transition-all flex items-center gap-3 shrink-0"
          >
            {searchType === 'pets' ? 'Profiles' : searchType === 'records' ? 'Vault' : 'Forum'}
            <ChevronRight size={14} className={cn("transition-transform", isTypeDropdownOpen && "rotate-90")} />
          </button>
          
          <AnimatePresence>
            {isTypeDropdownOpen && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: 10 }}
                 className="absolute right-1 bottom-full mb-3 bg-[#0B1424] border border-white/10 rounded-[2rem] p-3 shadow-2xl z-50 w-64 space-y-1 overflow-hidden"
               >
                  {['pets', 'records', 'posts'].map((type) => (
                    <button
                      key={type}
                      onClick={() => { setSearchType(type as any); setIsTypeDropdownOpen(false); }}
                      className={cn(
                        "w-full text-left p-4 rounded-2xl transition-all flex items-center gap-4",
                        searchType === type ? "bg-[#C5A572] text-[#0B1424]" : "text-white/60 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <span className="text-xl">{type === 'pets' ? '🐕' : type === 'records' ? '📋' : '💬'}</span>
                      <span className="text-xs font-black uppercase tracking-widest">{type === 'pets' ? 'Profiles' : type === 'records' ? 'Vault' : 'Forum'}</span>
                    </button>
                  ))}
               </motion.div>
            )}
          </AnimatePresence>
      </section>

      {/* 5. SOS Tactical Link - Premium Edition */}
      <motion.section 
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
        onClick={onSOSClick}
        className="bento-card bg-rose-600 p-1 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] border-none"
      >
        <div className="bg-rose-600 rounded-[2.4rem] p-12 text-white flex flex-col lg:flex-row items-center justify-between gap-12 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12 text-center lg:text-left">
            <div className="w-32 h-32 bg-white/20 text-white rounded-[2.5rem] flex items-center justify-center group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 shadow-2xl backdrop-blur-md">
               <AlertTriangle size={64} strokeWidth={2.5} />
            </div>
            <div className="space-y-4">
               <div className="inline-block px-4 py-1.5 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-2">Emergency Tactical Uplink</div>
               <h3 className="text-6xl font-display font-black tracking-tighter leading-[0.85]">SOS Urgent <br/> Veterinary Link</h3>
               <p className="text-xl font-medium text-white/80 max-w-lg">Immediate clinical dispatch and emergency hospital geolocation protocol.</p>
            </div>
          </div>
          <motion.div 
            animate={{ x: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="relative z-10 w-24 h-24 rounded-full border-4 border-white/30 flex items-center justify-center group-hover:bg-white group-hover:text-rose-600 transition-all shadow-2xl"
          >
            <ChevronRight size={48} strokeWidth={3} />
          </motion.div>
        </div>
      </motion.section>
    </motion.div>
  );
});
