import { useState, useEffect } from 'react';
import { BarChart3, CalendarDays, Users, TrendingUp, MapPin, CheckCircle, ChevronRight, Activity, Clock, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { subscribeToClinicOperationsData, logActivity, createNotification } from '../services/dbService';
import FinancialProjection from '../components/FinancialProjection';
import KnowledgeBaseSyncWidget from '../components/KnowledgeBaseSyncWidget';
import PatientVolumeChart from '../components/PatientVolumeChart';
import { auth } from '../lib/firebase';
import { useLanguage } from '../lib/i18n';

import { AdminDashboardSkeleton } from '../components/DashboardSkeleton';

export default function AdminDashboardView() {
  const [opsData, setOpsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [clinicStatus, setClinicStatus] = useState('Accepting Walk-ins');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToClinicOperationsData('clinic_downtown_01', (data) => {
      setOpsData(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    setTimeout(async () => {
      setClinicStatus(newStatus);
      setIsUpdatingStatus(false);
      if (auth.currentUser) {
        await logActivity(auth.currentUser.uid, 'Updated Global Walk-in Status', `Status set to ${newStatus}`);
        await createNotification(
          auth.currentUser.uid,
          'Network Status Updated',
          `The global clinic status is now: ${newStatus}`
        );
      }
    }, 800);
  };

  if (isLoading) {
    return <AdminDashboardSkeleton />;
  }

  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
  };

  const itemVars = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="p-6 md:p-8 min-h-screen bg-transparent relative">
      <div className="absolute top-[-100px] left-[50%] w-[500px] h-[500px] bg-indigo-400/10 rounded-full blur-[100px] pointer-events-none transform -translate-x-1/2"></div>

      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10 w-full">
        <div className="flex flex-col">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 font-display">{t('operationsCommand')}</h1>
            <div className="px-3 py-1 bg-white/80 backdrop-blur-md text-emerald-600 rounded-xl text-xs font-extrabold tracking-wide uppercase flex items-center gap-2 border border-emerald-100 shadow-[0_4px_12px_rgba(16,185,129,0.1)]">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              NETWORK ACTIVE
            </div>
          </div>
          <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
            <MapPin className="w-4 h-4 text-slate-400" />
            ZooL Pet Clinic - Trivandrum • Global Overview
          </p>
        </div>
      </header>

      <motion.div variants={containerVars} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        
        <motion.div variants={itemVars} className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] border border-slate-200/60 p-6 flex flex-col justify-between relative overflow-hidden group hover:border-cyan-200 transition-all duration-300">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-colors"></div>
            <div className="absolute bottom-0 inset-x-0 h-1 bg-cyan-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="p-3 bg-white rounded-2xl text-cyan-600 border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)] group-hover:scale-110 transition-transform duration-500">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold tracking-widest text-emerald-600 uppercase px-2 py-1 bg-white border border-slate-100 rounded-md shadow-sm">+12% vs yday</span>
            </div>
            <div className="relative z-10">
              <p className="text-[11px] font-bold text-slate-400 tracking-widest mb-1 uppercase">{t('dailyPatientVolume')}</p>
              <p className="text-5xl font-extrabold text-slate-900 font-display tracking-tighter">{opsData?.metrics.dailyVolume || 12}</p>
            </div>
          </div>
          
          <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] border border-slate-200/60 p-6 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-200 transition-all duration-300">
             <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors"></div>
             <div className="absolute bottom-0 inset-x-0 h-1 bg-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="p-3 bg-white rounded-2xl text-emerald-600 border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)] group-hover:scale-110 transition-transform duration-500">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-[11px] font-bold text-slate-400 tracking-widest mb-1 uppercase">{t('scheduleCompletion')}</p>
              <p className="text-5xl font-extrabold text-slate-900 font-display tracking-tighter">{opsData?.metrics.completionRate || 95}<span className="text-3xl text-emerald-500">%</span></p>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] border border-slate-200/60 p-6 flex flex-col justify-between relative overflow-hidden group hover:border-indigo-200 transition-all duration-300">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors"></div>
            <div className="absolute bottom-0 inset-x-0 h-1 bg-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="p-3 bg-white rounded-2xl text-indigo-600 border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)] group-hover:scale-110 transition-transform duration-500">
                <BarChart3 className="w-6 h-6" />
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-[11px] font-bold text-slate-400 tracking-widest mb-1 uppercase">{t('activeStaff')}</p>
              <p className="text-5xl font-extrabold text-slate-900 font-display tracking-tighter">{opsData?.metrics.activeStaff || 4}<span className="text-3xl text-slate-300 font-medium tracking-normal ml-2">/ 6</span></p>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] border border-slate-200/60 p-6 flex flex-col justify-between relative overflow-hidden group hover:border-rose-200 transition-all duration-300">
             <div className="absolute -right-6 -top-6 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-colors"></div>
             <div className="absolute bottom-0 inset-x-0 h-1 bg-rose-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="p-3 bg-white rounded-2xl text-rose-600 border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)] group-hover:scale-110 transition-transform duration-500">
                <Clock className="w-6 h-6" />
              </div>
               {opsData?.metrics.currentWaitTime !== '5 mins' && (
                 <span className="flex items-center gap-1.5 px-2 py-1 bg-white text-rose-600 border border-rose-100 rounded-md text-[10px] font-bold tracking-widest uppercase shadow-[0_2px_8px_rgba(225,29,72,0.1)]">
                   <AlertTriangle className="w-3 h-3" /> Peak
                 </span>
               )}
            </div>
            <div className="relative z-10">
              <p className="text-[11px] font-bold text-slate-400 tracking-widest mb-1 uppercase">{t('estWaitTime')}</p>
              <p className="text-5xl font-extrabold text-rose-600 font-display tracking-tighter">{opsData?.metrics.currentWaitTime?.split(' ')[0] || '15'}<span className="text-2xl text-rose-400 ml-1">m</span></p>
            </div>
          </div>
        </motion.div>

        {/* Left Column (Charts & Lists) */}
        <div className="lg:col-span-8 flex flex-col gap-6 md:gap-8">
          
          <motion.div variants={itemVars}>
             <PatientVolumeChart />
          </motion.div>

          <motion.div variants={itemVars} className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] border border-slate-200/60 p-6 md:p-8 flex flex-col h-[500px]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-bold text-xl text-slate-800 font-display flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-indigo-500" />
                  Master Schedule Log
                </h2>
                <p className="text-sm text-slate-500 mt-1 font-medium">Timeline visualization of all center activity.</p>
              </div>
              <button className="text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl text-xs font-bold transition-colors">
                View Expanding Timeline
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar relative">
               <div className="absolute left-[39px] top-0 bottom-0 w-0.5 bg-slate-100"></div>
              {opsData?.masterSchedule && opsData.masterSchedule.length > 0 ? (
                <div className="space-y-6">
                  {opsData.masterSchedule.map((apt: any, idx: number) => (
                    <div key={apt.id} className="relative flex items-start gap-6 group">
                      <div className="w-10 text-right shrink-0 pt-1">
                        <span className="font-bold text-slate-400 text-xs tracking-wider">{apt.time}</span>
                      </div>
                      <div className={`absolute left-[35px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm z-10 ${
                         apt.status === 'completed' ? 'bg-emerald-500' : apt.status === 'in-progress' ? 'bg-blue-500 animate-pulse' : 'bg-amber-400'
                      }`}></div>
                      <div className="flex-1 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] group-hover:border-indigo-200 transition-all cursor-pointer">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-slate-800 text-sm">{apt.type || 'General Visit'}</h4>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            apt.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : apt.status === 'in-progress' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {apt.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{apt.notes || 'Routine checkup scheduled.'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full opacity-50 relative z-10">
                   <div className="bg-slate-100 p-4 rounded-full mb-4">
                     <CalendarDays className="w-8 h-8 text-slate-400" />
                   </div>
                   <p className="text-slate-500 font-bold text-lg">Timeline Clear</p>
                   <p className="text-slate-400 text-sm mt-1">No appointments registered yet today.</p>
                </div>
              )}
            </div>
          </motion.div>

        </div>

        {/* Right Column (Controls & Analytics) */}
        <div className="lg:col-span-4 flex flex-col gap-6 md:gap-8">
          
          <motion.div variants={itemVars} className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-[0_12px_40px_-12px_rgba(0,0,0,0.3)] border border-slate-700 p-6 md:p-8 flex flex-col relative overflow-hidden text-white">
            
            <AnimatePresence>
              {isUpdatingStatus && (
                <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="absolute inset-0 z-20 bg-slate-900/60 backdrop-blur-md flex items-center justify-center">
                  <div className="w-10 h-10 border-4 border-slate-600 border-t-white rounded-full animate-spin"></div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-bl-full blur-[64px] pointer-events-none mix-blend-screen"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-tr-full blur-[64px] pointer-events-none mix-blend-screen"></div>

            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-xl border border-white/5 shadow-inner backdrop-blur-md">
                  <MapPin className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                   <h2 className="font-bold text-xl font-display tracking-wide">Network Visibility</h2>
                   <p className="text-[10px] uppercase font-bold text-blue-400/80 tracking-widest leading-none mt-1">Global Router</p>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-slate-300 font-medium mb-8 leading-relaxed relative z-10">
              Manage live traffic routing. Changes take effect on the global map instantly, alerting owners of expected wait thresholds.
            </p>

            <div className="space-y-3 relative z-10">
              <button 
                onClick={() => handleStatusUpdate('Accepting Walk-ins')}
                className={`w-full flex items-center justify-between p-4 rounded-2xl font-bold transition-all duration-300 ${
                  clinicStatus === 'Accepting Walk-ins' 
                    ? 'bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.15)] bg-emerald-500/10' 
                    : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                Accepting Walk-ins
                {clinicStatus === 'Accepting Walk-ins' && <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.9)]" />}
              </button>

              <button 
                onClick={() => handleStatusUpdate('Expect Delays')}
                className={`w-full flex items-center justify-between p-4 rounded-2xl font-bold transition-all duration-300 ${
                  clinicStatus === 'Expect Delays' 
                    ? 'bg-amber-500/20 border-2 border-amber-500/50 text-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.15)] bg-amber-500/10' 
                    : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                Expect Delays
                {clinicStatus === 'Expect Delays' && <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.9)]" />}
              </button>

              <button 
                onClick={() => handleStatusUpdate('Fully Booked')}
                className={`w-full flex items-center justify-between p-4 rounded-2xl font-bold transition-all duration-300 ${
                  clinicStatus === 'Fully Booked' 
                    ? 'bg-rose-500/20 border-2 border-rose-500/50 text-rose-300 shadow-[0_0_30px_rgba(225,29,72,0.15)] bg-rose-500/10' 
                    : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                Fully Booked
                {clinicStatus === 'Fully Booked' && <div className="w-3 h-3 rounded-full bg-rose-400 shadow-[0_0_12px_rgba(225,29,72,0.9)]" />}
              </button>
            </div>
          </motion.div>

          <motion.div variants={itemVars}>
             <KnowledgeBaseSyncWidget />
          </motion.div>

          <motion.div variants={itemVars}>
             <FinancialProjection />
          </motion.div>

          <motion.div variants={itemVars} className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_-4px_rgba(0,0,0,0.03)] border border-slate-200/60 p-6 md:p-8 flex flex-col relative overflow-hidden">
             <div className="absolute top-0 left-0 w-32 h-32 bg-rose-50/50 rounded-br-full blur-3xl pointer-events-none -ml-10 -mt-10"></div>
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h2 className="font-bold text-xl text-slate-800 font-display">Inventory Alerts</h2>
              <span className="text-[10px] font-extrabold px-2 py-1 bg-rose-50 text-rose-600 rounded-lg border border-rose-100 shadow-sm uppercase tracking-widest shrink-0">Low Stock</span>
            </div>
            
            <div className="space-y-4 relative z-10">
              <div className="p-4 border border-slate-100 hover:border-rose-200 bg-white shadow-sm rounded-2xl flex flex-col gap-4 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] group">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-rose-50 rounded-lg group-hover:bg-rose-100 transition-colors">
                     <AlertTriangle className="w-5 h-5 text-rose-500" />
                   </div>
                   <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                         <p className="text-sm font-bold text-slate-800">Rabies Vaccine (1-yr)</p>
                         <p className="text-xs font-black text-rose-500">12 units left</p>
                      </div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Threshold: 20 units</p>
                   </div>
                </div>
                
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                   <motion.div initial={{ width: 0 }} animate={{ width: '40%' }} transition={{ duration: 1, ease: 'easeOut' }} className="bg-rose-500 h-1.5 rounded-full"></motion.div>
                </div>
                
                <button className="w-full py-2 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-colors">Auto-Reorder Stock</button>
              </div>

               <div className="p-4 border border-slate-100 hover:border-amber-200 bg-white shadow-sm rounded-2xl flex flex-col gap-4 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] group">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-amber-50 rounded-lg group-hover:bg-amber-100 transition-colors">
                     <Activity className="w-5 h-5 text-amber-500" />
                   </div>
                   <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                         <p className="text-sm font-bold text-slate-800">Lidocaine HCI</p>
                         <p className="text-xs font-black text-amber-500">5 vls left</p>
                      </div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Threshold: 10 vls</p>
                   </div>
                </div>
                
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                   <motion.div initial={{ width: 0 }} animate={{ width: '50%' }} transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }} className="bg-amber-400 h-1.5 rounded-full"></motion.div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>

      </motion.div>
    </div>
  );
}

