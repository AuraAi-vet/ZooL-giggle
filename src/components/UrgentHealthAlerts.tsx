import { useState } from 'react';
import { Phone, Activity, HeartPulse, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Alert {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  severity: 'high' | 'medium';
}

export default function UrgentHealthAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: 'alarm_1',
      type: 'Heart Rate',
      message: 'Sudden spike in resting heart rate detected (145 BPM).',
      timestamp: 'Just now',
      severity: 'high'
    }
  ]);

  const dismissAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <AnimatePresence>
        {alerts.map(alert => (
          <motion.div 
            key={alert.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className={`relative overflow-hidden rounded-3xl p-6 border shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${
              alert.severity === 'high' 
                ? 'bg-rose-50/80 border-rose-200' 
                : 'bg-amber-50/80 border-amber-200'
            }`}
          >
            {alert.severity === 'high' && (
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-rose-200/40 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
            )}
            
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl text-white shadow-sm flex-shrink-0 ${
                  alert.severity === 'high' ? 'bg-rose-500' : 'bg-amber-500'
                }`}>
                  {alert.type === 'Heart Rate' ? <HeartPulse className="w-6 h-6 animate-pulse" /> : <Activity className="w-6 h-6" />}
                </div>
                <div>
                   <div className="flex items-center gap-2 mb-1">
                     <h3 className={`font-extrabold text-xs uppercase tracking-widest ${
                       alert.severity === 'high' ? 'text-rose-700' : 'text-amber-700'
                     }`}>
                       {alert.severity === 'high' ? 'Urgent Alert' : 'System Warning'}
                     </h3>
                     <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/60 text-slate-500 backdrop-blur-sm border border-slate-100">
                       {alert.timestamp}
                     </span>
                   </div>
                   <p className="text-slate-800 font-bold text-sm md:text-base">
                     {alert.message}
                   </p>
                </div>
              </div>
              <button 
                onClick={() => dismissAlert(alert.id)}
                className={`p-2 rounded-xl transition-colors ${
                  alert.severity === 'high' ? 'text-rose-400 hover:bg-rose-100 hover:text-rose-600' : 'text-amber-400 hover:bg-amber-100 hover:text-amber-600'
                }`}
                title="Dismiss Alert"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mt-5 flex flex-col sm:flex-row gap-3 relative z-10 w-full sm:w-auto">
               <button className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm text-white shadow-md transition-transform active:scale-95 ${
                 alert.severity === 'high' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
               }`}>
                 <Phone className="w-4 h-4" />
                 Call Vet Clinic
               </button>
               <button className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-colors border bg-white shadow-sm ${
                 alert.severity === 'high' ? 'border-rose-200 text-rose-700 hover:bg-rose-50' : 'border-amber-200 text-amber-700 hover:bg-amber-50'
               }`}>
                 View Telemetry Details
               </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
