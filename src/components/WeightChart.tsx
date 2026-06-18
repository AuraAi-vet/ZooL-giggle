import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { motion } from 'motion/react';
import { TrendingUp } from 'lucide-react';
import { Pet } from '../types';

interface WeightChartProps {
  pets: Pet[];
}

export function WeightChart({ pets }: WeightChartProps) {
  // Use current pet weights to create a more realistic view
  const currentTotalWeight = pets.reduce((sum, pet) => sum + (pet.weight || 0), 0);
  
  // Data for the last 6 months (simulated growth)
  const data = [
    { name: 'Dec', weight: currentTotalWeight * 0.94 },
    { name: 'Jan', weight: currentTotalWeight * 0.95 },
    { name: 'Feb', weight: currentTotalWeight * 0.97 },
    { name: 'Mar', weight: currentTotalWeight * 0.98 },
    { name: 'Apr', weight: currentTotalWeight * 0.99 },
    { name: 'May', weight: currentTotalWeight },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/95 backdrop-blur-3xl border border-ruru-navy/10 rounded-[2.5rem] p-8 shadow-sm group hover:shadow-xl hover:shadow-ruru-navy-light/5 transition-all duration-500"
    >
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-xl font-brand text-ruru-navy flex items-center gap-2">
            Health Analytics
            <TrendingUp size={18} className="text-ruru-teal" />
          </h3>
          <p className="text-[10px] text-ruru-navy/60 font-bold uppercase tracking-widest mt-1">Growth & Vitals monitoring</p>
        </div>
        <div className="bg-[#F5F5F0] px-4 py-2 rounded-[1.5rem]">
          <span className="text-sm font-bold text-ruru-navy-light">{currentTotalWeight.toFixed(1)} kg</span>
          <span className="text-[10px] text-ruru-navy/60 ml-1">Total</span>
        </div>
      </div>

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="ruru-navy-light" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="ruru-navy-light" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EBE6" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#8B8B6B', fontSize: 10, fontWeight: 'bold' }} 
            />
            <YAxis 
              hide 
              domain={['dataMin - 1', 'dataMax + 1']} 
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                borderRadius: '16px', 
                border: '1px solid #F0EBE6',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                fontSize: '12px'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="weight" 
              stroke="ruru-navy-light" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorWeight)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex gap-4 overflow-x-auto no-scrollbar">
        {pets.map(pet => (
          <div key={pet.id} className="flex items-center gap-2 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-ruru-navy-light" />
            <span className="text-xs font-bold text-ruru-navy-light">{pet.name}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
