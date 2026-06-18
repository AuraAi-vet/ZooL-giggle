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
  
  // Theme colors based on role
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
      accent: '#93C5FD',
      icon: <Stethoscope size={14} className="text-white" />
    },
    provider: {
      bg: 'from-emerald-400 to-emerald-600',
      primary: '#064E3B',
      accent: '#6EE7B7',
      icon: <Store size={14} className="text-white" />
    },
    admin: {
      bg: 'from-purple-400 to-purple-600',
      primary: '#2E1065',
      accent: '#D8B4FE',
      icon: <Shield size={14} className="text-white" />
    },
    guest: {
      bg: 'from-ruru-teal to-blue-500',
      primary: '#1A1816',
      accent: '#81C7D4',
      icon: null
    }
  };

  const theme = roleThemes[role] || roleThemes.guest;

  // Animation Variants for robotic cat-owl traits
  const headVariants = {
    idle: { y: 0 },
    listening: { y: [0, -4, 0], transition: { repeat: Infinity, duration: 1.5 } },
    speaking: { y: [0, -2, 0], transition: { repeat: Infinity, duration: 0.8 } },
    thinking: { rotate: [0, -5, 5, 0], transition: { repeat: Infinity, duration: 3 } },
    alert: { scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 1 } }
  };

  const earLVariants = {
    idle: { rotate: -15 },
    listening: { rotate: [-15, -25, -15], transition: { repeat: Infinity, duration: 1.5 } },
    speaking: { rotate: -10 },
    thinking: { rotate: [-15, -30, -15], transition: { repeat: Infinity, duration: 3 } },
    alert: { rotate: -30 }
  };

  const earRVariants = {
    idle: { rotate: 15 },
    listening: { rotate: [15, 25, 15], transition: { repeat: Infinity, duration: 1.5 } },
    speaking: { rotate: 10 },
    thinking: { rotate: [15, 5, 15], transition: { repeat: Infinity, duration: 3 } },
    alert: { rotate: 30 }
  };

  const eyeVariants = {
    idle: { scaleY: 1, scaleX: 1, transition: { duration: 0.2 } },
    listening: { scaleY: [1, 0.4, 1], scaleX: [1, 1.1, 1], transition: { repeat: Infinity, duration: 3, times: [0, 0.1, 1] } },
    speaking: { scaleY: [1, 0.6, 1, 0.6, 1], transition: { repeat: Infinity, duration: 2 } },
    thinking: { scaleY: 0.8, scaleX: 0.9, transition: { duration: 0.3 } },
    alert: { scaleY: 1.2, scaleX: 1.2, transition: { duration: 0.1 } }
  };

  const mouthVariants = {
    idle: { d: "M 42 65 Q 50 72 58 65" },
    listening: { d: "M 45 65 Q 50 67 55 65" },
    speaking: { d: "M 42 65 Q 50 75 58 65" },
    thinking: { d: "M 45 65 Q 50 63 55 65" },
    alert: { d: "M 45 68 Q 50 65 55 68" }
  };

  return (
    <div 
      className={cn("relative flex items-center justify-center", containerSizeClasses, className)} 
      style={customContainerStyle}
    >
      <motion.div 
        className="relative w-full h-full drop-shadow-xl"
        variants={headVariants}
        animate={status}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          {/* Base shadow for 3D effect */}
          <rect x="15" y="25" width="70" height="60" rx="30" fill="rgba(0,0,0,0.15)" className="translate-y-2 blur-sm" />
          
          {/* Ears */}
          <motion.path 
            variants={earLVariants} 
            animate={status}
            style={{ transformOrigin: "30px 40px" }}
            d="M 15 45 L 25 10 Q 30 5 35 15 L 45 35 Z" 
            fill="white" 
            className="drop-shadow-sm" 
          />
          <motion.path 
            variants={earRVariants} 
            animate={status}
            style={{ transformOrigin: "70px 40px" }}
            d="M 85 45 L 75 10 Q 70 5 65 15 L 55 35 Z" 
            fill="white" 
            className="drop-shadow-sm" 
          />
          
          {/* Ear Inner Accents */}
          <motion.path 
            variants={earLVariants} 
            animate={status}
            style={{ transformOrigin: "30px 40px" }}
            d="M 23 40 L 28 20 L 37 35 Z" 
            fill={theme.primary} 
            opacity={0.6}
          />
          <motion.path 
            variants={earRVariants} 
            animate={status}
            style={{ transformOrigin: "70px 40px" }}
            d="M 77 40 L 72 20 L 63 35 Z" 
            fill={theme.primary} 
            opacity={0.6}
          />

          {/* Main Squircle Head */}
          <rect x="15" y="25" width="70" height="60" rx="30" fill="url(#headGradient)" />
          
          {/* Visor / Face Plate */}
          <rect x="22" y="32" width="56" height="46" rx="23" fill={theme.primary} />
          <rect x="22" y="32" width="56" height="46" rx="23" fill="rgba(255,255,255,0.1)" />

          {/* Eyes inside visor */}
          <motion.rect 
            variants={eyeVariants} 
            animate={status}
            style={{ transformOrigin: "35px 45px" }}
            x="28" y="42" width="14" height="10" rx="5" fill="white" 
          />
          <motion.rect 
            variants={eyeVariants} 
            animate={status}
            style={{ transformOrigin: "65px 45px" }}
            x="58" y="42" width="14" height="10" rx="5" fill="white" 
          />

          {/* Eye Glow */}
          <motion.rect 
            variants={eyeVariants} 
            animate={status}
            style={{ transformOrigin: "35px 45px" }}
            x="28" y="42" width="14" height="10" rx="5" fill={theme.accent} 
            className="blur-sm opacity-60 mix-blend-screen"
          />
          <motion.rect 
            variants={eyeVariants} 
            animate={status}
            style={{ transformOrigin: "65px 45px" }}
            x="58" y="42" width="14" height="10" rx="5" fill={theme.accent} 
            className="blur-sm opacity-60 mix-blend-screen"
          />

          {/* Nose */}
          <circle cx="50" cy="56" r="3" fill="rgba(255,255,255,0.7)" />

          {/* Mouth */}
          <motion.path 
            variants={mouthVariants}
            animate={status}
            initial="idle"
            fill="transparent" 
            stroke="rgba(255,255,255,0.8)" 
            strokeWidth={3}
            strokeLinecap="round" 
          />

          {/* Gradients */}
          <defs>
            <linearGradient id="headGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
            <linearGradient id="visorGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={theme.primary} />
              <stop offset="100%" stopColor="#000000" />
            </linearGradient>
          </defs>
        </svg>

        {/* Small floating status light indicator */}
        <motion.div 
          animate={{ boxShadow: status === 'alert' ? '0 0 10px 2px rgba(239,68,68,0.8)' : status === 'listening' ? '0 0 10px 2px rgba(59,130,246,0.8)' : status === 'thinking' ? '0 0 10px 2px rgba(168,85,247,0.8)' : '0 0 4px 1px rgba(255,255,255,0.5)' }}
          className={cn(
            "absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full",
            status === 'alert' ? 'bg-red-500' : 
            status === 'thinking' ? 'bg-purple-400' : 
            status === 'listening' ? 'bg-blue-400' : 
            'bg-emerald-400'
          )}
        />
      </motion.div>

      {/* Role Badge Indicator */}
      {theme.icon && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(
            "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-lg border border-white/50 backdrop-blur-md bg-gradient-to-br z-10",
            theme.bg
          )}
        >
          {theme.icon}
        </motion.div>
      )}
    </div>
  );
};
