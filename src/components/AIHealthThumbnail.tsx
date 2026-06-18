import React from 'react';
import { Sparkles, Activity, ShieldCheck, HeartPulse } from 'lucide-react';
import { motion } from 'motion/react';

interface AIHealthThumbnailProps {
  petName: string;
  speciesBreed: string;
  imageUrl: string;
  healthScore: number;
}

// ⚡ Bolt: Wrapped in React.memo to prevent unnecessary re-renders of static UI elements
// Expected Impact: Eliminates re-renders when parent views fetch unrelated data
const AIHealthThumbnail = React.memo(function AIHealthThumbnail({
  petName,
  speciesBreed,
  imageUrl,
  healthScore,
}: AIHealthThumbnailProps) {
  return (
    <div className="bg-white rounded-3xl shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] border border-slate-200/60 p-6 flex flex-col relative overflow-hidden group hover:border-indigo-200 transition-all duration-300">
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-indigo-100/60 to-transparent rounded-bl-full pointer-events-none"></div>
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl">
           <Sparkles className="w-4 h-4" />
           <span className="text-xs font-bold tracking-wide">AI VISUAL SUMMARY</span>
        </div>
        <div className="text-right">
           <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Health Score</span>
           <span className="text-xl font-bold font-display text-emerald-600">{healthScore}/100</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 relative z-10 w-full mb-2">
        <div className="relative w-full md:w-1/2 aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden shadow-inner group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-shadow">
           <img 
             src={imageUrl} 
             alt={`AI Visual Summary of ${petName}`}
             className="w-full h-full object-cover"
             referrerPolicy="no-referrer"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
           <div className="absolute bottom-4 left-4 text-white">
             <h3 className="font-display font-bold text-xl drop-shadow-md">{petName}</h3>
             <p className="text-sm text-white/90 font-medium drop-shadow-md">{speciesBreed}</p>
           </div>
           
           {/* Abstract AI Overlays */}
           <motion.div 
             animate={{ rotate: 360 }} 
             transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
             className="absolute top-3 right-3 w-16 h-16 border-[1px] border-dashed border-white/40 rounded-full"
           ></motion.div>
           <motion.div 
             animate={{ scale: [1, 1.1, 1] }} 
             transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
             className="absolute top-7 right-7 w-8 h-8 border border-white/60 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-sm"
           >
             <HeartPulse className="w-4 h-4 text-white" />
           </motion.div>
        </div>

        <div className="w-full md:w-1/2 flex flex-col justify-center space-y-4">
           {/* Summary Stats */}
           <div className="flex flex-col gap-3">
             <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
               <div className="p-2 bg-white rounded-lg shadow-sm text-emerald-600">
                 <ShieldCheck className="w-5 h-5" />
               </div>
               <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Immunity</p>
                 <p className="text-sm font-bold text-slate-800">Robust (Vaccinated)</p>
               </div>
             </div>
             <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
               <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600">
                 <Activity className="w-5 h-5" />
               </div>
               <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vitals</p>
                 <p className="text-sm font-bold text-slate-800">Optimal Range</p>
               </div>
             </div>
           </div>
           <p className="text-xs font-medium text-slate-500 leading-relaxed italic">
             "Based on recent telemetry and clinical logs, {petName} exhibits strong cardiovascular health and ideal body condition."
           </p>
        </div>
      </div>
    </div>
  );
});

export default AIHealthThumbnail;
