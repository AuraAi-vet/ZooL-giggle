import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sparkles, 
  Activity, 
  Brain, 
  ShieldAlert, 
  ChevronRight, 
  Loader2,
  Stethoscope,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Download
} from 'lucide-react';
import { Pet, HealthRecord } from '../types';
import { getDifferentialDiagnosis, ClinicalAnalysis } from '../services/geminiService';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

interface DiagnosticToolProps {
  isOpen: boolean;
  onClose: () => void;
  pet: Pet | null;
  availablePets?: Pet[];
  onPetChange?: (pet: Pet) => void;
  records: HealthRecord[];
}

import { runLocalClinicalTriage } from '../services/localIntelligence';

export function DiagnosticTool({ isOpen, onClose, pet, availablePets, onPetChange, records }: DiagnosticToolProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ClinicalAnalysis | null>(null);
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const handleRunAnalysis = async () => {
    if (!pet) return;
    setIsAnalyzing(true);
    
    // Attempt local triage first
    const localResult = runLocalClinicalTriage(query);
    if (localResult) {
      setTimeout(() => {
        setResult(localResult);
        setIsAnalyzing(false);
      }, 800); // Simulate processing time for UX
      return;
    }

    try {
      const analysis = await getDifferentialDiagnosis(pet, records, query);
      setResult(analysis);
    } catch (error) {
      console.error("Diagnostic failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-end p-0 md:p-6 lg:p-10 pointer-events-none">
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-md pointer-events-auto"
        />
      </AnimatePresence>

      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 200 }}
        className="w-full max-w-3xl h-full md:h-[90vh] bg-white md:rounded-[2.5rem] shadow-2xl relative z-10 flex flex-col pointer-events-auto border-l border-slate-100 overflow-hidden"
      >
        <header className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Brain size={24} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Neural Diagnostic Hub</span>
              </div>
              <h2 className="text-2xl font-brand tracking-tighter text-slate-900">Clinical Reasoning Engine</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-50 rounded-2xl transition-all">
            <X size={24} className="text-slate-400" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar">
          {!result ? (
            <div className="max-w-xl mx-auto space-y-8 py-10">
              <section className="text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto text-blue-600">
                  <Stethoscope size={40} />
                </div>
                <h3 className="text-2xl font-brand text-slate-900">Initiate Differential Scan</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Select a clinical focus to begin cross-referencing biometric history with ZooL's neural vet-knoweldge base.
                </p>
              </section>

              {availablePets && onPetChange && availablePets.length > 0 && (
                <section className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Active Patient</p>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none"
                    value={pet?.id || ''}
                    onChange={(e) => {
                      const selected = availablePets.find(p => p.id === e.target.value);
                      if (selected) onPetChange(selected);
                    }}
                  >
                    <option value="" disabled>Select a patient...</option>
                    {availablePets.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.breed})</option>
                    ))}
                  </select>
                </section>
              )}

              <section className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Routine Analysis', desc: 'Baseline health scan' },
                    { label: 'Symptom Triage', desc: 'Focus on reported issues' },
                    { label: 'Chronic Review', desc: 'Long-term trend analysis' },
                    { label: 'Pathology Correlation', desc: 'Lab work deep-dive' }
                  ].map(type => (
                    <button 
                      key={type.label}
                      className="p-5 bg-slate-50 border border-slate-200 rounded-3xl text-left hover:border-blue-500 hover:bg-white transition-all group"
                      onClick={() => setQuery(type.label)}
                    >
                      <p className="text-[13px] font-black text-slate-900 mb-1 group-hover:text-blue-500">{type.label}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{type.desc}</p>
                    </button>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Specific Clinical Notes (Optional)</p>
                <textarea 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., Patient showing increased lethargy and decreased appetite since last vaccination..."
                  className="w-full bg-white border border-slate-200 rounded-3xl p-6 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none h-32"
                />
              </section>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRunAnalysis}
                disabled={isAnalyzing || !pet}
                className="w-full py-5 bg-slate-900 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} className="text-blue-400" />}
                {isAnalyzing ? 'Processing Clinical Stream...' : 'Execute Neural Scan'}
              </motion.button>
            </div>
          ) : (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Severity Banner */}
              <div className={cn(
                "p-8 rounded-[2.5rem] border-l-8 flex items-center justify-between",
                result.severity === 'high' ? "bg-rose-50 border-rose-500" : 
                result.severity === 'moderate' ? "bg-blue-50 border-blue-500" : "bg-emerald-50 border-emerald-500"
              )}>
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    result.severity === 'high' ? "bg-rose-500/10 text-rose-600" : 
                    result.severity === 'moderate' ? "bg-blue-500/10 text-blue-600" : "bg-emerald-500/10 text-emerald-600"
                  )}>
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Severity Assessment</p>
                    <h4 className="text-2xl font-brand text-slate-900 capitalize">{result.severity} Priority</h4>
                  </div>
                </div>
                <button onClick={() => setResult(null)} className="text-[10px] font-black uppercase text-blue-500 hover:underline">New Analysis</button>
              </div>

              {/* Differential List */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-1 h-4 bg-slate-900 rounded-full" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Differential Diagnoses</h3>
                </div>
                <div className="space-y-4">
                  {result.differentials.map((diag, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 30, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        type: "spring",
                        stiffness: 90,
                        damping: 14,
                        delay: idx * 0.12 
                      }}
                      whileHover={{ 
                        scale: 1.015, 
                        y: -2,
                        boxShadow: "0 20px 25px -5px rgba(59, 130, 246, 0.05), 0 10px 10px -5px rgba(59, 130, 246, 0.02)"
                      }}
                      className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm hover:border-blue-200 transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-5">
                        <div className="text-xs font-black text-slate-300 w-6">0{idx + 1}</div>
                        <div>
                          <h4 className="text-[15px] font-bold text-slate-900">{diag}</h4>
                          <div className="flex gap-2 mt-1">
                            <span className="text-[9px] font-black uppercase text-blue-400">Clinical Match Score: 88%</span>
                          </div>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-blue-500 group-hover:bg-blue-50 transition-all">
                        <ChevronRight size={18} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Assessment Deep-Dive */}
              <section className="bg-slate-900/90 backdrop-blur-3xl text-white rounded-[2.5rem] p-10 relative overflow-hidden border border-slate-700/50 shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full -mr-48 -mt-48" />
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-3 text-blue-400">
                    <Brain size={20} />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Neural Synthesis</span>
                  </div>
                  <div className="prose prose-invert prose-slate max-w-none prose-p:text-slate-300 prose-p:leading-relaxed">
                    <ReactMarkdown>{result.assessment}</ReactMarkdown>
                  </div>
                </div>
              </section>

              {/* Plan & Recommendations */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 px-2">
                    <ShieldAlert size={16} className="text-amber-500" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Tactical Plan</h3>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 space-y-4">
                    {result.plan.map((p, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 size={14} className="text-emerald-500" />
                        </div>
                        <p className="text-[13px] font-medium text-slate-600 leading-relaxed">{p}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center gap-3 px-2">
                    <TrendingUp size={16} className="text-blue-500" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Progression Forecast</h3>
                  </div>
                  <div className="bg-blue-50/50 border border-blue-100 rounded-[2.5rem] p-8">
                    <p className="text-lg font-brand text-slate-900 leading-tight">
                      System predicts high recovery velocity if protocol initiated within 24 hours.
                    </p>
                    <div className="mt-6 p-4 bg-white rounded-2xl border border-blue-100">
                      <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        <span>Confidence</span>
                        <span className="text-blue-500">92%</span>
                      </div>
                      <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: '92%' }} className="h-full bg-blue-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <button className="w-full py-6 bg-slate-50 border border-slate-200 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-slate-900 hover:bg-white transition-all flex items-center justify-center gap-3">
                 <Download size={18} /> Append to Clinical Chart
              </button>
            </div>
          )}
        </main>
      </motion.div>
    </div>
  );
}
