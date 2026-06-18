import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface ActivePatientCardProps {
  petName: string;
  speciesBreed: string;
  avatarUrl: string;
  healthStatus: "CLEAR" | "MONITORING" | "ACTION_NEEDED";
  nextMilestone: string;
  className?: string;
  onClick?: () => void;
}

export default function ActivePatientCard({
  petName,
  speciesBreed,
  avatarUrl,
  healthStatus,
  nextMilestone,
  className = "",
  onClick
}: ActivePatientCardProps) {
  
  const statusConfig = {
    CLEAR: {
      text: "All Clear",
      color: "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20",
      icon: <CheckCircle2 size={14} />
    },
    MONITORING: {
      text: "Under Review",
      color: "bg-slate-100 text-slate-700 border-slate-200",
      icon: <Clock size={14} />
    },
    ACTION_NEEDED: {
      text: "Action Needed",
      color: "bg-indigo-100 text-indigo-700 border-indigo-200",
      icon: <AlertCircle size={14} />
    }
  };

  const currentStatus = statusConfig[healthStatus];

  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      className={`bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col gap-5 cursor-pointer ${className}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <img 
          src={avatarUrl} 
          alt={petName} 
          className="w-14 h-14 rounded-full object-cover border-2 border-slate-100"
        />
        <div>
          <h2 className="text-lg font-bold text-[#1E293B] leading-tight font-display">{petName}</h2>
          <p className="text-xs text-slate-500">{speciesBreed}</p>
        </div>
      </div>

      {/* Status Badge */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border font-bold text-xs ${currentStatus.color}`}>
        {currentStatus.icon}
        {currentStatus.text}
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-slate-100">
        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Next Milestone</p>
        <p className="text-xs text-[#1E293B] mt-0.5">{nextMilestone}</p>
      </div>
    </motion.div>
  );
}
