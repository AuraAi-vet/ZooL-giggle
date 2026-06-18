import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Sparkles } from 'lucide-react';

interface ZooLLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showIcon?: boolean; // Kept for backward compatibility
}

export function ZooLLogo({ className, size = 'md' }: ZooLLogoProps) {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-5xl',
    xl: 'text-7xl',
  };

  const iconSizes = {
    sm: 'w-7 h-7 mr-1.5',
    md: 'w-10 h-10 mr-2.5',
    lg: 'w-16 h-16 mr-3.5',
    xl: 'w-24 h-24 mr-4',
  };

  return (
    <div className={cn("font-brand font-black tracking-tighter flex items-center select-none", sizeClasses[size], className)} title="ZooL">
      <span className="sr-only">ZooL</span>
      
      {/* Infinite Care Vector Logo (Paw Print + Infinity Loop in Navy, Teal, and Soft Sand) */}
      <motion.svg
        className={cn("shrink-0 drop-shadow-sm", iconSizes[size])}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Soft Sand & Vet Green Accent Background Circle */}
        <circle cx="50" cy="51" r="43" fill="#2E8B57" fillOpacity="0.1" />
        <circle cx="50" cy="51" r="43" stroke="#34b5c7" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.3" />
        
        {/* Animated Infinity Loop (Horizontal Care Flow) in Navy and Teal */}
        <motion.path
          d="M 50 56 C 65 37, 86 38, 86 58 C 86 76, 65 75, 50 56 C 35 75, 14 76, 14 58 C 14 38, 35 37, 50 56 Z"
          stroke="#0B1424"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ strokeWidth: [7, 7.5, 7] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Teal Inner Stream representing Clinical Focus & Fluid Precision */}
        <motion.path
          d="M 50 56 C 65 37, 86 38, 86 58 C 86 76, 65 75, 50 56"
          stroke="#34b5c7"
          strokeWidth="3"
          strokeLinecap="round"
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Paw Toe Pads: four clean modern geometric circles arching gracefully above the loop */}
        {/* Outer Left: Teal */}
        <motion.circle 
          cx="24" cy="33" r="6" 
          fill="#34b5c7"
          whileHover={{ scale: 1.2 }}
        />
        {/* Inner Left: Deep Navy */}
        <motion.circle 
          cx="40" cy="24" r="8" 
          fill="#0B1424"
          whileHover={{ scale: 1.2 }}
        />
        {/* Inner Right: Vibrant Teal/Navy Dual Accent */}
        <motion.circle 
          cx="60" cy="24" r="8" 
          fill="#0B1424"
          whileHover={{ scale: 1.2 }}
        />
        {/* Outer Right: Teal Accent */}
        <motion.circle 
          cx="76" cy="33" r="6" 
          fill="#34b5c7"
          whileHover={{ scale: 1.2 }}
        />

        {/* Dynamic Center Sparkle: Pulse Pink Accent */}
        <motion.path
          d="M 50 49 L 52 53 L 56 55 L 52 57 L 50 61 L 48 57 L 44 55 L 48 53 Z"
          fill="#eb99d3"
          animate={{ scale: [0.9, 1.15, 0.9], opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.svg>

      <div aria-hidden="true" className="relative flex items-end justify-center leading-none px-1">
        <span className="text-ruru-navy z-10 relative drop-shadow-sm pb-[0.05em]">Z</span>
        
        {/* First 'o' with Left Ear (Compassion Magenta) */}
        <span className="relative flex items-center justify-center mx-[0.01em] pb-[0.05em]">
          <motion.svg 
            width="0.75em" height="0.75em" viewBox="0 0 24 24" fill="currentColor"
            animate={{ rotate: [0, -15, 0, -5, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
            className="absolute -top-[0.55em] left-0 text-ruru-magenta origin-bottom-right drop-shadow-sm z-20 pointer-events-none"
          >
             {/* Styled Ear Left */}
             <path d="M 4 20 C 4 8, 12 2, 22 6 C 18 12, 14 18, 4 20 Z" />
          </motion.svg>
          <span className="text-ruru-magenta z-10 relative drop-shadow-sm">o</span>
        </span>

        {/* Second 'o' with Right Ear (Synthesizing Teal) */}
        <span className="relative flex items-center justify-center mr-[0.03em] pb-[0.05em]">
          <motion.svg 
            width="0.75em" height="0.75em" viewBox="0 0 24 24" fill="currentColor"
            animate={{ rotate: [0, 15, 0, 5, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5, repeatDelay: 1.5 }}
            className="absolute -top-[0.55em] right-0 text-ruru-teal origin-bottom-left drop-shadow-sm z-20 pointer-events-none"
          >
             {/* Styled Ear Right */}
             <path d="M 20 20 C 20 8, 12 2, 2 6 C 6 12, 10 18, 20 20 Z" />
          </motion.svg>
          <span className="text-ruru-teal z-10 relative drop-shadow-sm">o</span>
        </span>
        
        {/* Animated L that acts fully as the tail */}
        <span className="relative z-10 text-ruru-navy drop-shadow-sm flex items-center" style={{ height: '0.85em', width: '0.7em' }}>
          <motion.svg 
            className="absolute bottom-[0.06em] left-0 overflow-visible pointer-events-none" 
            width="100%" height="100%" viewBox="0 0 40 32" fill="none"
            stroke="currentColor" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round"
          >
            <motion.path 
              d="M 6,2 L 6,28 C 16,28 24,18 32,12"
              animate={{ 
                d: [
                   "M 6,2 L 6,28 C 16,28 24,18 32,12",
                   "M 6,2 L 6,28 C 18,28 30,28 38,20",
                   "M 6,2 L 6,28 C 16,28 24,18 32,12",
                   "M 6,2 L 6,28 C 14,26 14,12 22,8",
                   "M 6,2 L 6,28 C 16,28 24,18 32,12",
                ]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.svg>
        </span>
      </div>
    </div>
  );
}
