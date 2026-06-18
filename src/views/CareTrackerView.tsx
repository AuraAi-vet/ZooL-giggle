import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Droplets, 
  Footprints, 
  Heart, 
  Plus, 
  Trash2, 
  Utensils, 
  Zap, 
  Clock,
  Settings2,
  CheckCircle2,
  TrendingUp,
  Activity,
  Calendar
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { QuickLog, Pet } from '../types';
import { cn } from '../lib/utils';
import { PetCalmingSoundSpa } from '../components/PetCalmingSoundSpa';

interface CareTrackerViewProps {
  quickLogs: QuickLog[];
  pets: Pet[];
  onAddLog: () => void;
  onDeleteLog: (id: string) => void;
  onQuickLog?: (type: string, petId: string) => void;
}

export function CareTrackerView({ 
  quickLogs, 
  pets, 
  onAddLog, 
  onDeleteLog,
  onQuickLog
}: CareTrackerViewProps) {
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([pets[0]?.id || '']);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const togglePetSelection = (id: string) => {
    setSelectedPetIds(prev => 
      prev.includes(id) 
        ? (prev.length > 1 ? prev.filter(p => p !== id) : prev) 
        : [...prev, id]
    );
  };

  const filteredLogs = quickLogs.filter(l => selectedPetIds.includes(l.petId) && l.timestamp.startsWith(selectedDate));

  const stats = [
    { label: 'Food', icon: Utensils, color: 'bg-orange-50 text-orange-600', count: filteredLogs.filter(l => l.type === 'food').length },
    { label: 'Water', icon: Droplets, color: 'bg-blue-50 text-blue-600', count: filteredLogs.filter(l => l.type === 'water').length },
    { label: 'Walk', icon: Footprints, color: 'bg-green-50 text-green-600', count: filteredLogs.filter(l => l.type === 'walk').length },
    { label: 'Play', icon: Heart, color: 'bg-red-50 text-red-600', count: filteredLogs.filter(l => l.type === 'play').length }
  ];

  const last30DaysData = useMemo(() => {
    const dates = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return d.toISOString().split('T')[0];
    });

    return dates.map(dateStr => {
      const dayLogs = quickLogs.filter(l => 
        selectedPetIds.includes(l.petId) && 
        l.timestamp.startsWith(dateStr)
      );

      const food = dayLogs.filter(l => l.type === 'food').length;
      const water = dayLogs.filter(l => l.type === 'water').length;
      const walk = dayLogs.filter(l => l.type === 'walk' || l.type === 'play').length;
      const waste = dayLogs.filter(l => l.type === 'pee' || l.type === 'poop').length;
      const total = dayLogs.length;

      const d = new Date(dateStr);
      const name = d.toLocaleDateString([], { month: 'short', day: 'numeric' });

      return {
        date: dateStr,
        name,
        food,
        water,
        walk,
        waste,
        total
      };
    });
  }, [quickLogs, selectedPetIds]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="px-6 py-10 pb-32 space-y-12 max-w-5xl mx-auto"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-2">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center gap-2 bg-soft-green/30 px-3 py-1 rounded-full border border-soft-green/50">
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-1.5 h-1.5 bg-green-500 rounded-full" 
              />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-800">Routine Vault Active</p>
            </div>
            <div className="h-3 w-px bg-soft-blue/30" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-soft-ink/30">Temporal Care v2.0</p>
          </div>
          <h2 className="text-5xl font-display font-semibold text-soft-ink tracking-tight mb-2">Daily Rhythm</h2>
          <p className="text-soft-ink/50 text-lg font-medium leading-relaxed max-w-lg">Track and monitor your pet's life-critical care activities with clinical precision.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-12 h-12 bg-white border border-soft-blue/20 rounded-[1.25rem] shadow-sm text-soft-ink flex items-center justify-center hover:bg-soft-blue/10 transition-all group"
        >
          <Settings2 size={24} className="group-hover:rotate-90 transition-transform duration-500" />
        </motion.button>
      </header>

      {/* Pet Selection Slider */}
      <div className="flex flex-col gap-6 px-2">
        <label className="text-[10px] font-black text-soft-ink/30 uppercase tracking-[0.3em] px-1">Active Profiling Target</label>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-1 snap-x">
          {pets.map(pet => (
            <motion.button
              key={pet.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => togglePetSelection(pet.id)}
              className={cn(
                "flex-shrink-0 flex items-center gap-4 px-6 py-3 rounded-full transition-all duration-500 border snap-center",
                selectedPetIds.includes(pet.id) 
                  ? "bg-soft-ink border-soft-ink text-white shadow-xl shadow-soft-ink/10" 
                  : "bg-white border-soft-blue/20 text-soft-ink/40 hover:border-soft-blue/50"
              )}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white bg-soft-slate">
                   <img src={pet.image} alt="" className="w-full h-full object-cover" />
                </div>
                {selectedPetIds.includes(pet.id) && (
                  <motion.div 
                    layoutId="check-care"
                    className="absolute -top-1 -right-1 w-5 h-5 bg-ruru-teal rounded-full flex items-center justify-center border-2 border-soft-ink"
                  >
                    <CheckCircle2 size={10} className="text-white" />
                  </motion.div>
                )}
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest">{pet.name}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12 px-2">
        {/* Quick Intent Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
          {[
            { type: 'food', icon: Utensils, label: 'Feed', color: 'text-orange-500' },
            { type: 'water', icon: Droplets, label: 'Water', color: 'text-blue-500' },
            { type: 'walk', icon: Footprints, label: 'Walk', color: 'text-green-500' },
            { type: 'pee', icon: Zap, label: 'Pee', color: 'text-yellow-600' },
            { type: 'poop', icon: Trash2, label: 'Poop', color: 'text-stone-500' },
            { type: 'play', icon: Heart, label: 'Play', color: 'text-pink-500' },
          ].map(item => (
            <motion.button
              key={item.type}
              whileHover={{ y: -8, boxShadow: '0 20px 40px -8px rgba(15, 23, 42, 0.08)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                selectedPetIds.forEach(id => onQuickLog?.(item.type, id));
              }}
              className="bg-white border border-soft-blue/20 p-8 rounded-[2.5rem] flex flex-col items-center gap-5 transition-all duration-500 group"
            >
              <div className={cn("w-16 h-16 rounded-[1.5rem] bg-soft-slate flex items-center justify-center group-hover:scale-110 transition-transform duration-500", item.color)}>
                <item.icon size={32} />
              </div>
              <span className="text-[10px] font-black text-soft-ink uppercase tracking-widest">{item.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Temporal Selection & Stats Bento */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-soft-ink text-white p-10 rounded-[2.5rem] flex flex-col justify-between shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
            <div className="flex items-center justify-between relative z-10 mb-10">
               <button className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white hover:text-soft-ink transition-all"><ChevronLeft size={20} /></button>
               <div className="text-center">
                 <p className="text-3xl font-display font-semibold tracking-tight">{new Date(selectedDate).toLocaleDateString([], { month: 'long', day: 'numeric' })}</p>
                 <p className="text-[10px] font-black text-ruru-teal-light uppercase tracking-[0.25em] mt-1">Active Cycle</p>
               </div>
               <button className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white hover:text-soft-ink transition-all"><ChevronRight size={20} /></button>
            </div>
            <div className="relative z-10 pt-6 border-t border-white/5 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-ruru-teal rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Continuity 100%</span>
               </div>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Operational</p>
            </div>
          </div>
          
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-6">
            {stats.map(stat => (
              <div key={stat.label} className="bg-white border border-soft-blue/20 rounded-[2.5rem] p-8 text-center space-y-4 transition-all duration-500 group shadow-sm hover:shadow-xl hover:shadow-soft-blue/5">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mx-auto transition-transform duration-500 group-hover:scale-110", stat.color)}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-[9px] uppercase font-black text-soft-ink/30 tracking-[0.2em] mb-1">{stat.label}</p>
                  <p className="text-4xl font-display font-semibold text-soft-ink leading-none">{stat.count}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pet Calming Sound Therapy Spa */}
        <PetCalmingSoundSpa />

        {/* 30-Day Activity Trends Graph */}
        <div className="bg-white border border-soft-blue/20 rounded-[2.5rem] p-8 md:p-10 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-display text-3xl font-semibold text-soft-ink tracking-tight flex items-center gap-3">
                <TrendingUp className="text-ruru-teal" size={28} />
                30-Day Care Analytics
              </h3>
              <p className="text-xs text-soft-ink/40 font-medium leading-relaxed">
                Stacked breakdown of routine interactions: feedings, hydration cycles, outdoor exercise and waste logging.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-soft-slate px-4 py-2 border border-soft-blue/10 rounded-2xl shrink-0">
              <Calendar size={14} className="text-soft-ink/40" />
              <span className="text-[10px] font-black uppercase tracking-widest text-soft-ink/60">
                Last 30 Days Trend
              </span>
            </div>
          </div>

          <div className="h-[320px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={last30DaysData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorFood" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.01}/>
                  </linearGradient>
                  <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01}/>
                  </linearGradient>
                  <linearGradient id="colorWalk2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
                  </linearGradient>
                  <linearGradient id="colorWaste" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#78716c" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#78716c" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                  style={{ fontSize: '10px', fontWeight: 'bold', fill: '#94a3b8' }}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                  allowDecimals={false}
                  style={{ fontSize: '10px', fontWeight: 'bold', fill: '#94a3b8' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '1.25rem',
                    border: 'none',
                    color: '#fff',
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    padding: '12px 16px',
                  }}
                  itemStyle={{ fontSize: '12px', padding: '2px 0' }}
                  labelStyle={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#38bdf8', marginBottom: '4px' }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', paddingBottom: '20px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="food" 
                  name="Feeding (Food)" 
                  stackId="1" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorFood)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="water" 
                  name="Hydration (Water)" 
                  stackId="1" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorWater)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="walk" 
                  name="Exercise (Walk & Play)" 
                  stackId="1" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorWalk2)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="waste" 
                  name="Waste (Pee & Poop)" 
                  stackId="1" 
                  stroke="#78716c" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorWaste)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Timeline Refined */}
        <div className="space-y-10">
          <div className="flex justify-between items-center px-4">
            <div className="flex items-center gap-6">
              <h3 className="font-display text-3xl font-semibold text-soft-ink tracking-tight">Sequence Log</h3>
              <div className="h-[1px] w-24 bg-soft-blue/20" />
            </div>
            <motion.button 
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={onAddLog}
              className="flex items-center gap-3 text-[10px] font-black text-white bg-soft-ink px-8 py-4.5 rounded-[1.5rem] shadow-xl shadow-soft-ink/10 transition-all uppercase tracking-widest"
            >
              <Plus size={18} /> Add Custom Entry
            </motion.button>
          </div>

          <div className="relative space-y-8 before:absolute before:left-[2.25rem] before:top-4 before:bottom-4 before:w-[2px] before:bg-soft-blue/10">
            {filteredLogs.length > 0 ? filteredLogs.map((log, idx) => (
              <motion.div 
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                className="flex items-start gap-8 relative z-10 group"
              >
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg border-4 border-white transition-all duration-500 group-hover:scale-110",
                  log.type === 'food' ? "bg-orange-50 text-orange-600" :
                  log.type === 'water' ? "bg-blue-50 text-blue-600" :
                  log.type === 'walk' ? "bg-green-50 text-green-600" :
                  log.type === 'pee' ? "bg-yellow-50 text-yellow-600" :
                  log.type === 'poop' ? "bg-stone-50 text-stone-600" :
                  "bg-red-50 text-red-600"
                )}>
                  {log.type === 'food' && <Utensils size={20} />}
                  {log.type === 'water' && <Droplets size={20} />}
                  {log.type === 'walk' && <Footprints size={20} />}
                  {log.type === 'pee' && <Zap size={20} />}
                  {log.type === 'poop' && <Trash2 size={20} />}
                  {log.type === 'play' && <Heart size={20} />}
                </div>
                
                <div className="flex-1 bg-white border border-soft-blue/20 rounded-[2rem] p-8 flex items-center justify-between shadow-sm group-hover:shadow-xl group-hover:shadow-soft-blue/5 group-hover:border-soft-blue/50 transition-all duration-500">
                  <div className="space-y-2">
                    <div className="flex items-center gap-5">
                      <p className="text-xl font-display font-semibold text-soft-ink capitalize">{log.type}</p>
                      <div className="flex items-center gap-2 bg-soft-slate px-3 py-1 rounded-full border border-soft-blue/10">
                        <Clock size={12} className="text-soft-ink/30" /> 
                        <span className="text-[10px] font-black text-soft-ink/60 uppercase tracking-widest leading-none">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    {log.notes && <p className="text-sm font-medium text-soft-ink/40 italic leading-relaxed">"{log.notes}"</p>}
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    onClick={() => onDeleteLog(log.id)}
                    className="w-10 h-10 flex items-center justify-center text-soft-ink/10 hover:text-pink-600 hover:bg-soft-pink/20 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-500"
                  >
                    <Trash2 size={18} />
                  </motion.button>
                </div>
              </motion.div>
            )) : (
              <div className="text-center py-20 px-10 bg-white border-2 border-dashed border-soft-blue/20 rounded-[2.5rem] space-y-8 group">
                <div className="w-24 h-24 bg-soft-slate rounded-[2rem] flex items-center justify-center mx-auto text-soft-ink/10 transition-transform group-hover:rotate-12 duration-1000">
                   <Clock size={40} />
                </div>
                <div className="space-y-2">
                   <p className="text-2xl font-display font-semibold text-soft-ink">Timeline Inactive</p>
                   <p className="text-sm text-soft-ink/40 font-medium tracking-wide">No care entries recorded for this temporal cycle.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
