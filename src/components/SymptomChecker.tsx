import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Camera, AlertCircle, ChevronRight, Activity, Info } from 'lucide-react';
import { analyzeSymptoms } from '../services/geminiService';
import { compressImage } from '../lib/imageUtils';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';

export const SymptomChecker: React.FC = () => {
  const { pets } = useStore();
  const [selectedPetId, setSelectedPetId] = useState<string>('');
  const [symptoms, setSymptoms] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        setImage(compressedBase64);
      } catch (error) {
        console.error('Failed to compress image', error);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!symptoms.trim() && !image) return;
    
    setIsAnalyzing(true);
    try {
      const pet = pets.find(p => p.id === selectedPetId);
      const petContext = pet ? `${pet.name} is a ${pet.age}-year-old ${pet.breed || pet.type}.` : '';
      const analysis = await analyzeSymptoms(symptoms, image || undefined, petContext);
      setResult(analysis);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto pb-32">
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-sm shadow-red-500/50" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-ruru-navy/60">AI Diagnostics</p>
        </div>
        <h2 className="text-4xl font-brand text-ruru-navy tracking-tighter">Symptom Checker</h2>
        <p className="text-ruru-navy/60 text-sm font-medium">Describe what's happening or upload a photo for an instant triage.</p>
      </div>

      <div className="bg-white/95 backdrop-blur-3xl rounded-[2.5rem] p-10 shadow-sm border border-ruru-navy/10 space-y-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FDFBF7] rounded-bl-[6rem] -mr-16 -mt-16 transition-transform duration-1000 group-hover:scale-110 pointer-events-none" />
        
        <div className="relative z-10">
          <label className="block text-xs font-bold text-ruru-navy/60 uppercase mb-4 tracking-widest">Select Patient</label>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {pets.map(pet => (
              <button
                key={pet.id}
                onClick={() => setSelectedPetId(pet.id)}
                className={cn(
                  "flex-shrink-0 flex items-center gap-3 px-5 py-3 rounded-[1.5rem] border-2 transition-all duration-300",
                  selectedPetId === pet.id 
                    ? "bg-ruru-navy border-ruru-navy text-white shadow-lg" 
                    : "bg-white/95 backdrop-blur-3xl border-ruru-navy/10 text-ruru-navy/60 hover:border-[#DCD7D1]"
                )}
              >
                <img src={pet.image} alt={pet.name} className="w-8 h-8 rounded-lg object-cover" />
                <span className="font-bold text-sm">{pet.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <label className="block text-xs font-bold text-ruru-navy/60 uppercase mb-4 tracking-widest">Clinical Observations</label>
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="e.g. Limping on back left leg, lethargic..."
            className="w-full bg-[#FDFCFB] border-2 border-ruru-navy/10 rounded-[2rem] px-6 py-5 h-40 focus:outline-none focus:border-ruru-navy-light text-sm transition-colors resize-none placeholder:text-[#A8A29E]"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 relative z-10">
          <div className="relative flex-1">
            <button className="w-full h-[60px] flex items-center justify-center gap-3 bg-[#FDFBF7] rounded-[1.5rem] text-ruru-navy-light font-bold text-xs uppercase tracking-widest hover:bg-[#EBEBE0] transition-colors border-2 border-transparent hover:border-white/50">
              <Camera size={20} />
              {image ? 'Change Evidence' : 'Attach Photo'}
            </button>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
          {image && (
            <div className="w-[60px] h-[60px] rounded-[1.5rem] overflow-hidden border-2 border-ruru-navy/10 relative group/img shadow-md">
              <img src={image} alt="Preview" className="w-full h-full object-cover" />
              <button onClick={() => setImage(null)} className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                 <AlertCircle size={20} />
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || (!symptoms.trim() && !image)}
          className="w-full py-4 bg-ruru-navy-light text-white rounded-[1.5rem] font-bold shadow-lg shadow-ruru-navy-light/20 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Activity size={20} />
              Check Symptoms
            </>
          )}
        </button>
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className={cn(
            "p-6 rounded-[2.5rem] border flex gap-4",
            result.severity === 'emergency' || result.severity === 'high' ? "bg-red-50 border-red-100" :
            result.severity === 'medium' ? "bg-orange-50 border-orange-100" :
            "bg-emerald-50 border-ruru-teal-100"
          )}>
            <div className={cn(
              "w-12 h-12 rounded-[1.5rem] flex items-center justify-center flex-shrink-0",
              result.severity === 'emergency' || result.severity === 'high' ? "bg-red-100 text-red-600" :
              result.severity === 'medium' ? "bg-orange-100 text-orange-600" :
              "bg-emerald-100 text-emerald-600"
            )}>
              {result.severity === 'emergency' || result.severity === 'high' ? <AlertCircle size={24} /> : <Activity size={24} />}
            </div>
            <div>
              <h3 className="font-bold text-lg capitalize">{result.severity} Priority Assessment</h3>
              <p className="text-sm opacity-80 leading-snug">{result.assessment}</p>
            </div>
          </div>

          {result.isVisualAnalysis && result.findings && result.findings.length > 0 && (
            <div className="bg-white/95 backdrop-blur-3xl rounded-[2.5rem] p-6 shadow-sm border border-ruru-navy/10 space-y-4">
              <h4 className="font-bold flex items-center gap-2 text-ruru-navy-light">
                <Camera size={18} />
                Visual Finding Indicators
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.findings.map((finding: string, i: number) => (
                  <div key={`finding-${i}`} className="flex items-center gap-3 p-3 bg-emerald-50 border border-ruru-teal-100 rounded-[1.5rem]">
                    <div className="w-2 h-2 bg-ruru-teal rounded-full animate-pulse" />
                    <span className="text-xs font-bold text-emerald-900">{finding}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white/95 backdrop-blur-3xl rounded-[2.5rem] p-6 shadow-sm border border-ruru-navy/10 space-y-4">
            <h4 className="font-bold flex items-center gap-2">
              <Info size={18} className="text-ruru-navy-light" />
              Recommendations
            </h4>
            <div className="space-y-3">
              {result.recommendations.map((rec: string, i: number) => (
                <div key={`rec-${i}`} className="flex items-start gap-2 text-sm text-ruru-navy-light bg-[#F5F5F0] px-3 py-2 rounded-[1.25rem]">
                  <div className="w-1.5 h-1.5 rounded-full bg-ruru-navy-light mt-2 shrink-0" />
                  {rec}
                </div>
              ))}
            </div>
            {result.suggestedSpecialist && (
              <div className="mt-4 p-4 bg-ruru-navy rounded-[1.5rem]">
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Suggested Specialist</p>
                <p className="text-white font-bold">{result.suggestedSpecialist}</p>
              </div>
            )}
            
            {/* Actionable Triage Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'services' }))}
                className="flex items-center justify-center gap-2 py-4 bg-ruru-navy text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest"
              >
                Find Nearest Clinic <ChevronRight size={14} />
              </button>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'chat' }))}
                className="flex items-center justify-center gap-2 py-4 bg-ruru-teal text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-ruru-magenta transition-colors"
              >
                Ask RuRu Assistant <ChevronRight size={14} />
              </button>
            </div>

            <div className="pt-2">
              <p className="text-xs text-ruru-navy/60 italic">
                Disclaimer: This is an AI-powered triage tool and not a replacement for professional veterinary advice. Always consult a vet for emergencies.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
