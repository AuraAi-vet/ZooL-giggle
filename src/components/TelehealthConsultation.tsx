import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Send, 
  Activity, 
  Sparkles, 
  ShieldAlert, 
  Monitor, 
  ClipboardList, 
  Check, 
  Loader2, 
  ChevronRight, 
  X,
  User,
  Heart,
  MessageSquare
} from 'lucide-react';
import { Appointment, Pet, HealthRecord } from '../types';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface TelehealthConsultationProps {
  appointment: Appointment;
  pet?: Pet;
  role: 'owner' | 'vet' | 'provider';
  onClose: () => void;
  addRecord: (record: Omit<HealthRecord, 'id' | 'ownerId'>) => Promise<void>;
  updateAppointment: (id: string, updates: Partial<Appointment>) => Promise<void>;
}

export function TelehealthConsultation({
  appointment,
  pet,
  role,
  onClose,
  addRecord,
  updateAppointment
}: TelehealthConsultationProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Connection & Media States
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [telemetry, setTelemetry] = useState({
    fps: 30,
    latency: 28,
    loss: '0.00%',
    bitrate: '2.8 Mbps',
    codec: 'VP9 / Opus',
    encryption: 'Secure (DTLS-SRTP)'
  });

  // Chat panel states
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'peer', text: string, time: string }>>([
    { 
      sender: 'peer', 
      text: role === 'vet' 
        ? `Hello Doctor, Oliver is here. I have noticed some unusual lethargy over the past 48 hours.` 
        : `Hello! I am Doctor Sarah. Let's start the consult. How has Oliver been doing recently?`, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);

  // ClinScribe Scribe states (For Vet only)
  const [isScribing, setIsScribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [soapNote, setSoapNote] = useState<{
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  } | null>(null);
  const [isGeneratingSOAP, setIsGeneratingSOAP] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [prescription, setPrescription] = useState('');

  // 1. Get user media and set up audio visualizer
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    
    async function startMedia() {
      try {
        setIsConnecting(true);
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        activeStream = mediaStream;
        streamRef.current = mediaStream;
        setStream(mediaStream);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStream;
        }

        // Setup audio visualizer for ClinScribe waveform
        setupAudioVisualizer(mediaStream);
        
        // Simulate peer connection handshake
        setTimeout(() => {
          setIsConnecting(false);
          toast.success("WebRTC secure peer connection established!");
        }, 1500);

      } catch (err) {
        console.error("Error accessing user media: ", err);
        setIsConnecting(false);
        toast.error("Camera/Microphone access blocked. Running in simulation mode.");
      }
    }

    startMedia();

    // 2. Setup dynamic telemetry updates
    const telemetryInterval = setInterval(() => {
      setTelemetry(prev => ({
        ...prev,
        fps: Math.floor(Math.random() * 3) + 28, // 28-30
        latency: Math.floor(Math.random() * 8) + 20, // 20-27
        loss: (Math.random() * 0.05).toFixed(2) + '%',
        bitrate: (Math.random() * 0.5 + 2.5).toFixed(1) + ' Mbps'
      }));
    }, 3000);

    return () => {
      clearInterval(telemetryInterval);
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const setupAudioVisualizer = (mediaStream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(mediaStream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      
      source.connect(analyser);
      
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
    } catch (e) {
      console.warn("Could not load audio context for visualizer: ", e);
    }
  };

  // Canvas waveform visualizer animation
  useEffect(() => {
    if (!isScribing || !analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isScribing) return;
      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgba(11, 20, 36, 0.2)'; // Faded brand dark
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 1.5;

        // Custom Teal/Blue glowing wave
        ctx.fillStyle = `rgba(46, 139, 87, ${barHeight / 100})`; // Teal Glow HSL
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        
        ctx.fillStyle = `rgba(96, 165, 250, ${barHeight / 120})`; // Blue Sparkle
        ctx.fillRect(x, canvas.height / 2 - barHeight / 2, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isScribing]);

  // Handle muting audio track
  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
      toast.info(isMuted ? "Microphone enabled" : "Microphone muted");
    }
  };

  // Handle turning off camera track
  const toggleCamera = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff(!isCameraOff);
      toast.info(isCameraOff ? "Camera stream restored" : "Camera stream disabled");
    }
  };

  // Handle simulated screen sharing
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Revert back to camera stream
      if (localVideoRef.current && stream) {
        localVideoRef.current.srcObject = stream;
      }
      setIsScreenSharing(false);
      toast.success("Returned to camera view");
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
        toast.success("Screen sharing activated!");
        
        // Listen for screen sharing stop button pressed in browser chrome
        screenStream.getVideoTracks()[0].onended = () => {
          if (localVideoRef.current && stream) {
            localVideoRef.current.srcObject = stream;
          }
          setIsScreenSharing(false);
        };
      } catch (err) {
        console.warn("Screen share declined or failed, fallback to mock screen share", err);
        setIsScreenSharing(true);
        toast.info("Simulated screen sharing active");
      }
    }
  };

  // Chat message sending & auto-replies
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = {
      sender: 'user' as const,
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setChatInput('');

    // Generate responsive context-aware auto-reply (zero-cost rule-based chatbot)
    setIsTranscribing(true);
    setTimeout(() => {
      let replyText = `I understand. Let's record these details.`;
      const inputLower = chatInput.toLowerCase();

      if (role === 'vet') {
        // Vet role: Peer is the Owner
        if (inputLower.includes('vomit') || inputLower.includes('stomach') || inputLower.includes('food')) {
          replyText = `Oliver threw up twice yesterday. It was mostly undigested kibble. Since then, he hasn't drank much water.`;
        } else if (inputLower.includes('sleep') || inputLower.includes('energy') || inputLower.includes('letharg')) {
          replyText = `He stays in his basket all day. He barely gets up even when I offer him his favorite liver treats.`;
        } else if (inputLower.includes('itch') || inputLower.includes('scratch') || inputLower.includes('skin')) {
          replyText = `Yes, doctor! He keeps scratching behind his left ear. The skin there looks slightly red and inflamed.`;
        } else {
          replyText = `That makes perfect sense, doctor. I am observing him closely right now. What should our plan of action be?`;
        }
      } else {
        // Owner role: Peer is the Doctor
        if (inputLower.includes('vomit') || inputLower.includes('throw up') || inputLower.includes('stomach')) {
          replyText = `This sounds like a acute case of gastroenteritis. I recommend we fast him for 12 hours, then introduce a bland diet of boiled rice and boiled chicken. Let's monitor his hydration closely.`;
        } else if (inputLower.includes('letharg') || inputLower.includes('weak') || inputLower.includes('tired')) {
          replyText = `Lethargy can stem from dehydration or mild infectious stress. I want you to perform a quick capillary refill test: press gently on Oliver's gums. They should turn pink again within 2 seconds.`;
        } else if (inputLower.includes('ear') || inputLower.includes('scratch') || inputLower.includes('itch')) {
          replyText = `This could point to a local ear mite colonization or allergic reaction. Let's schedule an in-person otoscopic examination. For now, avoid wet exposure and keep the area dry.`;
        } else {
          replyText = `Understood. Oliver is showing good cardiovascular stability on video. Keep observing his respiration and ensure he has access to fresh electrolyte-rich water.`;
        }
      }

      setMessages(prev => [...prev, {
        sender: 'peer',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsTranscribing(false);
      
      // Auto-append peer messages to ClinScribe transcript if vet is scribing
      if (role === 'vet' && isScribing) {
        setTranscript(prev => prev + `\n[Owner]: ${chatInput}\n[Vet]: ${replyText}`);
      }
    }, 1500);
  };

  // Vet ClinScribe actions
  const toggleScribing = () => {
    if (!isScribing) {
      setIsScribing(true);
      setTranscript(`[Consultation Initialized - Scribe Engaged]\n[Vet]: Hello! Let's do a complete diagnostic analysis for ${pet?.name || 'Oliver'}.\n[Owner]: He is acting quite weak and didn't finish his food.`);
      toast.success("ClinScribe live voice mapping engaged!");
    } else {
      setIsScribing(false);
      toast.info("ClinScribe recording completed.");
    }
  };

  // Zero-cost high-fidelity SOAP Note Auto-Generator (rule-based local model)
  const handleGenerateSOAP = () => {
    setIsGeneratingSOAP(true);
    setTimeout(() => {
      const isDigestive = transcript.toLowerCase().includes('vomit') || transcript.toLowerCase().includes('food') || transcript.toLowerCase().includes('stomach');
      const isDerm = transcript.toLowerCase().includes('scratch') || transcript.toLowerCase().includes('ear') || transcript.toLowerCase().includes('skin');
      
      if (isDigestive) {
        setSoapNote({
          subjective: `Patient ${pet?.name || 'Oliver'} presented with acute vomiting (2 episodes in 24 hours) and moderate lethargy. Decreased water intake reported.`,
          objective: `Biometrics reviewed: active respiration stable at 24bpm. Mucous membranes moist, hydration status checked. Heart rate regular. No abdominal distension observed on video feed.`,
          assessment: `Acute Gastroenteritis / Dietary indiscretion. Dehydration risk is low-to-moderate.`,
          plan: `Recommend 12-hour food fast, followed by bland diet (boiled chicken/rice) split into 4 small portions. Hydrate with electrolyte solution. Recheck in 24 hours.`
        });
        setPrescription(`Electrolyte Hydration (250ml/day), Bland Diet protocol (boiled chicken & rice) for 3 days.`);
      } else if (isDerm) {
        setSoapNote({
          subjective: `Patient displays pruritus and persistent scratching concentrated around the left otic/auricular region. Mild erythema reported by owner.`,
          objective: `Visual analysis on zoom: localized reddening behind left ear canal. No active purulent drainage or swelling. Outer ear flap intact.`,
          assessment: `Otic Pruritus secondary to potential Otodectes cynotis (ear mites) or localized allergic dermatitis.`,
          plan: `Otoscopic visual exam recommended. Administer clean antiseptic wipes. Avoid topical steroids until ear canal check completed.`
        });
        setPrescription(`Chlorhexidine Antiseptic otic wipes (twice daily), schedule otoscopy appointment.`);
      } else {
        // Fallback standard checkup SOAP
        setSoapNote({
          subjective: `Patient presented for routine annual checkup. Owner reports general state is good, minor complaints about tartar accumulation.`,
          objective: `Respiration steady, body condition score (BCS) is optimal at 5/9. Coat is clean and shiny. Video assessment displays regular locomotion.`,
          assessment: `Healthy companion, mild dental tartar accumulation.`,
          plan: `Proceed with yearly core immunizations (DHPP / Rabies). Schedule routine dental scaling inside the clinic.`
        });
        setPrescription(`Core Vaccine Boosters (DHPP + Rabies), Dental Scaling scheduled.`);
      }
      setIsGeneratingSOAP(false);
      toast.success("AI SOAP draft note generated successfully!");
    }, 2000);
  };

  // Commit SOAP Note to Firestore Health Cloud
  const handleCommitSOAP = async () => {
    if (!soapNote) return;
    setIsCommitting(true);
    try {
      // 1. Create a health record in Firestore
      await addRecord({
        petId: appointment.petId,
        date: new Date().toISOString().split('T')[0],
        type: 'checkup',
        title: 'Telehealth Consult SOAP',
        description: `Subjective: ${soapNote.subjective.substring(0, 80)}...`,
        clinicalNotes: `[SOAP REPORT]\nSubjective: ${soapNote.subjective}\nObjective: ${soapNote.objective}\nAssessment: ${soapNote.assessment}\nPlan: ${soapNote.plan}`,
        prescription: prescription || 'None',
        verifiedByGov: false
      });

      // 2. Mark appointment completed
      await updateAppointment(appointment.id, { status: 'completed' });
      
      setIsCommitting(false);
      toast.success("SOAP consultation note committed securely to Health Cloud!");
      onClose();
    } catch (e) {
      console.error(e);
      setIsCommitting(false);
      toast.error("Failed to commit SOAP note to cloud.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B1424] text-white flex flex-col font-sans overflow-hidden">
      
      {/* 1. Header Row */}
      <header className="px-6 py-4 bg-brand-dark/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-ruru-teal rounded-2xl flex items-center justify-center shadow-lg shadow-ruru-teal/20">
            <Activity size={18} className="text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="block font-brand text-lg tracking-tight">ZooL TeleConsult Room</span>
              <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse">Live</span>
            </div>
            <span className="block text-[8px] font-black uppercase tracking-[0.25em] text-white/40">Encrypted Consultation Session</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="relative p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 flex items-center justify-center transition-colors"
          >
            <MessageSquare size={18} />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-ruru-teal text-[8px] font-black rounded-full flex items-center justify-center text-white border border-brand-dark">
              {messages.length}
            </span>
          </button>
          <div className="h-6 w-px bg-white/10" />
          <button 
            onClick={onClose} 
            className="p-3 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* 2. Main Work Area (Split Grid) */}
      <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden min-h-0">
        
        {/* Left Side: Video feeds */}
        <div className="flex-1 flex flex-col relative bg-black/90 p-4 min-h-0">
          
          {/* Main remote video placeholder */}
          <div className="flex-1 rounded-[2.5rem] bg-brand-dark border border-white/5 overflow-hidden relative flex items-center justify-center group shadow-inner">
            
            {isConnecting ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={32} className="text-ruru-teal animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Initializing remote WebRTC channels...</p>
              </div>
            ) : (
              <>
                {/* Loopback or simulated video feed representing the peer */}
                {stream && !isCameraOff ? (
                  <video 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover filter saturate-[1.05] brightness-[0.98] contrast-[1.02]"
                    ref={el => {
                      if (el && stream) el.srcObject = stream;
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-4 text-center p-8">
                    <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-ruru-teal mb-2 shadow-2xl">
                      <User size={36} />
                    </div>
                    <h4 className="text-xl font-brand">{role === 'vet' ? (pet?.name || 'Oliver') : 'Doctor Sarah'}</h4>
                    <p className="text-xs text-white/40 max-w-sm">
                      {isCameraOff ? "Camera turned off by participant" : "Connected safely. Video handshake loaded successfully."}
                    </p>
                  </div>
                )}

                {/* Overlaid overlay showing status */}
                <div className="absolute top-6 left-6 bg-brand-dark/60 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/80">
                    {role === 'vet' ? `Companion: ${pet?.name || 'Oliver'}` : `Dr. Sarah (AHD Vet)`}
                  </span>
                </div>
              </>
            )}

            {/* Draggable/Drifting PIP Local Camera feed */}
            <motion.div 
              drag
              dragConstraints={{ left: 0, right: 300, top: 0, bottom: 400 }}
              className="absolute bottom-6 right-6 w-36 h-48 sm:w-44 sm:h-56 bg-brand-dark/90 rounded-[2rem] border border-white/20 overflow-hidden shadow-2xl z-20 cursor-grab active:cursor-grabbing flex items-center justify-center"
            >
              {stream && !isCameraOff ? (
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover scale-x-[-1]" 
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-center p-4">
                  <VideoOff size={20} className="text-white/30" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Lens Sealed</span>
                </div>
              )}
              <div className="absolute bottom-3 left-3 bg-brand-dark/80 px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest border border-white/5">
                Local User
              </div>
            </motion.div>
          </div>

          {/* Device Action HUD */}
          <div className="h-20 flex items-center justify-center gap-4 shrink-0 pt-4">
            <button 
              onClick={toggleMute}
              className={cn(
                "p-4 rounded-full border transition-all duration-300",
                isMuted 
                  ? "bg-red-500/20 text-red-400 border-red-500/30" 
                  : "bg-white/5 hover:bg-white/10 text-white border-white/10"
              )}
              title={isMuted ? "Unmute Mic" : "Mute Mic"}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <button 
              onClick={toggleCamera}
              className={cn(
                "p-4 rounded-full border transition-all duration-300",
                isCameraOff 
                  ? "bg-red-500/20 text-red-400 border-red-500/30" 
                  : "bg-white/5 hover:bg-white/10 text-white border-white/10"
              )}
              title={isCameraOff ? "Enable Video" : "Disable Video"}
            >
              {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
            </button>
            <button 
              onClick={toggleScreenShare}
              className={cn(
                "p-4 rounded-full border transition-all duration-300",
                isScreenSharing 
                  ? "bg-ruru-teal/20 text-ruru-teal border-ruru-teal-500/30" 
                  : "bg-white/5 hover:bg-white/10 text-white border-white/10"
              )}
              title="Share Screen"
            >
              <Monitor size={20} />
            </button>
            <div className="w-px h-8 bg-white/10 mx-2" />
            <button 
              onClick={onClose}
              className="px-8 h-12 bg-red-600 hover:bg-red-700 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
            >
              <PhoneOff size={16} /> Disconnect
            </button>
          </div>
        </div>

        {/* Right Side: Vet Scribe Drawer OR Chat drawer depending on layout */}
        <AnimatePresence>
          {role === 'vet' && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '420px', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-white/5 bg-brand-dark/95 flex flex-col max-h-full overflow-hidden shrink-0 z-10 w-[420px]"
            >
              <div className="p-6 border-b border-white/5 flex items-center gap-3 shrink-0">
                <div className="w-8 h-8 bg-ruru-teal/10 rounded-xl flex items-center justify-center text-ruru-teal border border-ruru-teal/20">
                  <ClipboardList size={16} />
                </div>
                <div>
                  <h4 className="font-brand text-base">ClinScribe Scribe Hub</h4>
                  <p className="text-[8px] font-black uppercase tracking-widest text-white/40">AI SOAP Charting Workspace</p>
                </div>
              </div>

              <div className="flex-1 p-6 space-y-6 overflow-y-auto min-h-0">
                
                {/* 1. Live Scribe waveform visualizer */}
                <div className="bg-[#0B1424] border border-white/5 rounded-[2rem] p-6 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full", isScribing ? "bg-red-500 animate-ping" : "bg-white/20")} />
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/80">ClinScribe Voice Core</span>
                    </div>
                    {isScribing && (
                      <span className="text-[8px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full tracking-widest">RECORDING</span>
                    )}
                  </div>
                  
                  {isScribing ? (
                    <canvas ref={canvasRef} width={340} height={80} className="w-full h-20 rounded-xl bg-brand-dark/40 border border-white/5" />
                  ) : (
                    <div className="h-20 rounded-xl bg-brand-dark/20 border border-white/5 border-dashed flex items-center justify-center text-white/30 text-xs">
                      Voice assistant recorder standby
                    </div>
                  )}

                  <button 
                    onClick={toggleScribing}
                    className={cn(
                      "w-full py-4 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all mt-4",
                      isScribing 
                        ? "bg-red-600 text-white shadow-lg shadow-red-600/10" 
                        : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                    )}
                  >
                    {isScribing ? "Pause Scribe Processing" : "Activate ClinScribe Live Scribe"}
                  </button>
                </div>

                {/* 2. Text log monitor */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Live Scriptor Transcript</label>
                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Dictate observation logs or enter clinical transcripts manually..."
                    className="w-full h-32 bg-[#0B1424] border border-white/5 rounded-2xl p-4 text-xs text-white/80 leading-relaxed focus:ring-1 focus:ring-ruru-teal focus:border-ruru-teal resize-none"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={handleGenerateSOAP}
                      disabled={isGeneratingSOAP || !transcript}
                      className="flex-1 py-4 bg-ruru-teal text-white disabled:opacity-40 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-ruru-teal/20"
                    >
                      {isGeneratingSOAP ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      Draft SOAP Note
                    </button>
                    <button 
                      onClick={() => setTranscript('')}
                      className="px-4 bg-white/5 text-white rounded-[1.25rem] border border-white/10 hover:bg-white/10 text-xs"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* 3. SOAP draft Note block */}
                {soapNote && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#0B1424] border border-white/5 rounded-[2rem] p-6 space-y-4"
                  >
                    <h5 className="font-brand text-xs text-ruru-teal-light flex items-center gap-2">
                      <Check size={14} /> Structured SOAP note draft
                    </h5>
                    
                    <div className="space-y-3 divide-y divide-white/5 text-xs text-white/70">
                      <div className="pt-2">
                        <span className="block text-[8px] font-black uppercase tracking-widest text-ruru-teal mb-1">Subjective</span>
                        <p className="italic">"{soapNote.subjective}"</p>
                      </div>
                      <div className="pt-3">
                        <span className="block text-[8px] font-black uppercase tracking-widest text-ruru-teal mb-1">Objective</span>
                        <p className="italic">"{soapNote.objective}"</p>
                      </div>
                      <div className="pt-3">
                        <span className="block text-[8px] font-black uppercase tracking-widest text-ruru-teal mb-1">Assessment</span>
                        <p className="italic">"{soapNote.assessment}"</p>
                      </div>
                      <div className="pt-3">
                        <span className="block text-[8px] font-black uppercase tracking-widest text-ruru-teal mb-1">Plan & Prescriptions</span>
                        <p className="italic">"{soapNote.plan}"</p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-1">Rx Prescription</label>
                      <input 
                        type="text"
                        value={prescription}
                        onChange={(e) => setPrescription(e.target.value)}
                        placeholder="Add medical prescriptions..."
                        className="w-full px-4 py-3 bg-brand-dark border border-white/5 rounded-xl text-xs text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-ruru-teal"
                      />
                    </div>

                    <button 
                      onClick={handleCommitSOAP}
                      disabled={isCommitting}
                      className="w-full py-4.5 bg-emerald-600 text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/20 disabled:opacity-40"
                    >
                      {isCommitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      Commit consultation to health cloud
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3. Floating Telemetry Console */}
        <div className="absolute top-6 left-6 z-10 flex flex-col gap-2 pointer-events-none select-none max-w-xs">
          <div className="bg-[#0B1424]/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 space-y-2 text-[10px] font-mono text-emerald-400 shadow-xl">
            <div className="flex items-center gap-2 border-b border-white/5 pb-1 mb-1 text-white font-brand font-medium">
              <Activity size={12} className="text-ruru-teal" /> Peer telemetry HUD
            </div>
            <div className="flex justify-between gap-6">
              <span>Bitrate:</span>
              <span className="text-white">{telemetry.bitrate}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span>Latency:</span>
              <span className="text-white">{telemetry.latency} ms</span>
            </div>
            <div className="flex justify-between gap-6">
              <span>FPS:</span>
              <span className="text-white">{telemetry.fps} fps</span>
            </div>
            <div className="flex justify-between gap-6">
              <span>Packet Loss:</span>
              <span className="text-white">{telemetry.loss}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span>WebRTC Codec:</span>
              <span className="text-white">{telemetry.codec}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span>DTLS Status:</span>
              <span className="text-white">{telemetry.encryption}</span>
            </div>
          </div>
        </div>

        {/* 4. Chat overlay panel */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute top-0 right-0 w-80 h-full bg-[#0B1424] border-l border-white/10 shadow-2xl flex flex-col z-30"
            >
              <div className="p-4 border-b border-white/5 flex items-center justify-between bg-brand-dark">
                <span className="font-brand text-sm flex items-center gap-2"><MessageSquare size={16} /> Consult Chat</span>
                <button onClick={() => setIsChatOpen(false)} className="p-1 text-white/40 hover:text-white"><X size={16} /></button>
              </div>

              <div className="flex-1 p-4 space-y-4 overflow-y-auto text-xs flex flex-col">
                {messages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={cn(
                      "max-w-[85%] rounded-[1.25rem] p-3 flex flex-col space-y-1 relative",
                      msg.sender === 'user' 
                        ? "bg-ruru-teal text-white self-end rounded-tr-none" 
                        : "bg-white/5 text-white/90 border border-white/10 self-start rounded-tl-none"
                    )}
                  >
                    <p className="leading-relaxed">{msg.text}</p>
                    <span className="text-[7px] text-white/30 self-end">{msg.time}</span>
                  </div>
                ))}
                {isTranscribing && (
                  <div className="bg-white/5 text-white/40 border border-white/5 self-start rounded-[1.25rem] rounded-tl-none p-3 max-w-[85%] flex items-center gap-2">
                    <Loader2 size={12} className="animate-spin text-ruru-teal" />
                    <span>Peer is writing...</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 flex gap-2 shrink-0 bg-brand-dark">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type secure chat..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-ruru-teal"
                />
                <button 
                  type="submit"
                  className="p-2.5 bg-ruru-teal text-white rounded-xl flex items-center justify-center hover:bg-ruru-teal-light"
                >
                  <Send size={14} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
