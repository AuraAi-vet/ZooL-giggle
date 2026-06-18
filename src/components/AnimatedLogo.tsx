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
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
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
      style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={item} className="relative flex items-center justify-center mr-3">
        {/* Core Logo SVG */}
        <div className={`relative flex shadow-sm rounded-xl md:rounded-2xl lg:rounded-3xl overflow-hidden ${iconSizes[size]}`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-full h-full">
            <rect width="100" height="100" fill="#FAF8F5" rx="16"/>
            <g fill="none" stroke="#0B5A5C" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 35 20 H 65 V 35 H 80 V 65 H 65 V 80 H 35 V 65 H 20 V 35 H 35 Z" />
              <circle cx="50" cy="53" r="7" fill="#E06D53" stroke="none" />
              <circle cx="41" cy="40" r="3" fill="#0B5A5C" stroke="none" />
              <circle cx="50" cy="34" r="3" fill="#0B5A5C" stroke="none" />
              <circle cx="59" cy="40" r="3" fill="#0B5A5C" stroke="none" />
            </g>
          </svg>
          <motion.div 
             animate={isSyncing ? { rotate: 360 } : { rotate: 0 }}
             transition={isSyncing ? { repeat: Infinity, duration: 2, ease: "linear" } : {}}
             className="absolute top-1 right-1 p-1 opacity-80"
           >
              <Sparkles className={`text-[#E06D53] ${size === 'xl' ? 'w-6 h-6' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'}`} />
           </motion.div>
        </div>
      </motion.div>
      <motion.span variants={item} className="font-bold text-[#0B5A5C]">Z</motion.span>
      <motion.span variants={item} className="font-medium text-[#0B5A5C] tracking-[-0.02em]">oo</motion.span>
      <motion.span variants={item} className="font-bold text-[#0B5A5C]">L</motion.span>
      
      {/* Fallback Overlay for the Skeleton Loading Variant */}
      {variant === 'skeleton' && (
        <div className="absolute inset-0 bg-[#FAF8F5]/60 backdrop-blur-sm animate-pulse rounded-2xl z-20" />
      )}
    </motion.div>
  );
}
