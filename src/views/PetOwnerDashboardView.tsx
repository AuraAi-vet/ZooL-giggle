import { useEffect, useState } from 'react';
import { MapPin, CalendarPlus, CheckCircle, Bell, Plus, Dog, Activity, Heart, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { subscribeToOwnerPets, subscribeToOwnerAppointments, createAppointment, subscribeToServiceUpdates, createNotification, logActivity, addOwnerPet } from '../services/dbService';
import { PetProfile } from '../types';
import { auth } from '../lib/firebase';
import { useAppStore } from '../store/useAppStore';
import GemaChatInterface from '../components/GemaChatInterface'; 
import HealthHaloAvatar from '../components/HealthHaloAvatar';
import CareStreaksWidget from '../components/CareStreaksWidget';
import ClinicalTimelineModule, { HealthEvent } from '../components/ClinicalTimelineModule';
import ActivePatientCard from '../components/ActivePatientCard';
import NearbyClinicsWidget from '../components/NearbyClinicsWidget';

import IoTProgressWidget from '../components/IoTProgressWidget';
import SmartTriageModule from '../components/SmartTriageModule';
import DailyActivityTracker from '../components/DailyActivityTracker';
import HealthMetricsDashboard from '../components/HealthMetricsDashboard';
import UrgentHealthAlerts from '../components/UrgentHealthAlerts';
import AddPetDialog from '../components/AddPetDialog';
import AIInsightsWidget from '../components/AIInsightsWidget';
import PetDetailsModal from '../components/PetDetailsModal';
import AIHealthThumbnail from '../components/AIHealthThumbnail';
import { useLanguage } from '../lib/i18n';

import { PetOwnerDashboardSkeleton } from '../components/DashboardSkeleton';

export default function PetOwnerDashboardView() {
  const { pets, activePetId, setPets, setActivePetId } = useAppStore();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [serviceUpdates, setServiceUpdates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddPetOpen, setIsAddPetOpen] = useState(false);
  const [isPetDetailsOpen, setIsPetDetailsOpen] = useState(false);
  const { t } = useLanguage();

  
  // Booking State
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [externalBookingSuccess, setExternalBookingSuccess] = useState<{clinicName: string} | null>(null);

  useEffect(() => {
    let unsubUpdates: (() => void) | undefined;
    let unsubPets: (() => void) | undefined;
    let unsubApts: (() => void) | undefined;

    if (auth.currentUser) {
      unsubPets = subscribeToOwnerPets(auth.currentUser.uid, (livePets) => {
        setPets(livePets);
        setIsLoading(false);
      });
      unsubApts = subscribeToOwnerAppointments(auth.currentUser.uid, (liveApts) => {
        setAppointments(liveApts || []);
      });
      unsubUpdates = subscribeToServiceUpdates(auth.currentUser.uid, (updates) => {
        setServiceUpdates(updates);
      });
    } else {
      setIsLoading(false);
    }
    
    return () => {
      if (unsubUpdates) unsubUpdates();
      if (unsubPets) unsubPets();
      if (unsubApts) unsubApts();
    };
  }, [setPets]);

  const primaryPet = pets.find(p => p.petId === activePetId) || pets[0];

  // The Direct Booking Handler
  const handleBookTrialAppointment = async (source: string = 'UI Button', clinicId: string = 'clinic_zool_tvm', clinicName: string = 'ZooL Pet Clinic - Trivandrum') => {
    if (!primaryPet || !auth.currentUser) return;
    
    setIsBooking(true);
    try {
      const isExternal = clinicId.startsWith('ext_');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      await createAppointment(
        primaryPet.petId,
        auth.currentUser.uid,
        clinicId, 
        tomorrow.getTime(),
        `${primaryPet.name} - Checkup at ${clinicName} (Source: ${source})`
      );
      
      if (isExternal) {
        // External clinic logic
        await createNotification(
          auth.currentUser.uid,
          'Booking Request Sent',
          `Your appointment request for ${primaryPet.name} has been sent to ${clinicName}. We are contacting them to confirm.`
        );
        await logActivity(auth.currentUser.uid, 'External Booking Requested', `Requested a checkup for ${primaryPet.name} at ${clinicName}`);
        
        setExternalBookingSuccess({ clinicName });
        setTimeout(() => setExternalBookingSuccess(null), 6000); // Hide after 6s
      } else {
        // Internal clinic logic
        await createNotification(
          auth.currentUser.uid,
          'Appointment Confirmed',
          `Your checkup for ${pets[0].name} is scheduled for tomorrow at 10:00 AM at ${clinicName}.`
        );
        await logActivity(auth.currentUser.uid, 'Scheduled Appointment', `Scheduled a checkup for ${pets[0].name} at ${clinicName}`);
        
        setBookingSuccess(true);
        setTimeout(() => setBookingSuccess(false), 4000); // Hide after 4s
      }
      
    } catch (error) {
      console.error("Booking failed", error);
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return <PetOwnerDashboardSkeleton />;
  }

  // NEW: Robust Empty State Handling
  if (!primaryPet) {
    return (
      <div className="p-6 md:p-8 min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] border border-slate-200/60 p-10 max-w-lg w-full flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
            <Dog className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-3">Welcome to ZooL</h2>
          <p className="text-slate-500 font-medium mb-8 leading-relaxed">
            Your centralized care hub is ready. Add your first pet profile to unlock AI-assisted booking, health timelines, and live updates.
          </p>
          <button onClick={() => setIsAddPetOpen(true)} className="flex items-center justify-center gap-2 w-full py-4 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm shadow-blue-600/20">
            <Plus className="w-5 h-5" />
            {t('addPetProfile')}
          </button>
        </div>
        <AddPetDialog 
            isOpen={isAddPetOpen} 
            onClose={() => setIsAddPetOpen(false)} 
            onAdded={() => setIsAddPetOpen(false)}
            onSubmit={async (petData) => {
              if (auth.currentUser) {
                await addOwnerPet({ ...petData, ownerUid: auth.currentUser.uid, petId: "" });
              }
            }}
        />
      </div>
    );
  }

  const petName = primaryPet?.name || 'Pet';

  const dynamicEvents: HealthEvent[] = appointments.map((apt) => {
    const isUpcoming = apt.scheduledTime > Date.now();
    const isCompleted = apt.status === 'completed';
    const dateStr = new Date(apt.scheduledTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
    
    return {
      id: apt.id,
      date: isUpcoming ? new Date(apt.scheduledTime).toLocaleDateString([], { month: 'short', day: 'numeric' }).toUpperCase() : dateStr,
      type: isUpcoming ? "UPCOMING" : "VISIT",
      title: isUpcoming ? apt.notes.split(' - ')[1] || 'Upcoming Appointment' : 'Veterinary Visit',
      summaryText: isUpcoming ? "Scheduled Checkup" : (apt.notes || "Visit completed"),
      details: isUpcoming ? undefined : apt.notes
    };
  });

  const baseEvents: HealthEvent[] = [
    {
      id: "1",
      date: "12 OCT 2023",
      type: "VISIT",
      title: "Annual Wellness Exam",
      summaryText: "All vitals normal. Weight maintained.",
      details: `Dr. Sharma checked ${petName}'s heart, lungs, and joints. Everything looks great. Continue current diet.`
    },
    {
      id: "2",
      date: "05 DEC 2023",
      type: "VACCINE",
      title: "Rabies Booster",
      summaryText: "Administered 1-year Rabies vaccine.",
    }
  ];

  const timelineEvents = [...dynamicEvents.filter(e => e.type === 'UPCOMING'), ...baseEvents, ...dynamicEvents.filter(e => e.type !== 'UPCOMING')];

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
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-cyan-400/10 rounded-full blur-[100px] pointer-events-none"></div>

      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10 w-full bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] border border-slate-200/60">
        <div className="flex items-center gap-6">
           <HealthHaloAvatar 
             imageUrl="https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200&auto=format&fit=crop" 
             petName={primaryPet?.name || 'Pet'}
             healthScore={85} 
           />
           <div>
             <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
               {t('welcomeBack')} <br/>
               <span className="text-cyan-600">{primaryPet ? `${primaryPet.name}'s human` : t('petParent')}</span>
             </h1>
             <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
               <Dog size={16} className="text-slate-400" />
               {primaryPet?.breed} • {primaryPet?.age} years old
             </p>
           </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <CareStreaksWidget streak={12} />
          <button onClick={() => setIsAddPetOpen(true)} className="p-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl transition-all shadow-md active:scale-95 flex items-center gap-2 font-bold group">
             <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
             <span className="hidden sm:inline">Add Profile</span>
          </button>
        </div>
      </header>

      <motion.div variants={containerVars} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 auto-rows-max">
        <AddPetDialog 
            isOpen={isAddPetOpen} 
            onClose={() => setIsAddPetOpen(false)} 
            onAdded={() => setIsAddPetOpen(false)}
            onSubmit={async (petData) => {
              if (auth.currentUser) {
                await addOwnerPet({ ...petData, ownerUid: auth.currentUser.uid, petId: "" });
              }
            }}
        />

        <PetDetailsModal 
          isOpen={isPetDetailsOpen}
          onClose={() => setIsPetDetailsOpen(false)}
          pet={primaryPet}
        />
        
        {/* Top Feature: Smart Triage */}
        <motion.div variants={itemVars} className="col-span-1 lg:col-span-8">
          <SmartTriageModule onBookRoutine={() => handleBookTrialAppointment('Smart Triage')} />
        </motion.div>

        {/* Top Right: AI Thumbnail */}
        <motion.div variants={itemVars} className="col-span-1 lg:col-span-4 h-full flex">
          <div className="w-full h-full">
            <AIHealthThumbnail
               petName={petName}
               speciesBreed={primaryPet?.breed || 'Dog'}
               imageUrl="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=800"
               healthScore={92}
            />
          </div>
        </motion.div>
        
        {/* Urgent Alerts - Full Width Span */}
        {(true) && (
        <motion.div variants={itemVars} className="col-span-1 lg:col-span-12 w-full">
          <UrgentHealthAlerts />
        </motion.div>)}

        {/* Bento Row 2: Metrics and Activity */}
        <motion.div variants={itemVars} className="col-span-1 lg:col-span-7 h-full">
          <div className="w-full h-full">
            <HealthMetricsDashboard />
          </div>
        </motion.div>
        
        <motion.div variants={itemVars} className="col-span-1 lg:col-span-5 h-full">
          <div className="w-full h-full">
            <DailyActivityTracker />
          </div>
        </motion.div>

        {/* Bento Row 3: AI Insights, Gema Chat, IoT */}
        <motion.div variants={itemVars} className="col-span-1 lg:col-span-5 h-full">
          <div className="w-full h-full">
            <GemaChatInterface 
              petContext={primaryPet} 
              onBookAction={() => handleBookTrialAppointment('Gema Chat')} 
            />
          </div>
        </motion.div>

        <motion.div variants={itemVars} className="col-span-1 lg:col-span-4 h-full">
          <div className="w-full h-full">
             <AIInsightsWidget pet={primaryPet} />
          </div>
        </motion.div>

        <motion.div variants={itemVars} className="col-span-1 lg:col-span-3 flex flex-col gap-6 md:gap-8">
          <IoTProgressWidget />
          
          {/* Live Service Updates Module */}
          {serviceUpdates.length > 0 && (
            <div className="bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] border border-slate-200/60 p-6 flex flex-col flex-1">
              <div className="flex items-center gap-3 mb-4 text-slate-800">
                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 relative">
                  <Bell className="w-5 h-5" />
                  <div className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-indigo-50"></div>
                </div>
                <h2 className="font-bold text-lg">{t('liveUpdates')}</h2>
              </div>
              
              <div className="space-y-3">
                {serviceUpdates.slice(0, 3).map((update) => (
                  <div key={update.id} className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{update.providerName}</span>
                      <span className="text-xs font-medium text-slate-400">
                        {new Date(update.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 font-medium">{update.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Booking Map and Timeline: Bottom Area */}
        <motion.div variants={itemVars} className="col-span-1 lg:col-span-7 h-[500px]">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] border border-white/50 p-4 sm:p-6 flex flex-col relative overflow-hidden h-full">
            {isBooking && (
              <div className="absolute inset-0 z-20 bg-white/50 backdrop-blur-sm flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-brand-primary border-t-white rounded-full animate-spin"></div>
              </div>
            )}
            {/* Internal Success Overlay */}
            {bookingSuccess && (
              <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center text-emerald-600 transition-all animate-in fade-in duration-300">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <p className="font-extrabold text-xl font-display">Appointment Booked!</p>
                <p className="text-sm font-medium text-emerald-700 text-center px-4 mt-2">
                  We'll see {primaryPet?.name} tomorrow at 10:00 AM. Check live updates for details.
                </p>
              </div>
            )}
            
            {/* External Success Overlay */}
            {externalBookingSuccess && (
              <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center text-indigo-600 transition-all animate-in fade-in duration-300 p-6 text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 relative">
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                    <span className="text-white text-[10px] font-bold">1</span>
                  </div>
                  <CheckCircle className="w-8 h-8" />
                </div>
                <p className="font-extrabold text-xl font-display mb-2">Request Sent!</p>
                <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 mb-4 max-w-xs">
                  <p className="text-sm font-medium text-indigo-800 mb-3">
                    <strong className="block text-base">{externalBookingSuccess.clinicName}</strong>
                    is not yet in our preferred network.
                  </p>
                  <p className="text-xs text-indigo-600">
                    We've sent them your booking request along with an invitation to join the platform to seamlessly confirm your appointment.
                  </p>
                </div>
                <div className="space-y-2 mt-2 w-full max-w-xs">
                  <p className="text-sm font-bold text-slate-500 mb-4">
                    You will be notified once they respond.
                  </p>
                  <button 
                    onClick={() => {
                      window.location.hash = `#claim-booking=${encodeURIComponent(externalBookingSuccess.clinicName)}`;
                      setExternalBookingSuccess(null);
                    }}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                    Simulate Clinic Email Invite
                  </button>
                </div>
              </div>
            )}

            <NearbyClinicsWidget onBook={(id, name) => handleBookTrialAppointment('Map Search', id, name)} />
          </div>
        </motion.div>

        <motion.div variants={itemVars} className="col-span-1 lg:col-span-5 flex">
          <div className="w-full h-full min-h-[500px]">
            <ClinicalTimelineModule events={timelineEvents} />
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
