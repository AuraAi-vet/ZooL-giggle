import React, { useState, useEffect } from 'react';
import { BarChart3, CalendarDays, Settings, Users, TrendingUp, MapPin, CheckCircle } from 'lucide-react';
import { getClinicOperationsData, logActivity, createNotification } from '../services/dbService';
import { auth } from '../lib/firebase';

export default function AdminDashboardView() {
  const [opsData, setOpsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [clinicStatus, setClinicStatus] = useState('Accepting Walk-ins');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await getClinicOperationsData('clinic_downtown_01');
        setOpsData(data);
      } catch (error) {
        console.error("Failed to load operations data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    // Simulate an API call to update the global locator map status
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
    return (
      <div className="p-6 md:p-8 min-h-screen bg-[#F8FAFC] animate-pulse">
        <div className="h-12 bg-slate-200 rounded-xl mb-8 w-64"></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-4 gap-6">
             <div className="h-32 bg-slate-200 rounded-3xl"></div>
             <div className="h-32 bg-slate-200 rounded-3xl"></div>
             <div className="h-32 bg-slate-200 rounded-3xl"></div>
             <div className="h-32 bg-slate-200 rounded-3xl"></div>
          </div>
          <div className="lg:col-span-8 h-[500px] bg-slate-200 rounded-3xl"></div>
          <div className="lg:col-span-4 h-[500px] bg-slate-200 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 min-h-screen bg-[#F8FAFC]">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Operations Command</h1>
          <p className="text-slate-500 mt-1 font-medium">Downtown Wellness Vet • Master Overview</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        
        {/* Top KPI Metrics Row (Span Full) */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] border border-slate-200/60 p-6 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2 text-blue-600">
              <Users className="w-5 h-5" />
              <h2 className="font-bold text-sm">Daily Patient Volume</h2>
            </div>
            <p className="text-4xl font-extrabold text-slate-900">{opsData?.metrics.dailyVolume || 0}</p>
          </div>
          
          <div className="bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] border border-slate-200/60 p-6 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
              <h2 className="font-bold text-sm">Schedule Completion</h2>
            </div>
            <p className="text-4xl font-extrabold text-slate-900">{opsData?.metrics.completionRate || 0}%</p>
          </div>

          <div className="bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] border border-slate-200/60 p-6 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2 text-amber-600">
              <BarChart3 className="w-5 h-5" />
              <h2 className="font-bold text-sm">Active Staff</h2>
            </div>
            <p className="text-4xl font-extrabold text-slate-900">{opsData?.metrics.activeStaff || 0}</p>
          </div>

          <div className="bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] border border-slate-200/60 p-6 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2 text-rose-600">
              <TrendingUp className="w-5 h-5" />
              <h2 className="font-bold text-sm">Est. Wait Time</h2>
            </div>
            <p className="text-4xl font-extrabold text-slate-900">{opsData?.metrics.currentWaitTime || '--'}</p>
          </div>
        </div>

        {/* Master Schedule (Left Column) */}
        <div className="lg:col-span-8 bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] border border-slate-200/60 p-6 flex flex-col h-[500px]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <CalendarDays className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-lg text-slate-800">Master Schedule</h2>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {opsData?.masterSchedule.length === 0 ? (
              <p className="text-slate-500 text-center mt-10 font-medium">No appointments scheduled today.</p>
            ) : (
              opsData?.masterSchedule.map((apt: any) => (
                <div key={apt.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/60 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-slate-700 w-20">{apt.time}</span>
                    <span className={`px-3 py-1 text-xs font-bold rounded-lg border ${
                      apt.type === 'Trial Care' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {apt.type}
                    </span>
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    apt.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'
                  }`}>
                    {apt.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Network & Map Status Control (Right Column) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] border border-slate-700 p-6 flex flex-col relative overflow-hidden text-white h-full">
            
            {isUpdatingStatus && (
              <div className="absolute inset-0 z-10 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              </div>
            )}

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-white/10 rounded-xl">
                <MapPin className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="font-bold text-lg">Network Locator Status</h2>
            </div>
            
            <p className="text-sm text-slate-300 font-medium mb-6 leading-relaxed">
              Control how Downtown Wellness appears on the Pet Owner map. Updating this immediately affects incoming walk-ins and trial bookings.
            </p>

            <div className="space-y-3 mt-auto">
              <button 
                onClick={() => handleStatusUpdate('Accepting Walk-ins')}
                className={`w-full flex items-center justify-between p-4 rounded-2xl font-bold transition-all ${
                  clinicStatus === 'Accepting Walk-ins' 
                    ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400' 
                    : 'bg-white/5 border-2 border-transparent text-slate-400 hover:bg-white/10'
                }`}
              >
                Accepting Walk-ins
                {clinicStatus === 'Accepting Walk-ins' && <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
              </button>

              <button 
                onClick={() => handleStatusUpdate('Expect Delays')}
                className={`w-full flex items-center justify-between p-4 rounded-2xl font-bold transition-all ${
                  clinicStatus === 'Expect Delays' 
                    ? 'bg-amber-500/20 border-2 border-amber-500 text-amber-400' 
                    : 'bg-white/5 border-2 border-transparent text-slate-400 hover:bg-white/10'
                }`}
              >
                Expect Delays
                {clinicStatus === 'Expect Delays' && <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
              </button>

              <button 
                onClick={() => handleStatusUpdate('Fully Booked')}
                className={`w-full flex items-center justify-between p-4 rounded-2xl font-bold transition-all ${
                  clinicStatus === 'Fully Booked' 
                    ? 'bg-rose-500/20 border-2 border-rose-500 text-rose-400' 
                    : 'bg-white/5 border-2 border-transparent text-slate-400 hover:bg-white/10'
                }`}
              >
                Fully Booked
                {clinicStatus === 'Fully Booked' && <div className="w-2 h-2 rounded-full bg-rose-400" />}
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
