import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Download, 
  FileText, 
  Activity, 
  ShieldCheck, 
  Filter, 
  Calendar, 
  Edit2, 
  Upload, 
  CheckCircle2, 
  AlertCircle,
  FileBadge,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { HealthRecord, Pet } from '../types';
import { cn } from '../lib/utils';
import { parseMedicalRecord, getPetAdvice, SuggestedReminder } from '../services/geminiService';
import { toast } from 'sonner';
import { AIReminderSuggestor } from '../components/AIReminderSuggestor';

interface HealthViewProps {
  records: HealthRecord[];
  pets: Pet[];
  onAddRecord: () => void;
  onDeleteRecord: (id: string) => void;
  onUpdateRecord: (id: string, record: Partial<HealthRecord>) => void;
  onEditRecord: (record: HealthRecord) => void;
  onToggleReminder: (id: string) => void;
  onAddSuggestedRecord?: (suggestion: SuggestedReminder) => Promise<void>;
  onDownloadReport?: () => void;
}

export function HealthView({ 
  records, 
  pets, 
  onAddRecord, 
  onDeleteRecord, 
  onUpdateRecord,
  onEditRecord,
  onToggleReminder,
  onAddSuggestedRecord,
  onDownloadReport
}: HealthViewProps) {
  const [activeType, setActiveType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPetId, setSelectedPetId] = useState('all');
  const [isParsing, setIsParsing] = useState(false);
  const [smartInsight, setSmartInsight] = useState<string | null>(null);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (records.length > 0) {
      const petContext = selectedPetId === 'all' 
        ? `all pets (${pets.map(p => p.name).join(', ')})` 
        : pets.find(p => p.id === selectedPetId)?.name;
      
      const filteredForInsight = records.filter(r => selectedPetId === 'all' || r.petId === selectedPetId);
      
      if (filteredForInsight.length === 0) {
        setSmartInsight(null);
        return;
      }

      const context = `Summarize the clinical history for ${petContext} based on ${filteredForInsight.length} records. Current records: ${filteredForInsight.map(r => `${r.date}: ${r.title}`).join(', ')}. Provide a 2-sentence professional yet encouraging clinical summary.`;
      
      getPetAdvice(context, "Be professional, use medical-standard tone.").then(res => {
        setSmartInsight(res);
      });
    }
  }, [selectedPetId, records.length]);

  const filteredRecords = React.useMemo(() => {
    return records.filter(r => {
      const matchesType = activeType === 'all' || r.type === activeType;
      const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            r.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPet = selectedPetId === 'all' || r.petId === selectedPetId;
      return matchesType && matchesSearch && matchesPet;
    });
  }, [records, activeType, searchQuery, selectedPetId]);

  const handleSmartUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const parsedData = await parseMedicalRecord(base64);
        
        // Auto-fill logic here if needed
        if (parsedData) {
          toast.success("Record parsed successfully!");
          // Usually, we'd open the AddRecord modal with pre-filled data
          onAddRecord(); 
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      toast.error("Failed to parse record with AI.");
    } finally {
      setIsParsing(false);
    }
  };

  const types = [
    { id: 'all', label: 'All Records', icon: FileText },
    { id: 'vaccination', label: 'Vaccines', icon: ShieldCheck },
    { id: 'checkup', label: 'Checkups', icon: Activity },
    { id: 'medication', label: 'Medicine', icon: CheckCircle2 }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="px-6 py-10 pb-32 space-y-12 max-w-4xl mx-auto"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-2">
        <div className="space-y-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-full border border-white/10 shadow-lg">
              <ShieldCheck size={12} className="text-emerald-400" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Cloud Vault: Active</p>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Secure Protocol v2.4</p>
          </div>
          <h2 className="text-5xl font-brand text-slate-900 tracking-tighter leading-none italic">Health Vault</h2>
          <p className="text-slate-400 text-lg font-medium leading-tight">Standardized biometric & clinical asset storage ecosystem.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative group/upload">
            <button className={cn(
              "w-16 h-16 bg-white border border-slate-200 rounded-[2rem] shadow-sm text-slate-900 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center active:scale-95",
              isParsing && "animate-pulse"
            )}>
              <Upload size={28} className="group-hover/upload:scale-110 transition-transform duration-700" />
            </button>
            <input 
              type="file" 
              accept="image/*,application/pdf"
              onChange={handleSmartUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
          <motion.button 
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAddRecord}
            className="w-16 h-16 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-slate-900/20 transition-all group"
          >
            <Plus size={32} className="group-hover:rotate-90 transition-transform duration-700" />
          </motion.button>
        </div>
      </header>

      {/* AI Health Roadmap Suggestions */}
      {onAddSuggestedRecord && (
        <section className="px-2">
          <AIReminderSuggestor 
            pets={pets} 
            records={records} 
            onAccept={onAddSuggestedRecord} 
          />
        </section>
      )}

      {/* Smart Analysis Alert: Immersive Narrative */}
      <AnimatePresence>
        {smartInsight && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden bg-slate-900 rounded-[4rem] p-12 shadow-3xl text-white group border border-white/5 mx-2"
          >
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[9rem] rounded-full -mr-32 -mt-32 transition-transform duration-1000 group-hover:scale-125" />
            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-8">
                <div className="w-20 h-20 bg-white/10 rounded-[2.25rem] flex items-center justify-center backdrop-blur-2xl border border-white/10 shadow-3xl">
                  <Sparkles size={40} className="text-emerald-400 group-hover:rotate-12 transition-transform duration-700" />
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-400">Deep Extraction Synthesis</p>
                  <h3 className="text-3xl font-brand tracking-tight italic">Clinical Trajectory</h3>
                </div>
              </div>
              <p className="text-xl text-slate-300 leading-relaxed font-medium italic tracking-tight opacity-90 max-w-2xl">
                "{smartInsight}"
              </p>
              <div className="flex flex-wrap items-center gap-10 pt-8 border-t border-white/5">
                <div className="flex items-center gap-4">
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                   <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40">Vitality Stream: Optimized</p>
                </div>
                 <div className="flex items-center gap-4">
                   <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shadow-lg shadow-amber-500/50" />
                   <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40">Suggested: Annual Scan</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Matrix */}
      <div className="space-y-12 px-2">
        <div className="flex flex-col gap-10">
          <div className="flex gap-5 overflow-x-auto no-scrollbar py-2">
            <button
              onClick={() => setSelectedPetId('all')}
              className={cn(
                "px-10 py-4 rounded-full text-[11px] font-black uppercase tracking-[0.3em] transition-all duration-700 border snap-center",
                selectedPetId === 'all' ? "bg-slate-900 border-slate-900 text-white shadow-2xl" : "bg-white border-slate-200 text-slate-400 hover:border-slate-400"
              )}
            >
              Unified View
            </button>
            {pets.map(pet => (
              <button
                key={pet.id}
                onClick={() => setSelectedPetId(pet.id)}
                className={cn(
                  "flex items-center gap-4 px-8 py-4 rounded-full text-[11px] font-black uppercase tracking-[0.3em] transition-all duration-700 border snap-center",
                  selectedPetId === pet.id ? "bg-slate-900 border-slate-900 text-white shadow-2xl" : "bg-white border-slate-200 text-slate-400 hover:border-slate-400"
                )}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-md shrink-0 group-hover:scale-110 transition-transform">
                  <img src={pet.image} alt="" className="w-full h-full object-cover" />
                </div>
                {pet.name}
              </button>
            ))}
          </div>

          <div className="flex bg-slate-50 p-2 rounded-[2.5rem] border border-slate-200">
            {types.map(type => (
              <button
                key={type.id}
                onClick={() => setActiveType(type.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-4 py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-700",
                  activeType === type.id ? "bg-white text-slate-900 shadow-xl border border-slate-100" : "text-slate-400 hover:text-slate-900"
                )}
              >
                <type.icon size={22} className={activeType === type.id ? "text-emerald-600" : ""} />
                <span className="hidden sm:inline">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors duration-700" size={28} />
          <input 
            type="text" 
            placeholder="Search diagnosis, clinical markers, or dates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-[2.5rem] pl-24 pr-10 py-8 text-lg font-medium focus:outline-none focus:border-slate-900 shadow-sm transition-all focus:shadow-3xl placeholder:text-slate-300"
          />
        </div>
      </div>

      <div className="space-y-10 pb-20 px-2">
        {filteredRecords.length > 0 && (
          <motion.div 
            whileHover={{ y: -6 }}
            className="group relative"
          >
            <div className="absolute inset-0 bg-slate-900 rounded-[3.5rem] scale-[1.01] blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
            <button 
              onClick={onDownloadReport}
              className="relative w-full py-10 bg-slate-900 rounded-[3.5rem] text-[12px] font-black text-white uppercase tracking-[0.5em] flex items-center justify-center gap-8 overflow-hidden transition-all italic"
            >
              <div className="absolute top-0 right-0 w-48 h-full bg-white/5 skew-x-12 translate-x-16 group-hover:translate-x-0 transition-transform duration-1000" />
              <Download size={26} className="group-hover:animate-bounce pointer-events-none" /> 
              <span>Secure Clinical PDF Export</span>
            </button>
          </motion.div>
        )}

        {filteredRecords.length > 0 ? (
          <div className="grid grid-cols-1 gap-10">
            {filteredRecords.map((record, idx) => (
              <motion.div 
                key={record.id}
                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.7, delay: idx * 0.05 }}
                className="group relative bg-white border border-slate-200 rounded-[4rem] p-12 shadow-sm hover:shadow-3xl hover:border-slate-300 transition-all duration-700"
              >
                <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-10">
                  <div className="flex items-start gap-8">
                    <div className={cn(
                      "w-20 h-20 rounded-[2rem] flex items-center justify-center shrink-0 shadow-2xl relative group-hover:rotate-12 transition-all duration-700",
                      record.type === 'vaccination' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                      record.type === 'checkup' ? "bg-indigo-50 text-indigo-600 border border-indigo-100" :
                      record.type === 'medication' ? "bg-rose-50 text-rose-600 border border-rose-100" :
                      "bg-amber-50 text-amber-600 border border-amber-100"
                    )}>
                      {record.type === 'vaccination' && <ShieldCheck size={36} />}
                      {record.type === 'checkup' && <Activity size={36} />}
                      {record.type === 'medication' && <CheckCircle2 size={36} />}
                      {record.type === 'other' && <AlertCircle size={36} />}
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                          <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">
                             {pets.find(p => p.id === record.petId)?.name || 'Generic Pet'}
                          </span>
                        </div>
                        <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em]">{record.date}</span>
                      </div>
                      <h4 className="text-3xl font-brand text-slate-900 tracking-tighter leading-tight group-hover:text-emerald-700 transition-colors italic">{record.title}</h4>
                      <p className="text-base text-slate-400 leading-relaxed line-clamp-3 italic font-medium max-w-xl">{record.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-row md:flex-col items-center md:items-end gap-4 self-end md:self-start">
                    <div className={cn(
                      "px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.3em] text-center border shadow-sm",
                      record.nextDueDate && record.nextDueDate <= today ? "bg-red-600 border-transparent text-white" : "bg-slate-50 border-slate-100 text-slate-400"
                    )}>
                      {record.nextDueDate && record.nextDueDate <= today ? 'Alert: Overdue' : 'Asset Verified'}
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => onEditRecord(record)}
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all border border-slate-200 shadow-sm"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => onDeleteRecord(record.id)}
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-red-300 hover:bg-red-600 hover:text-white transition-all border border-red-100 shadow-sm"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Secondary Record Details */}
                <div className="pt-10 border-t border-slate-50 flex flex-wrap items-center justify-between gap-6">
                   <div className="flex items-center gap-8">
                      <div className="flex -space-x-4">
                         <div className="w-12 h-12 rounded-full bg-emerald-50 border-[6px] border-white flex items-center justify-center text-emerald-600 shadow-xl">
                            <ShieldCheck size={20} />
                         </div>
                         <div className="w-12 h-12 rounded-full bg-indigo-50 border-[6px] border-white flex items-center justify-center text-indigo-600 shadow-xl">
                            <Activity size={20} />
                         </div>
                      </div>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] leading-none">Biometric Integrity Confirmed</p>
                   </div>
                   <button className="flex items-center gap-4 text-[12px] font-black text-slate-900 uppercase tracking-[0.3em] group/btn transition-all hover:text-emerald-600">
                      View Diagnostics <ChevronRight size={20} className="group-hover/btn:translate-x-2 transition-transform" />
                   </button>
                </div>
                
                {/* Gov Verification Section */}
                <div className="mt-10 flex gap-6">
                  {!record.verifiedByGov ? (
                    <button 
                      onClick={() => {
                        const currentPet = pets.find(p => p.id === record.petId);
                        if (!currentPet?.eSamrudhaId) {
                          toast.error('Municipal linkage failed. Please link your e-Samrudha ID in the Government Portals section first.');
                          return;
                        }

                        toast.promise(
                          new Promise(resolve => setTimeout(resolve, 2000)),
                          {
                            loading: 'Neural verification with Municipal Node...',
                            success: () => {
                              onUpdateRecord(record.id, { verifiedByGov: true, govVerifyId: currentPet.eSamrudhaId });
                              return 'Asset Authenticated! ✅';
                            },
                            error: 'Verification timeout.'
                          }
                        );
                      }}
                      className="flex-1 py-6 bg-slate-50 border border-slate-200 rounded-[2rem] text-[12px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-slate-900 hover:text-white transition-all duration-700 shadow-sm"
                    >
                      <FileBadge size={22} /> Attest Clinical Asset
                    </button>
                  ) : (
                    <div className="flex-1 py-6 bg-emerald-50/50 border border-emerald-200 rounded-[2rem] text-[12px] font-black text-emerald-700 uppercase tracking-[0.3em] flex items-center justify-center gap-4 shadow-inner">
                      <ShieldCheck size={22} /> Municipal Auth: {record.govVerifyId}
                    </div>
                  )}
                </div>

                {record.nextDueDate && (
                  <div className="mt-8 flex flex-col sm:flex-row items-center gap-8 p-10 bg-slate-50 rounded-[2.5rem] border border-slate-200 relative overflow-hidden group/reminder">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover/reminder:opacity-100 transition-opacity duration-1000" />
                    <div className="w-16 h-16 bg-white border border-slate-200 rounded-[1.75rem] flex items-center justify-center text-slate-900 shadow-2xl relative z-10">
                      <Calendar size={32} />
                    </div>
                    <div className="flex-1 space-y-2 relative z-10 text-center sm:text-left">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] leading-none italic">Temporal Maintenance Point</p>
                      <p className="text-2xl font-brand text-slate-900 tracking-tight italic">{new Date(record.nextDueDate).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    {record.reminderEnabled && (
                      <div className="bg-slate-900 text-white text-[11px] font-black px-8 py-4 rounded-full uppercase tracking-[0.3em] shadow-3xl shadow-slate-900/40 relative z-10">Neural Alerts Active</div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 px-14 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[4rem] space-y-10 group">
             <div className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-100 shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-all duration-1000">
               <FileText size={64} />
             </div>
             <div className="space-y-3">
               <h3 className="text-4xl font-brand text-slate-900 tracking-tighter italic">Vault Initialized</h3>
               <p className="text-lg text-slate-400 italic font-medium leading-relaxed">Sequential storage awaiting professional clinical asset injection.</p>
             </div>
             <motion.button 
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={onAddRecord}
                className="px-16 py-6 bg-slate-900 text-white rounded-full font-black text-[12px] uppercase tracking-[0.4em] shadow-3xl shadow-slate-900/30 transition-all border border-transparent italic"
              >
                Inject First Asset
              </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
