import React, { useState, useEffect } from 'react';
import { Scissors, ClipboardList, ShieldAlert, CheckCircle, MessageSquare, Send, Sparkles } from 'lucide-react';
import { getProviderSchedule, logServiceCompletion, sendServiceUpdate, logActivity, createNotification } from '../services/dbService';
import { auth } from '../lib/firebase';

export default function ServiceProviderDashboardView() {
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

  useEffect(() => {
    const loadSchedule = async () => {

      try {
        // Mock provider ID for the grooming/boarding center
        const liveSchedule = await getProviderSchedule('provider_grooming_01');
        setSchedule(liveSchedule);
        if (liveSchedule.length > 0) setActivePet(liveSchedule[0]);
      } catch (error) {
        console.error("Failed to load schedule:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSchedule();
  }, []);

  const handleCompleteService = async () => {
    if (!activePet || !taskSummary.trim()) return;
    setIsSaving(true);
    try {
      await logServiceCompletion(activePet.id, taskSummary);
      
      if (auth.currentUser) {
        await logActivity(auth.currentUser.uid, 'Completed Service Task', `Task summary logged for ${activePet.name}`);
      }
      
      // Update local state queue
      const updatedSchedule = schedule.filter(p => p.id !== activePet.id);
      setSchedule(updatedSchedule);
      
      setTaskSummary('');
      setActivePet(updatedSchedule.length > 0 ? updatedSchedule[0] : null);
    } catch (error) {
      console.error("Failed to complete service", error);
    } finally {
      setIsSaving(false);
    }
  };

  // New Handler for Sending Client Updates
  const handleSendMessage = async () => {
    if (!activePet || !clientMessage.trim()) return;
    setIsSendingMsg(true);
    try {
      // In a real app, 'ownerUid' would be fetched alongside the activePet data
      // For this implementation, we assume activePet has an ownerUid property
      await sendServiceUpdate(
        activePet.petId, 
        activePet.ownerUid || 'mock_owner_uid', 
        'Downtown Grooming Team', 
        clientMessage
      );
      
      if (auth.currentUser && activePet.ownerUid) {
        await logActivity(auth.currentUser.uid, 'Sent Message to Client', `Message sent to owner of ${activePet.name}`);
        // Notify the owner
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
      <div className="p-6 md:p-8 min-h-screen bg-orange-50 animate-pulse">
        <div className="h-16 bg-slate-200/60 rounded-2xl mb-6 w-full max-w-sm"></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[80vh]">
          <div className="lg:col-span-4 bg-slate-200/60 rounded-2xl border border-slate-200"></div>
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="h-40 bg-slate-200/60 rounded-3xl border border-slate-200"></div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-200/60 rounded-2xl border border-slate-200"></div>
              <div className="bg-slate-200/60 rounded-2xl border border-slate-200"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-orange-50">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Care & Services Center</h1>
          <p className="text-slate-500 text-sm">Grooming • Boarding • Training</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[80vh]">
        
        {/* Left Column: Daily Schedule */}
        <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4 text-slate-800">
            <ClipboardList className="w-5 h-5 text-orange-500" />
            <h2 className="font-semibold">Today's Schedule</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {schedule.map((pet) => (
              <button 
                key={pet.id}
                onClick={() => setActivePet(pet)}
                className={`w-full text-left p-4 rounded-xl transition-all ${
                  activePet?.id === pet.id 
                    ? 'bg-orange-100 border border-orange-200' 
                    : 'bg-slate-50 border border-transparent hover:bg-slate-100'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <p className="font-bold text-slate-900">{pet.name}</p>
                  <span className="text-xs font-medium text-slate-500">{pet.time}</span>
                </div>
                <p className="text-xs text-slate-600 mb-2">{pet.details}</p>
                <span className="inline-block px-2 py-1 bg-white rounded-md text-xs font-medium text-orange-700 border border-orange-100">
                  {pet.serviceRequested}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Active Task Management */}
        {activePet && (
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Active Patient Card / Behavioral Overview */}
            <div className="flex flex-col gap-4 bg-white rounded-3xl p-6 border border-amber-200 border-l-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <ShieldAlert className="w-6 h-6 text-amber-500 opacity-20" />
              </div>
              <div className="flex items-center gap-4 relative z-10">
                <img 
                  src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200&auto=format&fit=crop" 
                  alt={activePet.name} 
                  className="w-16 h-16 rounded-full object-cover border-4 border-amber-50 shadow-sm"
                />
                <div>
                  <h2 className="text-xl font-bold text-slate-900 leading-tight">{activePet.name}</h2>
                  <p className="text-sm font-medium text-slate-600">{activePet.details}</p>
                </div>
                <div className="ml-auto">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold uppercase tracking-wider rounded-lg border border-amber-100">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Behavioral Alert
                    </span>
                </div>
              </div>
              
              <div className="mt-2 text-amber-900/90 text-sm font-medium bg-amber-50/50 p-4 rounded-xl border border-amber-100 relative z-10">
                 {activePet.behavioralNotes || "Friendly, but anxious around clippers. Treats highly recommended."}
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Service Checklist & Completion Log */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col">
                <div className="flex items-center gap-2 mb-4 text-slate-800">
                  <Scissors className="w-5 h-5 text-blue-500" />
                  <h2 className="font-semibold">Service Log</h2>
                </div>
                
                <textarea 
                  value={taskSummary}
                  onChange={(e) => setTaskSummary(e.target.value)}
                  className="flex-1 w-full p-4 bg-slate-50 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm"
                  placeholder={`Log completed tasks (e.g., "Nails trimmed, bathed with oatmeal shampoo, handled clippers well today")...`}
                ></textarea>
                
                <div className="mt-4 flex justify-end">
                  <button 
                    onClick={handleCompleteService}
                    disabled={!taskSummary.trim() || isSaving}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'Logging...' : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Complete Service
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
                    <p className="font-bold">Update Sent to Owner!</p>
                  </div>
                )}

                <div className="flex items-center justify-between mb-4 text-slate-800">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-500" />
                    <h2 className="font-semibold">Client Update</h2>
                  </div>
                </div>
                
                <p className="text-xs text-slate-500 mb-3">Send a quick, non-medical update directly to {activePet.name}'s owner.</p>
                
                {/* Quick Reply Chips */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <button onClick={() => setClientMessage("Bath time is all done! Wrapping up now.")} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium hover:bg-slate-200">Bath Done</button>
                  <button onClick={() => setClientMessage(`${activePet.name} is ready for pickup!`)} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium hover:bg-slate-200">Ready for Pickup</button>
                </div>

                <textarea 
                  value={clientMessage}
                  onChange={(e) => setClientMessage(e.target.value)}
                  className="flex-1 w-full p-4 bg-slate-50 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                  placeholder="Type a custom message..."
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
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {isSendingMsg ? 'Sending...' : (
                      <><Send className="w-4 h-4" /> Send Update</>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
