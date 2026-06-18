import { useState, useEffect } from 'react';
import { Users, Activity, Sparkles, CheckCircle, Package, Stethoscope, ChevronRight, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../lib/firebase';
import ExportToDocsButton from '../components/ExportToDocsButton';
import { subscribeToActiveQueue, saveClinicalNote, logActivity, createNotification } from '../services/dbService';
import ProviderServiceCatalog from '../components/ProviderServiceCatalog';

import { ClinicianDashboardSkeleton } from '../components/DashboardSkeleton';

export default function ClinicianDashboardView() {
  const [activeTab, setActiveTab] = useState<'appointments' | 'catalog'>('appointments');
  const [queue, setQueue] = useState<any[]>([]);
  const [activePatient, setActivePatient] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // New state for handling the SOAP notes input and saving status
  const [soapNote, setSoapNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Clear the SOAP note input whenever the active patient changes
  useEffect(() => {
    setSoapNote('');
    setSaveSuccess(false);
  }, [activePatient]);

  const handleSummarize = async () => {
    if (!soapNote.trim()) return;
    setIsSummarizing(true);
    try {
      const response = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rawNotes: soapNote, 
          patientContext: { petName: activePatient?.name || 'Pet' } 
        })
      });
      if(response.ok) {
        const data = await response.json();
        setSoapNote(data.response);
      }
    } catch(err) {
      console.error(err);
    } finally {
      setIsSummarizing(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToActiveQueue('clinic_downtown_01', (liveQueue) => {
      setQueue(liveQueue);
      if (liveQueue.length > 0 && !activePatient) {
        setActivePatient(liveQueue[0]);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [activePatient]);

  // Handler for the Save Chart button
  const handleSaveChart = async () => {
    if (!activePatient || !soapNote.trim()) return;
    
    setIsSaving(true);
    try {
      await saveClinicalNote(activePatient.id, soapNote);
      
      if (auth.currentUser) {
        await logActivity(auth.currentUser.uid, 'Saved Clinical Document', `Completed charting for ${activePatient.name}`);
        
        // Optionally notify the owner if the ownerUid is available (mocking it if not directly accessible)
        // Usually would have pet.ownerUid
        if (activePatient.ownerUid) {
          await createNotification(
            activePatient.ownerUid,
            'Clinical Report Available',
            `The visit summary for ${activePatient.name} has been completed.`
          );
        }
      }
      
      setSaveSuccess(true);
      
      // Remove the patient from the local queue to reflect the 'completed' status
      const updatedQueue = queue.filter((p) => p.id !== activePatient.id);
      setQueue(updatedQueue);
      
      // Auto-select the next patient in the queue
      if (updatedQueue.length > 0) {
        setTimeout(() => setActivePatient(updatedQueue[0]), 1500); // 1.5s delay to show the success message
      } else {
        setTimeout(() => setActivePatient(null), 1500);
      }
      
    } catch (error) {
      console.error("Failed to save chart", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <ClinicianDashboardSkeleton />;
  }

  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
  };

  const itemVars = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="p-6 md:p-8 min-h-screen bg-transparent relative">
      {/* Decorative ZooL Spot */}
      <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-cyan-400/10 rounded-full blur-[80px] pointer-events-none"></div>

      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 font-display mb-1">Provider Command</h1>
          <p className="text-slate-500 font-medium flex items-center gap-2">
             <Stethoscope className="w-4 h-4 text-cyan-600" />
             ZooL Unified Operations
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-white/80 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-slate-200/60">
            <button 
              onClick={() => setActiveTab('appointments')}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'appointments' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" /> Flowboard
              </div>
            </button>
            <button 
              onClick={() => setActiveTab('catalog')}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'catalog' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" /> Catalog
              </div>
            </button>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-700 border border-emerald-200/50 rounded-2xl shadow-sm text-sm font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            ACTIVE CLINIC
          </div>
        </div>
      </header>

      {activeTab === 'catalog' ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <ProviderServiceCatalog providerId={auth.currentUser?.uid || 'temp_provider_id'} />
        </motion.div>
      ) : (
      <motion.div variants={containerVars} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[80vh]">
        
        {/* Active Patient Queue (Spatial Flowboard) */}
        <motion.div variants={itemVars} className="lg:col-span-3 bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] border border-slate-200/60 p-6 flex flex-col h-full overflow-hidden relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 text-slate-800">
              <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-xl shadow-sm border border-cyan-100/50">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-xl font-display">Flowboard</h2>
            </div>
            <span className="text-[10px] font-extrabold bg-cyan-100 text-cyan-800 px-3 py-1.5 rounded-lg border border-cyan-200/50 shadow-sm">{queue.length} ACTIVE</span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {queue.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-50">
                 <Users className="w-12 h-12 mb-3 text-slate-400" />
                 <p className="text-sm font-medium text-slate-500 text-center">No appointments.</p>
              </div>
            ) : (
              // Grouped by spatial zone mock logic
              ['EXAM_IN_PROGRESS', 'WAITING_TRIAGE', 'PROCEDURE_PREP', 'IN_SURGERY', 'RECOVERY'].map(zone => {
                 const zonePatients = queue.filter((_, i) => i % 5 === ['EXAM_IN_PROGRESS', 'WAITING_TRIAGE', 'PROCEDURE_PREP', 'IN_SURGERY', 'RECOVERY'].indexOf(zone));
                 if (zonePatients.length === 0) return null;
                 
                 return (
                   <div key={zone} className="mb-6">
                     <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-slate-200"></span>
                       {zone.replace(/_/g, ' ')}
                     </p>
                     <div className="space-y-3">
                       {zonePatients.map(patient => (
                         <button 
                           key={patient.id}
                           onClick={() => setActivePatient(patient)}
                           className={`w-full text-left p-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                             activePatient?.id === patient.id 
                               ? 'bg-gradient-to-r from-cyan-50 to-white border border-cyan-200 shadow-md transform scale-[1.02]' 
                               : 'bg-white border border-slate-200/60 hover:border-cyan-200 hover:bg-slate-50 hover:shadow-sm'
                           }`}
                         >
                           {activePatient?.id === patient.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 rounded-l-2xl"></div>}
                           <div className="flex justify-between items-start mb-1">
                             <p className={`font-bold text-sm truncate ${activePatient?.id === patient.id ? 'text-cyan-900' : 'text-slate-800'}`}>
                               {patient.name}
                             </p>
                             <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${activePatient?.id === patient.id ? 'text-cyan-500 translate-x-1' : 'text-slate-300 group-hover:text-cyan-400 group-hover:translate-x-1'}`} />
                           </div>
                           <p className="text-[11px] text-slate-500 font-medium truncate">{patient.details}</p>
                         </button>
                       ))}
                     </div>
                   </div>
                 );
              })
            )}
          </div>
        </motion.div>

        {/* Right Content Area */}
        <AnimatePresence mode="wait">
        {activePatient ? (
          <motion.div 
            key={activePatient.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: "spring" as const, stiffness: 300, damping: 25 }}
            className="lg:col-span-9 flex flex-col gap-6"
          >
            
            {/* Gema AI Pre-Consult Brief */}
            <div className="bg-cyan-50/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] border border-cyan-100 p-6 md:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-200/30 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-5 relative z-10">
                <div className="flex items-center gap-3 text-cyan-900">
                  <div className="p-2.5 bg-cyan-100/80 rounded-xl shadow-sm border border-cyan-200/50">
                    <Sparkles className="w-5 h-5 text-cyan-600" />
                  </div>
                  <h2 className="font-extrabold text-xs uppercase tracking-widest text-cyan-800">ZooL AI Briefing</h2>
                </div>
                <div className="px-3 md:px-4 py-1.5 bg-white border border-cyan-100 rounded-xl text-[10px] font-bold text-cyan-600 uppercase tracking-wider shadow-sm flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></div> Live Context
                </div>
              </div>
              <p className="text-slate-700 text-sm md:text-base font-medium leading-relaxed relative z-10 max-w-4xl">
                <span className="font-bold text-slate-900 px-2 py-1 bg-white rounded-lg shadow-sm mr-1">{activePatient.name}</span> {activePatient.gemaBrief}
              </p>
            </div>

            {/* Clinical Charting & Vitals */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 h-full min-h-0">
              
              {/* Diagnostic & Imaging Interface */}
              <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] border border-slate-200/60 p-6 md:p-8 flex flex-col overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-400"></div>
                <div className="flex items-center justify-between mb-6 text-slate-800">
                   <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shadow-sm">
                      <Activity className="w-5 h-5" />
                    </div>
                    <h2 className="font-bold text-xl font-display">Diagnostics</h2>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 shadow-sm flex items-center gap-1">
                    <Sparkles size={10} /> SignalPET
                  </span>
                </div>
                <div className="flex flex-col xl:flex-row gap-5 flex-1 min-h-0">
                   <div className="xl:w-1/2 bg-slate-900 rounded-2xl h-[220px] xl:h-auto overflow-hidden relative group shadow-inner">
                      <img src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=400&h=300&fit=crop" className="w-full h-full object-cover opacity-60 mix-blend-luminosity hover:mix-blend-normal transition-all duration-500" alt="Radiograph" />
                      <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-400/50 rounded-2xl transition-all"></div>
                      <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold rounded uppercase tracking-wider">LATERAL RAD</div>
                      <div className="absolute top-1/2 left-1/2 w-16 h-16 border-2 border-rose-500 rounded-full animate-ping opacity-40 mix-blend-screen"></div>
                      <div className="absolute top-1/2 left-1/2 w-16 h-16 border border-rose-500 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                      <div className="absolute top-1/2 left-[60%] w-20 h-2 bg-rose-500/80 -translate-y-1/2 rounded-full overflow-hidden flex items-center"><div className="w-full h-px bg-white/50"></div></div>
                      <div className="absolute top-1/2 left-[60%] ml-20 -translate-y-1/2 px-2 py-1 bg-rose-500 text-white text-[10px] font-bold rounded">AI FINDING</div>
                   </div>
                   <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-1">
                      <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl group hover:border-rose-200 transition-colors">
                         <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest flex items-center gap-1"><Sparkles size={12}/> AI Visual Read</p>
                         <p className="text-sm font-medium text-slate-800 mt-2 leading-relaxed">Mild cardiomegaly detected. Suggested echocardiogram.</p>
                      </div>
                      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl group hover:border-emerald-200 transition-colors">
                         <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1"><FileText size={12}/> IDEXX Bloodwork</p>
                         <p className="text-sm font-medium text-slate-800 mt-2 leading-relaxed">WBC normal. BUN slightly elevated. Track hydration.</p>
                      </div>
                   </div>
                </div>
              </div>

              {/* SOAP Notes Box */}
              <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] border border-slate-200/60 p-6 md:p-8 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-cyan-400"></div>
                
                <AnimatePresence>
                {saveSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0 }} 
                    className="absolute inset-0 z-20 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center text-emerald-600 rounded-3xl"
                  >
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-5 shadow-inner border border-emerald-100/50">
                      <CheckCircle className="w-10 h-10" />
                    </div>
                    <p className="font-extrabold text-2xl font-display text-slate-800">Chart Saved</p>
                    <p className="text-sm font-medium text-slate-500 mt-2">Advancing flowboard...</p>
                  </motion.div>
                )}
                </AnimatePresence>

                <div className="flex items-center justify-between mb-6 text-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl shadow-sm">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h2 className="font-bold text-xl font-display">Ambient Scribe</h2>
                  </div>
                  <span className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 bg-slate-50 text-slate-500 rounded-lg border border-slate-200 shadow-sm">
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.5)]"></span>
                    <span className="truncate max-w-[100px]">{activePatient.name}</span>
                  </span>
                </div>
                
                <textarea 
                  value={soapNote}
                  onChange={(e) => setSoapNote(e.target.value)}
                  disabled={isSaving || saveSuccess}
                  className="flex-1 w-full p-5 bg-slate-50/50 border border-slate-200/80 rounded-2xl resize-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-400 focus:outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed font-mono transition-shadow shadow-inner leading-relaxed text-slate-700"
                  placeholder={`Ambiently listening... Start consultation with ${activePatient.name}. Audio will be structured into SOAP format.`}
                ></textarea>
                
                <div className="mt-5 flex justify-between items-center pt-2">
                  <button 
                    onClick={handleSummarize}
                    disabled={isSummarizing || !soapNote.trim() || isSaving || saveSuccess}
                    className="flex items-center gap-2 bg-gradient-to-b from-purple-50 to-purple-100/50 hover:from-purple-100 hover:to-purple-200 text-purple-700 border border-purple-200 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 shadow-sm active:scale-95"
                  >
                    {isSummarizing ? (
                      <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Sparkles size={14} />
                    )}
                    {isSummarizing ? 'Processing' : 'Auto-SOAP'}
                  </button>
                  <div className="flex items-center gap-3">
                    <ExportToDocsButton content={soapNote} title={`Clinical SOAP: ${activePatient.name}`} />
                    <button 
                      onClick={handleSaveChart}
                      disabled={!soapNote.trim() || isSaving || saveSuccess}
                      className="flex items-center justify-center px-8 py-2.5 min-w-[140px] bg-slate-900 text-white rounded-xl text-sm font-bold tracking-wide hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_0_rgb(0,0,0,0.1)]"
                    >
                      {isSaving ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        'Save Chart'
                      )}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        ) : (
          <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }}
             className="lg:col-span-9 flex flex-col items-center justify-center text-slate-400 h-full bg-white/50 backdrop-blur-sm rounded-3xl border border-slate-200/50 shadow-sm"
          >
            <Stethoscope className="w-16 h-16 mb-4 opacity-20" />
            <p className="font-display text-lg">Select a patient from the Flowboard</p>
          </motion.div>
        )}
        </AnimatePresence>

      </motion.div>
      )}
    </div>
  );
}
