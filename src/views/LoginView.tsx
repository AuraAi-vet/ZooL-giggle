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
  Shield
} from 'lucide-react';
import { ZooLLogo } from '../components/ZooLLogo';
import { useStore } from '../store/useStore';
import { auth, db } from '../firebase';
import { 
  RecaptchaVerifier, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithPhoneNumber, 
  ConfirmationResult 
} from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { toast } from 'sonner';

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

export function LoginView() {
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
        location: 'Update your location',
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
        toast.error('The login popup was closed before completion. Please try again and ensure popups are permitted.');
      } else if (error.code === 'auth/cancelled-by-user') {
        toast.error('Login was cancelled. Please try again.');
      } else {
        toast.error(error.message || 'Google login failed. Please try again.');
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

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-soft-slate overflow-hidden">
      {/* Visual Identity Section */}
      <div className="hidden lg:flex flex-col p-12 relative overflow-hidden bg-white border-r border-soft-blue/30 shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,#e0f2fe_0%,transparent_40%)] opacity-50" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_80%,#f3e8ff_0%,transparent_40%)] opacity-50" />
        
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-16">
            <ZooLLogo size="md" />
          </div>

          <div className="max-w-xl self-center my-auto">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl font-display font-semibold text-soft-ink tracking-tight leading-[1.1] mb-8"
            >
              The new standard for <span className="text-ruru-teal">pet health intelligence.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-soft-ink/60 font-medium leading-relaxed mb-12"
            >
              Empowering proactive pet parents with AI-driven diagnostics, seamless clinical integration, and holistic wellness monitoring.
            </motion.p>

            <div className="grid grid-cols-2 gap-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="p-6 bg-soft-blue/20 rounded-[2rem] border border-soft-blue/30 backdrop-blur-sm"
              >
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-4 text-ruru-teal shadow-soft">
                  <Zap size={24} />
                </div>
                <h3 className="font-display font-semibold text-soft-ink mb-1">Instant Triage</h3>
                <p className="text-sm text-soft-ink/50">Clinical-grade AI assessments available 24/7.</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="p-6 bg-soft-purple/20 rounded-[2rem] border border-soft-purple/30 backdrop-blur-sm"
              >
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-4 text-soft-purple shadow-soft">
                  <Activity size={24} />
                </div>
                <h3 className="font-display font-semibold text-soft-ink mb-1">Unified Vault</h3>
                <p className="text-sm text-soft-ink/50">All records synced across specialized networks.</p>
              </motion.div>
            </div>
          </div>
          
          <div className="mt-auto pt-12 flex items-center gap-6 opacity-40">
            <div className="flex -space-x-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-soft-slate" />
              ))}
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-soft-ink">Trusted by 50k+ Pet Parents</p>
          </div>
        </div>
      </div>

      {/* Auth Form Section */}
      <div className="flex flex-col items-center justify-center p-8 sm:p-24 bg-soft-slate">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white p-10 sm:p-12 rounded-[2.5rem] shadow-xl border border-white/60 relative overflow-hidden"
        >
          {/* Logo mobile-only */}
          <div className="lg:hidden flex justify-center mb-10">
            <ZooLLogo size="md" />
          </div>

          <div className="mb-10 text-center">
            <h2 className="text-3xl font-display font-semibold text-soft-ink mb-2">Welcome to ZooL</h2>
            <p className="text-soft-ink/50 font-medium">Continue your healthcare journey</p>
          </div>

          <AnimatePresence mode="wait">
            {authenticatedUser ? (
              <motion.div 
                key="role-selection"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { id: 'owner', label: 'Pet Parent', desc: 'Manage your pets & healthcare', icon: Heart, bg: 'bg-soft-pink text-pink-600' },
                    { id: 'vet', label: 'Medical Professional', desc: 'Veterinary clinical dashboard', icon: Shield, bg: 'bg-soft-blue text-blue-600' },
                    { id: 'provider', label: 'Service Provider', desc: 'Grooming, training & care', icon: Zap, bg: 'bg-soft-amber text-amber-600' }
                  ].map((role) => (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role.id as any)}
                      className={cn(
                        "flex items-center gap-5 p-5 rounded-[2rem] transition-all duration-300 border-2 text-left group",
                        selectedRole === role.id 
                          ? "bg-soft-slate border-soft-ink shadow-sm ring-4 ring-soft-slate" 
                          : "bg-white border-soft-slate hover:border-soft-blue/30"
                      )}
                    >
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform", role.bg)}>
                        <role.icon size={22} className={selectedRole === role.id ? "fill-current" : ""} />
                      </div>
                      <div className="flex-1">
                        <span className="block text-sm font-display font-semibold text-soft-ink">{role.label}</span>
                        <span className="block text-[10px] text-soft-ink/40 font-medium uppercase tracking-wider">{role.desc}</span>
                      </div>
                      {selectedRole === role.id && <div className="w-2 h-2 rounded-full bg-soft-ink" />}
                    </button>
                  ))}
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRoleSelection(authenticatedUser)}
                  className="w-full bg-soft-ink text-white py-5 rounded-[2rem] font-semibold shadow-xl shadow-soft-ink/10 flex items-center justify-center gap-2 group transition-all"
                >
                  Enter Dashboard
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </motion.div>
            ) : !phoneMode ? (
              <motion.div 
                key="social-login"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full py-4.5 bg-white border-2 border-soft-slate rounded-[2rem] font-semibold text-soft-ink flex items-center justify-center gap-4 hover:bg-soft-slate transition-all disabled:opacity-50"
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                  Continue with Google
                </motion.button>
                
                <div className="relative py-4 flex items-center">
                  <div className="flex-grow border-t border-soft-slate"></div>
                  <span className="flex-shrink-0 mx-4 text-xs font-black uppercase tracking-widest text-soft-ink/30">Temporal Partition</span>
                  <div className="flex-grow border-t border-soft-slate"></div>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPhoneMode(true)}
                  className="w-full py-4.5 bg-soft-slate text-soft-ink rounded-[2rem] font-semibold flex items-center justify-center gap-4 hover:bg-soft-blue/20 transition-all border-2 border-transparent hover:border-soft-blue/30"
                >
                  <Phone size={18} />
                  Mobile Number
                </motion.button>

                <p className="text-center text-[10px] font-black uppercase tracking-widest text-soft-ink/30 px-6 leading-relaxed">
                  By continuing, you agree to our <span className="text-soft-ink/60 hover:underline cursor-pointer">Encryption Standards</span> and <span className="text-soft-ink/60 hover:underline cursor-pointer">Care Protocols.</span>
                </p>
              </motion.div>
            ) : (
              <motion.div 
                key="phone-login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <button 
                  onClick={() => { setPhoneMode(false); setOtpSent(false); }}
                  className="p-3 -ml-3 text-soft-ink/40 hover:text-soft-ink transition-colors"
                >
                  <ChevronRight size={20} className="rotate-180" />
                </button>

                {!otpSent ? (
                  <form onSubmit={handlePhoneLogin} className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-soft-ink ml-2">Mobile Identifier</label>
                      <div className="flex gap-2">
                        <div className="bg-soft-slate px-5 py-4.5 rounded-[1.5rem] text-soft-ink font-semibold flex items-center">
                          +91
                        </div>
                        <input 
                          type="tel" 
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="Phone number"
                          className="flex-1 bg-soft-slate px-5 py-4.5 rounded-[1.5rem] text-soft-ink font-semibold placeholder:text-soft-ink/20 focus:outline-none focus:ring-2 focus:ring-soft-blue transition-all"
                          required
                        />
                      </div>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isLoading || phoneNumber.length < 10}
                      className="w-full bg-soft-ink text-white py-4.5 rounded-[2rem] font-semibold disabled:opacity-50 transition-all shadow-xl shadow-soft-ink/10"
                    >
                      {isLoading ? 'Encrypting...' : 'Request OTP Code'}
                    </motion.button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-soft-ink ml-2 text-center block">Verification Token</label>
                      <input 
                        type="text" 
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="••••••"
                        className="w-full bg-soft-slate px-5 py-6 rounded-[2rem] text-3xl font-display font-semibold text-center tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-soft-blue transition-all"
                        required
                      />
                      <p className="text-center text-xs text-soft-ink/40">Enter 6-digit code sent to +91 {phoneNumber}</p>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isLoading || otp.length < 6}
                      className="w-full bg-soft-ink text-white py-5 rounded-[2.5rem] font-semibold flex items-center justify-center gap-3 transition-all shadow-xl shadow-soft-ink/10"
                    >
                      {isLoading ? 'Verifying...' : 'Validate & Continue'}
                      <CheckCircle2 size={18} />
                    </motion.button>
                  </form>
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
