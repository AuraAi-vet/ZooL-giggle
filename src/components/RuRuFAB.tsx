import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, animate } from 'motion/react';
import { RuRuIcon } from './RuRuIcon';
import { X, MessageSquare, Shield, HelpCircle, Zap, Activity, Mic } from 'lucide-react';
import { cn } from '../lib/utils';

interface RuRuFABProps {
  onOpenAI: () => void;
  onNavigate: (tab: any) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  role?: 'owner' | 'vet' | 'provider' | 'admin' | 'guest';
}

export const RuRuFAB: React.FC<RuRuFABProps> = ({ onOpenAI, onNavigate, isOpen, setIsOpen, role = 'guest' }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dockedSide, setDockedSide] = useState<'left' | 'right' | 'top' | 'bottom'>('right');
  const fabRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const snapToEdge = () => {
    if (!fabRef.current) return;
    const rect = fabRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Account for safe area / padding
    const safePadding = 32;
    const distLeft = rect.left;
    const distRight = viewportWidth - rect.right;
    const distTop = rect.top;
    const distBottom = viewportHeight - rect.bottom;

    const minDist = Math.min(distLeft, distRight, distTop, distBottom);
    
    let targetX = x.get();
    let targetY = y.get();

    if (minDist === distLeft) {
      targetX = x.get() - distLeft + safePadding;
      setDockedSide('left');
    } else if (minDist === distRight) {
      targetX = x.get() + distRight - safePadding;
      setDockedSide('right');
    } else if (minDist === distTop) {
      targetY = y.get() - distTop + safePadding;
      setDockedSide('top');
    } else {
      targetY = y.get() + distBottom - safePadding;
      setDockedSide('bottom');
    }

    animate(x, targetX, { 
        type: 'spring', 
        stiffness: 500, 
        damping: 35,
        mass: 0.5 
    });
    animate(y, targetY, { 
        type: 'spring', 
        stiffness: 500, 
        damping: 35,
        mass: 0.5 
    });
  };

  const [constraints, setConstraints] = useState({ left: 0, right: 0, top: 0, bottom: 0 });

  useEffect(() => {
    const updateConstraints = () => {
      const padding = 24;
      const fabSize = 80; // Approximate size with padding/glow
      setConstraints({
        left: -window.innerWidth + (fabSize + padding),
        right: 0,
        top: -window.innerHeight + (fabSize + padding),
        bottom: 0
      });
    };
    updateConstraints();
    window.addEventListener('resize', updateConstraints);
    return () => window.removeEventListener('resize', updateConstraints);
  }, []);

  const [currentThought, setCurrentThought] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'listening' | 'speaking' | 'thinking' | 'alert'>('listening');

  useEffect(() => {
    if (isDragging) {
      setStatus('alert');
    } else if (showOptions) {
      setStatus('thinking');
    } else if (isOpen) {
      setStatus('speaking');
    } else {
      setStatus('listening');
      const interval = setInterval(() => {
        setStatus(prev => prev === 'listening' ? 'idle' : 'listening');
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [isDragging, showOptions, isOpen]);

  const getThoughts = () => {
    switch (role) {
      case 'vet': return ["Clinic OS ready.", "Scanning lab nodes...", "Ready to scribe.", "Records indexed.", "Patient queue optimized."];
      case 'provider': return ["Inventory analysis active.", "Tracking market trends.", "Ready for bulk orders.", "Customer flow steady.", "Scanning local demand."];
      case 'admin': return ["Security protocols active.", "Monitoring system health.", "Data integrity verified.", "Compliance checks passing.", "Network stable."];
      default: return ["Meow-intelligence ready!", "Health data synced.", "Need help, friend?", "Scanning for treats...", "I'm always learning!", "Ready to scan!"];
    }
  };

  useEffect(() => {
    if (!isOpen && !showOptions) {
      const interval = setInterval(() => {
        if (Math.random() > 0.7) {
          const thoughts = getThoughts();
          setCurrentThought(thoughts[Math.floor(Math.random() * thoughts.length)]);
          setTimeout(() => setCurrentThought(null), 3000);
        }
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [isOpen, showOptions, role]);

  const getQuickActions = () => {
    switch (role) {
      case 'vet':
        return [
          { icon: <Mic size={18} />, label: 'RuRu Voice Scribe', color: 'bg-blue-600', action: () => setIsOpen(true) },
          { icon: <MessageSquare size={18} />, label: 'Clinical Chat', color: 'bg-ruru-navy', action: onOpenAI },
          { icon: <Activity size={18} />, label: 'Diagnostic Triage', color: 'bg-emerald-500', action: () => onNavigate('vet') },
          { icon: <Shield size={18} />, label: 'Provider Training', color: 'bg-purple-600', action: () => onNavigate('training') },
          { icon: <HelpCircle size={18} />, label: 'Vet Support', color: 'bg-slate-700', action: () => onNavigate('settings') },
        ];
      case 'provider':
        return [
          { icon: <Mic size={18} />, label: 'Voice Assistant', color: 'bg-emerald-600', action: () => setIsOpen(true) },
          { icon: <MessageSquare size={18} />, label: 'Inventory AI', color: 'bg-ruru-navy', action: onOpenAI },
          { icon: <Zap size={18} />, label: 'Market Trends', color: 'bg-amber-500', action: () => onNavigate('practice') },
          { icon: <Shield size={18} />, label: 'Business Mod & Training', color: 'bg-purple-600', action: () => onNavigate('training') },
          { icon: <HelpCircle size={18} />, label: 'Vendor Support', color: 'bg-slate-700', action: () => onNavigate('settings') },
        ];
      case 'admin':
        return [
          { icon: <Mic size={18} />, label: 'Admin Voice Command', color: 'bg-purple-600', action: () => setIsOpen(true) },
          { icon: <MessageSquare size={18} />, label: 'System Analytics Auth', color: 'bg-ruru-navy', action: onOpenAI },
          { icon: <Shield size={18} />, label: 'Compliance Hub', color: 'bg-red-500', action: () => onNavigate('admin') },
        ];
      default:
        return [
          { icon: <Mic size={18} />, label: 'RuRu Live Voice', color: 'bg-ruru-teal', action: () => setIsOpen(true) },
          { icon: <MessageSquare size={18} />, label: 'Deep Chat', color: 'bg-ruru-navy', action: onOpenAI },
          { icon: <Activity size={18} />, label: 'Symptom Triage', color: 'bg-ruru-pink', action: () => onNavigate('symptoms') },
          { icon: <Shield size={18} />, label: 'Government Hub', color: 'bg-ruru-magenta', action: () => onNavigate('gov') },
          { icon: <Zap size={18} />, label: 'Pet Training Upgrades', color: 'bg-ruru-blue', action: () => onNavigate('training') },
          { icon: <HelpCircle size={18} />, label: 'Support & SOS', color: 'bg-ruru-purple', action: () => onNavigate('settings') },
        ];
    }
  };

  const quickActions = getQuickActions();

  return (
    <motion.div
      ref={fabRef}
      style={{ x, y }}
      className="fixed bottom-32 right-6 z-[9999] flex items-center cursor-grab active:cursor-grabbing"
      drag
      dragConstraints={constraints}
      dragElastic={0.05}
      dragMomentum={false}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => {
        setIsDragging(false);
        snapToEdge();
      }}
      whileDrag={{ scale: 1.15, boxShadow: "0px 15px 30px rgba(0, 0, 0, 0.4)" }}
    >
      <AnimatePresence>
        {currentThought && !showOptions && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.5 }}
            animate={{ opacity: 1, y: -60, scale: 1 }}
            exit={{ opacity: 0, y: -80, scale: 0.5 }}
            className="absolute bottom-16 right-0 bg-white/95 backdrop-blur-xl px-4 py-2 rounded-2xl rounded-br-none shadow-xl border border-ruru-teal/30 text-[10px] font-black text-ruru-navy uppercase tracking-widest whitespace-nowrap z-0 pointer-events-none"
          >
            {currentThought}
            <div className="absolute bottom-[-8px] right-2 w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-white/95 border-r-[4px] border-r-transparent" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showOptions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)', y: dockedSide === 'top' ? -20 : 20 }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', y: 0 }}
            exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)', y: dockedSide === 'top' ? -20 : 20 }}
            transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
            className={cn(
              "absolute flex flex-col gap-4 min-w-[200px] max-h-[70vh] p-4 transition-all duration-300 pointer-events-none",
              dockedSide === 'right' && "bottom-24 right-0 items-end",
              dockedSide === 'left' && "bottom-24 left-0 items-start",
              dockedSide === 'top' && "top-24 right-0 items-end",
              dockedSide === 'bottom' && "bottom-24 right-0 items-end"
            )}
          >
            {quickActions.map((action, idx) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, x: dockedSide === 'left' ? -20 : 20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: idx * 0.05, type: 'spring', stiffness: 400, damping: 25 }}
                whileHover={{ scale: 1.12, x: dockedSide === 'left' ? 12 : -12 }}
                whileTap={{ scale: 0.92, filter: 'brightness(1.2)' }}
                onClick={() => {
                  action.action();
                  setShowOptions(false);
                }}
                className={cn(
                  "flex items-center gap-4 group relative pointer-events-auto",
                  dockedSide === 'left' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className="bg-ruru-navy/90 backdrop-blur-md text-white text-[10px] px-4 py-2.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 font-bold uppercase tracking-[0.1em] shadow-2xl border border-white/20 whitespace-nowrap hidden sm:block scale-90 group-hover:scale-100 origin-right">
                  {action.label}
                </div>
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl border-2 border-white/20 text-white backdrop-blur-xl transition-all duration-300 relative z-10 overflow-hidden",
                  action.color,
                  "group-hover:shadow-[0_0_30px_rgba(52,181,199,0.5)] group-hover:border-white/60 group-active:scale-90"
                )}>
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                  {React.cloneElement(action.icon as React.ReactElement<any>, { size: 22, className: "relative z-10" })}
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowOptions(!showOptions)}
        className={cn("relative group pr-4 transition-transform z-50", isDragging && "scale-110")}
        aria-label="RuRu Assistant Menu"
        aria-expanded={showOptions}
      >
        {/* Holographic Glowing Ring Layers behind RuRu */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-ruru-teal to-ruru-magenta opacity-20 blur-2xl group-hover:opacity-40 transition-opacity duration-500 pointer-events-none" />
        
        {/* Dynamic active glow overlay based on state */}
        <div className={cn(
          "absolute -inset-1 rounded-full blur-xl opacity-40 group-hover:opacity-75 transition-all duration-500 pointer-events-none",
          status === 'listening' && "bg-ruru-teal shadow-[0_0_30px_#34b5c7]",
          status === 'thinking' && "bg-ruru-magenta shadow-[0_0_30px_#a150a0]",
          status === 'speaking' && "bg-emerald-400 shadow-[0_0_30px_#10b981]",
          status === 'alert' && "bg-red-500 shadow-[0_0_30px_#ef4444]",
          status === 'idle' && "bg-slate-400 shadow-[0_0_20px_#94a3b8]"
        )} />
        
        {/* Active ripple ring animation */}
        {status !== 'idle' && (
          <motion.div
            className="absolute inset-0 rounded-full border border-white/20 pointer-events-none"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.6, 0, 0.6]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}

        {/* Floating Sparkles (Teal and Magenta key animations) */}
        {status !== 'idle' && [
          { id: 1, size: 6, delay: 0, x: -22, y: -22 },
          { id: 2, size: 8, delay: 0.4, x: 26, y: -26 },
          { id: 3, size: 5, delay: 0.8, x: -28, y: 12 },
          { id: 4, size: 7, delay: 1.2, x: 22, y: 22 },
        ].map((sparkle) => (
          <motion.div
            key={sparkle.id}
            className="absolute rounded-full bg-gradient-to-tr from-ruru-teal to-ruru-magenta opacity-80 blur-[0.5px]"
            style={{
              width: sparkle.size,
              height: sparkle.size,
              left: `calc(50% + ${sparkle.x}px)`,
              top: `calc(50% + ${sparkle.y}px)`,
              zIndex: -1
            }}
            animate={{
              y: [0, -15, 0],
              x: [0, 6, 0],
              scale: [0.7, 1.3, 0.7],
              opacity: [0.2, 0.9, 0.2],
            }}
            transition={{
              duration: 2.5,
              delay: sparkle.delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}

        <div className="relative">
          <RuRuIcon 
            size={64} 
            role={role} 
            status={status} 
            className="transition-shadow duration-700 rounded-full bg-ruru-navy-light pt-1.5 shadow-2xl" 
          />
          
          <AnimatePresence>
            {showOptions && (
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 90 }}
                className="absolute -top-1 -right-1 bg-white/95 backdrop-blur-3xl rounded-full p-1.5 shadow-lg border border-ruru-navy/10 z-10"
              >
                <X size={14} className="text-ruru-navy font-bold" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.button>
    </motion.div>
  );
};
