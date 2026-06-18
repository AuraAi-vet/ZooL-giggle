import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface ZooLLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showIcon?: boolean; // Re-interpreted as showing our high-fidelity custom brand mark
  showText?: boolean;
}

export function ZooLLogo({ className, size = 'md', showIcon = true, showText = true }: ZooLLogoProps) {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-5xl',
    xl: 'text-7xl',
  };

  const accentSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  return (
    <div 
      className={cn("font-brand font-black tracking-tighter flex items-center select-none", className)} 
      title="ZooL"
      id="zool-logo-container"
    >
      {showIcon && (
        <motion.div
          initial={{ rotate: -15, scale: 0.8, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn(
            "mr-3 flex items-center justify-center rounded-[28%] bg-gradient-to-tr from-[#00ADB5] via-[#00E5FF] to-[#0B192C] shadow-lg shadow-[#00ADB5]/30 p-1 relative overflow-hidden group/logo",
            accentSizes[size]
          )}
        >
          {/* Subtle flare effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-bl from-white/20 to-transparent opacity-0 group-hover/logo:opacity-100 transition-opacity duration-500" />
          
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[70%] h-[70%] text-white drop-shadow-md">
            {/* Tech polygon lines representing stylized diagnostic ears */}
            <path 
              d="M25 45L40 22L50 35L60 22L75 45" 
              stroke="white" 
              strokeWidth="6" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="opacity-95"
            />
            {/* Tech Nodes/Joint representing connected care grid */}
            <circle cx="40" cy="22" r="5" fill="#FF758F" />
            <circle cx="60" cy="22" r="5" fill="#FF758F" />
            <circle cx="50" cy="35" r="5" fill="#00E5FF" />
            
            {/* Central geometric pet nose/heart pad */}
            <path 
              d="M50 48L36 62H64L50 48Z" 
              fill="white" 
              className="opacity-95"
            />
            
            {/* Warm pet smile line */}
            <path 
              d="M38 72C42 76 58 76 62 72" 
              stroke="white" 
              strokeWidth="5" 
              strokeLinecap="round" 
              className="opacity-80"
            />
            
            {/* Continuous health tracking digital orbit ring */}
            <circle 
              cx="50" 
              cy="50" 
              r="43" 
              stroke="white" 
              strokeWidth="3" 
              strokeDasharray="8 8" 
              className="opacity-30" 
            />
          </svg>
        </motion.div>
      )}
      
      {showText && (
        <div className={cn("relative flex items-baseline tracking-tight font-black", sizeClasses[size])}>
          <motion.span 
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-current font-black font-brand tracking-tighter"
          >
            Zoo
          </motion.span>
          <motion.span 
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-[#00ADB5] font-black font-brand tracking-tighter"
          >
            L
          </motion.span>
        </div>
      )}
    </div>
  );
}
