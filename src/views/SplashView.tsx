import React from 'react';
import { motion } from 'motion/react';
import AnimatedLogo from '../components/AnimatedLogo';

export default function SplashView() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-surface">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-64 h-auto"
      >
        {/* Plays continuously */}
        <AnimatedLogo variant="splash" />
      </motion.div>
    </div>
  );
}
