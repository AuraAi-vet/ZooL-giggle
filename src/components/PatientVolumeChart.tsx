import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { Users, Filter } from 'lucide-react';

const mockVolumeData = [
  { time: '08:00', walkins: 4, appointments: 12 },
  { time: '10:00', walkins: 10, appointments: 8 },
  { time: '12:00', walkins: 15, appointments: 5 },
  { time: '14:00', walkins: 8, appointments: 14 },
  { time: '16:00', walkins: 5, appointments: 16 },
  { time: '18:00', walkins: 2, appointments: 6 },
];

export default function PatientVolumeChart() {
  return (
    <div className="bg-white rounded-3xl shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] border border-slate-200/60 p-6 md:p-8 flex flex-col h-full relative overflow-hidden group hover:border-indigo-200 transition-all duration-300">
      <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50/50 rounded-bl-full blur-3xl pointer-events-none -mr-10 -mt-10 group-hover:bg-indigo-50/50 transition-colors"></div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 relative z-10 gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 font-display">
            <Users className="w-5 h-5 text-indigo-500" />
            Patient Flow Vectors
          </h2>
          <p className="text-sm text-slate-500 font-medium">Real-time breakdown of walk-ins vs. scheduled.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
           <button className="px-3 py-1.5 bg-white text-slate-700 text-xs font-bold rounded-lg shadow-sm">Today</button>
           <button className="px-3 py-1.5 text-slate-500 hover:text-slate-700 text-xs font-bold rounded-lg transition-colors">Week</button>
        </div>
      </div>

      <div className="flex-1 w-full h-[250px] relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mockVolumeData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} barGap={6}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgb(0 0 0 / 0.15)', padding: '12px 16px' }}
              labelStyle={{ color: '#64748b', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}
            />
            <Bar dataKey="appointments" name="Appointments" fill="#6366f1" radius={[6, 6, 6, 6]} barSize={16}>
               {mockVolumeData.map((entry, index) => (
                 <Cell key={`cell-apt-${index}`} fill={entry.appointments > 10 ? '#6366f1' : '#818cf8'} />
               ))}
            </Bar>
            <Bar dataKey="walkins" name="Walk-ins" fill="#f43f5e" radius={[6, 6, 6, 6]} barSize={16}>
               {mockVolumeData.map((entry, index) => (
                 <Cell key={`cell-walk-${index}`} fill={entry.walkins > 10 ? '#f43f5e' : '#fb7185'} />
               ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex items-center justify-center gap-6 mt-6 relative z-10 border-t border-slate-100 pt-6">
        <div className="flex items-center gap-2">
           <div className="w-3 h-3 rounded-full bg-[#6366f1]"></div>
           <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Scheduled (65)</span>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-3 h-3 rounded-full bg-[#f43f5e]"></div>
           <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Walk-ins (44)</span>
        </div>
      </div>
    </div>
  );
}
