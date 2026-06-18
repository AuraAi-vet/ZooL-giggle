import { useState, useEffect } from 'react';
import { Scissors, ClipboardList, ShieldAlert, CheckCircle, MessageSquare, Send, Sparkles, TrendingUp, X, Activity, CalendarDays, KanbanSquare, Layers } from 'lucide-react';
import { getProviderSchedule, logServiceCompletion, sendServiceUpdate, logActivity, createNotification } from '../services/dbService';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import FinancialProjection from '../components/FinancialProjection';
import SmartCalendarSync from '../components/SmartCalendarSync';
import CodeGeneratorWidget from '../components/CodeGeneratorWidget';
import AutoOptimizeWidget from '../components/AutoOptimizeWidget';
import CodexAssistant from '../components/CodexAssistant';
import CodexVerificationModule from '../components/CodexVerificationModule';
import AgileKanbanBoard from '../components/AgileKanbanBoard';

export default function ServiceProviderDashboardView() {
  const [activeTab, setActiveTab] = useState<'operations' | 'planning' | 'agile'>('agile');
  const [schedule, setSchedule] = useState<any[]>([]);

  const [activePet, setActivePet] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [taskSummary, setTaskSummary] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // New Messaging State
  const [clientMessage, setClientMessage] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const [msgSuccess, setMsgSuccess] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);

  // AI Surge Alert State
  const [bookingSurgeAlert, setBookingSurgeAlert] = useState<null | { service: string, increasePercent: number, message: string }>(null);

  useEffect(() => {
    const loadSchedule = async () => {

      try {
        const liveSchedule = await getProviderSchedule('provider_grooming_01');
        // Let's ensure some items have different statuses for Kanban demo if all are scheduled
        setSchedule(liveSchedule);
      } catch (error) {
        console.error("Failed to load schedule:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSchedule();

    const timer = setTimeout(() => {
      setBookingSurgeAlert({
        service: "Grooming & Spa",
        increasePercent: 45,
        message: "AI analysis detects a 45% surge in grooming requests for the upcoming sprint. Consider adjusting velocity and sprint capacity to capture this demand."
      });
    }, 6000);

    return () => clearTimeout(timer);
  }, []);

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
      // Optimistic update
      const updatedSchedule = schedule.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
      setSchedule(updatedSchedule);

      try {
          if (!taskId.startsWith('apt_') && !taskId.startsWith('temp')) {
            await updateDoc(doc(db, 'appointments', taskId), { status: newStatus });
          }
      } catch(e) {
          console.error("Error updating status", e);
      }
  };

  const handleCompleteService = async () => {
    if (!activePet || !taskSummary.trim()) return;
    setIsSaving(true);
    try {
      await logServiceCompletion(activePet.id, taskSummary);
      
      if (auth.currentUser) {
        await logActivity(auth.currentUser.uid, 'Completed Service Task', `Task summary logged for ${activePet.name}`);
      }
      
      // Update local state queue
      const updatedSchedule = schedule.map(p => p.id === activePet.id ? { ...p, status: 'completed' } : p);
      setSchedule(updatedSchedule);
      
      setTaskSummary('');
      setActivePet(null);
    } catch (error) {
      console.error("Failed to complete service", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendMessage = async () => {
    if (!activePet || !clientMessage.trim()) return;
    setIsSendingMsg(true);
    try {
      await sendServiceUpdate(
        activePet.petId, 
        activePet.ownerUid || 'mock_owner_uid', 
        'Downtown Grooming Team', 
        clientMessage
      );
      
      if (auth.currentUser && activePet.ownerUid) {
        await logActivity(auth.currentUser.uid, 'Sent Message to Client', `Message sent to owner of ${activePet.name}`);
        await createNotification(
          activePet.ownerUid,
          'New Message from Care Team',
          `Update on ${activePet.name}: ${clientMessage}`
        );
      }
      
      setClientMessage('');
      setMsgSuccess(true);
      setTimeout(() => setMsgSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setIsSendingMsg(false);
    }
  };

  const handleSuggestMessage = async () => {
    if (!activePet || !taskSummary.trim()) {
      alert("Please enter a Service Log first so the AI knows what to say.");
      return;
    }
    setIsSuggesting(true);
    try {
      const response = await fetch('/api/gemini/suggest-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskSummary, petName: activePet.name })
      });
      if (response.ok) {
        const data = await response.json();
        setClientMessage(data.response);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSuggesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 min-h-screen bg-[#F8FAFC] animate-pulse">
        <div className="h-16 bg-slate-200/60 rounded-2xl mb-6 w-full max-w-sm"></div>
        <div className="h-[80vh] bg-slate-200/60 rounded-2xl border border-slate-200"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 min-h-screen bg-[#F8FAFC]">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display">Sprint Operations</h1>
          <p className="text-slate-500 mt-1 font-medium text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            Agile Pet Care Workflow
          </p>
        </div>
        <div className="flex bg-white/50 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-slate-200/50">
          <button 
            onClick={() => setActiveTab('agile')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'agile' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <div className="flex items-center gap-2">
              <KanbanSquare className="w-4 h-4" /> Sprint Board
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('planning')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'planning' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" /> Insights & Review
            </div>
          </button>
        </div>
      </header>

      {/* AI Booking Surge Alert */}
      {bookingSurgeAlert && activeTab === 'agile' && (
        <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 relative animate-in slide-in-from-top-4">
          <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600 hidden sm:block">
             <TrendingUp className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Demand Surge Detected</h3>
            </div>
            <p className="text-slate-700 text-sm">{bookingSurgeAlert.message}</p>
          </div>
          <div className="flex items-center gap-3 mt-3 sm:mt-0 w-full sm:w-auto">
             <button onClick={() => { setActiveTab('planning'); setBookingSurgeAlert(null); }} className="flex-1 sm:flex-none px-4 py-2 border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-700 text-sm font-bold rounded-xl transition-colors shadow-sm">
               Review Capacity
             </button>
             <button onClick={() => setBookingSurgeAlert(null)} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-xl shadow-sm border border-slate-200">
               <X className="w-5 h-5" />
             </button>
          </div>
        </div>
      )}

      {activeTab === 'agile' ? (
        <div className="h-[80vh] relative">
          <AgileKanbanBoard 
            tasks={schedule} 
            onTaskSelect={(task) => setActivePet(task)} 
            onTaskStatusChange={handleTaskStatusChange}
          />
          
          {/* Active Task Modal Overlay */}
          {activePet && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-[#F8FAFC] rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                    <Activity className="w-5 h-5 text-indigo-500" />
                    Task Execution
                  </h2>
                  <button onClick={() => setActivePet(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                  {/* Task Header / Behavioral Overview */}
                  <div className="flex flex-col gap-4 bg-white rounded-2xl p-5 border border-amber-200 border-l-4 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-4 relative z-10">
                      <img 
                        src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200&auto=format&fit=crop" 
                        alt={activePet.name} 
                        className="w-14 h-14 rounded-full object-cover border-2 border-amber-50 shadow-sm"
                      />
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 leading-tight">{activePet.name}</h2>
                        <p className="text-sm font-medium text-slate-600">{activePet.details}</p>
                      </div>
                      <div className="ml-auto">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold uppercase tracking-wider rounded-lg border border-amber-100">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Behavioral Note
                          </span>
                      </div>
                    </div>
                    
                    <div className="mt-1 text-amber-900/90 text-sm font-medium bg-amber-50/50 p-3 rounded-xl border border-amber-100 inline-block">
                       {activePet.behavioralNotes || "Friendly, but anxious around clippers. Treats highly recommended."}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Service Checklist & Completion Log */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col">
                      <div className="flex items-center gap-2 mb-4 text-slate-800">
                        <Scissors className="w-5 h-5 text-indigo-500" />
                        <h2 className="font-semibold">Acceptance Criteria Log</h2>
                      </div>
                      
                      <textarea 
                        value={taskSummary}
                        onChange={(e) => setTaskSummary(e.target.value)}
                        className="flex-1 w-full p-4 bg-slate-50 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm min-h-[120px]"
                        placeholder={`Log completed tasks to meet DoD (Definition of Done)...`}
                      ></textarea>
                      
                      <div className="mt-4 flex justify-end gap-3">
                        <button 
                          onClick={() => handleTaskStatusChange(activePet.id, 'in-progress')}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
                        >
                          Mark In-Progress
                        </button>
                        <button 
                          onClick={handleCompleteService}
                          disabled={!taskSummary.trim() || isSaving}
                          className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                          {isSaving ? 'Logging...' : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Mark Done
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Client Messaging Module */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col relative">
                      {msgSuccess && (
                        <div className="absolute inset-0 z-10 bg-white/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center text-emerald-600">
                          <CheckCircle className="w-12 h-12 mb-2" />
                          <p className="font-bold">Update Sent to Stakeholder!</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between mb-4 text-slate-800">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-indigo-500" />
                          <h2 className="font-semibold">Stakeholder Update</h2>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <button onClick={() => setClientMessage("Bath time is all done! Wrapping up now.")} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium hover:bg-slate-200">Stage 1 Done</button>
                        <button onClick={() => setClientMessage(`${activePet.name} is ready for pickup!`)} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium hover:bg-slate-200">Ready for Pickup</button>
                      </div>

                      <textarea 
                        value={clientMessage}
                        onChange={(e) => setClientMessage(e.target.value)}
                        className="flex-1 w-full p-4 bg-slate-50 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm min-h-[100px]"
                        placeholder="Type a sprint increment update..."
                      ></textarea>
                      
                      <div className="mt-4 flex justify-between items-center">
                        <button 
                          onClick={handleSuggestMessage}
                          disabled={isSuggesting || !taskSummary.trim()}
                          className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors disabled:opacity-50"
                        >
                          {isSuggesting ? (
                            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Sparkles size={14} />
                          )}
                          {isSuggesting ? 'Drafting...' : 'AI Draft'}
                        </button>
                        <button 
                          onClick={handleSendMessage}
                          disabled={!clientMessage.trim() || isSendingMsg}
                          className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                        >
                          {isSendingMsg ? 'Sending...' : (
                            <><Send className="w-4 h-4" /> Send Update</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6 animate-in slide-in-from-top-4 duration-300 pb-12">
          <FinancialProjection />
          <SmartCalendarSync schedule={schedule} />
          <CodexAssistant />
          <CodexVerificationModule />
          <CodeGeneratorWidget />
          <AutoOptimizeWidget />
        </div>
      )}
    </div>
  );
}
