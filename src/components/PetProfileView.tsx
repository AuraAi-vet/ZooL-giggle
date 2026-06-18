import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Camera, 
  Activity, 
  Brain,
  Shield, 
  TrendingUp, 
  FileText, 
  Heart, 
  MessageCircle,
  Download,
  AlertCircle,
  Sparkles,
  Search,
  LayoutGrid,
  Loader2,
  Stethoscope,
  ClipboardList,
  History,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { Pet, HealthRecord, CommunityPost, PetDocument } from '../types';
import { ANIMAL_TYPES, ANIMAL_BREEDS } from '../lib/animalBreeds';
import { summarizeMedicalRecord, generateSOAPNote, SOAPNote } from '../services/geminiService';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';
import { toast } from 'sonner';
import { HealthAnalytics } from './HealthAnalytics';

import { DiagnosticTool } from './DiagnosticTool';

interface CareTimelineItem {
  id: string;
  date: string;
  type: 'vaccination' | 'checkup' | 'medication';
  title: string;
  description: string;
  status: 'completed' | 'upcoming';
  completedDate: string;
}

const DOG_TIMELINE: Omit<CareTimelineItem, 'status'>[] = [
  {
    id: 'def-1',
    date: 'Age 8 Weeks',
    type: 'vaccination',
    title: 'DHPP Booster #1',
    description: 'First core immunization defending against Distemper, Hepatitis, Parvovirus, and Parainfluenza.',
    completedDate: 'Completed'
  },
  {
    id: 'def-2',
    date: 'Age 12 Weeks',
    type: 'vaccination',
    title: 'DHPP Booster #2 & Rabies',
    description: 'Critical primary defense shield. Secondary boosters alongside core state Rabies immunization.',
    completedDate: 'Completed'
  },
  {
    id: 'def-3',
    date: 'Age 16 Weeks',
    type: 'vaccination',
    title: 'DHPP Booster #3 & Bordetella',
    description: 'Final booster for full immunization. Includes kennel cough prevention protocols.',
    completedDate: 'Pending'
  },
  {
    id: 'def-4',
    date: 'Age 6 Months',
    type: 'checkup',
    title: 'Dental & Spay/Neuter Consult',
    description: 'Lifecycle growth review mapping core alignment, weight indicators, and physical developments.',
    completedDate: 'Scheduled'
  },
  {
    id: 'def-5',
    date: 'Age 1 Year',
    type: 'medication',
    title: 'Annual Heartworm Prevention',
    description: 'Introduction to standard recurring safety logs and protective treatments.',
    completedDate: 'Scheduled'
  }
];

const CAT_TIMELINE: Omit<CareTimelineItem, 'status'>[] = [
  {
    id: 'def-1',
    date: 'Age 8 Weeks',
    type: 'vaccination',
    title: 'FVRCP Booster #1',
    description: 'Feline core immunity routing defending against Rhinotracheitis, Calicivirus, and Panleukopenia.',
    completedDate: 'Completed'
  },
  {
    id: 'def-2',
    date: 'Age 12 Weeks',
    type: 'vaccination',
    title: 'FVRCP Booster #2 & Rabies',
    description: 'Crucial secondary shield for building active antibodies, with primary Rabies dose.',
    completedDate: 'Completed'
  },
  {
    id: 'def-3',
    date: 'Age 16 Weeks',
    type: 'vaccination',
    title: 'FVRCP Booster #3 & FeLV',
    description: 'Finalizing core antibodies. Adds protective coverage for Feline Leukemia Virus.',
    completedDate: 'Pending'
  },
  {
    id: 'def-4',
    date: 'Age 6 Months',
    type: 'checkup',
    title: 'Sterilization Wellness Audit',
    description: 'Standard growth screening confirming healthy baseline markers prior to adolescent cycles.',
    completedDate: 'Scheduled'
  },
  {
    id: 'def-5',
    date: 'Age 1 Year',
    type: 'medication',
    title: 'Annual Parasite Preventative',
    description: 'Proactive preventative care targeting heartworm, fleas, ticks, and earmites.',
    completedDate: 'Scheduled'
  }
];

export function CareTimeline({ pet, records }: { pet: Pet; records: HealthRecord[] }) {
  const isDog = pet.type.toLowerCase() === 'dog';
  const customRecords = records
    .filter(r => r.petId === pet.id && ['vaccination', 'checkup', 'medication'].includes(r.type))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let timelineItems: CareTimelineItem[] = [];

  if (customRecords.length > 0) {
    timelineItems = customRecords.map((r, i) => ({
      id: r.id,
      date: r.date,
      type: r.type as any,
      title: r.title,
      description: r.description,
      status: 'completed',
      completedDate: r.date
    }));
  } else {
    const defaults = isDog ? DOG_TIMELINE : CAT_TIMELINE;
    timelineItems = defaults.map((item, index) => ({
      ...item,
      status: index < 2 ? 'completed' : 'upcoming'
    })) as CareTimelineItem[];
  }

  const [selectedItemId, setSelectedItemId] = useState<string>(timelineItems[0]?.id || '');
  const selectedItem = timelineItems.find(item => item.id === selectedItemId) || timelineItems[0];

  return (
    <section className="bg-white border border-ruru-teal/10 p-6 md:p-8 rounded-[3rem] shadow-sm space-y-6 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-4 bg-ruru-teal rounded-full" />
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">🏆 Lifecycle Care Timeline</h3>
            <p className="text-xs font-semibold text-ruru-navy/60 mt-0.5">Interactive medical logs & recommended vaccination roadmap.</p>
          </div>
        </div>
        <Sparkles size={16} className="text-ruru-teal animate-pulse" />
      </div>

      <div className="overflow-x-auto no-scrollbar py-4 -mx-6 px-6 relative">
        <div className="relative flex items-center justify-between min-w-[650px] px-8 py-6">
          <div className="absolute top-1/2 left-12 right-12 h-1 bg-slate-100 -translate-y-1/2 rounded-full z-0">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '105%' }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-ruru-teal rounded-full animate-pulse"
            />
          </div>

          {timelineItems.map((item, index) => {
            const isSelected = item.id === selectedItemId;
            return (
              <div 
                key={item.id}
                onClick={() => setSelectedItemId(item.id)}
                className="flex flex-col items-center cursor-pointer relative z-10 select-none group w-24"
              >
                <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 mb-2 text-center truncate w-full">
                  {item.date}
                </span>

                <motion.div
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative",
                    isSelected 
                      ? "border-ruru-navy bg-ruru-navy text-white shadow-lg"
                      : item.status === 'completed'
                        ? "border-emerald-500 bg-white text-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                        : "border-slate-200 bg-white text-slate-400 hover:border-slate-400"
                  )}
                >
                  {item.status === 'completed' && !isSelected && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                  )}

                  {item.type === 'vaccination' ? <Shield size={16} /> :
                   item.type === 'checkup' ? <Stethoscope size={16} /> :
                   <Heart size={16} />}
                </motion.div>

                <span className={cn(
                  "text-[9px] font-bold mt-2 text-center leading-tight line-clamp-2 w-full transition-colors",
                  isSelected ? "text-ruru-navy font-black" : "text-slate-500 group-hover:text-slate-700"
                )}>
                  {item.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {selectedItem && (
          <motion.div
            key={selectedItem.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="bg-white border border-ruru-teal/15 p-5 md:p-6 rounded-[2rem] shadow-[0_8px_25px_rgba(0,0,0,0.02)] space-y-4 relative overflow-hidden"
          >
            <div className={cn(
              "absolute top-0 left-0 w-full h-1",
              selectedItem.type === 'vaccination' ? "bg-emerald-500" :
              selectedItem.type === 'checkup' ? "bg-blue-500" : "bg-amber-500"
            )} />

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center border shrink-0",
                  selectedItem.type === 'vaccination' ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                  selectedItem.type === 'checkup' ? "bg-blue-50 border-blue-100 text-blue-600" :
                  "bg-amber-50 border-amber-100 text-amber-600"
                )}>
                  {selectedItem.type === 'vaccination' ? <Shield size={18} /> :
                   selectedItem.type === 'checkup' ? <Stethoscope size={18} /> :
                   <Heart size={18} />}
                </div>
                <div>
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 block">{selectedItem.date}</span>
                  <h4 className="text-sm font-bold text-slate-900 tracking-tight">{selectedItem.title}</h4>
                </div>
              </div>
              
              <span className={cn(
                "px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider self-start sm:self-center transition-all",
                selectedItem.status === 'completed'
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                  : "bg-amber-50 text-amber-600 border border-amber-100"
              )}>
                {selectedItem.completedDate}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {selectedItem.description}
            </p>

            <div className="bg-[#FDFBF7] border border-amber-500/10 rounded-2xl p-4 flex gap-3 items-start">
              <Sparkles size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-[8px] font-black uppercase tracking-widest text-amber-500 block mb-0.5">RuRu Care Insight</span>
                <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                  {selectedItem.type === 'vaccination' ? 'Ensure your pet is relaxed and hydrated. Keep vaccination records accessible in the Digital Vault for government compliance.' :
                   selectedItem.type === 'checkup' ? 'A baseline growth wellness audit enables early detection of nutritional or congenital anomalies. Take notes for your vet visit!' :
                   'Keep medication cycles uniform. Log administration immediately in the Daily Routine Hub to maintain continuity.'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

interface PetProfileViewProps {
  pet: Pet;
  records: HealthRecord[];
  posts: CommunityPost[];
  documents: PetDocument[];
  onClose: () => void;
  onUpdate: (id: string, data: Partial<Pet>) => void;
}

export function PetProfileView({ pet, records, posts, documents, onClose, onUpdate }: PetProfileViewProps) {
  const { role } = useStore();
  const [activeProfileTab, setActiveProfileTab] = useState<'overview' | 'analytics' | 'vault' | 'soap'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editedPet, setEditedPet] = useState(pet);

  const [recordSummaries, setRecordSummaries] = useState<Record<string, string>>({});
  const [isSummarizing, setIsSummarizing] = useState<Record<string, boolean>>({});
  const [generatedSOAP, setGeneratedSOAP] = useState<SOAPNote | null>(null);
  const [isGeneratingSOAP, setIsGeneratingSOAP] = useState(false);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);

  const handleSummarize = async (record: HealthRecord) => {
    setIsSummarizing(prev => ({ ...prev, [record.id]: true }));
    try {
      const summary = await summarizeMedicalRecord(record);
      setRecordSummaries(prev => ({ ...prev, [record.id]: summary }));
      toast.success("Record summarized successfully");
    } catch (e) {
      toast.error("Failed to generate summary");
    } finally {
      setIsSummarizing(prev => ({ ...prev, [record.id]: false }));
    }
  };

  const handleGenerateSOAP = async () => {
    setIsGeneratingSOAP(true);
    try {
      // Concatenate history for transcript-like context
      const transcript = `Pet: ${pet.name}, Breed: ${pet.breed}, History: ${records.map(r => `${r.date}: ${r.title} - ${r.description}`).join('; ')}`;
      const soap = await generateSOAPNote(transcript);
      setGeneratedSOAP(soap);
      toast.success("SOAP Note drafted by AI");
    } catch (e) {
      toast.error("Failed to generate SOAP note");
    } finally {
      setIsGeneratingSOAP(false);
    }
  };

  useEffect(() => {
    setEditedPet(pet);
  }, [pet]);

  // Manual save handler
  const handleSave = () => {
    onUpdate(pet.id, editedPet);
    setIsEditing(false);
  };

  const tabs = role === 'vet' ? [
    { id: 'overview', label: 'Patient Hub', icon: <Stethoscope size={16} /> },
    { id: 'soap', label: 'SOAP Notes', icon: <ClipboardList size={16} /> },
    { id: 'analytics', label: 'Diagnostic', icon: <TrendingUp size={16} /> },
    { id: 'vault', label: 'Vault', icon: <ShieldCheck size={16} /> },
  ] : [
    { id: 'overview', label: 'Overview', icon: <LayoutGrid size={16} /> },
    { id: 'analytics', label: 'Analytics', icon: <Activity size={16} /> },
    { id: 'vault', label: 'Vault', icon: <Shield size={16} /> },
  ];

  return (
    <div className={cn(
      "fixed inset-0 z-[70] flex flex-col font-sans",
      role === 'vet' ? "bg-slate-50" : "bg-[#FDFCFB]"
    )}>
      <header className={cn(
        "px-8 py-5 flex items-center justify-between sticky top-0 z-50 border-b",
        role === 'vet' ? "bg-white border-slate-200 shadow-sm" : "bg-white/95 backdrop-blur-3xl border-ruru-navy/10"
      )}>
        <div className="flex items-center gap-6">
          <button onClick={onClose} className="p-2.5 hover:bg-slate-50 rounded-2xl transition-all">
            <X size={20} className={role === 'vet' ? "text-slate-900" : "text-ruru-navy"} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className={cn(
                "text-[9px] font-black uppercase tracking-[0.3em]",
                role === 'vet' ? "text-blue-500" : "text-ruru-teal"
              )}>
                {role === 'vet' ? 'Clinical Chart • 502' : 'Pet Profile'}
              </span>
            </div>
            <h2 className="font-brand text-2xl tracking-tight text-slate-900">{pet.name}</h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {role === 'vet' && (
            <button className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-wider hover:bg-slate-200 transition-all border border-slate-200">
              <Download size={14} /> Export Chart
            </button>
          )}
          <button 
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
            className={cn(
              "px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all",
              isEditing 
                ? (role === 'vet' ? "bg-slate-900 text-white" : "bg-ruru-navy-light text-white")
                : "bg-slate-50 text-slate-500 hover:text-slate-900"
            )}
          >
            {isEditing ? 'Save' : 'Edit'}
          </button>
          {isEditing && (
            <button 
              onClick={() => {
                setEditedPet(pet);
                setIsEditing(false);
              }}
              className="px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-red-600 transition-all"
            >
              Cancel
            </button>
          )}
        </div>
      </header>

      <div className={cn(
        "flex overflow-x-auto no-scrollbar border-b",
        role === 'vet' ? "bg-white border-slate-200 px-6" : "bg-white/95 backdrop-blur-3xl border-ruru-navy/10"
      )}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveProfileTab(tab.id as any)}
            className={cn(
              "flex-1 flex items-center justify-center gap-3 py-5 px-6 transition-all text-[11px] font-black uppercase tracking-[0.2em] whitespace-nowrap border-b-[3px] -mb-px",
              activeProfileTab === tab.id 
                ? (role === 'vet' ? "border-slate-900 text-slate-900" : "border-ruru-navy-light text-ruru-navy-light")
                : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto p-8 space-y-10 pb-12 no-scrollbar scroll-smooth">
        {activeProfileTab === 'overview' && (
          <div className="max-w-5xl mx-auto space-y-10">
            <section className={cn(
              "p-10 flex flex-col md:flex-row items-center gap-10 rounded-[3.5rem] relative overflow-hidden",
              role === 'vet' ? "bg-white border border-slate-200 shadow-sm" : "pet-card"
            )}>
              {role === 'vet' && <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-bl-[10rem] -mr-20 -mt-20 blur-3xl opacity-50" />}
              
              <div className="relative group">
                <div className={cn(
                  "w-48 h-48 rounded-[2.5rem] p-1.5 overflow-hidden transition-all duration-700",
                  role === 'vet' ? "bg-slate-900 shadow-2xl rotate-3 group-hover:rotate-0" : "border-4 border-ruru-navy-light rounded-full p-1"
                )}>
                  <img src={isEditing ? editedPet.image : pet.image} alt={pet.name} className={cn("w-full h-full object-cover", role === 'vet' ? "rounded-[2.8rem]" : "rounded-full")} referrerPolicy="no-referrer" />
                </div>
                {isEditing && (
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[2.5rem] cursor-pointer">
                    <Camera className="text-white" size={32} />
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {}} />
                  </label>
                )}
              </div>
              
              <div className="flex-1 space-y-6 relative z-10 text-center md:text-left">
                {isEditing ? (
                  <div className="space-y-4">
                    <input 
                      type="text" 
                      value={editedPet.name}
                      onChange={(e) => setEditedPet({ ...editedPet, name: e.target.value })}
                      className="text-5xl font-brand w-full bg-transparent border-b border-slate-200 focus:outline-none focus:border-slate-900 tracking-tighter"
                    />
                    <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                      <select 
                        value={editedPet.type}
                        onChange={(e) => {
                          const newType = e.target.value;
                          setEditedPet({ ...editedPet, type: newType as any, breed: ANIMAL_BREEDS[newType]?.[0] || 'Unknown/Mixed' });
                        }}
                        className="text-sm font-medium text-slate-500 bg-transparent border-b border-slate-100 focus:outline-none focus:border-slate-900"
                      >
                        {ANIMAL_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      <select 
                        value={editedPet.breed || ''}
                        onChange={(e) => setEditedPet({ ...editedPet, breed: e.target.value })}
                        className="text-sm font-medium text-slate-500 bg-transparent border-b border-slate-100 focus:outline-none focus:border-slate-900 max-w-[150px]"
                      >
                        {(ANIMAL_BREEDS[editedPet.type] || ANIMAL_BREEDS['Other']).map(breed => (
                          <option key={breed} value={breed}>{breed}</option>
                        ))}
                      </select>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          value={editedPet.age}
                          onChange={(e) => setEditedPet({ ...editedPet, age: Number(e.target.value) })}
                          className="text-sm font-medium text-slate-500 w-12 bg-transparent border-b border-slate-100 focus:outline-none focus:border-slate-900"
                        />
                        <span className="text-sm text-slate-400">Yrs</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <h3 className="text-5xl font-brand text-slate-900 tracking-tighter mb-2 leading-none">{pet.name}</h3>
                      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Secondary Species: {pet.breed || pet.type}</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                       <div className="px-5 py-2 bg-slate-50 border border-slate-100 rounded-2xl">
                          <span className="block text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">Chronology</span>
                          <span className="text-[13px] font-bold text-slate-900">{pet.age} Years</span>
                       </div>
                       <div className="px-5 py-2 bg-slate-50 border border-slate-100 rounded-2xl">
                          <span className="block text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">Mass Indicator</span>
                          <span className="text-[13px] font-bold text-slate-900">{pet.weight || '12'} KG</span>
                       </div>
                       <div className="px-5 py-2 bg-blue-50 border border-blue-100 rounded-2xl">
                          <span className="block text-[8px] font-black uppercase tracking-[0.2em] text-blue-400 mb-0.5">Health Status</span>
                          <span className="text-[13px] font-bold text-blue-600">Optimal</span>
                       </div>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Horizontal Care Timeline */}
            <CareTimeline pet={pet} records={records} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <section className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-4 bg-slate-900 rounded-full" />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Vital Diagnostics</h3>
                    </div>
                    <Activity size={14} className="text-slate-300" />
                  </div>
                  <HealthAnalytics pet={pet} records={records} />
               </section>

               <section className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-4 bg-slate-900 rounded-full" />
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Social Footprint</h3>
                    </div>
                    <History size={14} className="text-slate-300" />
                  </div>
                  {posts.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 text-center border-dashed">
                      <p className="text-xs text-slate-400 font-medium italic">No public logs available for this subject.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {posts.map(post => (
                        <div key={post.id} className="bg-white border border-slate-100 rounded-[2.5rem] p-6 space-y-4 shadow-sm hover:border-blue-100 transition-all">
                          <p className="text-[13px] leading-relaxed text-slate-600">{post.content}</p>
                          <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
                            <span className="flex items-center gap-2 text-[10px] font-bold text-slate-400"><Heart size={14} className="text-rose-400" /> {post.likes}</span>
                            <span className="flex items-center gap-2 text-[10px] font-bold text-slate-400"><MessageCircle size={14} className="text-blue-400" /> {post.comments}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
               </section>
            </div>
          </div>
        )}

        {activeProfileTab === 'soap' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="bg-slate-900 text-white p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full -mr-48 -mt-48" />
              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/20">
                      <Sparkles size={24} className="text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400">Neural SOAP Engine</h3>
                      <p className="text-2xl font-brand mt-1 tracking-tight">Clinical Decision Support</p>
                    </div>
                  </div>
                  {!generatedSOAP && (
                    <button 
                      onClick={handleGenerateSOAP}
                      disabled={isGeneratingSOAP}
                      className="px-8 py-3 bg-white text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-100 transition-all disabled:opacity-50"
                    >
                      {isGeneratingSOAP ? 'Analyzing Stream...' : 'Synthesize Record'}
                    </button>
                  )}
                </div>
                
                {generatedSOAP ? (
                  <div className="prose prose-invert prose-slate max-w-none bg-slate-800/50 p-8 rounded-[2.5rem] border border-slate-700">
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-blue-400 uppercase text-[10px] font-black tracking-widest mb-1">Subjective</h4>
                        <p className="text-white font-medium">{generatedSOAP.subjective}</p>
                      </div>
                      <div>
                        <h4 className="text-blue-400 uppercase text-[10px] font-black tracking-widest mb-1">Objective</h4>
                        <p className="text-white font-medium">{generatedSOAP.objective}</p>
                      </div>
                      <div>
                        <h4 className="text-blue-400 uppercase text-[10px] font-black tracking-widest mb-1">Assessment</h4>
                        <p className="text-white font-medium">{generatedSOAP.assessment}</p>
                      </div>
                      <div>
                        <h4 className="text-blue-400 uppercase text-[10px] font-black tracking-widest mb-1">Plan</h4>
                        <p className="text-white font-medium">{generatedSOAP.plan}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-lg text-slate-400 font-medium leading-relaxed italic border-l-2 border-slate-800 pl-6">
                    Synthesize patient biometric history, previous clinical records, and owner reports into a structured SOAP documentation draft.
                  </p>
                )}
              </div>
            </section>

            <section className="space-y-4">
               <div className="flex items-center justify-between px-2">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Manual Entry Hub</h3>
                 <button className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest"><Plus size={14} /> New Manual Note</button>
               </div>
               <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 text-center space-y-4 shadow-sm border-dashed">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                     <ClipboardList size={32} />
                  </div>
                  <p className="text-xs text-slate-400 font-medium italic">Initial consultation pending. No manual SOAP entries found for this lifecycle stage.</p>
               </div>
            </section>
          </div>
        )}

        {activeProfileTab === 'analytics' && (
          <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="bg-white border border-slate-200 rounded-[3.5rem] p-10 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-[4rem]" />
               <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                  <div className="w-48 h-48 bg-slate-50 rounded-[2.5rem] flex items-center justify-center border border-slate-100 shadow-inner group-hover:rotate-12 transition-transform duration-1000">
                     <Activity size={80} className="text-slate-200" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3 text-blue-500 mb-2">
                      <Sparkles size={18} />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em]">Telemetry Correlation</span>
                    </div>
                    <p className="text-lg font-brand text-slate-900 tracking-tight leading-relaxed">
                      "Subject exhibits high consistency in biometric markers. Predicted seasonal shift in caloric requirements based on historical activity depth."
                    </p>
                    <div className="flex flex-wrap gap-3">
                       <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black tracking-widest border border-emerald-100">Zero Anomalies</span>
                       <span className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black tracking-widest border border-blue-100">100% Stability</span>
                       {role === 'vet' && (
                         <button 
                           onClick={() => setIsDiagnosticOpen(true)}
                           className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-black tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2"
                         >
                            <Brain size={12} /> Neural Diagnostic Suite
                         </button>
                       )}
                    </div>
                  </div>
               </div>
            </section>
            <HealthAnalytics pet={pet} records={records} />
          </div>
        )}

        {activeProfileTab === 'vault' && (
          <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-4 bg-slate-900 rounded-full" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Clinical Records</h3>
                </div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{records.length} Verified Entries</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {records.length > 0 ? records.map(record => (
                  <div key={record.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm space-y-4 group hover:border-blue-500/30 hover:shadow-xl transition-all">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center border",
                          record.type === 'vaccination' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-slate-50 border-slate-100 text-slate-600"
                        )}>
                          {record.type === 'vaccination' ? <Shield size={20} /> : <FileText size={20} />}
                        </div>
                        <div>
                          <h4 className="text-[15px] font-bold text-slate-900">{record.title}</h4>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{record.date}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-3">{record.description}</p>
                    
                    <div className="pt-4 flex items-center justify-between border-t border-slate-50">
                      <button 
                        onClick={() => handleSummarize(record)}
                        disabled={isSummarizing[record.id]}
                        className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-500 transition-colors disabled:opacity-50"
                      >
                        {isSummarizing[record.id] ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                        Neural Summary
                      </button>
                      <button className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900">Download PDF</button>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full py-20 text-center bg-white border border-slate-200 rounded-[2.5rem] border-dashed">
                    <p className="text-xs text-slate-400 font-medium italic">No biometric logs indexed in this cluster.</p>
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-4 bg-slate-900 rounded-full" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Diagnostics Vault</h3>
                </div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{documents.length} Assets Attached</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {documents.length > 0 ? documents.map(doc => (
                  <div key={doc.id} className="bg-white border border-slate-200 rounded-[2rem] p-5 flex flex-col justify-between group hover:border-blue-200 transition-all shadow-sm">
                    <div className="space-y-4">
                      <div className="w-full aspect-square bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-slate-200 border border-slate-100 group-hover:bg-blue-50 transition-colors">
                        <FileText size={48} />
                      </div>
                      <div>
                        <h4 className="text-[13px] font-black text-slate-900">{doc.title}</h4>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{doc.type}</p>
                      </div>
                    </div>
                    <button className="mt-4 w-full py-3 bg-slate-50 text-slate-400 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">
                      View Pathology
                    </button>
                  </div>
                )) : (
                   <div className="col-span-full py-20 text-center bg-slate-50 border border-slate-100 rounded-[2.5rem] border-dashed">
                      <AlertCircle size={48} className="mx-auto mb-4 text-slate-200" />
                      <p className="text-xs text-slate-400 font-medium">Digital archives remain empty.</p>
                   </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Manual Entry FAB (Vet Only) */}
      {role === 'vet' && (
        <div className="fixed bottom-10 right-10 z-[100]">
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            className="w-16 h-16 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-slate-900/40 border-4 border-slate-800"
          >
            <Plus size={28} />
          </motion.button>
        </div>
      )}
      {/* Modals */}
      <DiagnosticTool 
        isOpen={isDiagnosticOpen} 
        onClose={() => setIsDiagnosticOpen(false)} 
        pet={pet}
        records={records}
      />
    </div>
  );
}

import Markdown from 'react-markdown';
