import { useState, useEffect } from 'react';
import { Users, Activity, Sparkles, CheckCircle, Package } from 'lucide-react';
import { auth } from '../lib/firebase';
import ExportToDocsButton from '../components/ExportToDocsButton';
import { getActiveQueue, saveClinicalNote, logActivity, createNotification } from '../services/dbService';
import ProviderServiceCatalog from '../components/ProviderServiceCatalog';

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
    const loadQueue = async () => {
      try {
        const liveQueue = await getActiveQueue('clinic_downtown_01');
        setQueue(liveQueue);
        if (liveQueue.length > 0) {
          setActivePatient(liveQueue[0]);
        }
      } catch (error) {
        console.error("Failed to load patient queue:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadQueue();
  }, []);

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
    return (
      <div className="p-6 md:p-8 min-h-screen bg-slate-100 animate-pulse">
        <div className="h-16 bg-slate-200 rounded-2xl mb-6 w-full max-w-sm"></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[80vh]">
          <div className="lg:col-span-3 bg-slate-200 rounded-2xl border border-slate-200"></div>
          <div className="lg:col-span-9 flex flex-col gap-6">
            <div className="h-24 bg-slate-200 rounded-2xl border border-slate-200"></div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-200 rounded-2xl border border-slate-200"></div>
              <div className="bg-slate-200 rounded-2xl border border-slate-200"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-slate-100">
      
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clinician Workspace</h1>
          <p className="text-slate-500 text-sm">ACCUCARE Unified Dashboard</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-white/50 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-slate-200/50">
            <button 
              onClick={() => setActiveTab('appointments')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'appointments' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" /> Operations
              </div>
            </button>
            <button 
              onClick={() => setActiveTab('catalog')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'catalog' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" /> Practice Catalog
              </div>
            </button>
          </div>
          <div className="hidden md:block px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
            Accepting Walk-ins
          </div>
        </div>
      </header>

      {activeTab === 'catalog' ? (
        <ProviderServiceCatalog providerId={auth.currentUser?.uid || 'temp_provider_id'} />
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[80vh]">
        
        {/* Active Patient Queue (Spatial Flowboard) */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4 text-slate-800">
            <Users className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold">Spatial Flowboard</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {queue.length === 0 ? (
              <p className="text-sm text-slate-500 text-center mt-10">No active appointments.</p>
            ) : (
              // Grouped by spatial zone mock logic
              ['EXAM_IN_PROGRESS', 'WAITING_TRIAGE', 'PROCEDURE_PREP', 'IN_SURGERY', 'RECOVERY'].map(zone => {
                 const zonePatients = queue.filter((_, i) => i % 5 === ['EXAM_IN_PROGRESS', 'WAITING_TRIAGE', 'PROCEDURE_PREP', 'IN_SURGERY', 'RECOVERY'].indexOf(zone));
                 if (zonePatients.length === 0) return null;
                 
                 return (
                   <div key={zone} className="mb-4">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{zone.replace(/_/g, ' ')}</p>
                     <div className="space-y-2">
                       {zonePatients.map(patient => (
                         <button 
                           key={patient.id}
                           onClick={() => setActivePatient(patient)}
                           className={`w-full text-left p-3 rounded-xl transition-all ${
                             activePatient?.id === patient.id 
                               ? 'bg-blue-50 border border-blue-200 shadow-sm' 
                               : 'bg-white border border-slate-100 hover:bg-slate-50'
                           }`}
                         >
                           <p className={`font-bold text-sm ${activePatient?.id === patient.id ? 'text-blue-900' : 'text-slate-700'}`}>
                             {patient.name}
                           </p>
                           <p className="text-[11px] text-slate-500 font-medium truncate">{patient.details}</p>
                         </button>
                       ))}
                     </div>
                   </div>
                 );
              })
            )}
          </div>
        </div>

        {/* Right Content Area */}
        {activePatient && (
          <div className="lg:col-span-9 flex flex-col gap-6">
            
            {/* Gema AI Pre-Consult Brief */}
            <div className="bg-sky-50/50 backdrop-blur-xl rounded-2xl shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] border border-sky-100 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-300/20 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2 text-sky-900">
                  <div className="p-1.5 bg-sky-100 rounded-lg">
                    <Sparkles className="w-4 h-4 text-sky-600" />
                  </div>
                  <h2 className="font-extrabold text-[11px] uppercase tracking-widest text-sky-700">Gema Intelligence Brief</h2>
                </div>
              </div>
              <p className="text-slate-700 text-sm font-medium leading-relaxed relative z-10">
                <span className="font-bold text-sky-900">{activePatient.name}</span> — {activePatient.gemaBrief}
              </p>
            </div>

            {/* Clinical Charting & Vitals */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Diagnostic & Imaging Interface */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] border border-white/50 p-6 flex flex-col">
                <div className="flex items-center justify-between mb-6 text-slate-800">
                   <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-500 rounded-xl">
                      <Activity className="w-5 h-5" />
                    </div>
                    <h2 className="font-bold text-lg font-display">Diagnostic Imaging</h2>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                    SignalPET Connected
                  </span>
                </div>
                <div className="flex gap-4">
                   <div className="w-1/2 bg-slate-900 rounded-xl h-[200px] overflow-hidden relative group">
                      <img src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=400&h=300&fit=crop" className="w-full h-full object-cover opacity-60 mix-blend-luminosity hover:mix-blend-normal transition-all" alt="Radiograph" />
                      <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-400/50 rounded-xl transition-all"></div>
                      <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 text-white text-[10px] font-bold rounded">LATERAL RAD</div>
                      {/* AI Highlight Mock */}
                      <div className="absolute top-1/2 left-1/2 w-12 h-12 border-2 border-rose-500 rounded-full animate-ping opacity-50"></div>
                      <div className="absolute top-1/2 left-1/2 w-12 h-12 border-2 border-rose-500 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                   </div>
                   <div className="flex-1 flex flex-col gap-3">
                      <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                         <p className="text-[10px] font-bold text-rose-500 uppercase">AI Finding</p>
                         <p className="text-sm font-medium text-slate-800 mt-1">Mild cardiomegaly detected. Suggested echocardiogram.</p>
                      </div>
                      <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                         <p className="text-[10px] font-bold text-emerald-600 uppercase">Bloodwork (IDEXX)</p>
                         <p className="text-sm font-medium text-slate-800 mt-1">WBC normal. BUN slightly elevated.</p>
                      </div>
                   </div>
                </div>
              </div>

              {/* SOAP Notes Box */}
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] border border-white/50 p-6 flex flex-col relative">
                
                {/* Success Overlay */}
                {saveSuccess && (
                  <div className="absolute inset-0 z-10 bg-white/95 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center text-emerald-600 animate-in fade-in duration-300">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="w-8 h-8" />
                    </div>
                    <p className="font-extrabold text-xl font-display">Chart Saved Successfully</p>
                    <p className="text-sm font-medium text-emerald-700 mt-2">Moving to next patient...</p>
                  </div>
                )}

                <div className="flex items-center justify-between mb-5 text-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 text-purple-500 rounded-xl">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h2 className="font-bold text-lg font-display">Ambient AI Scribe</h2>
                  </div>
                  <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 bg-slate-100/80 backdrop-blur-sm text-slate-500 rounded-lg border border-slate-200">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.5)]"></span>
                    ACTIVE: {activePatient.name}
                  </span>
                </div>
                
                <textarea 
                  value={soapNote}
                  onChange={(e) => setSoapNote(e.target.value)}
                  disabled={isSaving || saveSuccess}
                  className="flex-1 w-full p-4 bg-slate-50/50 backdrop-blur-sm border border-slate-200/60 rounded-xl resize-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 focus:outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed font-mono transition-shadow shadow-inner"
                  placeholder={`Ambiently listening... Start consultation with ${activePatient.name}. Audio will be structured into SOAP.`}
                ></textarea>
                
                <div className="mt-4 flex justify-between items-center">
                  <button 
                    onClick={handleSummarize}
                    disabled={isSummarizing || !soapNote.trim() || isSaving || saveSuccess}
                    className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors disabled:opacity-50"
                  >
                    {isSummarizing ? (
                      <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Sparkles size={14} />
                    )}
                    {isSummarizing ? 'Structuring...' : 'AI Auto-SOAP'}
                  </button>
                  <div className="flex items-center gap-3">
                    <ExportToDocsButton content={soapNote} title={`Clinical SOAP: ${activePatient.name}`} />
                    <button 
                      onClick={handleSaveChart}
                      disabled={!soapNote.trim() || isSaving || saveSuccess}
                      className="flex items-center justify-center px-6 py-2 min-w-[120px] bg-slate-900 text-white rounded-xl text-sm font-bold tracking-wide hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          </div>
        )}

      </div>
      )}
    </div>
  );
}
