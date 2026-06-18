import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Stethoscope, Store, Shield, Heart } from 'lucide-react';

interface RuRuIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  status?: 'idle' | 'listening' | 'speaking' | 'thinking' | 'alert';
  role?: 'owner' | 'vet' | 'provider' | 'admin' | 'guest';
}

export const RuRuIcon: React.FC<RuRuIconProps> = ({ 
  className, 
  status = 'idle', 
  size = 'md', 
  role = 'guest' 
}) => {
  const isNumberSize = typeof size === 'number';
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const containerSizeClasses = isNumberSize ? '' : sizeMap[size as 'sm' | 'md' | 'lg' | 'xl'];
  const customContainerStyle = isNumberSize ? { width: size, height: size } : undefined;
  
  const roleThemes = {
    owner: {
      bg: 'from-[#FFB703] to-[#FB8500]',
      primary: '#023047',
      accent: '#FFD166',
      icon: <Heart size={14} className="text-white" fill="white" />
    },
    vet: {
      bg: 'from-blue-400 to-blue-600',
      primary: '#0F172A',
      accent: '#38BDF8',
      icon: <Stethoscope size={14} className="text-white" />
    },
    provider: {
      bg: 'from-emerald-400 to-emerald-600',
      primary: '#064E3B',
      accent: '#34D399',
      icon: <Store size={14} className="text-white" />
    },
    admin: {
      bg: 'from-purple-400 to-purple-600',
      primary: '#2E1065',
      accent: '#C084FC',
      icon: <Shield size={14} className="text-white" />
    },
    guest: {
      bg: 'from-[#00ADB5] to-[#FB8500]',
      primary: '#0B1424',
      accent: '#00ADB5',
      icon: null
    }
  };

  const theme = roleThemes[role] || roleThemes.guest;

  const orbVariants = {
    idle: { y: 0, scale: 1 },
    listening: { y: [0, -3, 0], scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 1.5 } },
    speaking: { y: [0, -2, 0], scale: [1, 1.02, 1], transition: { repeat: Infinity, duration: 0.8 } },
    thinking: { rotate: [0, -5, 5, 0], scale: [1, 0.98, 1], transition: { repeat: Infinity, duration: 3 } },
    alert: { scale: [1, 1.08, 1], transition: { repeat: Infinity, duration: 0.8 } }
  };

  const coreVariants = {
    idle: { scale: 1, opacity: 0.8 },
    listening: { scale: [1, 1.4, 1], opacity: [0.8, 1, 0.8], transition: { repeat: Infinity, duration: 1.5 } },
    speaking: { scale: [1, 1.2, 1], opacity: [0.8, 0.9, 0.8], transition: { repeat: Infinity, duration: 0.8 } },
    thinking: { scale: [0.8, 1.1, 0.8], opacity: [0.6, 0.9, 0.6], transition: { repeat: Infinity, duration: 2 } },
    alert: { scale: [1, 1.5, 1], opacity: [0.8, 1, 0.8], transition: { repeat: Infinity, duration: 0.5 } }
  };

  const ringVariants: any = {
    idle: { rotate: 0, opacity: 0.3 },
    listening: { rotate: 360, opacity: 0.8, transition: { repeat: Infinity, duration: 3, ease: 'linear' } },
    speaking: { rotate: 360, opacity: 0.5, transition: { repeat: Infinity, duration: 6, ease: 'linear' } },
    thinking: { rotate: -360, opacity: 0.6, transition: { repeat: Infinity, duration: 4, ease: 'linear' } },
    alert: { rotate: 360, opacity: 1, transition: { repeat: Infinity, duration: 1, ease: 'linear' } }
  };

  return (
    <div 
      className={cn("relative flex items-center justify-center", containerSizeClasses, className)} 
      style={customContainerStyle}
    >
      <motion.div 
        className="relative w-full h-full flex items-center justify-center"
        variants={orbVariants}
        animate={status}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible drop-shadow-2xl">
          <defs>
            <radialGradient id="orbGradient" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#2A3A5A" />
              <stop offset="100%" stopColor={theme.primary} />
            </radialGradient>
            
            <radialGradient id="coreGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={theme.accent} stopOpacity="1" />
              <stop offset="50%" stopColor={theme.accent} stopOpacity="0.5" />
              <stop offset="100%" stopColor={theme.accent} stopOpacity="0" />
            </radialGradient>

            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Abstract Orbital Rings */}
          <motion.circle 
            variants={ringVariants}
            animate={status}
            cx="50" cy="50" r="46" 
            fill="none" 
            stroke={theme.accent} 
            strokeWidth="1" 
            strokeDasharray="4 8"
            style={{ transformOrigin: '50px 50px' }}
          />

          <motion.circle 
            variants={ringVariants}
            animate={status}
            cx="50" cy="50" r="42" 
            fill="none" 
            stroke={theme.accent} 
            strokeWidth="0.5" 
            strokeDasharray="20 10 5 10"
            style={{ transformOrigin: '50px 50px', animationDirection: 'reverse' }}
          />

          {/* Main Body Capsule */}
          <rect 
            x="15" y="15" 
            width="70" height="70" 
            rx="35" 
            fill="url(#orbGradient)" 
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="2"
          />

          {/* Visor Screen */}
          <rect 
            x="25" y="30" 
            width="50" height="30" 
            rx="15" 
            fill="#060A14" 
            className="drop-shadow-inner"
          />
          
          {/* Active AI Core inside visor */}
          <motion.circle 
            variants={coreVariants}
            animate={status}
            cx="50" cy="45" r="12" 
            fill="url(#coreGradient)" 
            filter="url(#glow)"
          />

          {/* Expressive Visor Data Streams / "Eyes" */}
          <g opacity="0.8">
            <rect x="35" y="42" width="6" height="6" rx="3" fill="#FFF" />
            <rect x="59" y="42" width="6" height="6" rx="3" fill="#FFF" />
          </g>

          {/* Glass reflection */}
          <path 
            d="M 18 35 Q 50 15 82 35 C 75 50 25 50 18 35 Z" 
            fill="white" 
            opacity="0.05" 
          />
        </svg>

        {/* Floating status dot */}
        <motion.div 
          animate={{ 
            opacity: [0.5, 1, 0.5],
            boxShadow: `0 0 10px 2px ${theme.accent}`
          }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute -top-1 right-2 w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: theme.accent }}
        />
      </motion.div>

      {/* Role Badge Indicator */}
      {theme.icon && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(
            "absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.3)] border-2 border-white backdrop-blur-md bg-gradient-to-br z-10",
            theme.bg
          )}
        >
          {theme.icon}
        </motion.div>
      )}
    </div>
  );
};
