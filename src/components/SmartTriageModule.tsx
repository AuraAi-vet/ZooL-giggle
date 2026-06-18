import { useState } from 'react';
import { AlertCircle, Calendar, Plus, Bot, HeartPulse, Loader2, ArrowRight } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

interface TriageResult {
  action: 'emergency' | 'routine';
  reason: string;
  recommendation: string;
}

interface SmartTriageModuleProps {
  onBookRoutine?: () => void;
}

export default function SmartTriageModule({ onBookRoutine }: SmartTriageModuleProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [symptoms, setSymptoms] = useState('');
  const [petType, setPetType] = useState('Dog');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);

  const handleAnalyze = async () => {
    if (!symptoms.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/gemini/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms, petType }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      setResult(data);
    } catch (error) {
      console.error("Triage Error:", error);
      alert("Unable to process triage at this time. If this is an emergency, please contact your vet immediately.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetForm = () => {
    setIsOpen(false);
    setSymptoms('');
    setResult(null);
  };

  if (!isOpen) {
    return (
      <div className="bg-gradient-to-r from-indigo-500 rounded-3xl p-6 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.12)] to-purple-600 flex flex-col md:flex-row items-center justify-between text-white border border-indigo-400">
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-xl shrink-0">
            <HeartPulse className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Smart Triage Assistant</h2>
            <p className="text-indigo-100 text-sm font-medium opacity-90 mt-0.5">Describe symptoms to get immediate AI guidance.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(true)}
          className="w-full md:w-auto px-6 py-3 bg-white text-indigo-600 hover:bg-slate-50 font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
        >
          <Bot className="w-5 h-5" /> Analyze Symptoms
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] border border-slate-200/60 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Smart Triage</h2>
            <p className="text-xs font-semibold text-slate-500">AI Symptom Checker</p>
          </div>
        </div>
        <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 font-medium text-sm transition-colors">
          Cancel
        </button>
      </div>

      {!result ? (
        <div className="flex flex-col gap-4">
          <div className="flex gap-3">
            <select 
              value={petType} 
              onChange={(e) => setPetType(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium shrink-0"
            >
              <option value="Dog">Dog</option>
              <option value="Cat">Cat</option>
              <option value="Bird">Bird</option>
              <option value="Other">Other</option>
            </select>
            <input 
              type="text" 
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g., Lethargic, hasn't eaten in 2 days..." 
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            />
          </div>
          <button 
            onClick={handleAnalyze} 
            disabled={!symptoms.trim() || isAnalyzing}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 tracking-wide shadow-md shadow-indigo-200"
          >
            {isAnalyzing ? (
               <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</>
            ) : (
               <><Bot className="w-5 h-5" /> Get Assessment</>
            )}
          </button>
          
          <p className="text-[10px] text-center text-slate-400 uppercase font-bold tracking-wider mt-2">
            Not a substitute for professional veterinary advice
          </p>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-5">
           <div className={`p-4 rounded-2xl flex items-start gap-4 border ${result.action === 'emergency' ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
              <div className={`p-2 rounded-xl shrink-0 ${result.action === 'emergency' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {result.action === 'emergency' ? <AlertCircle className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
              </div>
              <div className="flex flex-col">
                <h3 className={`text-lg font-bold ${result.action === 'emergency' ? 'text-rose-800' : 'text-emerald-800'}`}>
                   {result.action === 'emergency' ? 'Emergency Care Recommended' : 'Routine Checkup Advised'}
                </h3>
                <p className={`text-sm mt-1 font-medium ${result.action === 'emergency' ? 'text-rose-700/80' : 'text-emerald-700/80'}`}>
                  {result.reason}
                </p>
              </div>
           </div>
           
           <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
             <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Next Step</h4>
             <p className="text-slate-800 font-medium">{result.recommendation}</p>
           </div>
           
           <div className="flex gap-3">
              <button onClick={resetForm} className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm text-center">
                 Check Another
              </button>
              {result.action === 'emergency' ? (
                 <a href="tel:911" className="flex-1 py-3 px-4 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-md shadow-rose-200 transition-colors flex justify-center items-center gap-2 text-sm">
                   Call Vet ER
                 </a>
              ) : (
                 <button onClick={() => onBookRoutine ? onBookRoutine() : window.location.hash = '#book-appointment'} className="flex-1 py-3 px-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-colors flex justify-center items-center gap-2 text-sm">
                   Book Now <ArrowRight className="w-4 h-4" />
                 </button>
              )}
           </div>
        </div>
      )}
    </div>
  );
}
