import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { 
  Dog, 
  Cat, 
  Bone, 
  Heart, 
  Zap, 
  Activity, 
  Phone, 
  ChevronRight, 
  CheckCircle2,
  Shield,
  Star,
  Sparkles,
  Lock,
  Compass,
  Layers,
  Calendar,
  User,
  Plus,
  AlertCircle
} from 'lucide-react';
import { ZooLLogo } from '../components/ZooLLogo';
import { useStore } from '../store/useStore';
import { auth, db } from '../firebase';
import { 
  RecaptchaVerifier, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  signInAnonymously
} from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { toast } from 'sonner';

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

export function LoginView() {
  const [activeTab, setActiveTab] = useState<'sandbox' | 'live'>('sandbox');
  const [phoneMode, setPhoneMode] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [selectedRole, setSelectedRole] = useState<'owner' | 'vet' | 'provider'>('owner');
  const [isLoading, setIsLoading] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<any>(auth.currentUser);
  const setUserProfile = useStore(state => state.setUserProfile);
  const setRole = useStore(state => state.setRole);

  useEffect(() => {
    if (auth.currentUser) {
      setAuthenticatedUser(auth.currentUser);
    }
  }, []);

  useEffect(() => {
    if (phoneMode && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible'
      });
    }
  }, [phoneMode]);

  const handleRoleSelection = async (user: any) => {
    setIsLoading(true);
    try {
      const newProfile = {
        uid: user.uid,
        name: user.displayName || (user.phoneNumber ? `User ${user.phoneNumber.slice(-4)}` : 'Pet Parent'),
        email: user.email || '',
        image: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'Pet Parent')}&background=random`,
        role: selectedRole,
        location: 'Mumbai, MH, India',
        createdAt: new Date().toISOString()
      };
      await setUserProfile(newProfile);
      setRole(selectedRole);
      toast.success(`Welcome to ZooL as a ${selectedRole}!`);
    } catch (error) {
      console.error('Role selection error:', error);
      toast.error('Failed to complete registration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        if (!userDoc.exists()) {
          setAuthenticatedUser(result.user);
        } else {
          const profile = userDoc.data() as any;
          await setUserProfile(profile);
          setRole(profile.role);
          toast.success(`Welcome back, ${profile.businessName || profile.name}!`);
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('The login popup was closed before completion. Please try again.');
      } else {
        toast.error(error.message || 'Google login failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    setIsLoading(true);
    try {
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      toast.success('OTP sent successfully!');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to send OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult || !otp) return;
    setIsLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      if (result.user) {
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        if (!userDoc.exists()) {
          setAuthenticatedUser(result.user);
        } else {
          const profile = userDoc.data() as any;
          await setUserProfile(profile);
          setRole(profile.role);
          toast.success("Logged in successfully!");
        }
      }
    } catch(err) {
      console.error(err);
      toast.error("Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSandboxLogin = async (roleType: 'owner' | 'vet' | 'provider') => {
    setIsLoading(true);
    try {
      // Authenticate anonymously so they have real DB permissions
      const result = await signInAnonymously(auth);
      if (result.user) {
        const nameMap = {
          owner: 'Sarah Connor',
          vet: 'Dr. Olivia Bennett',
          provider: 'Ecosystem Care Resort'
        };
        const avatarMap = {
          owner: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
          vet: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150',
          provider: 'https://images.unsplash.com/photo-1581579438747-1dc8d1e0ca96?auto=format&fit=crop&q=80&w=150'
        };
        const clinicMap = {
          owner: '',
          vet: 'City Pet Specialist Clinic (South)',
          provider: 'Happy Tails Resort & Spa'
        };
        
        const newProfile = {
          uid: result.user.uid,
          name: nameMap[roleType],
          email: `${roleType}-${result.user.uid.slice(0, 5)}@zool-sandbox.io`,
          isPremium: true,
          image: avatarMap[roleType],
          role: roleType,
          location: 'Mumbai, MH, India',
          businessName: clinicMap[roleType],
          createdAt: new Date().toISOString()
        };
        
        await setUserProfile(newProfile);
        setRole(roleType);
        toast.success(`Initialised complimentary sandbox session as ${newProfile.name}!`);
      }
    } catch (err: any) {
      console.error('Sandbox login error:', err);
      toast.error(`Ecosystem Demo Error: ${err.message || 'Firestore is syncing offline'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#FAF8F5] overflow-hidden font-sans">
      {/* Left Column: Visual Showcase Representation of reference mockup */}
      <div className="hidden lg:flex flex-col p-12 relative bg-gradient-to-br from-[#0B192C] via-[#112233] to-[#142D42] text-white border-r border-[#0B192C]/10 overflow-y-auto">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#00E5FF_0%,transparent_50%)] opacity-[0.14] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,#FF5252_0%,transparent_50%)] opacity-[0.06] pointer-events-none" />
        
        {/* Animated backdrop elements */}
        <div className="absolute top-24 right-16 w-32 h-32 bg-[#00ADB5] rounded-full filter blur-[100px] opacity-20 animate-pulse pointer-events-none" />
        <div className="absolute bottom-24 left-16 w-32 h-32 bg-[#FF758F] rounded-full filter blur-[80px] opacity-10 pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full justify-between gap-12">
          {/* Header section with upgraded official brand logo */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ZooLLogo size="md" showIcon={true} className="text-white brightness-200 contrast-125 select-none" />
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-black uppercase tracking-wider text-[#00E5FF]">
              <Sparkles size={11} className="animate-spin" />
              <span>Complimentary Access</span>
            </div>
          </div>

          {/* Core Banner Showcase: Designed around Sarah and upcoming buddy checker */}
          <div className="max-w-xl self-center w-full my-auto space-y-10">
            <div className="space-y-4">
              <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-5xl font-brand font-semibold text-white tracking-tight leading-[1.1]"
              >
                Better care. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] to-[#0ea5e9]">Happier pets.</span>
              </motion.h1>
              <p className="text-slate-300 text-sm font-medium leading-relaxed max-w-sm">
                ZooL is a modern veterinary and pet care platform that makes pet parenting easier, healthier, and more connected. Developed for immediate multirole attestation.
              </p>
            </div>

            {/* Simulated Live UI Screen mirroring Image 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
              className="w-full bg-[#FAF8F5]/5 border border-white/10 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-2xl relative"
            >
              {/* Phone Device Status Bar */}
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold px-2 mb-4">
                <span>9:41 AM</span>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping mr-1" />
                  <span className="text-[10px] tracking-widest text-[#00E5FF]">LIVE CONNECT</span>
                </div>
              </div>

              {/* Sarah Welcome Block */}
              <div className="flex items-center justify-between mb-5 px-1 bg-white/5 p-3 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                  <img 
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=80" 
                    alt="Sarah" 
                    className="w-10 h-10 rounded-full border-2 border-[#00E5FF]" 
                  />
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Welcome Back</span>
                    <p className="text-sm font-brand font-bold text-white flex items-center gap-1">
                      Sarah Connor <span className="text-xs">🐾</span>
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mr-1">
                  <span className="text-xs">🔔</span>
                </div>
              </div>

              {/* Pets Circle Row */}
              <div className="mb-6">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-wide px-1">
                  <span>Your Rested Animals</span>
                  <span className="text-[#00E5FF] hover:underline cursor-pointer">View All</span>
                </div>
                <div className="grid grid-cols-4 gap-3 bg-white/5 p-4 rounded-[2rem] border border-white/5">
                  {[
                    { name: 'Buddy', role: 'Golden Retriever', age: '3 years', img: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=80', active: true },
                    { name: 'Luna', role: 'Persian Cat', age: '2 years', img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=80', active: false },
                    { name: 'Milo', role: 'Dutch Rabbit', age: '1 year', img: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&q=80&w=80', active: false },
                  ].map((p, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <div className={cn("w-12 h-12 rounded-full p-0.5 shadow-md flex items-center justify-center relative", p.active ? "ring-2 ring-[#00E5FF]" : "ring-1 ring-white/10")}>
                        <img src={p.img} alt={p.name} className="w-full h-full rounded-full object-cover" />
                        {p.active && <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#1E293B]" />}
                      </div>
                      <span className="text-[10px] font-bold text-white mt-1.5">{p.name}</span>
                      <span className="text-[7.5px] text-slate-400 font-medium tracking-tight truncate max-w-full">{p.role}</span>
                    </div>
                  ))}
                  <div className="flex flex-col items-center justify-center">
                    <button className="w-12 h-12 rounded-full border border-dashed border-white/20 hover:border-[#00E5FF] hover:bg-[#00E5FF]/10 text-slate-400 hover:text-[#00E5FF] flex items-center justify-center transition-all">
                      <Plus size={16} />
                    </button>
                    <span className="text-[10px] font-bold text-slate-400 mt-1.5">Add</span>
                  </div>
                </div>
              </div>

              {/* Upcoming Appointment Card Row */}
              <div className="bg-[#FAF8F5] text-[#0B192C] p-4.5 rounded-[2rem] shadow-lg border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#00E5FF]/20 to-transparent rounded-bl-[4rem]" />
                <span className="text-[8px] font-black uppercase tracking-widest text-[#00ADB5] px-2 py-0.5 bg-[#00ADB5]/10 rounded-full inline-block mb-3">UPCOMING DUO CLINIC</span>
                <div className="flex gap-3 mb-3.5">
                  <img 
                    src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=80" 
                    alt="Olivia" 
                    className="w-11 h-11 rounded-full object-cover border-2 border-[#0B192C]" 
                  />
                  <div>
                    <h4 className="text-xs font-bold text-[#0B192C] flex items-center gap-1">
                      Dr. Olivia Bennett <span className="text-[10px] text-[#00ADB5] font-black">VR-CE7</span>
                    </h4>
                    <p className="text-[9.5px] font-medium text-slate-500">Clinical Surgeon • South District Vet</p>
                    <div className="flex gap-2.5 mt-1 text-[8.5px] font-bold text-[#0B192C]/70">
                      <span className="flex items-center gap-1">📅 24 May 2025</span>
                      <span className="flex items-center gap-1">⏰ 10:30 AM</span>
                    </div>
                  </div>
                </div>
                <button className="w-full py-2 bg-[#0B192C] hover:bg-[#0B192C]/90 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md">
                  Verify Appointment Schedule
                </button>
              </div>
            </motion.div>
          </div>

          {/* Bottom attribution block */}
          <div className="flex items-center gap-3 text-xs text-slate-400 font-bold border-t border-white/5 pt-5 uppercase tracking-wider justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Complimentary Premium active</span>
            </div>
            <span>ZooL v1.0.4-CLINICAL</span>
          </div>
        </div>
      </div>

      {/* Right Column: Dynamic Form Section */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white p-8 sm:p-10 rounded-[2.5rem] border border-slate-200/50 shadow-2xl relative"
        >
          {/* High-visibility active Trial Indicator as required by guidelines */}
          <div className="mb-6 p-3 bg-indigo-50 border border-indigo-100/50 rounded-2xl flex items-start gap-2.5">
            <span className="text-lg">🎁</span>
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-widest text-[#0B192C] font-semibold">ZooL Trial Mode Active</h4>
              <p className="text-[10px] text-indigo-700 font-medium leading-normal mt-0.5">
                Stripe Payments have been paused for clinical evaluation. Bookings bypass the processing session and write seamlessly.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center text-center mb-8">
            <ZooLLogo size="md" className="mb-4" />
            <h2 className="text-2xl font-brand font-semibold text-[#0B192C] tracking-tight">Ecosystem Gateway</h2>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mt-1.5">Configure and attestate your role</p>
          </div>

          {/* Dynamic Switch Tabs: Sandbox instant demo vs secure live */}
          <div className="flex p-1 bg-slate-150 rounded-2xl border border-slate-200/50 mb-8 self-stretch">
            <button
              onClick={() => { setActiveTab('sandbox'); setPhoneMode(false); }}
              className={cn(
                "flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                activeTab === 'sandbox' 
                  ? "bg-white text-[#0B192C] shadow-sm"
                  : "text-slate-500 hover:text-[#0B192C]"
              )}
            >
              Demo Sandbox
            </button>
            <button
              onClick={() => setActiveTab('live')}
              className={cn(
                "flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                activeTab === 'live' 
                  ? "bg-white text-[#0B192C] shadow-sm"
                  : "text-slate-500 hover:text-[#0B192C]"
              )}
            >
              Secure Live Login
            </button>
          </div>

          {/* Tab Renderers */}
          <AnimatePresence mode="wait">
            {activeTab === 'sandbox' ? (
              <motion.div 
                key="sandbox-login-tab"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <div className="text-left border-b pb-3 border-slate-100">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Sandbox Personas</h3>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Select a clinical role to enter immediately without external SMS costs</p>
                </div>

                <div className="grid grid-cols-1 gap-3.5">
                  {[
                    { id: 'owner', label: 'Sarah Connor', role: 'owner', desc: 'Pet Parent • Complete Wellness Hub', icon: Heart, badge: 'COMPLIMENTARY', color: 'text-[#00ADB5] hover:border-[#00ADB5]' },
                    { id: 'vet', label: 'Dr. Olivia Bennett', role: 'vet', desc: 'Veterinary Surgeon • Certified attestation', icon: Shield, badge: 'CLINICAL SUP', color: 'text-indigo-600 hover:border-indigo-500' },
                    { id: 'provider', label: 'Ecosystem Care Resort', role: 'provider', desc: 'Resort/Salon Host • Packages manager', icon: Zap, badge: 'COMMERCE PRO', color: 'text-amber-500 hover:border-amber-500' }
                  ].map((pCard) => (
                    <motion.button
                      key={pCard.id}
                      onClick={() => handleSandboxLogin(pCard.role as any)}
                      disabled={isLoading}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-3xl border border-slate-200 hover:border-ruru-teal bg-white/50 text-left transition-all relative group",
                        isLoading ? "opacity-50 cursor-not-allowed" : ""
                      )}
                    >
                      <div className={cn("w-11 h-11 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform", pCard.color)}>
                        <pCard.icon size={20} className="fill-current" />
                      </div>
                      <div className="flex-1 pr-12">
                        <span className="block text-xs font-black uppercase tracking-widest text-slate-400">{pCard.label}</span>
                        <span className="block text-[10px] text-slate-500 font-medium mt-0.5">{pCard.desc}</span>
                      </div>
                      <span className="absolute top-4 right-4 text-[7px] font-black uppercase tracking-widest bg-slate-100 text-[#0B192C] border px-2 py-0.5 rounded-full">
                        {pCard.badge}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="live-login-tab"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                {authenticatedUser ? (
                  <div className="space-y-6">
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                      <p className="text-xs text-slate-600 font-bold">Successfully logged in via Google/Email</p>
                      <p className="text-sm font-black text-emerald-800 mt-1 uppercase tracking-wider">{authenticatedUser.displayName || authenticatedUser.email}</p>
                    </div>

                    <div className="space-y-2 text-left">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Active Role</label>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { id: 'owner', label: 'Pet Parent', desc: 'Sarah Connor level care hub', icon: Heart },
                          { id: 'vet', label: 'Medical Professional', desc: 'Clinical attestation panel', icon: Shield },
                          { id: 'provider', label: 'Service Provider', desc: 'Resort logs & booking tracking', icon: Zap }
                        ].map((rObj) => (
                          <button
                            key={rObj.id}
                            onClick={() => setSelectedRole(rObj.id as any)}
                            className={cn(
                              "w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all",
                              selectedRole === rObj.id ? "border-[#0B192C] bg-[#00ADB5]/5" : "border-slate-200"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <rObj.icon size={16} className="text-slate-500" />
                              <div>
                                <span className="block text-xs font-bold text-[#0B192C]">{rObj.label}</span>
                                <span className="block text-[8px] text-slate-400 uppercase tracking-wider">{rObj.desc}</span>
                              </div>
                            </div>
                            {selectedRole === rObj.id && <span className="w-1.5 h-1.5 rounded-full bg-[#0B192C]" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleRoleSelection(authenticatedUser)}
                      className="w-full bg-[#0B192C] text-white py-4.5 rounded-[2rem] font-semibold flex items-center justify-center gap-2 group shadow-xl"
                    >
                      Authorise and Enter Dashboard
                      <ChevronRight size={16} />
                    </motion.button>
                  </div>
                ) : !phoneMode ? (
                  <div className="space-y-5">
                    <motion.button 
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                      className="w-full py-4 bg-white border border-slate-200 rounded-3xl font-semibold text-[#0B192C] flex items-center justify-center gap-3.5 hover:bg-slate-50 transition-all disabled:opacity-50"
                    >
                      <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                      Authenticate via Google
                    </motion.button>
                    
                    <div className="relative py-2 flex items-center">
                      <div className="flex-grow border-t border-slate-150"></div>
                      <span className="flex-shrink-0 mx-4 text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">Partition Gateway</span>
                      <div className="flex-grow border-t border-slate-150"></div>
                    </div>

                    <motion.button 
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setPhoneMode(true)}
                      className="w-full py-4 bg-slate-50 text-slate-700 rounded-3xl font-semibold flex items-center justify-center gap-3 hover:bg-slate-100 transition-all border border-slate-200"
                    >
                      <Phone size={16} className="text-slate-500" />
                      Request Secure Mobile OTP
                    </motion.button>

                    <p className="text-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 px-6 leading-relaxed">
                      By proceeding, you attest to our <span className="underline cursor-pointer">Encryption Standards</span> and <span className="underline cursor-pointer">Care Protocols</span>.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <button 
                      onClick={() => { setPhoneMode(false); setOtpSent(false); }}
                      className="p-2 text-slate-450 hover:text-slate-800 transition-colors text-xs font-bold uppercase tracking-wider flex items-center gap-1"
                    >
                      <ChevronRight size={16} className="rotate-180" />
                      <span>Back to Sign-in</span>
                    </button>

                    {!otpSent ? (
                      <form onSubmit={handlePhoneLogin} className="space-y-4 text-left">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[#0B192C] ml-1">Mobile Identifier</label>
                          <div className="flex gap-2">
                            <div className="bg-slate-50 border px-4 rounded-2xl text-slate-700 font-semibold flex items-center text-xs">
                              +91
                            </div>
                            <input 
                              type="tel" 
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                              placeholder="Phone number"
                              className="flex-1 bg-slate-50 border px-4 py-3.5 rounded-2xl text-[#0B192C] font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-ruru-teal"
                              required
                            />
                          </div>
                        </div>
                        <motion.button 
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          type="submit"
                          disabled={isLoading || phoneNumber.length < 10}
                          className="w-full bg-[#0B192C] text-white py-4 rounded-3xl font-semibold disabled:opacity-50 transition-all shadow-md"
                        >
                          {isLoading ? 'Encrypting Connection...' : 'Verify Mobile Number'}
                        </motion.button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyOtp} className="space-y-4 text-left">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center block">Verification Token</label>
                          <input 
                            type="text" 
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="••••••"
                            className="w-full bg-slate-50 border px-4 py-4 rounded-3xl text-2xl text-center tracking-[0.4em] focus:outline-none focus:ring-1 focus:ring-ruru-teal"
                            required
                          />
                          <p className="text-center text-[10px] text-slate-400">Enter 6-digit code dispatched to +91 {phoneNumber}</p>
                        </div>
                        <motion.button 
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          type="submit"
                          disabled={isLoading || otp.length < 6}
                          className="w-full bg-ruru-teal hover:bg-[#00ADB5] text-white py-4 rounded-3xl font-semibold flex items-center justify-center gap-2 transition-all shadow-md"
                        >
                          {isLoading ? 'Verifying...' : 'Attestate OTP and Confirm'}
                          <CheckCircle2 size={16} />
                        </motion.button>
                      </form>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div id="recaptcha-container"></div>
        </motion.div>
      </div>
    </div>
  );
}
