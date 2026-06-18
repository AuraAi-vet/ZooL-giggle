import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  X, 
  MapPin, 
  Phone,
  Ambulance,
  Building2,
  Activity,
  Heart,
  Bot,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { getDirectionsUrl } from '../services/mapsService';
import { analyzeSymptoms, SymptomAnalysis } from '../services/geminiService';
import { useStore } from '../store/useStore';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  nearbyVets: any[];
  isLoading: boolean;
}

export function SOSModal({ isOpen, onClose, nearbyVets, isLoading }: SOSModalProps) {
  const { pets } = useStore();
  const [isTriageLoading, setIsTriageLoading] = React.useState(false);
  const [triageResult, setTriageResult] = React.useState<SymptomAnalysis | null>(null);
  const [triageQuery, setTriageQuery] = React.useState('');

  if (!isOpen) return null;

  const handleTriage = async () => {
    if (!triageQuery.trim()) {
      toast.error('Please describe the emergency symptoms.');
      return;
    }
    setIsTriageLoading(true);
    try {
      const petInfo = pets.length > 0 ? `${pets[0].name}, ${pets[0].breed}, ${pets[0].age}y` : 'Unknown pet';
      const result = await analyzeSymptoms(triageQuery, petInfo);
      setTriageResult(result);
    } catch (error: any) {
      toast.error(error.message || 'Triage failed. Please contact a vet directly.');
    } finally {
      setIsTriageLoading(false);
    }
  };

  const firstAid = [
    { title: 'Heatstroke', steps: 'Move to cool area, apply wet towels, offer water.', icon: <Activity className="text-orange-500" size={18} /> },
    { title: 'Choking', steps: 'Check mouth for obstruction, perform Heimlich if needed.', icon: <ShieldAlert className="text-red-500" size={18} /> },
    { title: 'Bleeding', steps: 'Apply direct pressure with clean cloth.', icon: <Heart className="text-red-600" size={18} /> },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-ruru-navy/80 backdrop-blur-xl"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white/95 backdrop-blur-3xl w-full max-w-2xl rounded-[2.5rem] p-10 relative z-10 shadow-2xl overflow-y-auto max-h-[90vh] border-4 border-red-500/10"
          >
            <div className="flex justify-between items-start mb-10">
              <div className="flex items-start gap-5 text-red-600">
                <div className="w-16 h-16 rounded-[1.5rem] bg-red-50 flex items-center justify-center text-red-600 border border-red-100 shadow-sm shrink-0">
                  <ShieldAlert size={32} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500">Critical Response Protocol</p>
                  <h2 className="text-4xl font-brand tracking-tighter text-ruru-navy">Emergency SOS</h2>
                </div>
              </div>
              <button onClick={onClose} className="p-3 hover:bg-[#FDFBF7] rounded-full text-[#A8A29E] hover:text-ruru-navy transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-12">
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-[#A8A29E] uppercase tracking-[0.3em] flex items-center gap-2">
                    <Bot size={14} className="text-ruru-navy-light" />
                    AI Digital Triage Support
                  </h3>
                  {triageResult && (
                    <button 
                      onClick={() => { setTriageResult(null); setTriageQuery(''); }}
                      className="text-[10px] font-black uppercase text-rose-500 hover:underline"
                    >
                      Reset Triage
                    </button>
                  )}
                </div>

                {!triageResult ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6 space-y-4">
                    <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
                      "Describe exactly what's happening. RuRu will provide immediate stabilization steps while you connect to emergency services."
                    </p>
                    <div className="relative">
                      <textarea
                        value={triageQuery}
                        onChange={(e) => setTriageQuery(e.target.value)}
                        placeholder="e.g., My dog collapsed after running in the heat and is breathing very fast..."
                        className="w-full bg-white border border-slate-200 rounded-[1.5rem] p-5 text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all resize-none h-32"
                      />
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleTriage}
                        disabled={isTriageLoading}
                        className="absolute bottom-4 right-4 bg-rose-600 text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-600/20 flex items-center gap-2 disabled:opacity-50"
                      >
                        {isTriageLoading ? <Loader2 size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
                        Initiate AI Triage
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "rounded-[2rem] p-8 border-l-8 space-y-6 shadow-xl",
                      triageResult.severity === 'emergency' ? "bg-rose-50 border-rose-600 shadow-rose-600/5" : "bg-orange-50 border-orange-500 shadow-orange-500/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle size={24} className={triageResult.severity === 'emergency' ? "text-rose-600" : "text-orange-500"} />
                      <h4 className="font-brand text-2xl tracking-tight text-slate-900 capitalize">
                        {triageResult.severity} Alert Detected
                      </h4>
                    </div>
                    
                    <div className="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-p:text-slate-700">
                      <ReactMarkdown>{triageResult.assessment}</ReactMarkdown>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-black/5">
                      <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clinical Observations</p>
                        <ul className="space-y-2">
                          {triageResult.findings.map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs font-medium text-slate-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-rose-600">Stabilization Protocol</p>
                        <ul className="space-y-2">
                          {triageResult.recommendations.map((r, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs font-bold text-rose-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
              </section>

              <section className="space-y-6">
                <h3 className="text-[10px] font-black text-[#A8A29E] uppercase tracking-[0.3em]">24/7 Tactical Networks</h3>
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="flex justify-center py-12 bg-[#FDFBF7] rounded-[2rem] border border-ruru-navy/10">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="w-10 h-10 border-4 border-ruru-navy/10 border-t-red-500 rounded-full"
                      />
                    </div>
                  ) : nearbyVets.length > 0 ? (
                    nearbyVets.map((vet, idx) => (
                      <motion.div 
                        key={vet.id || vet.place_id || `vet-${idx}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-red-50/50 border border-red-100 rounded-[2rem] p-6 flex justify-between items-center group hover:bg-white/95 backdrop-blur-3xl hover:border-red-200 transition-all shadow-sm hover:shadow-xl hover:shadow-red-500/5"
                      >
                        <div className="space-y-1">
                          <h4 className="font-brand text-xl tracking-tight text-red-900 group-hover:text-red-700 transition-colors">{vet.name}</h4>
                          <p className="text-sm text-red-700/70 font-medium italic">{vet.address}</p>
                          {vet.distance && <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-lg text-[9px] font-black uppercase tracking-widest mt-2">{vet.distance} proximity</div>}
                        </div>
                        <div className="flex gap-3">
                          <a 
                            href={getDirectionsUrl(vet.location)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-14 h-14 bg-white/95 backdrop-blur-3xl text-red-600 border border-red-100 rounded-[1.25rem] flex items-center justify-center shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all"
                          >
                            <MapPin size={24} />
                          </a>
                          <a 
                            href={`tel:${vet.phone || '100'}`}
                            className="w-14 h-14 bg-red-600 text-white rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-red-600/30 hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
                          >
                            <Phone size={24} />
                          </a>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-10 px-6 bg-[#FDFBF7] rounded-[2rem] border border-dashed border-ruru-navy/10">
                      <p className="text-[11px] font-medium text-[#A8A29E] italic">Network unavailable. Fallback to physical emergency procedures.</p>
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-6">
                <h3 className="text-[10px] font-black text-[#A8A29E] uppercase tracking-[0.3em]">State Aid Infrastructure</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toast.info('Connecting to Municipal Animal Ambulance Services...')}
                    className="bg-[#FDFBF7] rounded-[2rem] p-6 flex flex-col items-start gap-6 group hover:bg-ruru-navy hover:text-white transition-all shadow-sm border border-ruru-navy/10 hover:border-ruru-navy"
                  >
                    <div className="w-14 h-14 bg-white/95 backdrop-blur-3xl rounded-[1.5rem] flex items-center justify-center text-ruru-navy-light group-hover:bg-white/10 group-hover:text-white transition-all shrink-0 border border-ruru-navy/10 group-hover:border-transparent">
                      <Ambulance size={28} />
                    </div>
                    <div className="text-left space-y-1">
                      <span className="block text-xl font-brand tracking-tight text-ruru-navy group-hover:text-white transition-colors">Tactical Dispatch</span>
                      <span className="block text-[10px] font-black uppercase tracking-widest text-emerald-600 group-hover:text-ruru-teal-light">Hotline: 1962</span>
                    </div>
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toast.info('Alerting Municipal Pet Control & Safety Board...')}
                    className="bg-[#FDFBF7] rounded-[2rem] p-6 flex flex-col items-start gap-6 group hover:bg-ruru-navy hover:text-white transition-all shadow-sm border border-ruru-navy/10 hover:border-ruru-navy"
                  >
                    <div className="w-14 h-14 bg-white/95 backdrop-blur-3xl rounded-[1.5rem] flex items-center justify-center text-ruru-navy-light group-hover:bg-white/10 group-hover:text-white transition-all shrink-0 border border-ruru-navy/10 group-hover:border-transparent">
                      <Building2 size={28} />
                    </div>
                    <div className="text-left space-y-1">
                      <span className="block text-xl font-brand tracking-tight text-ruru-navy group-hover:text-white transition-colors">Sector Control</span>
                      <span className="block text-[10px] font-black uppercase tracking-widest text-[#A8A29E] group-hover:text-white/60">Compliance & Safety</span>
                    </div>
                  </motion.button>
                </div>
              </section>

              <section className="space-y-6">
                <h3 className="text-[10px] font-black text-[#A8A29E] uppercase tracking-[0.3em]">Immediate Tactical Actions</h3>
                <div className="grid gap-4">
                  {firstAid.map(item => (
                    <motion.div 
                      key={item.title} 
                      whileHover={{ x: 5 }}
                      className="bg-white/95 backdrop-blur-3xl border border-ruru-navy/10 rounded-[2rem] p-6 flex items-center gap-6 shadow-sm hover:shadow-lg transition-all"
                    >
                      <div className="w-14 h-14 bg-[#FDFBF7] rounded-[1.5rem] flex items-center justify-center shrink-0 border border-ruru-navy/10">
                        {item.icon}
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-brand text-xl tracking-tight text-ruru-navy">{item.title}</h4>
                        <p className="text-sm font-medium text-ruru-navy/60 leading-relaxed italic opacity-90">{item.steps}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>

              <motion.button 
                animate={{ 
                  scale: [1, 1.02, 1],
                  boxShadow: [
                    "0 0 0 0 rgba(220, 38, 38, 0)",
                    "0 0 0 15px rgba(220, 38, 38, 0.1)",
                    "0 0 0 0 rgba(220, 38, 38, 0)"
                  ]
                }}
                transition={{ 
                  repeat: Infinity,
                  duration: 2.5
                }}
                className="w-full bg-red-600 text-white rounded-[2rem] py-6 text-sm font-black uppercase tracking-[0.2em] shadow-2xl transition-all"
              >
                Initiate Voice Protocol
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
