import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface ZooLLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showIcon?: boolean;
  showText?: boolean;
}

export function ZooLLogo({ className, size = 'md', showIcon = true, showText = true }: ZooLLogoProps) {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-5xl',
    xl: 'text-[5.5rem]',
  };

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <div 
      className={cn("font-display flex items-center select-none", className)} 
      title="ZooL"
      id="zool-logo-container"
    >
      {showIcon && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "mr-4 flex items-center justify-center rounded-3xl bg-gradient-to-tr from-[#0B1424] to-[#1A263B] shadow-[0_8px_30px_rgb(11,20,36,0.15)] relative group/logo",
            iconSizes[size]
          )}
        >
          {/* Subtle elegant border */}
          <div className="absolute inset-0 rounded-3xl border border-white/5 opacity-100 group-hover/logo:border-white/20 transition-colors duration-500 box-border" />
          
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[60%] h-[60%] text-[#C5A572]">
            {/* Elegant Continuous Line / Abstract Infinity & Shield */}
            <motion.path 
              d="M 50 15 C 75 15, 85 30, 85 50 C 85 75, 50 85, 50 85 C 50 85, 15 75, 15 50 C 15 30, 25 15, 50 15 Z" 
              stroke="url(#goldGradient)" 
              strokeWidth="6" 
              strokeLinecap="round" 
              className="drop-shadow-sm"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
            
            {/* Abstract Inner 'Z' / Lifeline representing Veterinary Precision */}
            <motion.path 
              d="M 35 40 L 65 40 L 35 60 L 65 60" 
              stroke="white" 
              strokeWidth="5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.9, scale: 1 }}
              transition={{ delay: 1, duration: 1 }}
            />

            <defs>
              <linearGradient id="goldGradient" x1="15" y1="15" x2="85" y2="85" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#E2C792" />
                <stop offset="50%" stopColor="#C5A572" />
                <stop offset="100%" stopColor="#9C7E4A" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
      )}
      
      {showText && (
        <div className={cn("relative flex items-center tracking-tight select-none pb-1", sizeClasses[size])}>
          <div className="flex items-center font-brand font-medium">
            {['Z', 'o', 'o', 'L'].map((char, index) => {
              const isLast = index === 3;
              const isO = char === 'o';

              if (isO) {
                return (
                  <motion.div
                    key={index}
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 150, delay: index * 0.1 }}
                    whileHover={{ scale: 1.15 }}
                    className={cn(
                      "inline-flex items-center justify-center relative -mx-[0.02em]",
                    )}
                  >
                    <span className="text-[#0B1424] opacity-90 transition-opacity duration-300">
                      o
                    </span>
                    {/* Modern medical/tech cross inside 'o' on hover context */}
                    <motion.div 
                      className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                      initial={{ scale: 0 }}
                      whileHover={{ scale: 1 }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-[#C5A572]" />
                    </motion.div>
                  </motion.div>
                );
              }

              return (
                <motion.span
                  key={index}
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ 
                    y: 0, 
                    opacity: 1,
                  }}
                  transition={{ 
                    type: 'spring', stiffness: 150, delay: index * 0.1
                  }}
                  whileHover={{ 
                    scale: 1.05, 
                    color: isLast ? "#0B1424" : "#C5A572",
                  }}
                  className={cn(
                    "inline-block tracking-tighter transition-colors duration-300 relative",
                    isLast ? "text-[#C5A572] italic font-black pl-1" : "text-[#0B1424] font-extrabold pr-1",
                  )}
                >
                  {char}
                  {isLast && (
                    <motion.div 
                      className="absolute -right-2 top-0 w-1.5 h-1.5 rounded-full bg-[#C5A572]"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </motion.span>
              );
            })}
          </div>
          
          {/* Refined clinical underline */}
          <motion.div 
            className="absolute bottom-1 left-0 right-[-8px] h-[3px] rounded-full bg-[#0B1424]/10 overflow-hidden"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
          >
            <motion.div 
              className="w-1/3 h-full bg-[#C5A572] rounded-full"
              animate={{ x: ['-100%', '350%'] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
}
