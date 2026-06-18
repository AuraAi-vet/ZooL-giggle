import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes total session time for testing
const WARNING_THRESHOLD_MS = 60 * 1000; // 60 seconds warning

export default function SessionTimerOverlay() {
  const { user } = useAppStore();
  const [remainingTime, setRemainingTime] = useState<number>(IDLE_TIMEOUT_MS);
  const [showWarning, setShowWarning] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = () => {
    lastActivityRef.current = Date.now();
    setRemainingTime(IDLE_TIMEOUT_MS);
    setShowWarning(false);
  };

  useEffect(() => {
    if (!user) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    // Update last activity on interaction, but throttle to avoid performance issues
    const handleActivity = () => {
      // Only reset if we are NOT currently in warning state.
      // If warning is shown, the user must explicitly click "Extend Session" to reset.
      if (!showWarning) {
        lastActivityRef.current = Date.now();
      }
    };

    window.addEventListener('mousemove', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });
    window.addEventListener('click', handleActivity, { passive: true });
    window.addEventListener('scroll', handleActivity, { passive: true });

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = Math.max(0, IDLE_TIMEOUT_MS - elapsed);
      setRemainingTime(remaining);

      if (remaining <= WARNING_THRESHOLD_MS && remaining > 0) {
        setShowWarning(true);
      } else if (remaining === 0) {
        // Auto-logout user
        useAppStore.getState().setAuth(null, null);
        window.location.reload();
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [user, showWarning]);

  if (!showWarning || !user) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] max-w-md w-full px-4"
      >
        <div className="bg-amber-500 text-white shadow-2xl rounded-2xl p-4 flex items-center justify-between overflow-hidden relative border border-amber-600/50">
          <div className="absolute top-0 left-0 h-1 bg-amber-300 w-full">
             <div 
               className="h-full bg-rose-500 transition-all duration-1000 ease-linear" 
               style={{ width: `${(remainingTime / WARNING_THRESHOLD_MS) * 100}%` }}
             ></div>
          </div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-white/20 p-2 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold">Session Expiring Soon</p>
              <p className="text-sm text-amber-50 font-medium">
                For your security, you will be automatically logged out in <b>{Math.ceil(remainingTime / 1000)}</b> seconds.
              </p>
            </div>
          </div>
          
          <button 
            onClick={resetTimer}
            className="flex-shrink-0 bg-slate-900 border border-slate-800 text-white font-bold text-sm px-4 py-2 rounded-xl hover:bg-slate-800 active:scale-95 transition-all shadow-lg flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Extend
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
