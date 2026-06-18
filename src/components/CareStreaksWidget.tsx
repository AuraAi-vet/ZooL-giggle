import React from 'react';
import { Trophy } from 'lucide-react';

// ⚡ Bolt: Wrapped in React.memo to prevent unnecessary re-renders for a simple primitive-prop component
// Expected Impact: Eliminates re-renders when parent views fetch unrelated data
const CareStreaksWidget = React.memo(function CareStreaksWidget({ streak }: { streak: number }) {
  return (
    <div className="bg-amber-50 border border-amber-100 rounded-3xl p-5 flex items-center gap-4">
      <Trophy size={24} className="text-amber-500" />
      <div>
        <p className="text-[10px] font-black uppercase text-amber-900">Care Streak</p>
        <p className="text-xl font-black text-amber-950">{streak} Days</p>
      </div>
    </div>
  );
});

export default CareStreaksWidget;
