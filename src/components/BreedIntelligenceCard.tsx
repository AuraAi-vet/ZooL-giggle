import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Dna, 
  ShieldAlert, 
  Utensils, 
  Timer, 
  TrendingUp,
  MapPin,
  ChevronRight,
  Sparkles,
  Search,
  X,
  ArrowRightLeft
} from 'lucide-react';
import { BreedInsight } from '../services/geminiService';
import fallbackBreedDatabase from '../breed-database.json';
import { cn } from '../lib/utils';

// Module level cache to avoid multiple network calls across components or re-mounts
let cachedDb: any = null;

interface BreedIntelligenceCardProps {
  breed: string;
  type: string;
}

export function BreedIntelligenceCard({ breed, type }: BreedIntelligenceCardProps) {
  const [activeBreed, setActiveBreed] = useState(breed);
  const [activeType, setActiveType] = useState(type);
  const [insight, setInsight] = useState<BreedInsight | null>(null);

  // Feature expansion: Compare Mode States
  const [compareBreed, setCompareBreed] = useState<string | null>(null);
  const [compareType, setCompareType] = useState<string | null>(null);
  const [compareInsight, setCompareInsight] = useState<BreedInsight | null>(null);

  // Search feature states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'dog' | 'cat' | 'other'>('all');
  const [database, setDatabase] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Sync state if props change
  useEffect(() => {
    setActiveBreed(breed);
    setActiveType(type);
    setCompareBreed(null);
    setCompareInsight(null);
    setSearchQuery('');
  }, [breed, type]);

  useEffect(() => {
    if (isOpen && !database && !loading) {
      loadDatabase();
    }
  }, [isOpen]);

  const getBreedInsightFromDb = (dbInstance: any, breedName: string, breedType: string): BreedInsight => {
    const normalizedType = (breedType || '').toLowerCase();
    const dbCategory = normalizedType === 'dog' 
      ? dbInstance.dog 
      : normalizedType === 'cat' 
        ? dbInstance.cat 
        : dbInstance.other;

    if (!dbCategory) return dbInstance.dog?.default || fallbackBreedDatabase.dog.default;

    const normalizedBreed = (breedName || '').toLowerCase().trim();
    
    // Direct lookup
    if (dbCategory[normalizedBreed]) {
      return dbCategory[normalizedBreed];
    } else {
      // Fuzzy/Partial matching
      const foundKey = Object.keys(dbCategory).find(key => 
        key !== 'default' && (normalizedBreed.includes(key) || key.includes(normalizedBreed))
      );
      if (foundKey) {
        return dbCategory[foundKey];
      }
    }
    return dbCategory.default;
  };

  const loadDatabase = async () => {
    setLoading(true);
    try {
      let activeDb = cachedDb;

      if (!activeDb) {
        try {
          const res = await fetch('/api/breed-database');
          if (res.ok) {
            const json = await res.json();
            if (json && (json.dog || json.cat || json.other)) {
              cachedDb = json;
              activeDb = json;
              console.log("Loaded live breed database asynchronously.");
            }
          }
        } catch (fetchErr) {
          console.warn("Backend breed database fetch offline/failed, using fallback:", fetchErr);
        }
      }

      // Fallback
      if (!activeDb) {
        activeDb = fallbackBreedDatabase;
      }

      setDatabase(activeDb);

      // Resolve primary breed insight
      const primaryInsight = getBreedInsightFromDb(activeDb, activeBreed, activeType);
      setInsight(primaryInsight);
    } catch (err) {
      console.error("Failed to load breed database", err);
    } finally {
      setLoading(false);
    }
  };

  // React to primary breed changes
  useEffect(() => {
    if (database) {
      const primaryInsight = getBreedInsightFromDb(database, activeBreed, activeType);
      setInsight(primaryInsight);
    }
  }, [activeBreed, activeType, database]);

  // React to comparative breed changes
  useEffect(() => {
    if (database && compareBreed && compareType) {
      const secondaryInsight = getBreedInsightFromDb(database, compareBreed, compareType);
      setCompareInsight(secondaryInsight);
    } else {
      setCompareInsight(null);
    }
  }, [compareBreed, compareType, database]);

  // Extract all searchable breeds in a flat format
  const searchableBreeds = React.useMemo(() => {
    const dbToUse = database || fallbackBreedDatabase;
    const list: Array<{ name: string; key: string; category: string; icon: string }> = [];
    
    const categories: Array<{ key: 'dog' | 'cat' | 'other'; icon: string }> = [
      { key: 'dog', icon: '🐕' },
      { key: 'cat', icon: '🐈' },
      { key: 'other', icon: '🐾' }
    ];

    categories.forEach(({ key, icon }) => {
      const categoryData = dbToUse[key];
      if (categoryData) {
        Object.keys(categoryData).forEach(breedKey => {
          if (breedKey !== 'default') {
            const prettyName = breedKey
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            list.push({
              name: prettyName,
              key: breedKey,
              category: key,
              icon: icon
            });
          }
        });
      }
    });

    return list;
  }, [database]);

  // Compute filtered search outputs
  const filteredBreeds = React.useMemo(() => {
    return searchableBreeds.filter(item => {
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesQuery = searchQuery.trim() === '' || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [searchableBreeds, searchQuery, categoryFilter]);

  return (
    <div className="bg-white/95 backdrop-blur-3xl border border-ruru-navy/10 rounded-[2.5rem] overflow-hidden transition-all duration-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] group/card">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-8 flex items-center justify-between group"
      >
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-[1.75rem] bg-gradient-to-br from-emerald-50 to-teal-50 text-ruru-teal flex items-center justify-center shrink-0 border border-emerald-100 shadow-inner group-hover:scale-105 transition-transform duration-500">
            <Dna size={26} />
          </div>
          <div className="text-left">
            <h3 className="text-xl font-brand tracking-tight text-ruru-navy group-hover:text-ruru-teal transition-colors">Breed Intelligence</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-ruru-navy/50">Database Lookup</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">
                <Dna size={10} className="text-emerald-500" /> Active DB
              </span>
            </div>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0, scale: isOpen ? 1.1 : 1 }}
          className="w-10 h-10 rounded-full bg-ruru-navy/5 flex items-center justify-center text-ruru-navy/60 group-hover:bg-ruru-navy/10 group-hover:text-ruru-navy transition-colors"
        >
          <ChevronRight size={20} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-8 pt-0 space-y-8">
              
              {/* Feature Expansion: Real-time Search and Compare Panel */}
              <div className="bg-slate-50/50 p-6 rounded-[2.25rem] border border-ruru-navy/5 space-y-4">
                <div className="flex flex-col md:flex-row gap-3">
                  {/* Search Query Input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ruru-navy/40" size={18} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search breeds to compare..."
                      className="w-full pl-11 pr-10 py-3 bg-white border border-ruru-navy/10 rounded-2xl text-sm font-medium text-ruru-navy placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-ruru-teal/20 focus:border-ruru-teal transition-all"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ruru-navy/40 hover:text-ruru-navy transition-colors"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {/* Category Filter Tag Buttons */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0 shrink-0 select-none scrollbar-none">
                    {(['all', 'dog', 'cat', 'other'] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategoryFilter(cat)}
                        className={cn(
                          "px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl border transition-all shrink-0",
                          categoryFilter === cat
                            ? "bg-ruru-navy border-ruru-navy text-white shadow-sm"
                            : "bg-white border-ruru-navy/10 text-ruru-navy/60 hover:border-ruru-navy/20 hover:text-ruru-navy"
                        )}
                      >
                        {cat === 'all' ? 'All' : cat === 'dog' ? 'Dogs 🐕' : cat === 'cat' ? 'Cats 🐈' : 'Exotics 🐾'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Display matches or recommended comparative rows */}
                <AnimatePresence>
                  {searchQuery.trim() !== '' ? (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="space-y-2 max-h-56 overflow-y-auto pr-1"
                    >
                      <p className="text-[9px] font-black uppercase tracking-widest text-ruru-navy/40">Matching Breeds ({filteredBreeds.length})</p>
                      {filteredBreeds.length === 0 ? (
                        <p className="text-xs text-[#A8A29E] italic py-2">No matching breeds found in clinical catalog.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {filteredBreeds.slice(0, 8).map((item) => (
                            <div 
                              key={`${item.category}-${item.key}`}
                              className="bg-white hover:bg-teal-50/40 p-3 rounded-xl border border-ruru-navy/5 hover:border-ruru-teal/30 hover:scale-[1.01] transition-all flex items-center justify-between gap-3 group/item"
                            >
                              <span className="text-sm font-semibold text-ruru-navy flex items-center gap-1.5">
                                <span>{item.icon}</span>
                                <span className="truncate capitalize">{item.name}</span>
                              </span>
                              
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => {
                                    setActiveBreed(item.key);
                                    setActiveType(item.category);
                                    setSearchQuery('');
                                  }}
                                  className="px-2.5 py-1 bg-ruru-navy/5 hover:bg-ruru-navy text-[10px] font-black uppercase tracking-wider text-ruru-navy hover:text-white rounded-lg transition-all"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => {
                                    setCompareBreed(item.key);
                                    setCompareType(item.category);
                                    setSearchQuery('');
                                  }}
                                  className="px-2.5 py-1 bg-ruru-teal/10 hover:bg-ruru-teal text-[10px] font-black uppercase tracking-wider text-ruru-teal hover:text-white rounded-lg transition-all flex items-center gap-1"
                                >
                                  <ArrowRightLeft size={10} /> Compare
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    /* Suggestions for Comparison based on Active Type */
                    <div className="space-y-2">
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#A8A29E]">Quick Compare Recommendations ({activeType.toUpperCase()}s)</p>
                      <div className="flex gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-none">
                        {searchableBreeds
                          .filter(item => item.category === activeType && item.key !== activeBreed)
                          .slice(0, 5)
                          .map((item) => (
                            <button
                              key={`${item.category}-${item.key}`}
                              onClick={() => {
                                setCompareBreed(item.key);
                                setCompareType(item.category);
                              }}
                              className="px-3 py-1.5 bg-white hover:bg-ruru-teal/5 text-xs font-medium text-ruru-navy border border-ruru-navy/5 hover:border-ruru-teal/30 rounded-xl transition-all flex items-center gap-1.5 shrink-0"
                            >
                              <ArrowRightLeft size={10} className="text-ruru-teal animate-pulse" />
                              <span className="capitalize">Compare {item.name}</span>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Active Comparison Status Header element */}
              {compareInsight && compareBreed && (
                <div className="bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-[#FDFBF7] p-4 rounded-2xl border border-ruru-teal/25 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-ruru-teal/10 text-ruru-teal flex items-center justify-center shrink-0">
                      <ArrowRightLeft size={16} />
                    </div>
                    <div>
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-ruru-teal">Clinical Compare Active</h5>
                      <p className="text-xs font-semibold text-ruru-navy">
                        Comparing <span className="text-ruru-teal uppercase font-bold">{activeBreed}</span> vs <span className="text-ruru-indigo uppercase font-bold text-indigo-700">{compareBreed}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setCompareBreed(null);
                      setCompareType(null);
                      setCompareInsight(null);
                    }}
                    className="px-3 py-1 bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white text-[9px] font-black uppercase tracking-[0.15em] rounded-lg transition-all flex items-center gap-1 border border-rose-100 hover:border-rose-500 shadow-sm shrink-0"
                  >
                    <X size={10} /> Stop Compare
                  </button>
                </div>
              )}

              {loading ? (
                <div className="py-16 flex flex-col items-center justify-center space-y-6">
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 180] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="text-ruru-teal border border-ruru-teal/20 p-4 rounded-full bg-ruru-teal/5"
                  >
                    <Search size={32} />
                  </motion.div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-ruru-navy/50 animate-pulse text-center">Querying Clinical Database<span className="animate-[ping_1.5s_infinite]">...</span></p>
                </div>
              ) : compareInsight && compareBreed && insight ? (
                /* Dynamic side-by-side comparison layout template */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                  
                  {/* Column 1: Primary Breed Details */}
                  <div className="space-y-6 bg-slate-50/40 p-6 rounded-[2rem] border border-slate-100 relative">
                    <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                      Primary
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#A8A29E]">{activeType} breed</span>
                      <h4 className="text-2xl font-brand text-ruru-navy capitalize">{activeBreed}</h4>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-ruru-navy/5 shadow-sm space-y-2">
                      <h5 className="text-[9px] font-black uppercase tracking-widest text-ruru-teal flex items-center gap-1.5"><Zap size={10} /> Executive Summary</h5>
                      <span className="text-xs font-light text-ruru-navy-light leading-relaxed italic block">"{insight.summary}"</span>
                    </div>

                    <div className="p-4 rounded-xl bg-red-50/20 border border-red-100/30 space-y-3">
                      <h5 className="text-[9px] font-black uppercase tracking-widest text-red-600 flex items-center gap-1.5"><ShieldAlert size={10} /> Genetic Tendencies</h5>
                      <ul className="space-y-2">
                        {insight.commonIssues.map((issue, i) => (
                          <li key={i} className="text-xs font-light text-ruru-navy flex items-start gap-2">
                            <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5 shrink-0" />
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-emerald-50/20 border border-emerald-100/30 space-y-3">
                      <h5 className="text-[9px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1.5"><Utensils size={10} /> Dietary Intake</h5>
                      <ul className="space-y-2">
                        {insight.dietaryNeeds.map((need, i) => (
                          <li key={i} className="text-xs font-light text-ruru-navy flex items-start gap-2">
                            <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                            <span>{need}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-orange-50/20 border border-orange-100/30 space-y-1">
                      <h5 className="text-[9px] font-black uppercase tracking-widest text-orange-600 flex items-center gap-1.5"><TrendingUp size={10} /> Exercise Intensity</h5>
                      <span className="text-xs font-light text-ruru-navy block">{insight.exerciseLevel}</span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#FDFBF7] border border-ruru-navy/5 flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#A8A29E] flex items-center gap-1.5"><Timer size={12} /> Expected Lifespan</span>
                      <span className="text-xs font-brand text-ruru-navy font-bold">{insight.longevity}</span>
                    </div>
                  </div>

                  {/* Column 2: Comparison Breed Details */}
                  <div className="space-y-6 bg-teal-50/10 p-6 rounded-[2rem] border border-ruru-teal/15 relative">
                    <div className="absolute top-4 right-4 bg-teal-100 text-teal-800 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                      Comparison
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#A8A29E]">{compareType} breed</span>
                      <h4 className="text-2xl font-brand text-indigo-900 capitalize">{compareBreed}</h4>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-ruru-navy/5 shadow-sm space-y-2">
                      <h5 className="text-[9px] font-black uppercase tracking-widest text-ruru-teal flex items-center gap-1.5"><Zap size={10} /> Executive Summary</h5>
                      <span className="text-xs font-light text-ruru-navy-light leading-relaxed italic block text-indigo-950">"{compareInsight.summary}"</span>
                    </div>

                    <div className="p-4 rounded-xl bg-red-50/20 border border-red-100/30 space-y-3">
                      <h5 className="text-[9px] font-black uppercase tracking-widest text-red-600 flex items-center gap-1.5"><ShieldAlert size={10} /> Genetic Tendencies</h5>
                      <ul className="space-y-2">
                        {compareInsight.commonIssues.map((issue, i) => (
                          <li key={i} className="text-xs font-light text-ruru-navy flex items-start gap-2">
                            <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5 shrink-0" />
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-emerald-50/20 border border-emerald-100/30 space-y-3">
                      <h5 className="text-[9px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1.5"><Utensils size={10} /> Dietary Intake</h5>
                      <ul className="space-y-2">
                        {compareInsight.dietaryNeeds.map((need, i) => (
                          <li key={i} className="text-xs font-light text-ruru-navy flex items-start gap-2">
                            <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                            <span>{need}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-orange-50/20 border border-orange-100/30 space-y-1">
                      <h5 className="text-[9px] font-black uppercase tracking-widest text-orange-600 flex items-center gap-1.5"><TrendingUp size={10} /> Exercise Intensity</h5>
                      <span className="text-xs font-light text-ruru-navy block">{compareInsight.exerciseLevel}</span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#FDFBF7] border border-ruru-navy/5 flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#A8A29E] flex items-center gap-1.5"><Timer size={12} /> Expected Lifespan</span>
                      <span className="text-xs font-brand text-ruru-navy font-bold">{compareInsight.longevity}</span>
                    </div>
                  </div>

                </div>
              ) : insight ? (
                /* Standard single breed view */
                <div className="space-y-8 pt-2">
                  <div className="bg-gradient-to-br from-[#FDFBF7] to-white rounded-[2.5rem] p-8 border border-ruru-navy/5 relative overflow-hidden shadow-sm">
                    <div className="absolute -top-4 -right-4 w-32 h-32 bg-ruru-teal/5 rounded-full blur-2xl" />
                    <div className="absolute top-4 right-4 opacity-10">
                      <Sparkles size={48} className="text-ruru-teal" />
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-ruru-teal mb-4 flex items-center gap-2">
                       <Zap size={12} /> Executive Summary ({activeBreed.toUpperCase()})
                    </h4>
                    <p className="text-[15px] text-ruru-navy-light leading-relaxed font-light relative z-10 italic">
                      "{insight.summary}"
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 bg-red-50/30 p-6 rounded-[2rem] border border-red-100/50">
                      <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-red-500 flex items-center gap-2">
                        <div className="bg-red-100 p-1.5 rounded-lg"><ShieldAlert size={16} /></div>
                        Genetic Predispositions
                      </h4>
                      <ul className="space-y-3 pt-2">
                        {insight.commonIssues.map((issue, i) => (
                          <li key={i} className="text-sm text-ruru-navy flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0 shadow-[0_0_8px_rgba(248,113,113,0.5)]" />
                            <span className="font-light">{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-4 bg-emerald-50/30 p-6 rounded-[2rem] border border-emerald-100/50">
                      <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600 flex items-center gap-2">
                         <div className="bg-emerald-100 p-1.5 rounded-lg"><Utensils size={16} /></div>
                         Dietary Requirements
                      </h4>
                      <ul className="space-y-3 pt-2">
                        {insight.dietaryNeeds.map((need, i) => (
                          <li key={i} className="text-sm text-ruru-navy flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                            <span className="font-light">{need}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-orange-50/30 p-6 rounded-[2rem] border border-orange-100/50">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-600 flex items-center gap-2 mb-4">
                      <div className="bg-orange-100 p-1.5 rounded-lg"><TrendingUp size={16} /></div>
                      Exercise Recommendations
                    </h4>
                    <p className="text-sm font-light text-ruru-navy leading-relaxed">
                      {insight.exerciseLevel}
                    </p>
                  </div>

                  {insight.careTips && insight.careTips.length > 0 && (
                    <div className="bg-ruru-teal/5 p-6 rounded-[2rem] border border-ruru-teal/10">
                      <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-ruru-teal flex items-center gap-2 mb-4">
                        <div className="bg-ruru-teal/10 p-1.5 rounded-lg"><Sparkles size={16} /></div>
                        Care Recommendations
                      </h4>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {insight.careTips.map((tip, i) => (
                          <li key={i} className="text-sm text-ruru-navy flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-ruru-teal mt-2 shrink-0 shadow-[0_0_8px_rgba(52,181,199,0.5)]" />
                            <span className="font-light">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-ruru-navy/10 px-2 lg:gap-6">
                    <div className="flex flex-col items-center justify-center p-4 rounded-[2rem] bg-[#FDFBF7] border border-ruru-navy/5 space-y-2">
                      <Timer size={20} className="text-ruru-magenta mb-1" />
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#A8A29E]">Expected Lifespan</p>
                      <p className="text-sm font-brand text-ruru-navy text-center leading-tight">{insight.longevity}</p>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 rounded-[2rem] bg-[#FDFBF7] border border-ruru-navy/5 space-y-2">
                      <MapPin size={20} className="text-ruru-blue mb-1" />
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#A8A29E]">Origin</p>
                      <p className="text-sm font-brand text-ruru-navy text-center leading-tight">Global Scan</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 p-4 rounded-[1.5rem] text-center">
                  <p className="text-xs text-red-600">Failed to load breed intelligence catalog.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
