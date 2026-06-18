import React, { useState } from 'react';
import { Stethoscope, CheckCircle, Store, CalendarPlus, ChevronRight, Loader2 } from 'lucide-react';
import AnimatedLogo from '../components/AnimatedLogo';
import { auth } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { createUserProfile, logActivity } from '../services/dbService';

export default function ExternalProviderOnboardingView({ 
  onClose,
  clinicName = "Downtown Wellness Vet - Independent"
}: { 
  onClose: () => void;
  clinicName?: string;
}) {
  const [step, setStep] = useState(1);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const handleClaim = async () => {
    setIsAuthenticating(true);
    try {
      if (!auth.currentUser) {
        const googleProvider = new GoogleAuthProvider();
        await signInWithPopup(auth, googleProvider);
      }
      setStep(2);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request' || err.code === 'auth/internal-error' || err.code === 'auth/network-request-failed') {
        alert("Please open the app in a new tab to complete login, or allow popups.");
      } else {
        alert("Authentication failed: " + err.message);
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleFinalize = async () => {
    if (!auth.currentUser) return;
    setIsFinalizing(true);
    try {
      const newProfile = {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email || '',
        roleId: 'role_vet_02',
        displayName: auth.currentUser.displayName || clinicName,
        createdAt: Date.now(),
      };
      await createUserProfile(newProfile);
      await logActivity(auth.currentUser.uid, 'Account Claimed', `Claimed external booking profile for ${clinicName}`);
      onClose(); // This clears the hash and their auth state in App will drop them to ClinicianDashboard
    } catch (err) {
      console.error(err);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-[#FAF8F5] z-[100] flex flex-col overflow-y-auto">
      <div className="absolute top-6 left-6">
        <AnimatedLogo size="md" />
      </div>
      
      <div className="max-w-3xl w-full mx-auto mt-24 p-6">
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_-12px_rgba(0,0,0,0.1)] border border-slate-200 overflow-hidden">
          
          <div className="bg-emerald-600 p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 opacity-10">
              <Store className="w-64 h-64" />
            </div>
            <h1 className="text-3xl font-display font-black mb-2 relative z-10">
              Claim Your ZooL Booking
            </h1>
            <p className="text-emerald-50 text-lg relative z-10 max-w-xl">
              A Pet Owner has requested an appointment at <strong>{clinicName}</strong> through the ZooL Network. Claim your free practice profile to confirm the booking.
            </p>
          </div>

          <div className="p-8">
            <div className="flex gap-8 items-start">
              
              <div className="w-1/3 border-r border-slate-100 pr-8 hidden md:block">
                <div className="space-y-6 relative">
                  <div className="absolute left-3 top-4 bottom-4 w-0.5 bg-emerald-100"></div>
                  
                  <div className={`relative flex items-center gap-4 transition-opacity ${step === 1 ? 'opacity-100' : 'opacity-50'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs z-10 ${step === 1 ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'}`}>1</div>
                    <span className="font-bold text-slate-800">Secure the Request</span>
                  </div>
                  
                  <div className={`relative flex items-center gap-4 transition-opacity ${step === 2 ? 'opacity-100' : 'opacity-40'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs z-10 ${step === 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
                    <span className="font-bold text-slate-800">Review Appointment</span>
                  </div>

                  <div className={`relative flex items-center gap-4 transition-opacity ${step === 3 ? 'opacity-100' : 'opacity-40'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs z-10 ${step === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>3</div>
                    <span className="font-bold text-slate-800">Accept & Join</span>
                  </div>
                </div>
              </div>

              <div className="flex-1">
                {step === 1 && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="mb-8">
                      <div className="flex items-center gap-3 mb-4 text-emerald-600 bg-emerald-50 w-max px-4 py-2 rounded-xl">
                        <CalendarPlus className="w-5 h-5" />
                        <span className="font-bold">Pending Booking Request</span>
                      </div>
                      <h2 className="text-2xl font-bold text-slate-800 mb-2">Connect Your Practice</h2>
                      <p className="text-slate-600 mb-6">
                        Verify you are an authorized representative of {clinicName} to view the patient's records and confirm this appointment.
                      </p>

                      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 mb-6">
                        <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-widest">Why Join ZooL?</h3>
                        <ul className="space-y-3">
                          <li className="flex gap-3 text-slate-700 text-sm">
                            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                            Receive seamless bookings straight from pet owners.
                          </li>
                          <li className="flex gap-3 text-slate-700 text-sm">
                            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                            Access continuous IoT health data and AI summaries for your patients.
                          </li>
                          <li className="flex gap-3 text-slate-700 text-sm">
                            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                            Zero upfront costs. Grow your modern practice today.
                          </li>
                        </ul>
                      </div>
                    </div>

                    <button 
                      onClick={handleClaim}
                      disabled={isAuthenticating}
                      className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                    >
                      {isAuthenticating ? 'Connecting...' : 'Claim & Continue with Google'}
                      {!isAuthenticating && <ChevronRight className="w-5 h-5" />}
                    </button>
                    
                    <button onClick={onClose} className="w-full mt-4 py-3 text-slate-500 font-medium hover:text-slate-800 text-sm">
                      Decline & Close
                    </button>
                  </div>
                )}

                {step === 2 && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-800">Practice Verified</h2>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-200 mb-6 shadow-sm">
                      <h3 className="font-bold text-slate-800 mb-2">Pending Appointment Details</h3>
                      <div className="flex justify-between items-center py-3 border-b border-slate-100">
                        <span className="text-slate-500 text-sm">Pet</span>
                        <span className="font-bold text-slate-800">Max (Golden Retriever)</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-slate-100">
                        <span className="text-slate-500 text-sm">Requested Time</span>
                        <span className="font-bold text-slate-800">Tomorrow at 10:00 AM</span>
                      </div>
                      <div className="flex justify-between items-center py-3">
                        <span className="text-slate-500 text-sm">Reason</span>
                        <span className="font-bold text-slate-800">General Checkup</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => setStep(3)}
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
                    >
                      Confirm Appointment & Go To Dashboard
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}

                {step === 3 && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 text-center py-12">
                     <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-12 h-12" />
                      </div>
                      <h2 className="text-3xl font-display font-black text-slate-800 mb-4">Welcome to ZooL!</h2>
                      <p className="text-slate-600 mb-8 max-w-sm mx-auto">
                        Your clinic profile is setup and the booking is confirmed. You can now manage your patients directly.
                      </p>
                      <button 
                        onClick={handleFinalize}
                        disabled={isFinalizing}
                        className="py-4 px-8 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center mx-auto gap-2"
                      >
                        {isFinalizing && <Loader2 className="w-5 h-5 animate-spin" />}
                        Enter Clinic Dashboard
                      </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
