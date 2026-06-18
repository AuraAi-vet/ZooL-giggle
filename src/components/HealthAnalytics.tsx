import React from 'react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { Pet, HealthRecord } from '../types';
import { TrendingUp, Activity, ShieldCheck, HeartPulse } from 'lucide-react';
import { cn } from '../lib/utils';

interface HealthAnalyticsProps {
  pet: Pet;
  records: HealthRecord[];
}

export function HealthAnalytics({ pet, records }: HealthAnalyticsProps) {
  // Process Weight Data
  const weightData = React.useMemo(() => {
    if (!pet.weightHistory || pet.weightHistory.length === 0) {
      // Sample data if none exists to show the interface
      return [
        { date: '2025-01', weight: pet.weight * 0.95 },
        { date: '2025-02', weight: pet.weight * 0.98 },
        { date: '2025-03', weight: pet.weight },
      ];
    }
    return pet.weightHistory.map(w => ({
      date: new Date(w.date).toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
      weight: w.value
    }));
  }, [pet]);

  // Process Record Types Data
  const recordStats = React.useMemo(() => {
    const counts = records.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'Vaccination', value: counts.vaccination || 0, color: '#10b981' },
      { name: 'Checkup', value: counts.checkup || 0, color: '#3b82f6' },
      { name: 'Medication', value: counts.medication || 0, color: '#f59e0b' },
      { name: 'Other', value: counts.other || 0, color: '#6b7280' },
    ];
  }, [records]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Quick Stats Cards */}
        <div className="bg-white/95 backdrop-blur-3xl p-6 rounded-[2rem] border border-ruru-navy/10 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-[1.5rem]">
              <TrendingUp size={20} />
            </div>
            <p className="text-[10px] font-black text-ruru-navy/60 uppercase tracking-widest">Weight Status</p>
          </div>
          <h4 className="text-2xl font-brand text-ruru-navy">{pet.weight} <span className="text-sm font-sans text-ruru-navy/60">kg</span></h4>
          <p className="text-xs text-emerald-600 font-medium mt-1">Stable across 3 months</p>
        </div>

        <div className="bg-white/95 backdrop-blur-3xl p-6 rounded-[2rem] border border-ruru-navy/10 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-[1.5rem]">
              <Activity size={20} />
            </div>
            <p className="text-[10px] font-black text-ruru-navy/60 uppercase tracking-widest">Health Score</p>
          </div>
          <h4 className="text-2xl font-brand text-ruru-navy">{pet.healthScore || '92'}<span className="text-sm font-sans text-ruru-navy/60">%</span></h4>
          <div className="w-full bg-[#F5F5F0] h-1.5 rounded-full mt-2">
            <div 
              className="bg-blue-600 h-full rounded-full" 
              style={{ width: `${pet.healthScore || 92}%` }} 
            />
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-3xl p-6 rounded-[2rem] border border-ruru-navy/10 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-[1.5rem]">
              <ShieldCheck size={20} />
            </div>
            <p className="text-[10px] font-black text-ruru-navy/60 uppercase tracking-widest">Vaccinations</p>
          </div>
          <h4 className="text-2xl font-brand text-ruru-navy">Up to date</h4>
          <p className="text-xs text-ruru-navy/60 mt-1">Next: June 2026</p>
        </div>

        <div className="bg-ruru-navy p-6 rounded-[2rem] shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-ruru-teal/10 blur-[40px] rounded-full -mr-16 -mt-16" />
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="p-3 bg-ruru-teal/20 text-ruru-teal-light rounded-[1.5rem]">
              <HeartPulse size={20} />
            </div>
            <p className="text-[10px] font-black text-ruru-teal-light/60 uppercase tracking-widest">Vitals Sync</p>
          </div>
          <h4 className="text-2xl font-brand text-white relative z-10">Neural Active</h4>
          <p className="text-xs text-ruru-teal-light/80 mt-1 relative z-10">Real-time monitoring on</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weight Evolution Chart */}
        <div className="lg:col-span-2 bg-white/95 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-ruru-navy/10 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h3 className="text-xl font-brand text-ruru-navy">Weight Evolution</h3>
              <p className="text-xs text-ruru-navy/60">Historical biometric trajectory</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-ruru-teal rounded-full" />
                <span className="text-[10px] font-black text-ruru-navy/60 uppercase tracking-widest">Weight (kg)</span>
              </div>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weightData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EBE6" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#8B8B6B' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#8B8B6B' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    fontSize: '12px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorWeight)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Record Type Distribution */}
        <div className="bg-white/95 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-ruru-navy/10 shadow-sm">
          <div className="space-y-1 mb-8">
            <h3 className="text-xl font-brand text-ruru-navy">Care Profile</h3>
            <p className="text-xs text-ruru-navy/60">Medical activity distribution</p>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recordStats} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F0EBE6" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 9, fontWeight: 900, fill: '#8B8B6B' }}
                  width={80}
                />
                <Tooltip 
                  cursor={{ fill: '#F5F5F0' }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
                    fontSize: '11px',
                    fontWeight: 800
                  }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                  {recordStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4 mt-6">
            <div className="flex items-center justify-between p-4 bg-[#FDFBF7] rounded-[1.5rem] border border-ruru-navy/10">
              <span className="text-[10px] font-black text-ruru-navy/60 uppercase tracking-widest">Total Clinical Consults</span>
              <span className="text-lg font-brand text-ruru-navy">{records.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
