
import { useState, useEffect } from 'react';
import { Activity, HeartPulse, Moon, WifiOff } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface CircularProgressProps {
  value: number;
  max: number;
  color: string;
  label: string;
  unit: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({ value, max, color, label, unit }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / max) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-slate-100"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`${color} transition-all duration-1000 ease-out`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-slate-800 tracking-tight leading-none">{value}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{unit}</span>
        </div>
      </div>
      <span className="mt-2 text-xs font-bold text-slate-600 uppercase tracking-widest">{label}</span>
    </div>
  );
};

const mockTelemetryData = [
  { time: '6am', heartRate: 72, activity: 800 },
  { time: '9am', heartRate: 110, activity: 2500 },
  { time: '12pm', heartRate: 85, activity: 1200 },
  { time: '3pm', heartRate: 125, activity: 3800 },
  { time: '6pm', heartRate: 90, activity: 1400 },
  { time: '9pm', heartRate: 68, activity: 400 }
];

export default function IoTProgressWidget() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="bg-white rounded-3xl shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] border border-slate-200/60 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
          IoT Telemetry
        </h2>
        {isOnline ? (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-bold tracking-widest uppercase">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Live Sync
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[10px] font-bold uppercase tracking-wider border border-amber-200" title="Offline. Data will sync when reconnected.">
            <WifiOff className="w-3 h-3" /> Sync Pending
          </span>
        )}
      </div>
      
      <div className="flex flex-col md:flex-row gap-8 items-center justify-between mb-8">
        <CircularProgress value={8540} max={10000} color="text-indigo-500" label="Activity" unit="Steps" />
        <CircularProgress value={112} max={180} color="text-rose-500" label="Heart" unit="BPM" />
        <CircularProgress value={8} max={12} color="text-sky-500" label="Sleep" unit="Hrs" />
      </div>

      <div className="h-[200px] w-full relative">
        <div className="absolute top-0 right-0 z-10 flex gap-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <div className="w-2 h-2 rounded-full bg-rose-400"></div> Heart Rate
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <div className="w-2 h-2 rounded-full bg-indigo-400"></div> Activity
          </div>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mockTelemetryData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorHeart" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
            <YAxis hide />
            <Tooltip 
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgb(0 0 0 / 0.15)', padding: '12px 16px' }}
              labelStyle={{ color: '#64748b', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}
            />
            <Area 
              type="monotone" 
              dataKey="activity" 
              stroke="#6366f1" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorActivity)" 
              activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }}
            />
            <Area 
              type="monotone" 
              dataKey="heartRate" 
              stroke="#f43f5e" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorHeart)" 
              activeDot={{ r: 6, strokeWidth: 0, fill: '#f43f5e' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
