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
    sm: 'h-6 w-[60px]',
    md: 'h-10 w-[100px]',
    lg: 'h-16 w-[160px]',
    xl: 'h-24 w-[240px]'
  };

  return (
    <motion.div
      className={`relative flex items-center justify-center font-sans ${sizes[size]} ${className}`}
      style={{ fontFamily: "'Outfit', sans-serif" }}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={item} className="relative flex items-center justify-center">
        {/* ZooL Core Logo SVG */}
        <div className={`relative flex items-center justify-center ${iconSizes[size]}`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 120" className="w-full h-full drop-shadow-md">
            {/* Z */}
            <path d="M 20 30 L 75 30 L 75 42 L 40 80 L 75 80 L 75 92 L 20 92 L 20 80 L 55 42 L 20 42 Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            
            {/* O1 Outer */}
            <circle cx="120" cy="61" r="32" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            {/* O1 Iris */}
            <circle cx="120" cy="61" r="20" fill="url(#greenIris)" />
            <circle cx="120" cy="61" r="8" fill="#020617" />
            <circle cx="124" cy="56" r="3" fill="#ffffff" />
            <circle cx="117" cy="64" r="1.5" fill="#ffffff" />
            {/* Ear 1 */}
            <path d="M 96 40 Q 105 5 115 12 Q 125 18 135 34 Z" fill="currentColor" />

            {/* O2 Outer */}
            <circle cx="190" cy="61" r="32" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            {/* O2 Iris */}
            <circle cx="190" cy="61" r="20" fill="url(#greenIris)" />
            <circle cx="190" cy="61" r="8" fill="#020617" />
            <circle cx="194" cy="56" r="3" fill="#ffffff" />
            <circle cx="187" cy="64" r="1.5" fill="#ffffff" />
            {/* Ear 2 */}
            <path d="M 175 34 Q 185 18 195 12 Q 205 5 214 40 Z" fill="currentColor" />

            {/* Bridge */}
            <rect x="150" y="56" width="10" height="10" fill="currentColor" />

            {/* L */}
            <path d="M 235 30 L 247 30 L 247 80 L 285 80 L 285 92 L 235 92 Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>

            <defs>
              <radialGradient id="greenIris" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="70%" stopColor="#059669" />
                <stop offset="100%" stopColor="#047857" />
              </radialGradient>
            </defs>
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
      
      {/* Fallback Overlay for the Skeleton Loading Variant */}
      {variant === 'skeleton' && (
        <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm animate-pulse rounded-2xl z-20" />
      )}
    </motion.div>
  );
}
