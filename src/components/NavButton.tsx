import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

export function SidebarNavButton({ active, onClick, icon, label }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center p-2 rounded-[1.25rem] w-[4.5rem] h-14 relative group outline-none focus:outline-none transition-all duration-300",
        active ? "-translate-y-1" : "hover:-translate-y-0.5"
      )}
    >
      {active && (
        <motion.div
          layoutId="activeNavBG"
          className="absolute inset-0 bg-[#F5F5F0] rounded-[1.25rem]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      <div className={cn(
        "transition-all duration-300 relative z-10 mb-0.5",
        active ? "text-ruru-navy scale-110 drop-shadow-sm" : "text-[#A8A29E] group-hover:text-ruru-navy/70 group-hover:scale-105"
      )}>
        {React.cloneElement(icon as React.ReactElement<any>, { 
          size: 20,
          strokeWidth: active ? 2.5 : 2
        })}
      </div>
      <span className={cn(
        "text-[10px] font-semibold tracking-wide relative z-10 transition-all duration-300 w-full text-center truncate",
        active ? "text-ruru-navy opacity-100" : "text-[#A8A29E] opacity-70 group-hover:opacity-90"
      )}>
        {label}
      </span>
      {active && (
        <motion.div 
          layoutId="active-indicator"
          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-ruru-teal rounded-full"
        />
      )}
    </button>
  );
}

export function NavButton({ active, onClick, icon, label }: NavButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center gap-1 w-16 h-14 transition-all duration-300 rounded-[1.25rem] group outline-none focus:outline-none",
        active ? "bg-[#F5F5F0] -translate-y-0.5" : "hover:-translate-y-0.5 hover:bg-[#FAF9F6]"
      )}
    >
      <motion.div
        animate={{ scale: active ? 1.15 : 1, y: active ? -1 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn(
          "transition-colors duration-300",
          active ? "text-ruru-navy drop-shadow-md" : "text-[#A8A29E] group-hover:text-ruru-navy/70"
        )}
      >
        {React.cloneElement(icon as React.ReactElement<any>, { 
          size: 22,
          strokeWidth: active ? 2.5 : 2
        })}
      </motion.div>
      <span className={cn(
        "text-[10px] font-semibold tracking-wide text-center truncate px-1 transition-colors duration-300",
        active ? "text-ruru-navy" : "text-[#A8A29E] group-hover:text-ruru-navy/80"
      )}>
        {label}
      </span>
      {active && (
        <motion.div 
          layoutId="nav-indicator-dot" 
          className="absolute -bottom-1 w-1.5 h-1.5 bg-ruru-teal rounded-full shadow-sm shadow-ruru-teal/30" 
        />
      )}
    </button>
  );
}
