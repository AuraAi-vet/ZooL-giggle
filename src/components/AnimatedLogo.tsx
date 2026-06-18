import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface AnimatedLogoProps {
  variant?: 'splash' | 'header' | 'skeleton';
  isSyncing?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function AnimatedLogo({ variant = 'header', isSyncing = false, className = '', size = 'md' }: AnimatedLogoProps) {
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const item: any = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  const sizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-6xl'
  };
  
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <motion.div
      className={`relative flex items-center justify-center font-sans ${sizes[size]} ${className}`}
      style={{ fontFamily: "'Outfit', sans-serif" }}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={item} className="relative flex items-center justify-center mr-3">
        {/* ZooL Core Logo SVG */}
        <div className={`relative flex shadow-xl shadow-cyan-900/10 rounded-xl md:rounded-2xl lg:rounded-3xl overflow-hidden ${iconSizes[size]}`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-full h-full">
            <rect width="100" height="100" fill="#0B132B" rx="20"/>
            <g fill="none" stroke="#06B6D4" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 50 25 L 75 50 L 50 75 L 25 50 Z" fill="#1C2B4B" />
              <path d="M 50 35 L 65 50 L 50 65 L 35 50 Z" fill="#06B6D4" opacity="0.8" />
              <circle cx="50" cy="50" r="10" fill="#FFFFFF" stroke="none" />
              <circle cx="43" cy="46" r="2.5" fill="#0B132B" stroke="none" />
              <circle cx="57" cy="46" r="2.5" fill="#0B132B" stroke="none" />
              <path d="M 48 53 Q 50 56 52 53" stroke="#0B132B" strokeWidth="2" fill="none" />
            </g>
          </svg>
          <motion.div 
             animate={isSyncing ? { rotate: 360 } : { rotate: 0 }}
             transition={isSyncing ? { repeat: Infinity, duration: 2, ease: "linear" } : {}}
             className="absolute top-1 right-1 p-1 opacity-80"
           >
              <Sparkles className={`text-cyan-300 ${size === 'xl' ? 'w-6 h-6' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'}`} />
           </motion.div>
        </div>
      </motion.div>
      <motion.span variants={item} className="font-bold tracking-tight text-slate-800 dark:text-white">ZooL</motion.span>
      <motion.span variants={item} className="font-light tracking-tight text-cyan-600 dark:text-cyan-400">Vet</motion.span>
      
      {/* Fallback Overlay for the Skeleton Loading Variant */}
      {variant === 'skeleton' && (
        <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm animate-pulse rounded-2xl z-20" />
      )}
    </motion.div>
  );
}
