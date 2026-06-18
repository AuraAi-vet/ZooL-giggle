import React from 'react';
import { motion } from 'motion/react';

interface AnimatedLogoProps {
  variant: 'splash' | 'header' | 'skeleton';
  isSyncing?: boolean;
  className?: string;
}

export default function AnimatedLogo({ variant, isSyncing = false, className = '' }: AnimatedLogoProps) {
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div
      className={`relative flex items-center justify-center font-display font-bold text-xl tracking-tighter ${className}`}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      <motion.span variants={item} className="text-[#3B82F6]">Z</motion.span>
      <motion.span variants={item} className="text-[#1E293B]">ooL</motion.span>
      
      {/* Fallback Overlay for the Skeleton Loading Variant */}
      {variant === 'skeleton' && (
        <div className="absolute inset-0 bg-slate-200/50 mix-blend-color animate-pulse rounded-lg" />
      )}
    </motion.div>
  );
}
