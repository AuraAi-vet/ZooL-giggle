import { useState, useEffect } from 'react';
import { Scissors, ClipboardList, ShieldAlert, CheckCircle, MessageSquare, Send, Sparkles, TrendingUp, X, Activity, CalendarDays, KanbanSquare, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { subscribeToProviderSchedule, logServiceCompletion, sendServiceUpdate, logActivity, createNotification } from '../services/dbService';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import FinancialProjection from '../components/FinancialProjection';
import SmartCalendarSync from '../components/SmartCalendarSync';
import CodeGeneratorWidget from '../components/CodeGeneratorWidget';
import AutoOptimizeWidget from '../components/AutoOptimizeWidget';
import CodexAssistant from '../components/CodexAssistant';
import CodexVerificationModule from '../components/CodexVerificationModule';
import AgileKanbanBoard from '../components/AgileKanbanBoard';

import { ServiceProviderDashboardSkeleton } from '../components/DashboardSkeleton';

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
    setIsLoading(true);
    const unsubscribe = subscribeToProviderSchedule('provider_grooming_01', (liveSchedule) => {
      setSchedule(liveSchedule);
      setIsLoading(false);
    });

    const timer = setTimeout(() => {
      setBookingSurgeAlert({
        service: "Grooming & Spa",
        increasePercent: 45,
        message: "AI analysis detects a 45% surge in grooming requests for the upcoming sprint. Consider adjusting velocity and sprint capacity to capture this demand."
      });
    }, 6000);

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
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
    return <ServiceProviderDashboardSkeleton />;
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
      <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-cyan-400/10 rounded-full blur-[100px] pointer-events-none transform"></div>

      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10 w-full">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 font-display mb-1">Sprint Operations</h1>
          <p className="text-slate-500 mt-1 font-medium flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-600" />
            ZooL Service Workflow
          </p>
        </div>
        <div className="flex bg-white/80 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-slate-200/60">
          <button 
            onClick={() => setActiveTab('agile')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'agile' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
          >
            <div className="flex items-center gap-2">
              <KanbanSquare className="w-4 h-4" /> Sprint Board
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('planning')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'planning' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
          >
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" /> Insights & Review
            </div>
          </button>
        </div>
      </header>

      {/* AI Booking Surge Alert */}
      <AnimatePresence>
      {bookingSurgeAlert && activeTab === 'agile' && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="mb-10 bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-100/50 rounded-[2rem] p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 relative shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)]"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-200/30 rounded-full blur-xl pointer-events-none -mt-10 -mr-10"></div>
          <div className="p-3.5 bg-white rounded-2xl shadow-sm border border-cyan-100 text-cyan-600 hidden sm:block relative z-10">
             <TrendingUp className="w-6 h-6" />
          </div>
          <div className="flex-1 relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-cyan-600" />
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider font-display">Demand Surge Detected</h3>
            </div>
            <p className="text-slate-700 text-sm leading-relaxed max-w-3xl">{bookingSurgeAlert.message}</p>
          </div>
          <div className="flex items-center gap-3 mt-4 sm:mt-0 w-full sm:w-auto relative z-10">
             <button onClick={() => { setActiveTab('planning'); setBookingSurgeAlert(null); }} className="flex-1 sm:flex-none px-6 py-3 bg-white hover:bg-slate-50 text-cyan-700 text-sm font-bold tracking-wide rounded-xl transition-colors shadow-sm border border-cyan-100">
               Review Capacity
             </button>
             <button onClick={() => setBookingSurgeAlert(null)} className="p-3 text-slate-400 hover:text-slate-600 bg-white rounded-xl shadow-sm border border-slate-200 transition-colors">
               <X className="w-5 h-5" />
             </button>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {activeTab === 'agile' ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-[80vh] relative rounded-[2rem] border border-slate-200/60 overflow-hidden shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] bg-white/70 backdrop-blur-xl">
          <AgileKanbanBoard 
            tasks={schedule} 
            onTaskSelect={(task) => setActivePet(task)} 
            onTaskStatusChange={handleTaskStatusChange}
          />
          
          {/* Active Task Modal Overlay */}
          <AnimatePresence>
          {activePet && (
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            >
              <motion.div 
                 initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }} transition={{ type: "spring" as const, stiffness: 300, damping: 25 }}
                 className="bg-[#F8FAFC] rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
              >
                <div className="px-6 py-5 border-b border-slate-200/80 flex justify-between items-center bg-white">
                  <h2 className="text-xl font-bold flex items-center gap-3 text-slate-800 font-display">
                    <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl border border-cyan-100">
                       <Activity className="w-5 h-5" />
                    </div>
                    Task Execution
                  </h2>
                  <button onClick={() => setActivePet(null)} className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-slate-500 transition-colors shadow-sm">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                  {/* Task Header / Behavioral Overview */}
                  <div className="flex flex-col gap-4 bg-white rounded-3xl p-6 border border-amber-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-2 h-full bg-amber-400"></div>
                    <div className="flex items-center gap-5 relative z-10">
                      <img 
                        src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200&auto=format&fit=crop" 
                        alt={activePet.name} 
                        className="w-16 h-16 rounded-full object-cover border-4 border-amber-50 shadow-sm"
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
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 flex flex-col">
                      <div className="flex items-center gap-3 mb-5 text-slate-800">
                        <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-xl border border-cyan-100">
                          <Scissors className="w-5 h-5" />
                        </div>
                        <h2 className="font-bold text-lg font-display">Acceptance Criteria Log</h2>
                      </div>
                      
                      <textarea 
                        value={taskSummary}
                        onChange={(e) => setTaskSummary(e.target.value)}
                        className="flex-1 w-full p-4 bg-slate-50/50 border border-slate-200/80 rounded-2xl resize-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 focus:outline-none text-sm min-h-[140px] shadow-inner transition-shadow"
                        placeholder={`Log completed tasks to meet DoD (Definition of Done)...`}
                      ></textarea>
                      
                      <div className="mt-5 flex justify-end gap-3 pt-2">
                        <button 
                          onClick={() => handleTaskStatusChange(activePet.id, 'in-progress')}
                          className="px-5 py-2.5 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold tracking-wide transition-all"
                        >
                          Mark In-Progress
                        </button>
                        <button 
                          onClick={handleCompleteService}
                          disabled={!taskSummary.trim() || isSaving}
                          className="flex items-center justify-center min-w-[140px] gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold tracking-wide hover:bg-slate-800 transition-colors shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] disabled:opacity-50"
                        >
                          {isSaving ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Mark Done
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Client Messaging Module */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 flex flex-col relative overflow-hidden">
                      <AnimatePresence>
                      {msgSuccess && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                          className="absolute inset-0 z-20 bg-white/95 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center text-emerald-600"
                        >
                          <div className="p-4 bg-emerald-50 rounded-full mb-3 shadow-inner">
                            <CheckCircle className="w-10 h-10" />
                          </div>
                          <p className="font-extrabold text-xl font-display text-slate-800">Update Sent</p>
                        </motion.div>
                      )}
                      </AnimatePresence>

                      <div className="flex items-center justify-between mb-5 text-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                            <MessageSquare className="w-5 h-5" />
                          </div>
                          <h2 className="font-bold text-lg font-display">Stakeholder Update</h2>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        <button onClick={() => setClientMessage("Bath time is all done! Wrapping up now.")} className="px-3.5 py-1.5 bg-white border border-slate-200 shadow-sm text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors">Stage 1 Done</button>
                        <button onClick={() => setClientMessage(`${activePet.name} is ready for pickup!`)} className="px-3.5 py-1.5 bg-white border border-slate-200 shadow-sm text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors">Ready for Pickup</button>
                      </div>

                      <textarea 
                        value={clientMessage}
                        onChange={(e) => setClientMessage(e.target.value)}
                        className="flex-1 w-full p-4 bg-slate-50/50 border border-slate-200/80 rounded-2xl resize-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 focus:outline-none text-sm min-h-[110px] shadow-inner transition-shadow"
                        placeholder="Type a sprint increment update..."
                      ></textarea>
                      
                      <div className="mt-5 flex justify-between items-center pt-2">
                        <button 
                          onClick={handleSuggestMessage}
                          disabled={isSuggesting || !taskSummary.trim()}
                          className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 shadow-sm"
                        >
                          {isSuggesting ? (
                            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Sparkles size={14} />
                          )}
                          {isSuggesting ? 'Drafting' : 'AI Draft'}
                        </button>
                        <button 
                          onClick={handleSendMessage}
                          disabled={!clientMessage.trim() || isSendingMsg}
                          className="flex items-center justify-center min-w-[140px] gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold tracking-wide hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-[0_4px_14px_0_rgb(0,0,0,0.15)]"
                        >
                          {isSendingMsg ? (
                             <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            <><Send className="w-4 h-4" /> Send Update</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div variants={containerVars} initial="hidden" animate="show" className="flex flex-col gap-6 pb-12">
          <motion.div variants={itemVars} className="flex flex-col gap-6"><FinancialProjection /></motion.div>
          <motion.div variants={itemVars} className="flex flex-col gap-6"><SmartCalendarSync schedule={schedule} /></motion.div>
          <motion.div variants={itemVars} className="flex flex-col gap-6"><CodexAssistant /></motion.div>
          <motion.div variants={itemVars} className="flex flex-col gap-6"><CodexVerificationModule /></motion.div>
          <motion.div variants={itemVars} className="flex flex-col gap-6"><CodeGeneratorWidget /></motion.div>
          <motion.div variants={itemVars} className="flex flex-col gap-6"><AutoOptimizeWidget /></motion.div>
        </motion.div>
      )}
    </div>
  );
}
