import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Calendar as CalendarIcon, 
  FileText, 
  Mic, 
  MicOff, 
  Save, 
  Clipboard, 
  Search,
  ChevronRight,
  Clock,
  CheckCircle2,
  Plus,
  Loader2,
  X,
  Phone,
  ClipboardList,
  AlertTriangle,
  ShieldCheck,
  LayoutDashboard,
  Activity,
  Sparkles,
  ShieldAlert,
  Stethoscope,
  Download,
  History,
  ChevronDown,
  ChevronUp,
  FileBadge,
  Shield
} from 'lucide-react';
import { Calendar as ReactBigCalendar } from 'react-big-calendar';
import moment from 'moment';
import { momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useStore } from '../store/useStore';
import { 
  generateSOAPNote, 
  transcribeAudio, 
  getClinicalAssessment, 
  getPatientSnapshot,
  getProactiveSuggestions,
  type SOAPNote, 
  type ClinicalAssessment 
} from '../services/geminiService';
import { AICostDashboard } from './AICostDashboard';
import { Pet, Appointment, UserProfile, BlockedSlot, PatientSnapshot, ProactiveSuggestion } from '../types';
import { cn } from '../lib/utils';
import { toast } from 'sonner';


const localizer = momentLocalizer(moment);
interface VetDashboardProps {
  userProfile?: UserProfile | null;
}

export const VetDashboard = React.memo<VetDashboardProps>(({ userProfile }) => {
  const pets = useStore(state => state.pets);
  const healthRecords = useStore(state => state.healthRecords);
  const addRecord = useStore(state => state.addRecord);
  const appointments = useStore(state => state.appointments);
  const updateAppointment = useStore(state => state.updateAppointment);
  const blockedSlots = useStore(state => state.blockedSlots);
  const addBlockedSlot = useStore(state => state.addBlockedSlot);
  const deleteBlockedSlot = useStore(state => state.deleteBlockedSlot);
  // Memoize calendar events
  const calendarEvents = useMemo(() => {
    const aptEvents = appointments.map(apt => ({
      id: apt.id,
      title: `${apt.petName} - ${apt.serviceName}`,
      start: new Date(`${apt.date}T${apt.time}`),
      end: new Date(new Date(`${apt.date}T${apt.time}`).getTime() + 60 * 60 * 1000),
      isApt: true
    }));
    
    const blockEvents = blockedSlots.map(slot => ({
      id: slot.id,
      title: slot.reason ? `Blocked: ${slot.reason}` : `Blocked Slot`,
      start: new Date(`${slot.date}T${slot.time}`),
      end: new Date(new Date(`${slot.date}T${slot.time}`).getTime() + 60 * 60 * 1000),
      isApt: false
    }));

    return [...aptEvents, ...blockEvents];
  }, [appointments, blockedSlots]);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'patients' | 'scribe' | 'schedule' | 'labs'>('dashboard');
  const [isTelehealthActive, setIsTelehealthActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [soapNote, setSoapNote] = useState<SOAPNote | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [ruruContext, setRuruContext] = useState<string | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(false);

  const [patientSnapshots, setPatientSnapshots] = useState<Record<string, PatientSnapshot>>({});
  const [isGeneratingSnapshot, setIsGeneratingSnapshot] = useState<string | null>(null);
  const [proactiveSuggestions, setProactiveSuggestions] = useState<ProactiveSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const handleGenerateSnapshot = async (aptId: string) => {
    const apt = appointments.find(a => a.id === aptId);
    if (!apt) return;
    const pet = pets.find(p => p.id === apt.petId);
    if (!pet) return;

    setIsGeneratingSnapshot(aptId);
    try {
      const records = healthRecords.filter(r => r.petId === pet.id);
      const snapshot = await getPatientSnapshot(pet, records, apt);
      if (snapshot) {
        setPatientSnapshots(prev => ({ ...prev, [aptId]: snapshot }));
        toast.success(`Clinical snapshot generated for ${pet.name}`);
      }
    } catch (e) {
      toast.error("Failed to generate snapshot");
    } finally {
      setIsGeneratingSnapshot(null);
    }
  };

  const fetchProactiveSuggestions = async () => {
    if (pets.length === 0) return;
    setIsLoadingSuggestions(true);
    try {
      // Analyze top 3 patients needing checkups
      const suggestionPool = await Promise.all(
        pets.slice(0, 3).map(p => getProactiveSuggestions(p, healthRecords.filter(r => r.petId === p.id)))
      );
      setProactiveSuggestions(suggestionPool.flat());
    } catch (e) {
      console.error("Proactive scheduling failed", e);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'dashboard' && proactiveSuggestions.length === 0) {
      fetchProactiveSuggestions();
    }
  }, [activeTab]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Memoize stats
  const stats = useMemo(() => {
    const completedAppointments = appointments.filter(a => a.status === 'completed');
    const completedCount = completedAppointments.length;
    const totalDuration = completedAppointments.reduce((sum, appt) => sum + (appt.durationMinutes || 45), 0);
    const avgConsultDuration = completedCount > 0 ? Math.round(totalDuration / completedCount) : 0;
    const avgRecordCountPerPet = pets.length > 0 ? (healthRecords.length / pets.length).toFixed(1) : '0';

    return [
        { label: 'Today\'s Consultations', value: appointments.filter(a => a.date === new Date().toISOString().split('T')[0]).length.toString(), sub: '+2 from avg', icon: ClipboardList, color: 'text-blue-500' },
        { label: 'Emergency Alerts', value: '2', sub: 'Urgent Action', icon: AlertTriangle, color: 'text-red-500' },
        { label: 'Patient Records', value: pets.length.toString(), sub: 'Total Managed', icon: Users, color: 'text-ruru-navy-light' },
        { label: 'AHD Sync Status', value: (
          <div className="w-full flex items-center gap-2">
            <div className="flex-1 h-2 bg-emerald-100 rounded-full overflow-hidden">
              <div className="h-full bg-ruru-teal" style={{ width: '98%' }}></div>
            </div>
            <span className="text-sm">98%</span>
          </div>
        ), sub: 'Healthy', icon: ShieldCheck, color: 'text-ruru-teal' },
        { label: 'Avg. Consult Duration', value: `${avgConsultDuration}m`, sub: 'Computed Avg', icon: Clock, color: 'text-purple-500' },
        { label: 'Patient Lifetime Value', value: avgRecordCountPerPet.toString(), sub: 'Avg. Records/Pet', icon: Sparkles, color: 'text-amber-500' },
    ];
  }, [appointments, pets, healthRecords]);

  // Memoize upcoming appointments
  const upcomingAppointments = useMemo(() => appointments
    .filter(apt => apt.status !== 'completed' && apt.status !== 'cancelled')
    .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime()), [appointments]);

  const appointmentGroupingSuggestions = useMemo(() => {
    const suggestions: any[] = [];
    const apts = upcomingAppointments;
    for (let i = 0; i < apts.length - 1; i++) {
        if (apts[i].ownerId === apts[i+1].ownerId) {
             suggestions.push({
                id: `group-${apts[i].id}-${apts[i+1].id}`,
                ownerId: apts[i].ownerId,
                ownerName: apts[i].ownerName || 'Unknown Owner',
                appointment1: apts[i],
                appointment2: apts[i+1]
             });
        }
    }
    return suggestions;
  }, [upcomingAppointments]);

  // Slot Management State
  const [selectedPetForBlocking, setSelectedPetForBlocking] = useState<string | undefined>();
  const [blockReason, setBlockReason] = useState<string>('');
  const timeSlots = Array.from({ length: 18 }, (_, i) => {
    const hour = Math.floor(i / 2) + 9;
    const minutes = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minutes}`;
  });

  const toggleSlot = async (slot: string) => {
    const existingSlot = blockedSlots.find(s => s.time === slot && s.vetId === userProfile?.uid);
    
    if (existingSlot) {
      await deleteBlockedSlot(existingSlot.id);
      toast.success(`Slot ${slot} is now available`);
    } else {
      await addBlockedSlot({
        vetId: userProfile?.uid || '',
        date: new Date().toISOString().split('T')[0],
        time: slot,
        petId: selectedPetForBlocking,
        reason: blockReason || (selectedPetForBlocking ? 'Pet Appointment' : 'Personal Time Off')
      });
      toast.success(`Slot ${slot} has been blocked for ${selectedPetForBlocking ? pets.find(p => p.id === selectedPetForBlocking)?.name : (blockReason || 'personal reasons')}`);
    }
  };

  // Disease Assessment State
  const [assessmentQuery, setAssessmentQuery] = useState('');
  const [isAssessing, setIsAssessing] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<ClinicalAssessment | null>(null);

  const handleAssessment = async () => {
    if (!assessmentQuery) return;
    setIsAssessing(true);
    try {
      const result = await getClinicalAssessment(assessmentQuery);
      if (result) {
        setAssessmentResult(result);
        toast.success('Clinical assessment complete');
      } else {
        toast.error('Assessment failed or rate limited');
      }
    } catch (e) {
      toast.error('Assessment failed');
    } finally {
      setIsAssessing(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: Appointment['status']) => {
    try {
      await updateAppointment(id, { status });
      toast.success(`Appointment marked as ${status}`);
    } catch (error) {
      toast.error('Failed to update appointment status');
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          setIsTranscribing(true);
          try {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const base64Audio = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(audioBlob);
              reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve(base64);
              };
              reader.onerror = reject;
            });
            
            const result = await transcribeAudio(base64Audio, 'audio/webm');
            setTranscript(prev => prev + (prev ? ' ' : '') + result);
          } catch (error) {
            console.error('Transcription error:', error);
            toast.error('Failed to transcribe audio.');
          } finally {
            setIsTranscribing(false);
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        toast.error('Microphone access is required for the scribe.');
      }
    }
  };

  const handleGenerateSOAP = async () => {
    setIsGenerating(true);
    try {
      const note = await generateSOAPNote(transcript);
      setSoapNote(note);
      toast.success('SOAP note generated successfully!');
    } catch (error) {
      toast.error('Failed to generate SOAP note.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartConsult = async (pet: Pet, telehealth = false) => {
    setSelectedPet(pet);
    setIsTelehealthActive(telehealth);
    setActiveTab('scribe');
    
    // Simulate fetching pre-consult AI summary
    setIsLoadingContext(true);
    setTimeout(() => {
      setRuruContext("Owner reported lethargy and decreased appetite for 48 hours. RuRu AI suggested monitoring intake and checking hydration. No vomiting reported originally.");
      setIsLoadingContext(false);
    }, 1500);
  };

  const handleSaveNote = async () => {
    if (!soapNote || !selectedPet) return;
    setIsSaving(true);
    try {
      await addRecord({
        petId: selectedPet.id,
        date: new Date().toISOString().split('T')[0],
        type: 'checkup',
        title: `Clinical Consultation - ${selectedPet.name}`,
        description: soapNote.assessment,
        clinicalNotes: `Subjective: ${soapNote.subjective}\nObjective: ${soapNote.objective}\nAssessment: ${soapNote.assessment}\nPlan: ${soapNote.plan}`,
        reminderEnabled: false
      });
      toast.success('Record saved to patient chart!');
      setSoapNote(null);
      setTranscript('');
      setActiveTab('patients');
    } catch (error) {
      toast.error('Failed to save record.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FDFCFB]">
      {/* Executive Command Header */}
      <div className="p-8 bg-white/95 backdrop-blur-3xl border-b border-ruru-navy/10 shadow-sm sticky top-0 z-30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-3xl font-brand text-ruru-navy">Clinical Workbench</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="w-2 h-2 bg-ruru-teal rounded-full animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-widest text-ruru-navy-light">{userProfile?.name || 'Practitioner'} • Professional Command</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden xl:flex items-center gap-6 px-6 py-3 bg-[#F5F5F0] rounded-[1.5rem] border border-ruru-navy/10">
              <div className="text-center">
                <p className="text-[10px] font-black uppercase text-ruru-navy/60">Ready</p>
                <p className="text-sm font-bold text-ruru-navy">{upcomingAppointments.length} Patients</p>
              </div>
              <div className="w-px h-6 bg-[#EAEAE5]" />
              <div className="text-center">
                <p className="text-[10px] font-black uppercase text-ruru-navy/60">Completed</p>
                <p className="text-sm font-bold text-ruru-navy">{appointments.filter(a => a.status === 'completed' && a.date === new Date().toISOString().split('T')[0]).length}</p>
              </div>
            </div>
            <div className="flex bg-[#F5F5F0] p-1 rounded-[1.5rem]">
              {(['dashboard', 'patients', 'scribe', 'schedule'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-5 py-2.5 rounded-[1.25rem] text-xs font-bold transition-all capitalize flex items-center gap-2",
                    activeTab === tab 
                      ? "bg-white/95 backdrop-blur-3xl text-ruru-navy shadow-sm" 
                      : "text-ruru-navy/60 hover:text-ruru-navy-light"
                  )}
                >
                  {tab === 'dashboard' && <LayoutDashboard size={14} />}
                  {tab === 'patients' && <Users size={14} />}
                  {tab === 'scribe' && <Mic size={14} />}
                  {tab === 'schedule' && <CalendarIcon size={14} />}
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

          {activeTab === 'dashboard' && (
            <div className="px-8 -mt-4 mb-4">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3"
              >
                {stats.slice(0, 5).map((stat, idx) => (
                  <div key={stat.label} className="bg-white/95 backdrop-blur-3xl border border-ruru-navy/10 rounded-[1.5rem] p-4 flex items-center gap-4 transition-all">
                    <div className={cn("w-8 h-8 rounded-lg bg-[#F5F5F0] flex items-center justify-center shrink-0", stat.color)}>
                      <stat.icon size={16} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-ruru-navy/60 uppercase tracking-tighter">{stat.label}</p>
                      <p className="text-sm font-bold text-ruru-navy">{stat.value}</p>
                    </div>
                  </div>
                ))}
                <AICostDashboard />
              </motion.div>
            </div>
          )}

      <div className="flex-1 overflow-y-auto p-8">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Clinical Hero: Next Patient */}
              {upcomingAppointments.length > 0 ? (
                <div className="bg-emerald-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-12 group">
                  <div className="relative z-10 flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="bg-ruru-teal/20 text-ruru-teal-light px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-ruru-teal-500/30">Immediate Priority</span>
                      <span className="text-ruru-teal-light/80 text-[10px] font-bold flex items-center gap-1">
                        <Clock size={12} /> Starts in {moment(`${upcomingAppointments[0].date}T${upcomingAppointments[0].time}`).fromNow(true)}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 mb-8">
                       <div className="relative">
                         <img 
                            src={pets.find(p => p.id === upcomingAppointments[0].petId)?.image || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=2043&auto=format&fit=crop'} 
                            alt="Next Patient" 
                            className="w-24 h-24 rounded-[2rem] object-cover border-4 border-ruru-teal-800/50 shadow-2xl"
                          />
                          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-ruru-teal rounded-full border-4 border-ruru-teal-900 flex items-center justify-center">
                            <Activity size={14} className="text-white" />
                          </div>
                       </div>
                       <div>
                         <h3 className="text-4xl font-brand mb-1">{upcomingAppointments[0].petName}</h3>
                         <p className="text-emerald-300/80 text-sm font-medium">{upcomingAppointments[0].serviceName} • {upcomingAppointments[0].type.toUpperCase()}</p>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white/5 backdrop-blur-md rounded-[1.5rem] p-4 border border-white/10">
                        <p className="text-[10px] text-ruru-teal-light font-bold uppercase mb-1">Breed</p>
                        <p className="font-bold text-sm">{pets.find(p => p.id === upcomingAppointments[0].petId)?.breed || 'N/A'}</p>
                      </div>
                      <div className="bg-white/5 backdrop-blur-md rounded-[1.5rem] p-4 border border-white/10">
                        <p className="text-[10px] text-ruru-teal-light font-bold uppercase mb-1">Last Visit</p>
                        <p className="font-bold text-sm">March 12</p>
                      </div>
                      <div className="bg-white/5 backdrop-blur-md rounded-[1.5rem] p-4 border border-white/10">
                        <p className="text-[10px] text-ruru-teal-light font-bold uppercase mb-1">AI Risk</p>
                        <p className="font-bold text-sm text-ruru-teal-light">Stable</p>
                      </div>
                      <div className="bg-white/5 backdrop-blur-md rounded-[1.5rem] p-4 border border-white/10">
                        <p className="text-[10px] text-ruru-teal-light font-bold uppercase mb-1">Clinical Snapshot</p>
                        {patientSnapshots[upcomingAppointments[0].id] ? (
                          <div className="flex items-center gap-2">
                             <CheckCircle2 size={12} className="text-ruru-teal-light" />
                             <p className="font-bold text-[10px]">Analyzed</p>
                          </div>
                        ) : (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleGenerateSnapshot(upcomingAppointments[0].id); }}
                            disabled={isGeneratingSnapshot === upcomingAppointments[0].id}
                            className="text-xs font-black text-ruru-teal-light hover:text-white transition-colors flex items-center gap-1"
                          >
                            {isGeneratingSnapshot === upcomingAppointments[0].id ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                            GENERATE
                          </button>
                        )}
                      </div>
                    </div>

                    {patientSnapshots[upcomingAppointments[0].id] && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 bg-black/20 rounded-[2.5rem] p-6 border border-white/10"
                      >
                         <div className="flex items-center gap-2 mb-4 text-ruru-teal-light">
                           <Sparkles size={16} />
                           <span className="text-[10px] font-black uppercase tracking-widest">AI Clinical Brief</span>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                               <div>
                                 <p className="text-[9px] font-bold text-ruru-teal-light/60 uppercase mb-1">Critical Findings</p>
                                 <ul className="space-y-1">
                                   {patientSnapshots[upcomingAppointments[0].id].criticalFindings.map((f, i) => (
                                     <li key={i} className="text-xs text-white/90 flex items-start gap-2">
                                       <div className="w-1 h-1 bg-ruru-teal-light rounded-full mt-1.5" />
                                       {f}
                                     </li>
                                   ))}
                                 </ul>
                               </div>
                               <div>
                                 <p className="text-[9px] font-bold text-ruru-teal-light/60 uppercase mb-1">Vitals Insight</p>
                                 <p className="text-xs text-white/90">Weight Trend: <span className="font-bold capitalize">{patientSnapshots[upcomingAppointments[0].id].vitals.weightTrend}</span></p>
                               </div>
                            </div>
                            <div className="space-y-4 text-left">
                               <div>
                                 <p className="text-[9px] font-bold text-ruru-teal-light/60 uppercase mb-1">Suggested Exam Focus</p>
                                 <div className="flex flex-wrap gap-2">
                                   {patientSnapshots[upcomingAppointments[0].id].diagnosticPathways.map((p, i) => (
                                     <span key={i} className="bg-white/10 border border-white/20 px-3 py-1 rounded-lg text-[9px] font-bold">{p}</span>
                                   ))}
                                 </div>
                               </div>
                               <div>
                                 <p className="text-[9px] font-bold text-ruru-teal-light/60 uppercase mb-1">Snapshot Summary</p>
                                 <p className="text-[11px] text-white/70 leading-relaxed italic line-clamp-3">"{patientSnapshots[upcomingAppointments[0].id].lastSummary}"</p>
                               </div>
                            </div>
                         </div>
                      </motion.div>
                    )}
                  </div>
                  
                  <div className="relative z-10 space-y-3 w-full md:w-auto">
                    <button 
                      onClick={() => {
                        const pet = pets.find(p => p.id === upcomingAppointments[0].petId);
                        if (pet) handleStartConsult(pet);
                      }}
                      className="w-full md:w-64 py-5 bg-white/95 backdrop-blur-3xl text-emerald-900 rounded-[2.5rem] font-black text-sm uppercase tracking-widest hover:bg-emerald-50 hover:scale-[1.02] transition-all shadow-xl flex items-center justify-center gap-3"
                    >
                      <Mic size={20} /> Open ClinScribe
                    </button>
                    {upcomingAppointments[0].type === 'telehealth' && (
                      <button 
                        onClick={() => {
                          const pet = pets.find(p => p.id === upcomingAppointments[0].petId);
                          if (pet) handleStartConsult(pet, true);
                        }}
                        className="w-full md:w-64 py-5 bg-emerald-800 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all border border-ruru-teal-700 flex items-center justify-center gap-3"
                      >
                        <Phone size={20} /> Telehealth Feed
                      </button>
                    )}
                  </div>

                  <Activity className="absolute -bottom-20 -right-20 text-white/5 w-[30rem] h-[30rem] group-hover:scale-110 transition-transform duration-1000" />
                </div>
              ) : (
                <div className="bg-emerald-900 rounded-[2.5rem] p-12 text-center text-white">
                  <p className="text-lg font-brand italic text-emerald-200">No immediate patients scheduled. Command Center at standby.</p>
                </div>
              )}

              {/* Rapid Command Bar */}
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={() => setActiveTab('patients')} className="px-6 py-4 bg-white/95 backdrop-blur-3xl border border-ruru-navy/10 rounded-[1.5rem] flex items-center gap-3 shadow-sm hover:border-ruru-navy-light transition-all group">
                  <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 group-hover:bg-ruru-teal group-hover:text-white transition-all">
                    <Users size={16} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-ruru-navy">Search Registry</span>
                </button>
                <div className="h-10 w-px bg-[#F0EBE6] hidden md:block" />
                <button onClick={() => setActiveTab('labs')} className="px-6 py-4 bg-white/95 backdrop-blur-3xl border border-ruru-navy/10 rounded-[1.5rem] flex items-center gap-3 shadow-sm hover:border-ruru-navy-light transition-all group">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Activity size={16} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-ruru-navy">AI Lab Center</span>
                </button>
                <button onClick={() => setActiveTab('scribe')} className="px-6 py-4 bg-white/95 backdrop-blur-3xl border border-ruru-navy/10 rounded-[1.5rem] flex items-center gap-3 shadow-sm hover:border-[rgb(90,90,64)] transition-all group">
                  <div className="p-2 bg-purple-50 rounded-lg text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all">
                    <Mic size={16} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-ruru-navy">Manual Scribe</span>
                </button>
                <button onClick={() => setActiveTab('schedule')} className="px-6 py-4 bg-white/95 backdrop-blur-3xl border border-ruru-navy/10 rounded-[1.5rem] flex items-center gap-3 shadow-sm hover:border-ruru-navy-light transition-all group">
                  <div className="p-2 bg-amber-50 rounded-lg text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all">
                    <CalendarIcon size={16} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-ruru-navy">Block Slots</span>
                </button>
              </div>

              {/* AI Proactive Prevention Roadmap */}
              <div className="bg-white/95 backdrop-blur-3xl border border-ruru-navy/10 rounded-[2.5rem] p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-brand text-ruru-navy flex items-center gap-3">
                      <Sparkles className="text-amber-500" size={24} /> Proactive Prevention Roadmap
                    </h3>
                    <p className="text-xs text-ruru-navy/60 mt-1">AI-suggested outreach for at-risk or due patients based on longitudinal history and breed insights.</p>
                  </div>
                  <button 
                    onClick={fetchProactiveSuggestions}
                    disabled={isLoadingSuggestions}
                    className="text-[10px] font-black uppercase tracking-widest text-amber-600 hover:text-amber-700 disabled:opacity-50"
                  >
                    {isLoadingSuggestions ? "Scanning Records..." : "Refresh Analysis"}
                  </button>
                </div>
                
                {proactiveSuggestions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {proactiveSuggestions.map((suggestion, idx) => (
                      <div key={idx} className="bg-[#FDFBF7] border border-ruru-navy/10 rounded-[2.5rem] p-6 relative overflow-hidden group hover:border-amber-200 transition-all">
                        <div className="relative z-10 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                              suggestion.priority === 'high' ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
                            )}>
                              {suggestion.priority} Priority
                            </span>
                            <span className="text-[9px] font-bold text-[#A8A29E]">{suggestion.suggestedDate}</span>
                          </div>
                          <div>
                             <h4 className="font-black text-[10px] text-ruru-navy/60 uppercase tracking-widest mb-1">{suggestion.petName}</h4>
                             <p className="text-base font-bold text-ruru-navy mb-1 capitalize">{suggestion.type.replace('_', ' ')}</p>
                             <p className="text-[10px] text-ruru-navy-light leading-relaxed line-clamp-3 italic opacity-80">"{suggestion.reason}"</p>
                          </div>
                          <button className="w-full py-3 bg-white/95 backdrop-blur-3xl border border-ruru-navy/10 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest text-ruru-navy hover:bg-ruru-navy hover:text-white transition-all shadow-sm">
                             Schedule Outreach
                          </button>
                        </div>
                        <Sparkles className="absolute -bottom-8 -right-8 text-amber-500/5 w-32 h-32 group-hover:scale-125 transition-transform duration-700" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-ruru-navy/60 italic bg-[#FDFBF7] rounded-[2.5rem] border border-dashed border-ruru-navy/10">
                    {isLoadingSuggestions ? "Processing biometric data..." : "No urgent proactive outreach needed at this moment."}
                  </div>
                )}
              </div>

              {appointmentGroupingSuggestions.length > 0 && (
                <div className="bg-white/95 backdrop-blur-3xl border border-ruru-navy/10 rounded-[2.5rem] p-8 shadow-sm">
                  <h3 className="text-2xl font-brand text-ruru-navy mb-6 flex items-center gap-3">
                    <Users className="text-ruru-teal" size={24} /> Consolidation Opportunities
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {appointmentGroupingSuggestions.map((group) => (
                      <div key={group.id} className="bg-[#FDFBF7] border border-ruru-navy/10 rounded-[2.5rem] p-6">
                         <p className="font-bold text-ruru-navy mb-2">Owner: {group.ownerName}</p>
                         <p className="text-xs text-ruru-navy/60 mb-4">{group.appointment1.petName} ({group.appointment1.time}) and {group.appointment2.petName} ({group.appointment2.time}) are scheduled consecutively. Suggest grouping for efficiency or a small discount.</p>
                         <button className="w-full py-3 bg-ruru-teal text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all">
                             Suggest Consolidated Visit
                         </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  {/* AHD Regional Epidemiology Sentinel */}
                  <div className="bg-ruru-navy rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl group">
                   <div className="relative z-10">
                     <div className="flex items-center justify-between mb-8">
                       <h3 className="text-2xl font-brand flex items-center gap-3">
                         <ShieldAlert className="text-ruru-teal-light" size={32} /> Regional Health Sentinel
                       </h3>
                       <div className="flex items-center gap-3">
                         <span className="bg-ruru-teal/20 text-ruru-teal-light px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-ruru-teal-500/30">Monitoring Active</span>
                       </div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-5 hover:bg-white/10 transition-all cursor-default">
                         <p className="text-[10px] font-black text-ruru-teal-light uppercase mb-2">Local Outbreaks</p>
                         <p className="text-base font-bold mb-1">Infectious Coryza</p>
                         <p className="text-[10px] text-white/50 leading-relaxed">Pathanamthitta Cluster: High secondary infection risk noted.</p>
                       </div>
                       <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-5 hover:bg-white/10 transition-all cursor-default">
                         <p className="text-[10px] font-black text-ruru-teal-light uppercase mb-2">Rabies Surveillance</p>
                         <p className="text-base font-bold mb-1">92% Compliance</p>
                         <p className="text-[10px] text-white/50 leading-relaxed">Target: 95%. Suggest vaccines for all unverified dogs today.</p>
                       </div>
                       <div className="bg-ruru-teal/10 border border-ruru-teal-500/20 rounded-[2.5rem] p-5 flex flex-col justify-center">
                         <p className="text-[10px] font-black text-ruru-teal-light uppercase mb-2">Clinical Directive</p>
                         <p className="text-xs font-bold leading-relaxed italic text-white/90">"Screen for respiratory distress in poultry cases reported within 15km."</p>
                       </div>
                     </div>
                   </div>
                   <Activity className="absolute -bottom-20 -right-20 text-ruru-teal/5 w-96 h-96 group-hover:scale-110 transition-transform duration-1000" />
                </div>
                <div className="bg-white/95 backdrop-blur-3xl border border-ruru-navy/10 rounded-[2rem] overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-ruru-navy/10 flex items-center justify-between">
                    <h3 className="font-bold text-ruru-navy flex items-center gap-2">
                      <Clock size={18} className="text-ruru-navy-light" /> Today's Triage Queue
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-ruru-teal rounded-full animate-pulse" />
                      <span className="text-[10px] font-bold text-emerald-600 uppercase">Live Queue</span>
                    </div>
                  </div>
                  <div className="divide-y divide-[#F0EBE6]">
                    {upcomingAppointments.length > 0 ? (
                      upcomingAppointments.map((apt, idx) => (
                        <motion.div 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          key={apt.id} 
                          className={cn("p-6 flex items-center justify-between hover:bg-[#FDFCFB] group", apt.type === 'telehealth' ? "bg-ruru-teal/5" : "")}
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-center w-16">
                              <p className="text-sm font-bold text-ruru-navy">{apt.time}</p>
                              <p className={cn("text-[10px] uppercase font-bold", apt.type === 'telehealth' ? "text-ruru-teal font-black" : "text-ruru-navy/60")}>{apt.type}</p>
                            </div>
                            <div className={cn("w-12 h-12 rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 transition-transform", apt.type === 'telehealth' ? 'bg-ruru-teal/10 text-ruru-teal' : 'bg-[#F5F5F0] text-ruru-navy-light')}>
                              {apt.type === 'telehealth' ? <Activity size={20} /> : <Stethoscope size={20} />}
                            </div>
                            <div>
                              <p className="font-bold text-ruru-navy underline-offset-4 group-hover:underline cursor-pointer" onClick={() => {
                                const pet = pets.find(p => p.id === apt.petId);
                                if (pet) {
                                  setSelectedPet(pet);
                                  setActiveTab('patients');
                                }
                              }}>{apt.petName}</p>
                              <p className="text-[10px] text-ruru-navy/60 uppercase font-medium">{apt.serviceName}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                             <button className="p-2 text-ruru-navy/60 hover:text-ruru-navy-light transition-colors tooltip-trigger" 
                               onClick={() => {
                                 const pet = pets.find(p => p.id === apt.petId);
                                 if (pet) {
                                   setSelectedPet(pet);
                                   setActiveTab('patients');
                                 }
                               }}
                             >
                               <History size={14} />
                             </button>
                             <button className="p-2 text-ruru-navy/60 hover:text-ruru-navy-light transition-colors">
                               <Phone size={14} />
                             </button>
                             {apt.type === 'telehealth' ? (
                               <button 
                                 onClick={() => {
                                   const pet = pets.find(p => p.id === apt.petId);
                                   if (pet) handleStartConsult(pet, true);
                                 }}
                                 className="bg-ruru-teal text-white px-5 py-2.5 rounded-[1.25rem] text-[10px] font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-ruru-teal-500/10"
                               >
                                 <Activity size={14} /> JOIN CALL
                               </button>
                             ) : (
                               <button 
                                 onClick={() => {
                                   const pet = pets.find(p => p.id === apt.petId);
                                   if (pet) handleStartConsult(pet);
                                 }}
                                 className="bg-ruru-navy text-white px-5 py-2.5 rounded-[1.25rem] text-[10px] font-bold hover:bg-ruru-navy-light transition-all flex items-center gap-2 shadow-lg shadow-[#2D2A26]/10"
                               >
                                 <Plus size={14} /> CONSULT
                               </button>
                             )}
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="p-12 text-center text-ruru-navy/60 italic">No active queue.</div>
                    )}
                  </div>
                </div>

                <div className="bg-white/95 backdrop-blur-3xl border border-ruru-navy/10 rounded-[2rem] p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-brand text-ruru-navy flex items-center gap-2">
                      <FileBadge className="text-blue-500" size={20} /> Advanced Lab Hub
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm text-ruru-navy/60">Request clinical diagnostics or view synced results from AHD labs.</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setActiveTab('labs')} className="p-4 bg-[#F5F5F0] rounded-[1.5rem] text-[10px] font-bold text-ruru-navy-light hover:bg-[#EAEAE5] transition-all flex flex-col items-center gap-3">
                        <Activity size={24} /> New Request
                      </button>
                      <button onClick={() => setActiveTab('labs')} className="p-4 bg-[#F5F5F0] rounded-[1.5rem] text-[10px] font-bold text-ruru-navy-light hover:bg-[#EAEAE5] transition-all flex flex-col items-center gap-3">
                        <History size={24} /> Lab History
                      </button>
                    </div>
                  </div>
                </div>

                {/* AI Disease Assessment Tool */}
                <div className="bg-white/95 backdrop-blur-3xl border border-ruru-navy/10 rounded-[2rem] p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-brand text-ruru-navy flex items-center gap-2">
                      <Sparkles className="text-[#D4AF37]" size={20} /> AI Symptom Assessment
                    </h3>
                    {assessmentResult && (
                      <button onClick={() => setAssessmentResult(null)} className="text-[10px] font-bold text-ruru-navy/60 hover:text-ruru-navy">CLEAR</button>
                    )}
                  </div>
                  
                  {!assessmentResult ? (
                    <div className="space-y-4">
                      <p className="text-sm text-ruru-navy/60">Describe patient symptoms to cross-reference with AHD disease trends and clinical knowledge base.</p>
                      <div className="flex gap-3">
                        <input 
                          type="text" 
                          value={assessmentQuery}
                          onChange={(e) => setAssessmentQuery(e.target.value)}
                          placeholder="e.g. 5yo Golden Retriever with lethargy, vomiting, and bloody stool..."
                          className="flex-1 bg-[#F5F5F0] border-none rounded-[1.5rem] py-4 px-6 text-sm focus:ring-2 focus:ring-ruru-navy-light/30"
                        />
                        <button 
                          onClick={handleAssessment}
                          disabled={isAssessing || !assessmentQuery}
                          className="bg-ruru-navy-light text-white px-8 py-4 rounded-[1.5rem] font-bold hover:bg-ruru-navy transition-all disabled:opacity-50"
                        >
                          {isAssessing ? <Loader2 size={20} className="animate-spin" /> : "Assess"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "p-6 rounded-[2.5rem] border",
                        assessmentResult.severity === 'high' ? "bg-red-50 border-red-100" : "bg-emerald-50 border-ruru-teal-100"
                      )}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={18} className={assessmentResult.severity === 'high' ? "text-red-500" : "text-ruru-teal"} />
                          <span className="text-xs font-bold uppercase tracking-widest">{assessmentResult.severity} RISK DETECTED</span>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400">Likelihood: {assessmentResult.likelihood}</span>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter mb-1">Potential Differential Diagnosis</p>
                          <div className="flex flex-wrap gap-2">
                            {assessmentResult.possibilities.map((p: string) => (
                              <span key={p} className="bg-white/95 backdrop-blur-3xl px-3 py-1 rounded-full text-[10px] font-bold border border-black/5">{p}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter mb-1">Clinical Recommendation</p>
                          <p className="text-sm text-ruru-navy leading-relaxed italic">{assessmentResult.recommendation}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Sidebar: Quick Actions & Alerts */}
              <div className="space-y-6">
                <div className="bg-white/95 backdrop-blur-3xl border border-ruru-navy/10 rounded-[2rem] p-6 shadow-sm">
                  <h3 className="font-bold mb-4 text-ruru-navy flex items-center gap-2">
                    <Search size={18} /> Patient Lookup
                  </h3>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A29E]" size={14} />
                    <input 
                      type="text" 
                      placeholder="Name or Microchip..."
                      className="w-full bg-[#F5F5F0] border-none rounded-[1.25rem] py-2.5 pl-10 text-xs focus:ring-2 focus:ring-ruru-navy-light/30"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    {pets.slice(0, 4).map(pet => (
                      <button key={pet.id} className="w-full text-left p-3 rounded-[1.25rem] hover:bg-[#F5F5F0] flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <img src={pet.image} alt={pet.name} className="w-8 h-8 rounded-lg object-cover" />
                          <span className="text-xs font-medium text-ruru-navy">{pet.name}</span>
                        </div>
                        <ChevronRight size={14} className="text-[#A8A29E] group-hover:translate-x-1" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-emerald-50 border border-ruru-teal-100 rounded-[2rem] p-6">
                  <h3 className="font-bold text-emerald-900 mb-2 flex items-center gap-2">
                    <ShieldCheck size={18} /> AHD Verified
                  </h3>
                  <p className="text-xs text-emerald-800/70 mb-4">All today's vaccination certificates have been digitally signed and synced with e-Samrudha portal.</p>
                  <button className="w-full flex items-center justify-center py-2.5 bg-ruru-teal text-white rounded-[1.25rem] text-[10px] font-bold">Manage Signatures</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        {activeTab === 'scribe' && (
            <motion.div 
              key="scribe"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-[1600px] mx-auto"
            >
              {!selectedPet ? (
                <div className="bg-white/95 backdrop-blur-3xl border border-ruru-navy/10 rounded-[2rem] p-12 text-center shadow-sm">
                  <div className="w-16 h-16 bg-[#F5F5F0] rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 text-ruru-navy-light">
                    <Search size={32} />
                  </div>
                  <h2 className="text-2xl font-brand mb-2">Select a Patient</h2>
                  <p className="text-ruru-navy/60 mb-8">You must select a patient to start an AI clinical scribe session.</p>
                  <button onClick={() => setActiveTab('patients')} className="flex items-center justify-center bg-ruru-navy-light text-white px-8 py-3 rounded-[1.5rem] font-bold">View Patients</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 h-[calc(100vh-250px)]">
                  {/* Left Column: Longitudinal Data & History (4 units) */}
                  <div className="xl:col-span-4 flex flex-col gap-6 overflow-y-auto pr-2">
                    {/* RuRu AI Context (Handover) */}
                    <div className="bg-amber-50 border border-amber-100 rounded-[2rem] p-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="text-amber-500" size={18} />
                        <h4 className="font-bold text-amber-900">Pre-Consult Context (RuRu AI)</h4>
                      </div>
                      {isLoadingContext ? (
                        <div className="flex items-center gap-2 py-4">
                          <Loader2 size={14} className="animate-spin text-amber-500" />
                          <span className="text-[10px] uppercase font-bold text-amber-600">Syncing AI Conversations...</span>
                        </div>
                      ) : (
                        <p className="text-xs text-amber-800/80 leading-relaxed italic">
                          "{ruruContext || "No previous AI chat history for this patient."}"
                        </p>
                      )}
                    </div>

                    {/* Longitudinal Trends */}
                    <div className="bg-white/95 backdrop-blur-3xl border border-ruru-navy/10 rounded-[2rem] p-6 shadow-sm">
                      <h4 className="font-bold text-ruru-navy mb-4 flex items-center gap-2">
                        <Activity size={18} className="text-ruru-navy-light" /> Clinical Trendline
                      </h4>
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-[10px] font-bold text-ruru-navy/60 uppercase">Weight Trend (6m)</span>
                            <span className="text-xs font-bold text-red-500">-2.4kg</span>
                          </div>
                          <div className="h-12 w-full bg-[#F5F5F0] rounded-[1.25rem] flex items-end px-2 gap-1 overflow-hidden">
                            {[40, 55, 60, 45, 30, 25, 45, 35].map((h, i) => (
                              <div key={i} className="flex-1 bg-red-400/30 rounded-t-sm" style={{ height: `${h}%` }} />
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-[10px] font-bold text-ruru-navy/60 uppercase">Appetite Score (AI)</span>
                            <span className="text-xs font-bold text-ruru-teal">Stable</span>
                          </div>
                          <div className="h-12 w-full bg-[#F5F5F0] rounded-[1.25rem] flex items-end px-2 gap-1 overflow-hidden">
                            {[60, 65, 70, 70, 75, 70, 70, 75].map((h, i) => (
                              <div key={i} className="flex-1 bg-ruru-teal-light/30 rounded-t-sm" style={{ height: `${h}%` }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Patient Records Ref */}
                    <div className="bg-white/95 backdrop-blur-3xl border border-ruru-navy/10 rounded-[2rem] overflow-hidden shadow-sm flex-1">
                      <div className="p-6 border-b border-ruru-navy/10">
                        <h4 className="font-bold text-ruru-navy flex items-center gap-2">
                          <History size={18} className="text-ruru-navy-light" /> Medical Archive
                        </h4>
                      </div>
                      <div className="p-6 space-y-4">
                        {healthRecords
                          .filter(r => r.petId === selectedPet.id)
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map(record => (
                            <div key={record.id} className="p-4 bg-[#FDFCFB] border border-ruru-navy/10 rounded-[1.5rem]">
                              <div className="flex justify-between items-start mb-1">
                                <p className="text-xs font-bold text-ruru-navy capitalize">{record.type}</p>
                                <span className="text-[10px] text-[#A8A29E]">{record.date}</span>
                              </div>
                              <p className="text-[10px] text-ruru-navy-light line-clamp-2">{record.title}</p>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Workstation (8 units) */}
                  <div className="xl:col-span-8 flex flex-col gap-6">
                    {isTelehealthActive && (
                      <div className="bg-ruru-navy rounded-[2rem] overflow-hidden aspect-video relative border-4 border-ruru-teal-500/30">
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <p className="text-white/40 font-brand italic">Encrypted Video Handshake Active...</p>
                        </div>
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20">
                          <button onClick={() => setIsRecording(!isRecording)} className={cn("p-4 rounded-full transition-all", isRecording ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20")}>
                            <Mic size={20} />
                          </button>
                          <button onClick={() => setIsTelehealthActive(false)} className="px-8 py-4 bg-red-600 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl">
                            End Session
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="bg-white/95 backdrop-blur-3xl border border-ruru-navy/10 rounded-[2.5rem] p-8 shadow-sm flex-1 flex flex-col gap-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <img src={selectedPet.image} alt={selectedPet.name} className="w-14 h-14 rounded-[1.5rem] object-cover" />
                          <div>
                            <h3 className="text-xl font-brand text-ruru-navy">Consulting: {selectedPet.name}</h3>
                            <p className="text-xs text-ruru-navy/60">{selectedPet.breed} • {selectedPet.age} • Patient ID: {selectedPet.id.slice(0, 8)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button className="p-3 bg-[#F5F5F0] rounded-[1.25rem] text-ruru-navy-light hover:bg-[#EAEAE5]"><FileBadge size={20} /></button>
                          <button onClick={() => setSelectedPet(null)} className="p-3 bg-red-50 rounded-[1.25rem] text-red-500 hover:bg-red-100"><X size={20} /></button>
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col gap-6">
                        <div className="relative flex-1">
                          <textarea
                            value={transcript}
                            onChange={(e) => setTranscript(e.target.value)}
                            placeholder="Voice scribe or manual entry: Start detailing clinical observations..."
                            className="w-full h-full bg-[#FDFCFB] border border-ruru-navy/10 rounded-[1.5rem] p-6 text-base text-ruru-navy-light leading-relaxed focus:ring-0 focus:border-ruru-navy-light resize-none"
                          />
                          {isTranscribing && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-[1.5rem]">
                              <Loader2 size={32} className="animate-spin text-ruru-navy-light mb-4" />
                              <span className="text-sm font-bold text-ruru-navy-light">Processing Audio Stream...</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-4">
                          <button 
                            onClick={toggleRecording}
                            className={cn(
                              "flex-1 py-5 rounded-[2rem] font-bold flex items-center justify-center gap-3 transition-all text-lg",
                              isRecording ? "bg-red-600 text-white" : "bg-ruru-navy text-white"
                            )}
                          >
                            {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
                            {isRecording ? "Stop Scribe" : "Start Scribe"}
                          </button>
                          <button 
                            onClick={handleGenerateSOAP}
                            disabled={isGenerating || !transcript}
                            className="flex-1 py-5 bg-ruru-navy-light text-white rounded-[2rem] font-bold hover:bg-ruru-navy transition-all flex items-center justify-center gap-3 text-lg disabled:opacity-50"
                          >
                            {isGenerating ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} />}
                            Draft SOAP Note
                          </button>
                        </div>
                      </div>
                    </div>

                    {soapNote && (
                      <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-ruru-navy rounded-[2.5rem] p-8 text-white shadow-2xl"
                      >
                         <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-brand">Structured AI SOAP Draft</h3>
                            <div className="flex gap-4">
                              <button onClick={handleSaveNote} disabled={isSaving} className="bg-ruru-teal text-ruru-navy px-8 py-3 rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest hover:bg-ruru-teal-light transition-all">
                                {isSaving ? "Saving..." : "Commit to Health Cloud"}
                              </button>
                              {upcomingAppointments.length > 1 && (
                                <button 
                                  onClick={() => {
                                    handleSaveNote();
                                    const nextApt = upcomingAppointments[1];
                                    const nextPet = pets.find(p => p.id === nextApt.petId);
                                    if (nextPet) handleStartConsult(nextPet);
                                  }}
                                  className="bg-white/10 text-white px-8 py-3 rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest border border-white/20 hover:bg-white/20 transition-all flex items-center gap-2"
                                >
                                  Stage Next: {upcomingAppointments[1].petName} <ChevronRight size={14} />
                                </button>
                              )}
                            </div>
                         </div>
                         <div className="grid grid-cols-2 gap-6">
                            {['subjective', 'objective', 'assessment', 'plan'].map((k) => (
                              <div key={k} className="bg-white/5 p-4 rounded-[1.5rem] border border-white/10">
                                <p className="text-[10px] font-black uppercase tracking-widest text-ruru-teal-light mb-2">{k}</p>
                                <p className="text-sm text-white/80 leading-relaxed italic">{soapNote[k as keyof SOAPNote]}</p>
                              </div>
                            ))}
                         </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'labs' && (
            <motion.div key="labs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-brand text-ruru-navy">Digital Lab Center</h2>
                  <p className="text-ruru-navy/60 text-sm">Cross-referenced with AHD national disease database</p>
                </div>
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className="p-3 bg-[#F5F5F0] rounded-[1.5rem] text-ruru-navy/60 hover:text-ruru-navy"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                  <div className="bg-white/95 backdrop-blur-3xl border border-ruru-navy/10 rounded-[2.5rem] p-8 shadow-sm">
                    <h3 className="text-xl font-brand text-ruru-navy mb-8">Pending Diagnostic Results</h3>
                    <div className="space-y-4">
                      {[
                        { pet: 'Oliver', test: 'Complete Blood Count', status: 'In Process', priority: 'High' },
                        { pet: 'Luna', test: 'Liver Function Panel', status: 'Evaluating', priority: 'Standard' },
                        { pet: 'Rocky', test: 'Skin Biopsy', status: 'Synced', priority: 'Critical' }
                      ].map((lab, i) => (
                        <div key={`${lab.pet}-${lab.test}`} className="flex items-center justify-between p-6 bg-[#FDFCFB] border border-ruru-navy/10 rounded-[2.5rem]">
                           <div className="flex items-center gap-5">
                             <div className="w-12 h-12 bg-white/95 backdrop-blur-3xl rounded-[1.5rem] border border-ruru-navy/10 flex items-center justify-center text-ruru-navy-light">
                               <Activity size={20} />
                             </div>
                             <div>
                               <p className="font-bold text-ruru-navy">{lab.pet} • {lab.test}</p>
                               <p className="text-[10px] text-[#A8A29E] font-black uppercase tracking-widest">{lab.status}</p>
                             </div>
                           </div>
                           <div className="flex items-center gap-4">
                             <span className={cn("px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest", lab.priority === 'Critical' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600")}>{lab.priority}</span>
                             <button className="text-[#A8A29E] hover:text-ruru-navy"><ChevronRight size={20} /></button>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="bg-ruru-navy rounded-[2.5rem] p-8 text-white">
                    <h4 className="text-lg font-brand mb-4">Quick Lab Command</h4>
                    <div className="space-y-3">
                      <button className="w-full py-4 bg-white/10 hover:bg-white/20 transition-all rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3">
                        <Plus size={16} /> Order Radiology
                      </button>
                      <button className="w-full py-4 bg-white/10 hover:bg-white/20 transition-all rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3">
                        <Plus size={16} /> Blood Chemistry
                      </button>
                      <button className="w-full py-4 bg-ruru-teal hover:bg-ruru-teal-light transition-all rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 border-none">
                        <Download size={16} /> Bulk Export PDF
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'patients' && (
            <motion.div key="patients" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-brand text-ruru-navy">Patient Directory</h2>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A29E]" size={14} />
                    <input 
                      type="text" 
                      placeholder="Quick patient search..."
                      className="bg-white/95 backdrop-blur-3xl border border-ruru-navy/10 rounded-[1.25rem] py-2.5 pl-10 text-xs w-64"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pets.map(pet => (
                  <div key={pet.id} className="bg-white/95 backdrop-blur-3xl border border-ruru-navy/10 rounded-[2.5rem] p-6 shadow-sm hover:border-ruru-navy-light transition-all group relative overflow-hidden">
                    <div className="flex items-center gap-4 mb-6">
                      <img src={pet.image} alt={pet.name} className="w-16 h-16 rounded-[1.5rem] object-cover ring-2 ring-[#F5F5F0]" />
                      <div>
                        <h4 className="text-lg font-brand text-ruru-navy">{pet.name}</h4>
                        <p className="text-xs text-ruru-navy/60">{pet.breed} • {pet.type}</p>
                        {pet.eSamrudhaId && (
                           <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                             <ShieldCheck size={10} /> e-Samrudha Synced
                           </div>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                       <div className="bg-[#FDFCFB] p-3 rounded-[1.5rem] border border-ruru-navy/10">
                          <p className="text-[10px] text-[#A8A29E] uppercase font-bold mb-0.5">Blood Group</p>
                          <p className="text-xs font-bold text-ruru-navy">{pet.bloodGroup || 'Not Tested'}</p>
                       </div>
                       <div className="bg-[#FDFCFB] p-3 rounded-[1.5rem] border border-ruru-navy/10">
                          <p className="text-[10px] text-[#A8A29E] uppercase font-bold mb-0.5">Weight</p>
                          <p className="text-xs font-bold text-ruru-navy">{pet.weight} kg</p>
                       </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setSelectedPet(pet);
                          setActiveTab('scribe');
                        }}
                        className="flex-1 bg-ruru-navy text-white py-3 rounded-[1.25rem] text-[10px] font-bold uppercase tracking-wider hover:bg-ruru-navy-light transition-all flex items-center justify-center gap-2"
                      >
                        <Mic size={14} /> Start Consult
                      </button>
                      <button 
                        className="p-3 bg-[#F5F5F0] text-ruru-navy/60 rounded-[1.25rem] hover:bg-ruru-navy hover:text-white transition-all"
                      >
                        <FileText size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

                    {activeTab === 'schedule' && (
            <motion.div key="schedule" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 bg-white/95 backdrop-blur-3xl rounded-[2.5rem] border border-ruru-navy/10 space-y-6">
                <div className="bg-[#FDFCFB] p-6 rounded-[2.5rem] border border-ruru-navy/10">
                  <h3 className="font-bold text-ruru-navy mb-4">Block Time Slots</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-xs font-bold text-ruru-navy/60 mb-2 uppercase tracking-widest">Select Pet to Associate (Optional)</label>
                      <select
                        value={selectedPetForBlocking || ''}
                        onChange={(e) => setSelectedPetForBlocking(e.target.value || undefined)}
                        className="w-full bg-white/95 backdrop-blur-3xl border border-ruru-navy/10 rounded-[1.25rem] py-2 px-3 text-xs focus:ring-2 focus:ring-ruru-teal outline-none"
                      >
                        <option value="">Personal / No Pet</option>
                        {pets.map(pet => (
                          <option key={pet.id} value={pet.id}>{pet.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ruru-navy/60 mb-2 uppercase tracking-widest">Reason for Block (Optional)</label>
                      <input 
                        type="text" 
                        value={blockReason} 
                        onChange={(e) => setBlockReason(e.target.value)} 
                        placeholder="e.g., Surgery, Lunch, PTO"
                        className="w-full bg-white/95 backdrop-blur-3xl border border-ruru-navy/10 rounded-[1.25rem] py-2 px-3 text-xs focus:ring-2 focus:ring-ruru-teal outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {timeSlots.map(slot => (
                      <button
                        key={slot}
                        onClick={() => toggleSlot(slot)}
                        className={cn(
                          "py-2 px-1 rounded-[1.25rem] text-[10px] font-bold transition-all",
                          blockedSlots.some(s => s.time === slot) 
                            ? "bg-ruru-navy text-white" 
                            : "bg-[#F5F5F0] text-ruru-navy-light hover:bg-[#EAEAE5]"
                        )}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
                
                <ReactBigCalendar
                    localizer={localizer}
                    events={calendarEvents}
                    startAccessor="start"
                    endAccessor="end"
                    views={['month', 'week', 'day']}
                    culture="en-US"
                    style={{ height: 500 }}
                    eventPropGetter={(event: any) => {
                      if (!event.isApt) {
                        return {
                          className: "rounded-md border-none !text-xs font-bold text-white px-2 py-1 shadow-sm !bg-slate-400 opacity-80"
                        };
                      }
                      const apt = appointments.find(a => a.id === event.id);
                      const isTele = apt?.type === 'telehealth';
                      return {
                        className: cn(
                          "rounded-md border-none !text-xs font-bold text-white px-2 py-1 shadow-sm",
                          isTele ? "!bg-ruru-teal" : "!bg-ruru-navy-light"
                        )
                      };
                    }}
                    onSelectEvent={(event: any) => {
                      if (!event.isApt) return;
                      const apt = appointments.find(a => a.id === event.id);
                      if (apt) {
                        const pet = pets.find(p => p.id === apt.petId);
                        if (pet) {
                          setSelectedPet(pet);
                          setActiveTab('patients');
                        }
                      }
                    }}
                />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});
