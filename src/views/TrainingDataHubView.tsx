import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Database, FileText, CheckCircle2, Upload, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TrainingDataHubView() {
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mockInteractions = [
    { id: 1, user: 'User 1', prompt: 'Pet has cough', response: 'Suggest hydration and rest', collected: true },
    { id: 2, user: 'User 2', prompt: 'Diet recommendations?', response: 'Vegetable diet based on species...', collected: false },
  ];

  const topicData = [
    { name: 'Diet', count: 450 },
    { name: 'Behavior', count: 320 },
    { name: 'Urgent Care', count: 180 },
    { name: 'Check-up', count: 550 },
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      // Simulate processing
      setTimeout(() => {
        setIsProcessing(false);
        alert('File processed and integrated into training vectors.');
      }, 2000);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-3xl p-6 border border-slate-200/50 shadow-xs flex flex-col gap-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[10px] font-black tracking-widest uppercase text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
            AI Training Hub
          </span>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-3 font-display">Interaction Data Management</h2>
          <p className="text-xs text-slate-500 mt-1">Manage, curate, and export interaction data for refining RuRu's models.</p>
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
        >
          {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          Import CSV
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          className="hidden" 
          accept=".csv"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
            <p className="text-[10px] uppercase font-bold text-blue-600">Total Interactions</p>
            <p className="text-2xl font-black text-blue-950">2,451</p>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
            <p className="text-[10px] uppercase font-bold text-emerald-600">Collected for Training</p>
            <p className="text-2xl font-black text-emerald-950">1,208</p>
          </div>
      </div>

      <div className="h-64 mt-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4">Topic Distribution</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={topicData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip />
            <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Recent Interactions</h3>
        {mockInteractions.map(interaction => (
          <div key={interaction.id} className="border border-slate-100 rounded-xl p-4 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-3">
              <FileText className="text-slate-400" size={18} />
              <div>
                <h4 className="text-xs font-bold text-slate-800">{interaction.prompt}</h4>
                <p className="text-[10px] text-slate-500">{interaction.response}</p>
              </div>
            </div>
            <button className={`p-2 rounded-full ${interaction.collected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
              <CheckCircle2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
