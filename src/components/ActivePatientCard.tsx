import { motion } from 'motion/react';
import { AlertCircle, CheckCircle2, Clock, ChevronRight } from 'lucide-react';

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
      color: "bg-emerald-50 text-emerald-600 border-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.1)]",
      icon: <CheckCircle2 size={14} />
    },
    MONITORING: {
      text: "Under Review",
      color: "bg-slate-50 text-slate-600 border-slate-200",
      icon: <Clock size={14} />
    },
    ACTION_NEEDED: {
      text: "Action Needed",
      color: "bg-rose-50 text-rose-600 border-rose-200 shadow-[0_0_15px_rgba(225,29,72,0.1)]",
      icon: <AlertCircle size={14} />
    }
  };

  const currentStatus = statusConfig[healthStatus];

  return (
    <motion.div 
      whileHover={{ y: -2, scale: 1.01 }}
      title={onClick ? "View Medical Record" : undefined}
      className={`bg-white rounded-3xl p-6 border border-slate-200/60 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_32px_-12px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col gap-5 relative overflow-hidden group ${onClick ? 'cursor-pointer hover:border-indigo-200' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
      
      {/* Header */}
      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img 
              src={avatarUrl} 
              alt={petName} 
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-sm"
              referrerPolicy="no-referrer"
            />
            {healthStatus === "ACTION_NEEDED" && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-full"></span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 leading-tight font-display">{petName}</h2>
            <p className="text-sm font-medium text-slate-500">{speciesBreed}</p>
          </div>
        </div>
        
        {onClick && (
          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Status Badge */}
      <div className={`flex w-fit items-center gap-2 px-3 py-1.5 rounded-xl border font-bold text-xs relative z-10 ${currentStatus.color}`}>
        {currentStatus.icon}
        {currentStatus.text}
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between relative z-10">
        <div>
          <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Next Milestone</p>
          <p className="text-sm font-medium text-slate-800 mt-1 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            {nextMilestone}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
