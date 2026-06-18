import React, { useState, useEffect } from 'react';
import { Users, Activity, FileText, Sparkles, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getActiveQueue, saveClinicalNote, logActivity, createNotification } from '../services/dbService';
import { auth } from '../lib/firebase';
import ExportToDocsButton from '../components/ExportToDocsButton';

export default function ClinicianDashboardView() {
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
      const updatedQueue = queue.filter(p => p.id !== activePatient.id);
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
      
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clinician Workspace</h1>
          <p className="text-slate-500 text-sm">ACCUCARE Unified Dashboard</p>
        </div>
        <div className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
          Accepting Walk-ins
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[80vh]">
        
        {/* Active Patient Queue */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4 text-slate-800">
            <Users className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold">Active Queue</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {queue.length === 0 ? (
              <p className="text-sm text-slate-500 text-center mt-10">No active appointments.</p>
            ) : (
              queue.map((patient) => (
                <button 
                  key={patient.id}
                  onClick={() => setActivePatient(patient)}
                  className={`w-full text-left p-4 rounded-r-xl transition-all ${
                    activePatient?.id === patient.id 
                      ? 'bg-blue-50 border-l-4 border-blue-500 hover:bg-blue-100' 
                      : 'bg-white border-l-4 border-transparent hover:bg-slate-50'
                  }`}
                >
                  <p className={`font-bold ${activePatient?.id === patient.id ? 'text-blue-900' : 'text-slate-700'}`}>
                    {patient.name}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">{patient.details}</p>
                  <p className="text-xs text-slate-400 mt-2">{patient.time} - {patient.reason}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Content Area */}
        {activePatient && (
          <div className="lg:col-span-9 flex flex-col gap-6">
            
            {/* Gema AI Pre-Consult Brief */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-sm border border-indigo-100 p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-indigo-900">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  <h2 className="font-semibold">Gema Pre-Consult Brief: {activePatient.name}</h2>
                </div>
              </div>
              <p className="text-indigo-800 text-sm leading-relaxed italic">
                {activePatient.gemaBrief}
              </p>
            </div>

            {/* Clinical Charting & Vitals */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Vitals Box */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col">
                <div className="flex items-center justify-between mb-4 text-slate-800">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-rose-500" />
                    <h2 className="font-semibold">Weight Trend (kg)</h2>
                  </div>
                </div>
                <div className="flex-1 w-full min-h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activePatient.healthTrends} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Line type="monotone" dataKey="weight" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* SOAP Notes Box */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col relative">
                
                {/* Success Overlay */}
                {saveSuccess && (
                  <div className="absolute inset-0 z-10 bg-white/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center text-emerald-600">
                    <CheckCircle className="w-12 h-12 mb-2" />
                    <p className="font-bold">Chart Saved Successfully</p>
                    <p className="text-sm text-emerald-700">Moving to next patient...</p>
                  </div>
                )}

                <div className="flex items-center justify-between mb-4 text-slate-800">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-500" />
                    <h2 className="font-semibold">Clinical Notes (SOAP)</h2>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                    {activePatient.name}
                  </span>
                </div>
                
                <textarea 
                  value={soapNote}
                  onChange={(e) => setSoapNote(e.target.value)}
                  disabled={isSaving || saveSuccess}
                  className="flex-1 w-full p-3 md:p-4 bg-slate-50 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                  placeholder={`Enter observations, metrics, assessment, and treatment plan for ${activePatient.name}...`}
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
    </div>
  );
}
