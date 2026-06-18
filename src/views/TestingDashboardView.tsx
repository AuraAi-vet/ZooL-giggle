import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useTestingStore } from '../store/useTestingStore';
import { Activity, ShieldAlert, Monitor, Bug, ArrowRight, RefreshCw, BarChart } from 'lucide-react';

export default function TestingDashboardView() {
  const { perfMetrics, a11yIssues, interactionEvents, runA11yScan, isTrackingEvents, setTrackingEvents, clearInteractionEvents } = useTestingStore();
  const [activeTab, setActiveTab] = useState<'perf' | 'a11y' | 'interactions'>('perf');

  useEffect(() => {
    runA11yScan();
  }, [runA11yScan]);

  const latestLCP = perfMetrics.filter(m => m.type === 'lcp').pop();
  const apiCalls = perfMetrics.filter(m => m.type === 'api');
  const avgApiLatency = apiCalls.length > 0 
    ? apiCalls.reduce((sum, m) => sum + m.value, 0) / apiCalls.length 
    : 0;

  return (
    <div className="p-6 md:p-8 min-h-screen bg-[#F8FAFC]">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 font-display flex items-center gap-3">
          <Bug className="w-8 h-8 text-cyan-500" />
          Testing & Telemetry Dashboard
        </h1>
        <p className="text-slate-500 mt-2">Environment: <span className="font-mono bg-slate-200 px-2 rounded-md">PREVIEW_AI_STUDIO</span></p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Largest Contentful Paint</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">{latestLCP ? `${Math.round(latestLCP.value)}ms` : 'N/A'}</p>
            </div>
            <div className="p-3 bg-cyan-50 rounded-xl">
              <Activity className="w-6 h-6 text-cyan-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">A11y Violations</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">{a11yIssues.length}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-xl">
              <ShieldAlert className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Avg API Latency</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">{avgApiLatency > 0 ? `${Math.round(avgApiLatency)}ms` : 'N/A'}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <BarChart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="flex border-b border-slate-200 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('perf')}
            className={`px-6 py-4 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'perf' ? 'border-cyan-500 text-cyan-700' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
          >
            Performance Metrics
          </button>
          <button 
            onClick={() => setActiveTab('a11y')}
            className={`px-6 py-4 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'a11y' ? 'border-cyan-500 text-cyan-700' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
          >
             Accessibility (WCAG)
          </button>
          <button 
             onClick={() => setActiveTab('interactions')}
             className={`px-6 py-4 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'interactions' ? 'border-cyan-500 text-cyan-700' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
          >
            Interaction Trails
          </button>
        </div>

        <div className="p-6 md:p-8 bg-slate-50/50 min-h-[400px]">
           {activeTab === 'perf' && (
             <div className="space-y-4">
               <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4"><Activity className="w-5 h-5"/> Live Render & API Metrics</h3>
               {perfMetrics.length === 0 ? (
                 <p className="text-slate-500">No performance metrics recorded yet.</p>
               ) : (
                 <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                   <table className="w-full text-left text-sm">
                     <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                       <tr>
                         <th className="p-3 font-medium">Type</th>
                         <th className="p-3 font-medium">Metric Name</th>
                         <th className="p-3 font-medium">Value (ms)</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 font-mono text-xs">
                       {perfMetrics.slice().reverse().map((m, i) => (
                         <tr key={i} className="hover:bg-slate-50">
                           <td className="p-3"><span className="px-2 py-1 bg-slate-100 rounded-md text-slate-600">{m.type}</span></td>
                           <td className="p-3 text-slate-700 truncate max-w-xs">{m.name}</td>
                           <td className="p-3 font-semibold text-slate-800">{Math.round(m.value)} ms</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               )}
             </div>
           )}

           {activeTab === 'a11y' && (
             <div className="space-y-4">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="font-semibold text-slate-800 flex items-center gap-2"><ShieldAlert className="w-5 h-5"/> Lighthouse A11y Violations</h3>
                 <button onClick={runA11yScan} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors">
                   <RefreshCw className="w-4 h-4"/> Rescan DOM
                 </button>
               </div>
               
               {a11yIssues.length === 0 ? (
                 <div className="p-8 bg-green-50 border border-green-200 rounded-2xl flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <h4 className="font-semibold text-green-800">100% Core Compliance Assessed</h4>
                    <p className="text-green-600 mt-1 max-w-sm">No initial accessibility violations found in the currently mounted DOM.</p>
                 </div>
               ) : (
                 <div className="space-y-3">
                   {a11yIssues.map((issue, i) => (
                     <div key={i} className="bg-white p-4 border border-orange-200 border-l-4 border-l-orange-500 rounded-xl shadow-sm flex items-start gap-4">
                       <ShieldAlert className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                       <div>
                         <p className="font-semibold text-slate-800">{issue.issue}</p>
                         <p className="text-sm font-mono text-slate-500 mt-2 bg-slate-50 p-2 rounded-md border border-slate-100">{issue.element}</p>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           )}

           {activeTab === 'interactions' && (
             <div className="space-y-4">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Monitor className="w-5 h-5"/> Session Replay Trail</h3>
                 <div className="flex items-center gap-3">
                   <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                     <input type="checkbox" checked={isTrackingEvents} onChange={(e) => setTrackingEvents(e.target.checked)} className="rounded text-cyan-600 focus:ring-cyan-500 border-slate-300"/>
                     Tracking Active
                   </label>
                   <button onClick={clearInteractionEvents} className="text-sm font-medium text-rose-600 hover:text-rose-700 ml-2">Clear Logs</button>
                 </div>
               </div>

               {interactionEvents.length === 0 ? (
                 <p className="text-slate-500">Interact with the app outside this view to record events.</p>
               ) : (
                 <div className="space-y-2">
                   {interactionEvents.slice().reverse().map((ev, i) => (
                     <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl text-sm">
                       <span className="shrink-0 text-slate-400 text-xs w-20">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                       <span className={`px-2 py-0.5 rounded font-medium text-xs ${ev.type === 'click' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'} w-16 text-center`}>
                         {ev.type}
                       </span>
                       <span className="font-mono text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 truncate flex-1 min-w-0" title={ev.path}>
                         {ev.path}
                       </span>
                       {ev.value && (
                         <span className="text-slate-500 italic flex items-center gap-1 shrink-0"><ArrowRight className="w-3 h-3"/> "{ev.value}"</span>
                       )}
                     </div>
                   ))}
                 </div>
               )}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
