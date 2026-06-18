import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Shield, Brain, Activity, Stethoscope, ArrowRight, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { UserProfile } from '../types';

interface OnboardingWizardProps {
  onComplete: () => void;
  onAddPet: () => void;
  userProfile: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
}

const features = [
  {
    title: "Unified Health Records",
    desc: "Keep all medical records, vaccinations, and notes in one secure, accessible place.",
    icon: Activity,
    color: "bg-emerald-500",
    shadow: "shadow-emerald-500/20"
  },
  {
    title: "AI-Powered Insights",
    desc: "Get intelligent recommendations tailored specifically to your pet's breed and history.",
    icon: Brain,
    color: "bg-blue-500",
    shadow: "shadow-blue-500/20"
  },
  {
    title: "Seamless Care Network",
    desc: "Connect directly with top-rated veterinarians, groomers, and service providers.",
    icon: Stethoscope,
    color: "bg-rose-500",
    shadow: "shadow-rose-500/20"
  }
];

export function OnboardingWizard({ onComplete, onAddPet, userProfile, onUpdateProfile }: OnboardingWizardProps) {
  const [step, setStep] = useState(0); // 0: Welcome, 1: Features, 2: Role, 3: Role Setup
  const [featureIdx, setFeatureIdx] = useState(0);
  const [localRole, setLocalRole] = useState<'owner' | 'vet' | 'provider'>(userProfile.role || 'owner');
  const [businessName, setBusinessName] = useState('');
  const [providerType, setProviderType] = useState<UserProfile['providerType']>('clinic');

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleRoleSelect = (role: 'owner' | 'vet' | 'provider') => {
    setLocalRole(role);
    onUpdateProfile({ role });
  };

  const handleBusinessSubmit = () => {
    onUpdateProfile({ 
      businessName, 
      providerType: localRole === 'vet' ? 'clinic' : providerType,
      onboardingComplete: true 
    });
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-ruru-navy/60 backdrop-blur-md">
      <AnimatePresence mode="wait">
        <motion.div 
          key={step}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col min-h-[400px]"
        >
          {step === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-ruru-teal/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />
              
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 15 }}
                className="w-24 h-24 bg-ruru-navy rounded-[2rem] flex items-center justify-center shadow-2xl shadow-ruru-navy/20 mb-8 relative"
              >
                <Sparkles className="text-blue-400 absolute top-4 right-4" size={16} />
                <Heart className="text-white w-10 h-10" fill="currentColor" />
              </motion.div>
              
              <h1 className="text-4xl font-brand text-ruru-navy mb-4 tracking-tight">Welcome to ZooL</h1>
              <p className="text-[#A8A29E] font-medium text-lg leading-relaxed mb-12">
                The intelligent ecosystem for comprehensive pet care and animal wellness.
              </p>
              
              <button 
                onClick={nextStep}
                className="w-full py-4 bg-ruru-navy text-white rounded-[1.5rem] text-sm font-black uppercase tracking-widest shadow-xl shadow-ruru-navy/20 flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors"
              >
                Get Started <ArrowRight size={18} />
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="flex-1 flex flex-col p-8 md:p-12 relative h-full">
              <div className="flex items-center justify-between mb-8">
                <button onClick={prevStep} className="text-[#A8A29E] font-bold text-xs uppercase tracking-widest hover:text-ruru-navy transition-colors">Back</button>
                <div className="flex gap-2">
                  {features.map((_, i) => (
                    <div key={i} className={cn("w-2 h-2 rounded-full transition-all", i === featureIdx ? "bg-ruru-navy w-6" : "bg-ruru-navy/10")} />
                  ))}
                </div>
                <button onClick={nextStep} className="text-blue-500 font-bold text-xs uppercase tracking-widest hover:text-blue-600 transition-colors">Skip</button>
              </div>

              <div className="flex-1 flex flex-col justify-center mb-8 relative min-h-[220px]">
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={featureIdx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="text-center"
                  >
                    <div className={cn("w-20 h-20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 text-white shadow-xl", features[featureIdx].color, features[featureIdx].shadow)}>
                      {React.createElement(features[featureIdx].icon, { size: 32 })}
                    </div>
                    <h2 className="text-2xl font-brand text-ruru-navy mb-4">{features[featureIdx].title}</h2>
                    <p className="text-[#A8A29E] font-medium text-lg leading-relaxed px-4">
                      {features[featureIdx].desc}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              <button 
                onClick={() => {
                  if (featureIdx < features.length - 1) setFeatureIdx(prev => prev + 1);
                  else nextStep();
                }}
                className="w-full py-4 bg-ruru-navy text-white rounded-[1.5rem] text-sm font-black uppercase tracking-widest shadow-xl shadow-ruru-navy/20 flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors mt-auto"
              >
                {featureIdx < features.length - 1 ? 'Next' : 'Continue'} <ArrowRight size={18} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="flex-1 flex flex-col p-8 md:p-12 h-full justify-between">
              <div>
                 <div className="mb-8">
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#A8A29E] mb-2">Step 1 of 2</p>
                     <h2 className="text-3xl font-brand text-ruru-navy mb-2">Who are you?</h2>
                     <p className="text-[#A8A29E] font-medium">Select your primary role to customize your experience.</p>
                 </div>
                 
                 <div className="space-y-4 mb-8">
                   {[
                     { id: 'owner', label: 'Pet Owner', sub: 'I want to manage care for my pets', icon: Heart },
                     { id: 'vet', label: 'Veterinarian', sub: 'I want to manage my clinical practice', icon: Shield },
                     { id: 'provider', label: 'Service Provider', sub: 'I offer grooming, boarding, or retail', icon: MessageCircle }
                   ].map(r => (
                     <button
                       key={r.id}
                       onClick={() => handleRoleSelect(r.id as any)}
                       className={cn(
                         "w-full flex items-center p-4 rounded-[1.5rem] border-2 text-left transition-all relative overflow-hidden group",
                         localRole === r.id 
                           ? "border-ruru-navy bg-[#FDFBF7]" 
                           : "border-ruru-navy/5 hover:border-ruru-navy/20 bg-white"
                       )}
                     >
                       <div className={cn(
                         "w-12 h-12 rounded-[1rem] flex items-center justify-center mr-4 transition-colors",
                         localRole === r.id ? "bg-ruru-navy text-white shadow-md" : "bg-[#F5F5F0] text-[#A8A29E] group-hover:bg-ruru-navy/5 text-ruru-navy"
                       )}>
                         <r.icon size={20} />
                       </div>
                       <div className="flex-1">
                         <p className="font-bold text-ruru-navy text-lg">{r.label}</p>
                         <p className="text-[10px] text-[#A8A29E] font-medium leading-tight">{r.sub}</p>
                       </div>
                       {localRole === r.id && (
                         <CheckCircle2 className="text-blue-500 ml-2" size={20} />
                       )}
                     </button>
                   ))}
                 </div>
              </div>

              <div className="flex items-center gap-4 mt-auto pt-4">
                <button onClick={prevStep} className="px-6 py-4 rounded-[1.5rem] font-bold text-[#A8A29E] bg-[#F5F5F0] hover:bg-[#EBEBE6] transition-colors">
                   Back
                </button>
                <button 
                  onClick={nextStep}
                  className="flex-1 py-4 bg-ruru-navy text-white rounded-[1.5rem] text-sm font-black uppercase tracking-widest shadow-xl shadow-ruru-navy/20 flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors"
                >
                  Continue <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && localRole === 'owner' && (
            <div className="flex-1 flex flex-col p-8 md:p-12 h-full text-center items-center justify-center">
              <div className="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20 mb-8 border-4 border-white">
                 <Heart className="text-white w-10 h-10" fill="currentColor" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#A8A29E] mb-2">Step 2 of 2</p>
              <h2 className="text-3xl font-brand text-ruru-navy mb-4">You're all set!</h2>
              <p className="text-[#A8A29E] font-medium text-lg leading-relaxed mb-12 px-4">
                Let's add your first pet to start building their digital health record.
              </p>
              
              <div className="w-full flex gap-4 mt-auto">
                <button 
                  onClick={() => {
                    onUpdateProfile({ onboardingComplete: true });
                    onComplete();
                  }}
                  className="px-6 py-4 rounded-[1.5rem] font-bold text-[#A8A29E] bg-[#F5F5F0] hover:bg-[#EBEBE6] transition-colors"
                >
                   Skip for now
                </button>
                <button 
                  onClick={() => {
                    onAddPet();
                    onUpdateProfile({ onboardingComplete: true });
                    onComplete();
                  }}
                  className="flex-1 py-4 bg-ruru-navy text-white rounded-[1.5rem] text-sm font-black uppercase tracking-widest shadow-xl shadow-ruru-navy/20 hover:bg-blue-600 transition-colors"
                >
                  Add My Pet
                </button>
              </div>
            </div>
          )}

          {step === 3 && (localRole === 'vet' || localRole === 'provider') && (
            <div className="flex-1 flex flex-col p-8 md:p-12 h-full">
               <div className="mb-8">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#A8A29E] mb-2">Step 2 of 2</p>
                 <h2 className="text-3xl font-brand text-ruru-navy mb-2">Business Setup</h2>
                 <p className="text-[#A8A29E] font-medium">Almost there. Tell us about your {localRole === 'vet' ? 'practice' : 'business'}.</p>
               </div>
              
              <div className="space-y-6 flex-1">
                <div>
                  <label className="block text-[10px] font-black text-[#A8A29E] uppercase tracking-widest mb-2 ml-1">Business / Practice Name</label>
                  <input 
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full bg-[#F5F5F0] border-none rounded-[1.25rem] px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-ruru-navy transition-all"
                    placeholder="e.g. Paws & Claws Clinic"
                  />
                </div>
                {localRole === 'provider' && (
                  <div>
                    <label className="block text-[10px] font-black text-[#A8A29E] uppercase tracking-widest mb-2 ml-1">Primary Service</label>
                    <select 
                      value={providerType}
                      onChange={(e) => setProviderType(e.target.value as any)}
                      className="w-full bg-[#F5F5F0] border-none rounded-[1.25rem] px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-ruru-navy transition-all appearance-none"
                    >
                      <option value="groomer">Grooming & Spa</option>
                      <option value="boarding">Hostel / Boarding</option>
                      <option value="trainer">Pet Trainer</option>
                      <option value="shop">Pet Shop & Food</option>
                      <option value="breeder">Breeder</option>
                      <option value="farm">Farming / Livestock</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 mt-8 pt-4">
                <button onClick={prevStep} className="px-6 py-4 rounded-[1.5rem] font-bold text-[#A8A29E] bg-[#F5F5F0] hover:bg-[#EBEBE6] transition-colors">
                   Back
                </button>
                <button 
                  onClick={handleBusinessSubmit}
                  disabled={!businessName}
                  className="flex-1 py-4 bg-ruru-navy text-white rounded-[1.5rem] text-sm font-black uppercase tracking-widest shadow-xl shadow-ruru-navy/20 flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  Complete Setup <CheckCircle2 size={18} />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

