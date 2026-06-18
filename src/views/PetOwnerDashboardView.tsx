import React, { useEffect, useState } from 'react';
import { MapPin, CalendarPlus, CheckCircle, Bell, Plus, Dog } from 'lucide-react';
import { getOwnerPets, createAppointment, subscribeToServiceUpdates, createNotification, logActivity } from '../services/dbService';
import { PetProfile } from '../types';
import { auth } from '../lib/firebase';
import GemaChatInterface from '../components/GemaChatInterface'; 
import HealthHaloAvatar from '../components/HealthHaloAvatar';
import CareStreaksWidget from '../components/CareStreaksWidget';
import ClinicalTimelineModule, { HealthEvent } from '../components/ClinicalTimelineModule';
import ActivePatientCard from '../components/ActivePatientCard';

export default function PetOwnerDashboardView() {
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [serviceUpdates, setServiceUpdates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Booking State
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const fetchLivePetData = async () => {
      if (auth.currentUser) {
        try {
          const livePets = await getOwnerPets(auth.currentUser.uid);
          setPets(livePets);
          
          // Subscribe to live service updates sent by groomers/boarders
          unsubscribe = subscribeToServiceUpdates(auth.currentUser.uid, (updates) => {
            setServiceUpdates(updates);
          });
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      }
      setIsLoading(false);
    };
    fetchLivePetData();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // The Direct Booking Handler
  const handleBookTrialAppointment = async (source: string = 'UI Button') => {
    if (!pets[0] || !auth.currentUser) return;
    
    setIsBooking(true);
    try {
      // Schedule for tomorrow at 10:00 AM (Mock logic for demonstration)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      await createAppointment(
        pets[0].petId,
        auth.currentUser.uid,
        'clinic_downtown_01', 
        tomorrow.getTime(),
        `${pets[0].name} - Trial Checkup (Source: ${source})`
      );
      
      // Also trigger a system notification to demonstrate the UI
      await createNotification(
        auth.currentUser.uid,
        'Appointment Confirmed',
        `Your trial checkup for ${pets[0].name} is scheduled for tomorrow at 10:00 AM.`
      );
      
      await logActivity(auth.currentUser.uid, 'Scheduled Appointment', `Scheduled a trial checkup for ${pets[0].name}`);
      
      setBookingSuccess(true);
      setTimeout(() => setBookingSuccess(false), 4000); // Hide after 4s
      
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
          <button className="flex items-center justify-center gap-2 w-full py-4 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm shadow-blue-600/20">
            <Plus className="w-5 h-5" />
            Add Pet Profile
          </button>
        </div>
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
        <div className="flex items-center">
          <CareStreaksWidget streak={12} />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column - Gema Chat and active patient view */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <ActivePatientCard 
            petName={petName}
            speciesBreed={primaryPet?.breed || 'Dog'}
            avatarUrl="https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200&auto=format&fit=crop"
            healthStatus="CLEAR"
            nextMilestone="Upcoming Annual Review"
          />
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

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col relative overflow-hidden">
            
            {/* Success Overlay */}
            {bookingSuccess && (
              <div className="absolute inset-0 z-10 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center text-emerald-600 transition-all">
                <CheckCircle className="w-12 h-12 mb-2" />
                <p className="font-bold text-lg">Trial Booked!</p>
                <p className="text-sm text-emerald-700 text-center px-4">
                  We'll see {primaryPet?.name} tomorrow at 10:00 AM.
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 mb-4 text-slate-800">
              <MapPin className="w-5 h-5 text-blue-500" />
              <h2 className="font-semibold">Nearest Verified Clinic</h2>
            </div>
            
            <div className="h-40 bg-slate-100 rounded-xl mb-4 flex items-center justify-center border border-slate-200">
              <p className="text-slate-400 text-sm font-medium">Downtown Wellness Vet</p>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Downtown Wellness is currently accepting walk-ins and trial appointments.
            </p>

            <button 
              onClick={() => handleBookTrialAppointment('UI Button')}
              disabled={isBooking || bookingSuccess}
              className="mt-auto flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isBooking ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <CalendarPlus className="w-5 h-5" />
                  Book Complimentary Care
                </>
              )}
            </button>
          </div>

          {/* Timeline Module */}
          <ClinicalTimelineModule events={timelineEvents} />

        </div>

      </div>
    </div>
  );
}
