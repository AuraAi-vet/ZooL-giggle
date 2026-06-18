import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Radar, 
  ShieldAlert, 
  Map as MapIcon, 
  Activity, 
  MapPin, 
  TrendingUp,
  AlertCircle,
  Stethoscope
} from 'lucide-react';
import { getRegionalHealthAlerts } from '../services/geminiService';
import { PublicAlert } from '../types';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface BiospatialRadarProps {
  location?: { lat: number; lng: number };
}

export function BiospatialRadar({ location = { lat: 8.5241, lng: 76.9366 } }: BiospatialRadarProps) {
  const [alerts, setAlerts] = useState<PublicAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  useEffect(() => {
    async function loadAlerts() {
      try {
        const data = await getRegionalHealthAlerts(location);
        setAlerts(data);
      } catch (error) {
        toast.error("Failed to sync Biospatial Radar data");
      } finally {
        setIsLoading(false);
      }
    }
    loadAlerts();
  }, [location]);

  return (
    <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800 relative overflow-hidden group">
      {/* Neural Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      
      <div className="relative z-10 space-y-8">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)] group-hover:rotate-12 transition-transform duration-700">
              <Radar className="text-blue-400" size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400">Biospatial Intelligence</h3>
              </div>
              <p className="text-2xl font-brand text-white tracking-tight">Health Radar</p>
            </div>
          </div>

          <div className="flex items-center bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700">
            <button 
              onClick={() => setViewMode('map')}
              className={cn(
                "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                viewMode === 'map' ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              )}
            >
              Telemetry
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                viewMode === 'list' ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              )}
            >
              Bulletins
            </button>
          </div>
        </header>

        {viewMode === 'map' ? (
          <div className="relative aspect-[16/9] md:aspect-[21/9] bg-slate-800/30 rounded-[2.5rem] border border-slate-700 overflow-hidden group/map">
            {/* Mock Map Texture */}
            <div className="absolute inset-0 opacity-20 filter grayscale contrast-125"
                 style={{ 
                   backgroundImage: 'url("https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/76.9366,8.5241,10/800x400?access_token=pk.placeholder")',
                   backgroundSize: 'cover'
                 }} />
            
            {/* Pulse Points */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="absolute -inset-2 w-4 h-4 bg-blue-500/40 rounded-full animate-ping" />
                <div className="absolute -inset-4 w-8 h-8 bg-blue-500/20 rounded-full animate-ping duration-1000" />
                <div className="w-2 h-2 bg-blue-500 rounded-full relative z-10 shadow-[0_0_10px_#3b82f6]" />
              </div>

              {alerts.slice(0, 3).map((alert, i) => (
                <motion.div 
                  key={alert.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.3 }}
                  style={{ 
                    position: 'absolute',
                    top: `${40 + (i * 15)}%`,
                    left: `${30 + (i * 20)}%`
                  }}
                >
                  <div className={cn(
                    "relative group/point cursor-pointer",
                    alert.severity === 'critical' ? "text-rose-500" : "text-amber-500"
                  )}>
                    <div className="absolute -inset-4 w-8 h-8 bg-current/20 rounded-full animate-ping" />
                    <div className="w-3 h-3 bg-current rounded-full relative z-10 shadow-lg" />
                    
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-48 opacity-0 group-hover/point:opacity-100 transition-all scale-95 group-hover/point:scale-100 pointer-events-none">
                      <div className="bg-slate-900/95 backdrop-blur-3xl border border-slate-700 p-4 rounded-2xl shadow-2xl">
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1 leading-none">{alert.type}</p>
                        <p className="text-[11px] font-bold text-white mb-2 leading-tight">{alert.title}</p>
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                            alert.severity === 'critical' ? "bg-rose-500/20 text-rose-400" : "bg-amber-500/20 text-amber-400"
                          )}>
                            {alert.severity}
                          </span>
                        </div>
                      </div>
                      <div className="w-2 h-2 bg-slate-900 border-r border-b border-slate-700 rotate-45 mx-auto -mt-1" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
              <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 px-5 py-3 rounded-2xl flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-lg bg-slate-700 border border-slate-900 flex items-center justify-center overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?u=vet${i}`} alt="Vet" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">12 Active Nodes Scanning</p>
              </div>

              <div className="flex gap-2">
                <div className="px-4 py-2 bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Alert Level</p>
                  <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">Normal</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.map((alert, i) => (
              <motion.div 
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-slate-800/40 border border-slate-700 p-6 rounded-[2rem] hover:bg-slate-800/60 transition-all group/item"
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all group-hover/item:scale-110",
                    alert.severity === 'critical' ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : 
                    alert.severity === 'high' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                    "bg-blue-500/10 border-blue-500/20 text-blue-500"
                  )}>
                    <ShieldAlert size={24} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{alert.issuedBy}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{new Date(alert.timestamp).toLocaleDateString()}</span>
                    </div>
                    <h4 className="text-base font-bold text-white tracking-tight lead-tight">{alert.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{alert.message}</p>
                    <div className="pt-2 flex items-center gap-3">
                       <button className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-blue-400 hover:text-blue-300 transition-colors">
                          <Stethoscope size={10} /> Clinical Protocol
                       </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <footer className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Spatial Drift', value: '0.4%', icon: Activity },
            { label: 'Infection Velocity', value: 'Low', icon: TrendingUp },
            { label: 'Regional Focus', value: 'Kerala', icon: MapPin },
            { label: 'Risk Vector', value: 'Stable', icon: ShieldAlert },
          ].map((stat, i) => (
            <div key={i} className="bg-slate-800/30 border border-slate-700/50 p-5 rounded-[1.75rem] group/stat hover:bg-slate-800/50 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <stat.icon size={14} className="text-slate-500 group-hover/stat:text-blue-400 transition-colors" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{stat.label}</span>
              </div>
              <p className="text-lg font-brand text-white tracking-tight">{stat.value}</p>
            </div>
          ))}
        </footer>
      </div>
    </div>
  );
}
