import { useEffect, useState } from 'react';
import { MapPin, CalendarPlus, CheckCircle, Bell, Plus, Dog } from 'lucide-react';
import { getOwnerPets, createAppointment, subscribeToServiceUpdates, createNotification, logActivity, addOwnerPet } from '../services/dbService';
import { PetProfile } from '../types';
import { auth } from '../lib/firebase';
import GemaChatInterface from '../components/GemaChatInterface'; 
import HealthHaloAvatar from '../components/HealthHaloAvatar';
import CareStreaksWidget from '../components/CareStreaksWidget';
import ClinicalTimelineModule, { HealthEvent } from '../components/ClinicalTimelineModule';
import ActivePatientCard from '../components/ActivePatientCard';
import NearbyClinicsWidget from '../components/NearbyClinicsWidget';

import IoTProgressWidget from '../components/IoTProgressWidget';
import AddPetDialog from '../components/AddPetDialog';

export default function PetOwnerDashboardView() {
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [serviceUpdates, setServiceUpdates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddPetOpen, setIsAddPetOpen] = useState(false);
  
  // Booking State
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [externalBookingSuccess, setExternalBookingSuccess] = useState<{clinicName: string} | null>(null);

  const loadData = async () => {
    if (auth.currentUser) {
      try {
        const livePets = await getOwnerPets(auth.currentUser.uid);
        setPets(livePets);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    loadData();
    if (auth.currentUser) {
      unsubscribe = subscribeToServiceUpdates(auth.currentUser.uid, (updates) => {
        setServiceUpdates(updates);
      });
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // The Direct Booking Handler
  const handleBookTrialAppointment = async (source: string = 'UI Button', clinicId: string = 'clinic_downtown_01', clinicName: string = 'Downtown Wellness Vet') => {
    if (!pets[0] || !auth.currentUser) return;
    
    setIsBooking(true);
    try {
      const isExternal = clinicId.startsWith('ext_');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      await createAppointment(
        pets[0].petId,
        auth.currentUser.uid,
        clinicId, 
        tomorrow.getTime(),
        `${pets[0].name} - Checkup at ${clinicName} (Source: ${source})`
      );
      
      if (isExternal) {
        // External clinic logic
        await createNotification(
          auth.currentUser.uid,
          'Booking Request Sent',
          `Your appointment request for ${pets[0].name} has been sent to ${clinicName}. We are contacting them to confirm.`
        );
        await logActivity(auth.currentUser.uid, 'External Booking Requested', `Requested a checkup for ${pets[0].name} at ${clinicName}`);
        
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
    return (
      <div className="p-6 md:p-8 min-h-screen bg-[#F8FAFC] animate-pulse">
        <div className="h-32 bg-slate-200 rounded-3xl mb-8 w-full border border-slate-100"></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          <div className="lg:col-span-8 flex flex-col gap-6 md:gap-8">
            <div className="h-48 bg-slate-200 rounded-3xl border border-slate-100"></div>
            <div className="h-96 bg-slate-200 rounded-3xl border border-slate-100 flex-1"></div>
          </div>
          <div className="lg:col-span-4 flex flex-col gap-6 md:gap-8">
             <div className="h-64 bg-slate-200 rounded-3xl border border-slate-100"></div>
             <div className="h-64 bg-slate-200 rounded-3xl border border-slate-100"></div>
          </div>
        </div>
      </div>
    );
  }

  const primaryPet = pets[0];

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
            Add Pet Profile
          </button>
        </div>
        <AddPetDialog 
            isOpen={isAddPetOpen} 
            onClose={() => setIsAddPetOpen(false)} 
            onAdded={loadData}
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

  // Mock timeline events
  const timelineEvents: HealthEvent[] = [
    {
      id: "1",
      date: "OCT 12, 2023",
      type: "VISIT",
      title: "Annual Wellness Exam",
      summaryText: "All vitals normal. Weight maintained.",
      details: `Dr. Smith checked ${petName}'s heart, lungs, and joints. Everything looks great. Continue current diet.`
    },
    {
      id: "2",
      date: "DEC 05, 2023",
      type: "VACCINE",
      title: "Rabies Booster",
      summaryText: "Administered 1-year Rabies vaccine.",
    },
    {
       id: "3",
       date: "TOMORROW",
       type: "UPCOMING",
       title: "Complimentary Trial Checkup",
       summaryText: "Scheduled via Gema.",
    }
  ];

  return (
    <div className="p-6 min-h-screen bg-slate-50">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
        <div className="flex items-center gap-6">
           <HealthHaloAvatar 
             imageUrl="https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200&auto=format&fit=crop" 
             petName={primaryPet?.name || 'Pet'}
             healthScore={85} 
           />
           <div>
             <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
               Welcome back, <br/>
               <span className="text-blue-600">{primaryPet ? `${primaryPet.name}'s human` : 'Pet Parent'}</span>
             </h1>
             <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
               <Dog size={16} className="text-slate-400" />
               {primaryPet?.breed} • {primaryPet?.age} years old
             </p>
           </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsAddPetOpen(true)} className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-colors">
             <Plus className="w-6 h-6" />
          </button>
          <CareStreaksWidget streak={12} />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <AddPetDialog 
            isOpen={isAddPetOpen} 
            onClose={() => setIsAddPetOpen(false)} 
            onAdded={loadData}
            onSubmit={async (petData) => {
              if (auth.currentUser) {
                await addOwnerPet({ ...petData, ownerUid: auth.currentUser.uid, petId: "" });
              }
            }}
        />
        
        {/* Left Column - Gema Chat and active patient view */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <ActivePatientCard 
            petName={petName}
            speciesBreed={primaryPet?.breed || 'Dog'}
            avatarUrl="https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200&auto=format&fit=crop"
            healthStatus="CLEAR"
            nextMilestone="Upcoming Annual Review"
          />
          <IoTProgressWidget />
          <GemaChatInterface 
            petContext={primaryPet} 
            onBookAction={() => handleBookTrialAppointment('Gema Chat')} 
          />
        </div>

        {/* Right Column - Locator Map & Direct Booking */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* Live Service Updates Module */}
          {serviceUpdates.length > 0 && (
            <div className="bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] border border-slate-200/60 p-6 flex flex-col mb-6">
              <div className="flex items-center gap-3 mb-4 text-slate-800">
                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 relative">
                  <Bell className="w-5 h-5" />
                  <div className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-indigo-50"></div>
                </div>
                <h2 className="font-bold text-lg">Live Updates</h2>
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

          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] border border-white/50 p-4 sm:p-6 flex flex-col relative overflow-hidden flex-1 min-h-[500px]">
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

          {/* Timeline Module */}
          <ClinicalTimelineModule events={timelineEvents} />

        </div>

      </div>
    </div>
  );
}
