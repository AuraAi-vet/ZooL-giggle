import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertCircle, 
  ChevronRight, 
  X, 
  MapPin, 
  Zap, 
  Sparkles,
  Info,
  ShieldCheck
} from 'lucide-react';
import { getRegionalHealthAlerts } from '../services/geminiService';
import { PublicAlert } from '../types';
import { cn } from '../lib/utils';

export function RegionalAlertsBanner() {
  const [alerts, setAlerts] = useState<PublicAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    // Determine location - using a static default for now, can be enhanced with Geolocation
    // The user's metadata mentioned Asia/East, but let's assume a general region or ask search to find.
    // In a real app, we'd use navigator.geolocation
    setLoading(true);
    try {
      const data = await getRegionalHealthAlerts("your current region");
      setAlerts(data);
    } catch (err) {
      console.error("Failed to load alerts", err);
    } finally {
      setLoading(false);
    }
  };

  if (!visible || (alerts.length === 0 && !loading)) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative group bg-ruru-navy rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Sparkles size={48} className="text-ruru-teal-light" />
        </div>
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-ruru-teal/20 flex items-center justify-center text-ruru-teal-light border border-ruru-teal-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <AlertCircle size={18} />
              </div>
              <div>
                <h3 className="text-sm font-brand text-white tracking-tight">Regional Pulse</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-black uppercase tracking-widest text-ruru-teal-light/80">AI Surveillance Active</span>
                  <div className="w-1 h-1 rounded-full bg-ruru-teal animate-pulse" />
                </div>
              </div>
            </div>
            <button 
              onClick={() => setVisible(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="py-2 flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-ruru-teal animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-ruru-teal animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-ruru-teal animate-bounce [animation-delay:0.4s]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Scanning Global Health Nodes</span>
              </div>
            ) : (
              alerts.map((alert, idx) => (
                <div 
                  key={idx}
                  className="flex items-start gap-4 pb-4 last:pb-0 last:border-b-0 border-b border-white/5"
                >
                  <div className={cn(
                    "mt-1 w-2 h-2 rounded-full shrink-0",
                    alert.severity === 'high' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : 
                    alert.severity === 'medium' ? "bg-yellow-500" : "bg-ruru-teal"
                  )} />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white/90">{alert.title}</h4>
                    <p className="text-[11px] text-white/50 leading-relaxed italic line-clamp-2">
                      {alert.message}
                    </p>
                    {alert.issuedBy && (
                      <p className="text-[8px] font-black uppercase tracking-widest text-ruru-teal-light/60 mt-1">
                        Issued By: {alert.issuedBy}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-ruru-teal-light">
                <Zap size={10} fill="currentColor" />
                <span className="text-[8px] font-black uppercase tracking-widest">Powered by Flash 1.5</span>
              </div>
            </div>
            <button className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors group">
              Detailed Intelligence <ChevronRight size={10} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
