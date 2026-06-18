import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface EdgeTriggerProps {
  side: 'left' | 'right';
  icon: React.ReactNode;
  children: React.ReactNode;
  label?: string;
  className?: string;
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
}

export const EdgeTrigger: React.FC<EdgeTriggerProps> = ({ 
  side, 
  icon, 
  children, 
  label, 
  className,
  isOpen,
  onToggle
}) => {
  return (
    <div className={cn(
      "fixed top-1/2 -translate-y-1/2 z-[100] transition-all duration-500",
      side === 'left' ? "left-0" : "right-0",
      className
    )}>
      <div className="relative flex items-center">
        {/* The Handle / Trigger - Responsive sizing */}
        <motion.button
          drag="y"
          dragConstraints={{ top: -window.innerHeight / 2 + 50, bottom: window.innerHeight / 2 - 50 }}
          dragMomentum={false}
          onClick={() => onToggle(!isOpen)}
          whileHover={{ scale: 1.05, x: side === 'left' ? 4 : -4 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "w-8 h-20 sm:w-12 sm:h-24 bg-[#1A1A1A]/90 backdrop-blur-2xl border border-white/10 flex flex-col items-center justify-center gap-1.5 shadow-[0_15px_35px_rgba(0,0,0,0.3)] transition-all duration-500 overflow-visible",
            side === 'left' 
              ? "rounded-r-[1.5rem] sm:rounded-r-3xl" 
              : "rounded-l-[1.5rem] sm:rounded-l-3xl",
            isOpen && (side === 'left' ? "translate-x-[-120%]" : "translate-x-[120%]")
          )}
        >
          <div className="text-white scale-90 sm:scale-100 drop-shadow-md">
            {icon}
          </div>
          <div className="text-white/20">
            {side === 'left' ? <ChevronRight size={10} className="sm:size-12" /> : <ChevronLeft size={10} className="sm:size-12" />}
          </div>
          {label && !isOpen && (
            <div className={cn(
              "absolute whitespace-nowrap text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-[0.4em] pointer-events-none",
              side === 'left' ? "left-10 sm:left-14 origin-left" : "right-10 sm:right-14 origin-right",
              "[writing-mode:vertical-lr] rotate-180"
            )}>
              {label}
            </div>
          )}
        </motion.button>

        {/* The Content Overlay/Panel - Responsive sizing and alignment */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, x: side === 'left' ? -100 : 100, scale: 0.9, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: side === 'left' ? -100 : 100, scale: 0.9, filter: 'blur(10px)' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={cn(
                "fixed top-1/2 -translate-y-1/2 bg-white/98 backdrop-blur-3xl rounded-[2.5rem] p-6 sm:p-10 shadow-[0_35px_80px_rgba(0,0,0,0.25)] border border-ruru-navy/10 z-[110] transition-all",
                "w-[calc(100vw-2.5rem)] max-w-[380px] sm:w-[400px]",
                side === 'left' ? "left-5 sm:left-8" : "right-5 sm:right-8"
              )}
            >
              <button 
                onClick={() => onToggle(false)}
                className="absolute top-4 right-4 p-2.5 hover:bg-[#F5F5F0] rounded-full transition-colors text-ruru-navy/60"
              >
                <X size={18} />
              </button>
              <div className="mt-2">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
