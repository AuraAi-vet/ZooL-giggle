import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trash2, 
  Mic, 
  MapPin, 
  Sparkles, 
  Camera, 
  X, 
  MicOff, 
  Send,
  MessageSquare,
  Activity,
  ClipboardCheck,
  Building,
  Volume2,
  ExternalLink,
  AlertTriangle,
  Zap
} from 'lucide-react';
import Markdown from 'react-markdown';
import { Pet } from '../types';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';
import { translations } from '../lib/translations';
import { RuRuIcon } from '../components/RuRuIcon';
import { playAudio, AIPersona, getUsage, AICost } from '../services/geminiService';
import { compressImage } from '../lib/imageUtils';
import { getMaxDailyCredits } from '../services/geminiService';

interface AIViewProps {
  messages: { role: 'user' | 'ai'; text: string; groundingLinks?: { title: string, url: string }[] }[];
  onSend: () => void;
  input: string;
  setInput: (v: string) => void;
  isTyping: boolean;
  pets: Pet[];
  selectedPetId: string | null;
  onSelectPet: (id: string | null) => void;
  onLiveClick: () => void;
  aiImage: string | null;
  setAiImage: (v: string | null) => void;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onClearChat: () => void;
  persona: AIPersona;
  onSelectPersona: (p: AIPersona) => void;
}

export function AIView({ 
  messages, 
  onSend, 
  input, 
  setInput, 
  isTyping, 
  pets, 
  selectedPetId, 
  onSelectPet, 
  onLiveClick, 
  aiImage, 
  setAiImage, 
  isRecording, 
  onStartRecording, 
  onStopRecording, 
  onClearChat,
  persona,
  onSelectPersona
}: AIViewProps) {
  const { language, role } = useStore();
  const t = translations[language];
  const [showOptimizerInfo, setShowOptimizerInfo] = React.useState(false);
  const aiUsage = React.useMemo(() => getUsage(), [messages.length, isTyping]);
  const isLimited = aiUsage.creditsUsed >= getMaxDailyCredits();
  const powerPercent = Math.max(0, Math.min(100, ((getMaxDailyCredits() - aiUsage.creditsUsed) / getMaxDailyCredits()) * 100));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        try {
          const compressed = await compressImage(file);
          setAiImage(compressed);
        } catch (error) {
          console.error("Image compression failed", error);
        }
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAiImage(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-[calc(100vh-120px)] relative overflow-hidden max-w-5xl mx-auto px-4 md:px-8"
    >
      {/* Soft Ethereal Backgrounds */}
      <div className="absolute inset-0 pointer-events-none -z-10 bg-amber-50/40">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-100/40 blur-[120px] rounded-full mix-blend-multiply" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-rose-100/40 blur-[120px] rounded-full mix-blend-multiply" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-amber-200/20 blur-[150px] rounded-full mix-blend-multiply" />
      </div>

      <header className="py-8 space-y-6 sticky top-0 z-[30] bg-transparent">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
          <div className="flex items-center gap-5">
            <div className="relative">
               <RuRuIcon role={role} size={64} status={isTyping ? 'speaking' : isRecording ? 'listening' : 'idle'} className="bg-white rounded-3xl shadow-xl border border-slate-100" />
               <motion.div 
                 animate={{ opacity: [0.4, 1, 0.4] }}
                 transition={{ duration: 2, repeat: Infinity }}
                 className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-white shadow-sm"
               />
            </div>
            <div className="space-y-1 relative">
              <h2 className="text-4xl font-display font-extrabold text-slate-900 tracking-tight leading-none">RuRu AI</h2>
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clinical Navigator</span>
                <span className="w-1 h-1 bg-slate-200 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Active Pipeline</span>
                <span className="w-1 h-1 bg-slate-200 rounded-full" />
                <button 
                  onClick={() => setShowOptimizerInfo(prev => !prev)}
                  className="text-[10px] font-bold uppercase text-indigo-600 bg-indigo-50/80 hover:bg-indigo-100 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95 border border-indigo-100/30"
                >
                  <Zap size={10} className="fill-indigo-600 animate-pulse text-indigo-600" />
                  -37% Prompt Load
                </button>
              </div>

              <AnimatePresence>
                {showOptimizerInfo && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute top-14 left-0 w-80 bg-white border border-indigo-100/60 p-5 rounded-3xl shadow-xl z-50 space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5 font-display">
                          <Sparkles size={12} className="text-indigo-500 animate-spin" style={{ animationDuration: '3s' }} />
                          Neural Prompt Optimizer
                        </h4>
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                          Active Token Shield
                        </p>
                      </div>
                      <button 
                        onClick={() => setShowOptimizerInfo(false)}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      Squeezes redundant attributes, maps verbose keys to micro-variables, and strips filler words—reducing prompt tokens by <strong className="text-indigo-600 font-extrabold">30% to 58%</strong> while preserving 100% veterinary/clinical reasoning.
                    </p>

                    <div className="grid grid-cols-2 gap-3.5 bg-indigo-50/40 p-3 rounded-2xl border border-indigo-100/30">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-indigo-400/80 uppercase tracking-wider">Compression</span>
                        <p className="text-lg font-black font-display text-indigo-950">-37% Avg</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-indigo-400/80 uppercase tracking-wider">Precision</span>
                        <p className="text-lg font-black font-display text-emerald-600">100% Lossless</p>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
                        <Activity size={12} className="text-indigo-500 shrink-0" />
                        <span>Strips generic metadata & attachments</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
                        <ClipboardCheck size={12} className="text-indigo-500 shrink-0" />
                        <span>Preserves diagnostics, doses, and history</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex flex-col items-end gap-1.5 min-w-[140px]">
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Neural Link</span>
                   <span className="text-xs font-bold text-slate-900">{Math.floor(powerPercent)}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                  <motion.div animate={{ width: `${powerPercent}%` }} className="h-full bg-slate-900 transition-all duration-1000" />
                </div>
             </div>
             
             <div className="h-10 w-px bg-slate-200 mx-2" />
             
             <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClearChat}
                className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-100 transition-all shadow-sm"
             >
                <Trash2 size={20} />
             </motion.button>
          </div>
        </div>

        {/* Tactical Controls Panel */}
        <div className="flex flex-wrap items-center gap-3 px-2">
            <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto no-scrollbar">
                {['Global', ...pets.map(p => p.name)].map((name, idx) => (
                  <button 
                    key={name}
                    onClick={() => onSelectPet(idx === 0 ? null : pets[idx-1].id)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2",
                      (idx === 0 ? selectedPetId === null : selectedPetId === pets[idx-1].id)
                        ? "bg-slate-900 text-white shadow-lg" 
                        : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    {idx > 0 && <img src={pets[idx-1].image} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />}
                    <span>{name}</span>
                  </button>
                ))}
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-2xl">
                {['doctor', 'nutritionist', 'behaviorist'].map((p) => (
                  <button 
                    key={p}
                    onClick={() => onSelectPersona(p as AIPersona)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      persona === p ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {p.substring(0, 3)}
                  </button>
                ))}
            </div>

            <motion.button 
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               onClick={onLiveClick}
               className="ml-auto px-6 py-3 bg-sky-500 text-white rounded-2xl shadow-lg shadow-sky-500/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
            >
               <Volume2 size={16} /> Live Sync
            </motion.button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pt-4 pb-20 space-y-12 no-scrollbar scroll-smooth">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center space-y-10 py-12">
             <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-white border border-slate-100 rounded-full shadow-sm">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 leading-none">Neural Link Established</span>
                </div>
                <h3 className="text-5xl font-display font-extrabold text-slate-900 tracking-tighter leading-none italic">
                   How should I assist <br/>
                   <span className="text-slate-300">your companion today?</span>
                </h3>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                {[
                  { title: 'Diagnostic Triage', desc: 'Visual & symptom evaluation', icon: ClipboardCheck, input: "Can you perform a clinical symptom assessment for my pet?" },
                  { title: 'Health Synthesis', desc: 'Diet, behavior & lifespans', icon: Activity, input: "What are the core nutrition requirements for my pet's breed?" },
                  { title: 'Spatial Logic', desc: 'Locate specialized care', icon: MapPin, input: "Find the nearest specialized veterinary hospitals" },
                  { title: 'Live Assistant', desc: 'Voice-activated health guidance', icon: Volume2, input: null, action: onLiveClick }
                ].map((item, idx) => (
                  <motion.button 
                    key={idx}
                    whileHover={{ y: -4, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)' }}
                    onClick={item.action || (() => setInput(item.input!))}
                    className="p-6 bg-white border border-slate-100 rounded-[2.5rem] text-left transition-all shadow-sm hover:border-slate-900 group flex items-center gap-5"
                  >
                    <div className="w-14 h-14 rounded-3xl bg-slate-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all flex items-center justify-center shrink-0">
                       <item.icon size={28} />
                    </div>
                    <div>
                        <h5 className="text-xl font-display font-extrabold text-slate-900 leading-none mb-1">{item.title}</h5>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 opacity-70 leading-none">{item.desc}</p>
                    </div>
                  </motion.button>
                ))}
             </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div 
            key={`msg-${i}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex flex-col space-y-3",
              msg.role === 'user' ? "items-end" : "items-start"
            )}
          >
            <div className={cn(
              "relative px-8 py-7 rounded-[2.5rem] text-md leading-relaxed max-w-[92%] md:max-w-[80%] transition-all duration-500 backdrop-blur-2xl",
              msg.role === 'user' 
                ? "bg-slate-900/80 text-white rounded-tr-none shadow-2xl shadow-slate-900/10 font-medium" 
                : "bg-white/70 border border-white/50 rounded-tl-none shadow-xl shadow-slate-200/40 text-slate-800"
            )}>
              <div className="markdown-body">
                <Markdown>{msg.text}</Markdown>
              </div>

              {msg.role === 'ai' && msg.text && (
                <button onClick={() => playAudio(msg.text)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-900 transition-colors">
                  <Volume2 size={18} />
                </button>
              )}
              
              {msg.groundingLinks && msg.groundingLinks.length > 0 && (
                <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                   {msg.groundingLinks.map((link, idx) => (
                      <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:border-slate-300 transition-all">
                         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
                            <ExternalLink size={18} />
                         </div>
                         <div className="min-w-0">
                            <span className="block truncate font-bold text-slate-950 text-sm">{link.title}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Clinical Source</span>
                         </div>
                      </a>
                   ))}
                </div>
              )}
            </div>
            <div className={cn("flex items-center gap-3 px-6 text-[10px] font-black uppercase tracking-widest text-slate-300", msg.role === 'user' && "flex-row-reverse")}>
               <span>{msg.role === 'user' ? 'Caregiver' : 'RuRu AI'}</span>
               <span className="w-1 h-1 bg-slate-200 rounded-full" />
               <span className="opacity-60">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-4 px-12">
            <div className="flex gap-2 p-4 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
              <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-slate-900 rounded-full" />
              <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-slate-900 rounded-full" />
              <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-slate-900 rounded-full" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Synthesizing clinical data...</span>
          </div>
        )}
      </div>

      {/* Input Module */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-bg-main via-bg-main/90 to-transparent pt-12 pb-8 px-8 z-[40]">
        <div className="max-w-3xl mx-auto space-y-4">
          <AnimatePresence>
            {aiImage && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-24 h-24 relative rounded-3xl overflow-hidden border-2 border-white shadow-2xl ml-4">
                 <img src={aiImage} alt="" className="w-full h-full object-cover" />
                 <button onClick={() => setAiImage(null)} className="absolute top-1 right-1 bg-slate-900 text-white p-1.5 rounded-xl shadow-lg"><X size={12}/></button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-3 p-2 bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl focus-within:border-slate-900 transition-all duration-300">
             <div className="relative group p-1 mb-1">
                <button className="w-11 h-11 bg-slate-50 text-slate-400 items-center justify-center rounded-full flex hover:bg-slate-100 hover:text-slate-900 transition-all">
                   <Camera size={20} />
                   <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                </button>
             </div>

             <textarea 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               placeholder={aiImage ? "Describe the symptoms..." : t.ai.placeholder}
               className="flex-1 bg-transparent py-4 px-2 text-md font-medium text-slate-900 focus:outline-none resize-none no-scrollbar placeholder:text-slate-300"
               rows={1}
               style={{ maxHeight: '120px' }}
             />

             <div className="flex items-center gap-2 pr-2 pb-1">
                <button 
                  onClick={isRecording ? onStopRecording : onStartRecording}
                  className={cn("w-11 h-11 rounded-full flex items-center justify-center transition-all", isRecording ? "bg-red-50 text-red-500 shadow-inner" : "text-slate-400 hover:bg-slate-50")}
                >
                  {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <button 
                  onClick={onSend}
                  disabled={!input.trim() && !aiImage}
                  className="w-12 h-12 bg-slate-900 text-white rounded-[1.25rem] shadow-xl flex items-center justify-center disabled:opacity-20 transition-all"
                >
                  <Send size={18} />
                </button>
             </div>
          </div>
          <p className="text-center text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">Enhanced by ZooL Medical Logic</p>
        </div>
      </div>
    </motion.div>
  );
}
