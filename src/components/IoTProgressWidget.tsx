
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
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-slate-100"
          />
          {/* Progress circle */}
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

export default function IoTProgressWidget() {
  return (
    <div className="bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] border border-slate-200/60 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
          IoT Telemetry
        </h2>
        <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-bold tracking-widest uppercase">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          Live
        </span>
      </div>
      <div className="flex items-center justify-around">
        <CircularProgress value={8540} max={10000} color="text-brand-secondary" label="Activity" unit="Steps" />
        <CircularProgress value={112} max={180} color="text-brand-primary" label="Heart" unit="BPM" />
        <CircularProgress value={8} max={12} color="text-blue-500" label="Sleep" unit="Hrs" />
      </div>
    </div>
  );
}
