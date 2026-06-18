import React, { useState } from 'react';
import { Calendar as CalendarIcon, Download, AlertTriangle, CheckCircle, RefreshCcw } from 'lucide-react';

const mockConflicts = [
  { id: '1', date: '2026-06-10', time: '14:00', event: 'Dr. Appointment (Personal)', clientSession: 'Grooming - Buddy' },
];

export default function SmartCalendarSync({ schedule }: { schedule: any[] }) {
  const [isExporting, setIsExporting] = useState(false);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [hasChecked, setHasChecked] = useState(false);

  // Generate a basic ICS file from schedule items
  const handleExportICS = () => {
    setIsExporting(true);
    
    setTimeout(() => {
      let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Zool//Zool Applet//EN\n";
      
      schedule.forEach(item => {
        // Minimal mock ICS generation (assumes today's date for simple demo purposes)
        const todayStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
        // Rough time parsing '10:00 AM'
        let timeStr = "100000";
        if (item.time) {
          const match = item.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
          if (match) {
            let hr = parseInt(match[1]);
            const min = match[2];
            const isPM = match[3].toUpperCase() === 'PM';
            if (isPM && hr !== 12) hr += 12;
            if (!isPM && hr === 12) hr = 0;
            timeStr = `${hr.toString().padStart(2, '0')}${min}00`;
          }
        }
        
        icsContent += `BEGIN:VEVENT\n`;
        icsContent += `DTSTART:${todayStr}T${timeStr}Z\n`;
        icsContent += `DTEND:${todayStr}T${(parseInt(timeStr.substring(0,2)) + 1).toString().padStart(2, '0')}${timeStr.substring(2)}Z\n`;
        icsContent += `SUMMARY:${item.name} - ${item.serviceRequested}\n`;
        icsContent += `DESCRIPTION:${item.details || 'No details provided.'}\n`;
        icsContent += `END:VEVENT\n`;
      });
      
      icsContent += "END:VCALENDAR";

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', 'provider_schedule.ics');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsExporting(false);
    }, 800);
  };

  const simulateConflictCheck = () => {
    setIsCheckingConflicts(true);
    setTimeout(() => {
      setConflicts(mockConflicts);
      setHasChecked(true);
      setIsCheckingConflicts(false);
    }, 1500);
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <CalendarIcon className="w-5 h-5 text-indigo-500" />
            Smart Calendar Sync
          </h2>
          <p className="text-sm text-slate-500">Export your schedule to external calendars or check for overlaps.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={simulateConflictCheck}
            disabled={isCheckingConflicts}
            className="px-4 py-2 bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isCheckingConflicts ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
            Check Conflicts
          </button>
          <button 
            onClick={handleExportICS}
            disabled={isExporting || schedule.length === 0}
            className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-sm font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            {isExporting ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export .ICS
          </button>
        </div>
      </div>

      {hasChecked && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          {conflicts.length > 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
               <h3 className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-3">
                 <AlertTriangle className="w-4 h-4" /> Schedule Overlaps Detected
               </h3>
               <div className="space-y-2">
                 {conflicts.map(conflict => (
                   <div key={conflict.id} className="bg-white/60 p-3 rounded-lg border border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                     <div>
                       <div className="text-xs font-bold text-slate-500 mb-1">{conflict.date} at {conflict.time}</div>
                       <div className="text-sm font-medium text-slate-800">
                         Ext. Event: <span className="font-bold">{conflict.event}</span>
                       </div>
                       <div className="text-sm font-medium text-amber-700 mt-0.5">
                         Clashes with: <span className="font-bold">{conflict.clientSession}</span>
                       </div>
                     </div>
                     <button className="px-3 py-1.5 bg-white border border-amber-200 hover:bg-amber-50 text-amber-700 text-xs font-bold rounded-lg transition-colors">
                       Resolve Issue
                     </button>
                   </div>
                 ))}
               </div>
            </div>
          ) : (
             <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
               <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
                 <CheckCircle className="w-5 h-5" />
               </div>
               <div>
                  <h3 className="font-bold text-emerald-800 text-sm">All Clear</h3>
                  <p className="text-xs text-emerald-600 mt-0.5">No schedule conflicts detected between your provider slots and external calendars.</p>
               </div>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
