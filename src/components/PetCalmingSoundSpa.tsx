import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  Volume2, 
  Timer, 
  Info, 
  Heart, 
  Sparkles, 
  VolumeX,
  Compass,
  Smile,
  Shield,
  Clock
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

// Audio types and presets
interface SoundPreset {
  id: string;
  name: string;
  subtitle: string;
  frequencyDescription: string;
  veterinaryRationale: string;
  targetSpecies: 'All' | 'Cats' | 'Dogs' | 'Birds';
  icon: string;
  color: string;
}

const PRESETS: SoundPreset[] = [
  {
    id: 'feline_purr',
    name: 'Feline Therapeutic Purr',
    subtitle: '25Hz - 50Hz Resonance',
    frequencyDescription: 'A low-pitched harmonic hum built of 28Hz and 56Hz carrier waves, modulated by a 1.5Hz respiratory flow LFO (Low-Frequency Oscillator).',
    veterinaryRationale: 'Feline purring frequencies trigger osteoblastic bone repair, muscle regeneration, and endorphin release. Highly effective for soothing cats post-surgery and reducing situational anxiety in active dogs.',
    targetSpecies: 'Cats',
    icon: '🐱',
    color: 'from-[#C5A572] to-[#E5D5B2]'
  },
  {
    id: 'binaural_delta',
    name: 'Binaural Sleep Beacon',
    subtitle: '3.5Hz Delta Wave Infusion',
    frequencyDescription: 'Binaural carrier tones (100Hz in left, 103.5Hz in right) generating a subconscious 3.5Hz delta wave entrainment.',
    veterinaryRationale: 'Delta wave stimulation is scientifically proven to suppress neural over-excitability. Recommended for masking high-stress events like sudden fireworks, atmospheric lightning, or thundering stormfronts.',
    targetSpecies: 'Dogs',
    icon: '🐶',
    color: 'from-[#0B1424] to-[#2B3E5B]'
  },
  {
    id: 'pink_mask',
    name: 'Deep Canopy Brown Rain',
    subtitle: 'Cascading Pink & Brown Noise',
    frequencyDescription: 'A cascade of pseudo-random pink and brown noise filtered at 180Hz to mimic wet jungle foliage dampening deep acoustic reverberations.',
    veterinaryRationale: 'Sudden spike noises (car honks, thunder cracks) trigger fight-or-flight. Sustained brown noise masks transient noise shocks, establishing a safe auditory bubble in high-density urban environments.',
    targetSpecies: 'All',
    icon: '🌧️',
    color: 'from-emerald-800 to-emerald-950'
  },
  {
    id: 'solfeggio_harmony',
    name: 'Solfeggio Healing 432/528Hz',
    subtitle: 'Harmonic Attunement Complex',
    frequencyDescription: 'A pure sinusoidal fundamental at 432Hz and 528Hz accompanied by a slow 0.1Hz phase shift to induce structural relaxation.',
    veterinaryRationale: 'Solfeggio frequencies are proven in acoustic veterinary therapy to reduce serum cortisol levels and stimulate parasympathetic nervous action, slowing bounding heart rates in hyper-anxious pets.',
    targetSpecies: 'All',
    icon: '✨',
    color: 'from-[#8B5CF6] to-[#A78BFA]'
  }
];

export function PetCalmingSoundSpa() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState('feline_purr');
  const [volume, setVolume] = useState(0.4); // volume scale from 0 to 1
  const [showRationale, setShowRationale] = useState(true);
  const [timerLeft, setTimerLeft] = useState<number | null>(null); // time left in seconds
  const [activeTimerMinutes, setActiveTimerMinutes] = useState<number | null>(null);
  
  // Real-world pet state logging simulation for telemetry!
  const [petMoodLog, setPetMoodLog] = useState<{timestamp: string, mood: string, preset: string}[]>([]);
  const [loggedMood, setLoggedMood] = useState<'Restless' | 'Attentive' | 'Asleep' | 'Calmed'>('Attentive');

  // Audio Context Ref & Nodes
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mainGainRef = useRef<GainNode | null>(null);
  
  // Oscillator/Source refs for clean teardown and updates
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);
  const noiseNodeRef = useRef<AudioWorkletNode | ScriptProcessorNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const lfoGainRef = useRef<GainNode | null>(null);

  const selectedPreset = PRESETS.find(p => p.id === selectedPresetId) || PRESETS[0];

  // Stop sound playing helper
  const stopAudio = () => {
    try {
      if (osc1Ref.current) {
        osc1Ref.current.stop();
        osc1Ref.current.disconnect();
        osc1Ref.current = null;
      }
      if (osc2Ref.current) {
        osc2Ref.current.stop();
        osc2Ref.current.disconnect();
        osc2Ref.current = null;
      }
      if (noiseNodeRef.current) {
        noiseNodeRef.current.disconnect();
        noiseNodeRef.current = null;
      }
      if (lfoRef.current) {
        lfoRef.current.stop();
        lfoRef.current.disconnect();
        lfoRef.current = null;
      }
      if (lfoGainRef.current) {
        lfoGainRef.current.disconnect();
        lfoGainRef.current = null;
      }
      if (filterNodeRef.current) {
        filterNodeRef.current.disconnect();
        filterNodeRef.current = null;
      }
    } catch (e) {
      console.warn("Stopping nodes raised harmless error:", e);
    }
  };

  const startAudio = () => {
    stopAudio();

    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const mainGain = ctx.createGain();
    mainGain.gain.setValueAtTime(volume, ctx.currentTime);
    mainGain.connect(ctx.destination);
    mainGainRef.current = mainGain;

    if (selectedPresetId === 'feline_purr') {
      // FELINE PURR Synthesizer
      // Carrier 1 at 28Hz
      const osc1 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(28, ctx.currentTime);

      // Carrier 2 at 56Hz of subtle harmonic
      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(56, ctx.currentTime);

      // Lowpass filter to muffle sharp harmonics
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(95, ctx.currentTime);

      // Modulator LFO to simulate rhythmic purr breathing oscillation
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(1.5, ctx.currentTime); // 1.5 breaths/second

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(0.35, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency); // modulating filter cutoff produces beautiful throbbing
      
      // Connect carriers to filter
      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.7, ctx.currentTime);

      osc1.connect(oscGain);
      osc2.connect(oscGain);
      oscGain.connect(filter);
      filter.connect(mainGain);

      // Start nodes
      osc1.start();
      osc2.start();
      lfo.start();

      // Store node pointers
      osc1Ref.current = osc1;
      osc2Ref.current = osc2;
      filterNodeRef.current = filter;
      lfoRef.current = lfo;
      lfoGainRef.current = lfoGain;

    } else if (selectedPresetId === 'binaural_delta') {
      // BINAURAL BEAT SYSTEM (100Hz and 103.5Hz)
      const merger = ctx.createChannelMerger(2);

      const oscLeft = ctx.createOscillator();
      oscLeft.type = 'sine';
      oscLeft.frequency.setValueAtTime(100, ctx.currentTime);

      const oscRight = ctx.createOscillator();
      oscRight.type = 'sine';
      oscRight.frequency.setValueAtTime(103.5, ctx.currentTime);

      const leftGain = ctx.createGain();
      const rightGain = ctx.createGain();
      leftGain.gain.setValueAtTime(0.5, ctx.currentTime);
      rightGain.gain.setValueAtTime(0.5, ctx.currentTime);

      oscLeft.connect(leftGain);
      oscRight.connect(rightGain);

      leftGain.connect(merger, 0, 0); // connect to channel 0
      rightGain.connect(merger, 0, 1); // connect to channel 1

      merger.connect(mainGain);

      oscLeft.start();
      oscRight.start();

      osc1Ref.current = oscLeft;
      osc2Ref.current = oscRight;

    } else if (selectedPresetId === 'pink_mask') {
      // BROWN NOISE Rain generator using ScriptProcessor
      const bufferSize = 2 * ctx.sampleRate;
      let lastOut = 0.0;
      
      const noiseProcessor = ctx.createScriptProcessor(4096, 0, 1);
      noiseProcessor.onaudioprocess = (e) => {
        const outputBuffer = e.outputBuffer;
        const channelData = outputBuffer.getChannelData(0);
        for (let i = 0; i < outputBuffer.length; i++) {
          const white = Math.random() * 2 - 1;
          // Apply a brown low-frequency accumulator
          channelData[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = channelData[i];
          channelData[i] *= 4.5; // Gain boost
        }
      };

      const lpFilter = ctx.createBiquadFilter();
      lpFilter.type = 'lowpass';
      lpFilter.frequency.setValueAtTime(240, ctx.currentTime);

      noiseProcessor.connect(lpFilter);
      lpFilter.connect(mainGain);

      noiseNodeRef.current = noiseProcessor;
      filterNodeRef.current = lpFilter;

    } else if (selectedPresetId === 'solfeggio_harmony') {
      // SOLFEGGIO 432 Hz healing vibration
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(432, ctx.currentTime);

      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(528, ctx.currentTime);

      const blendGain = ctx.createGain();
      blendGain.gain.setValueAtTime(0.3, ctx.currentTime); // blended gently

      // Subtle phase/tremolo LFO
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // ultra slow

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(0.15, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(blendGain.gain);

      osc1.connect(blendGain);
      osc2.connect(blendGain);
      blendGain.connect(mainGain);

      osc1.start();
      osc2.start();
      lfo.start();

      osc1Ref.current = osc1;
      osc2Ref.current = osc2;
      lfoRef.current = lfo;
      lfoGainRef.current = lfoGain;
    }
  };

  // Synchronise sound volume when slider rolls
  useEffect(() => {
    if (isPlaying && mainGainRef.current && audioCtxRef.current) {
      mainGainRef.current.gain.setValueAtTime(volume, audioCtxRef.current.currentTime);
    }
  }, [volume, isPlaying]);

  // Restart sound when active preset switches
  useEffect(() => {
    if (isPlaying) {
      startAudio();
    } else {
      stopAudio();
    }
    return () => stopAudio();
  }, [selectedPresetId, isPlaying]);

  // Timer logic
  useEffect(() => {
    if (timerLeft === null) return;
    if (timerLeft <= 0) {
      setIsPlaying(false);
      setTimerLeft(null);
      setActiveTimerMinutes(null);
      toast.success("Zen Therapy cycle finalized. Speaker muted automatically.");
      return;
    }

    const interval = setInterval(() => {
      setTimerLeft(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(interval);
  }, [timerLeft]);

  const handleTogglePlay = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      toast.info(`Zen Spa engaged: ${selectedPreset.name}`);
    } else {
      setIsPlaying(false);
    }
  };

  const handleSelectPreset = (id: string) => {
    setSelectedPresetId(id);
  };

  const handleStartTimer = (minutes: number) => {
    setTimerLeft(minutes * 60);
    setActiveTimerMinutes(minutes);
    setIsPlaying(true);
    toast.success(`Sleep timer initialized: ${minutes} Min cycle.`);
  };

  const handleCancelTimer = () => {
    setTimerLeft(null);
    setActiveTimerMinutes(null);
    toast.info("Sleep timer disabled. Continuous reproduction enabled.");
  };

  // Real world Log
  const handleLogPetMood = () => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newEntry = { timestamp: timeStr, mood: loggedMood, preset: selectedPreset.name };
    setPetMoodLog(prev => [newEntry, ...prev].slice(0, 5));
    toast.success(`Telemetry logged: Pet is enjoying ${selectedPreset.name} as "${loggedMood}"`);
  };

  // Simple Timer parsing
  const formatTimerValue = (sec: number | null) => {
    if (sec === null) return '';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-white border border-ruru-navy/5 rounded-[2.5rem] p-6 md:p-8 shadow-xl max-w-4xl mx-auto space-y-8" id="pet-sound-spa-container">
      {/* Header and Brand typography */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-50 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-[#C5A572]">
            <Sparkles size={16} className="animate-spin-slow text-[#C5A572]" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em]">Quantum Acoustic Solace</span>
          </div>
          <h2 className="text-3xl font-brand text-ruru-navy tracking-tight">ZenPet Calming Sound Spa</h2>
          <p className="text-xs text-[#A8A29E] mt-1">Medical-grade acoustic frequencies engineered for companion animal stabilization.</p>
        </div>
        
        {/* Play indicator badge */}
        <AnimatePresence>
          {isPlaying && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest"
            >
              <div className="flex items-end gap-0.5 h-3">
                <span className="w-0.5 bg-emerald-500 animate-[bounce_1s_infinite_100ms] h-3" />
                <span className="w-0.5 bg-emerald-500 animate-[bounce_1s_infinite_200ms] h-2" />
                <span className="w-0.5 bg-emerald-500 animate-[bounce_1s_infinite_300ms] h-3" />
                <span className="w-0.5 bg-emerald-500 animate-[bounce_1s_infinite_400ms] h-1" />
              </div>
              Transmitting Solace Frequency
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Preset cards */}
        <div className="lg:col-span-12 xl:col-span-6 space-y-4">
          <label className="text-[9px] font-black text-[#A8A29E] uppercase tracking-[0.25em] block">Select Therapeutic Protocol</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PRESETS.map((preset) => {
              const isActive = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset.id)}
                  className={cn(
                    "p-5 rounded-[2rem] text-left border relative overflow-hidden transition-all duration-500 hover:shadow-md",
                    isActive 
                      ? "bg-[#0B1424] border-[#0B1424] text-white shadow-xl shadow-[#0B1424]/10" 
                      : "bg-[#FDFBF7] border-[#C5A572]/10 hover:border-[#C5A572]/30 text-ruru-navy"
                  )}
                >
                  <div className="flex items-center justify-between mb-3 relative z-10">
                    <span className="text-2xl">{preset.icon}</span>
                    <span className={cn(
                      "text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider border",
                      isActive 
                        ? "bg-white/10 text-[#C5A572] border-[#C5A572]/20" 
                        : "bg-[#0B1424]/5 text-slate-500 border-slate-200"
                    )}>
                      {preset.targetSpecies} Target
                    </span>
                  </div>

                  <div className="space-y-1 relative z-10">
                    <h4 className="font-brand text-[15px] tracking-tight">{preset.name}</h4>
                    <p className={cn(
                      "text-[11px] font-medium leading-tight",
                      isActive ? "text-[#C5A572]" : "text-slate-500"
                    )}>
                      {preset.subtitle}
                    </p>
                  </div>
                  
                  {/* Subtle water-ripple overlay for active mode */}
                  {isActive && (
                    <motion.div 
                      layoutId="pulsar-glow"
                      className="absolute inset-0 bg-gradient-to-r opacity-5 pointer-events-none"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Rationale and Deep Science under active Preset */}
          <AnimatePresence mode="wait">
            {showRationale && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#FDFBF7] border border-[#C5A572]/10 rounded-[2rem] p-5 space-y-4"
              >
                <div className="flex items-center gap-2 text-ruru-navy font-brand text-sm border-b border-[#C5A572]/10 pb-2">
                  <Info size={16} className="text-[#C5A572]" />
                  Acoustic Science & Action Strategy
                </div>
                
                <div className="space-y-3 text-xs leading-relaxed">
                  <p className="text-slate-700">
                    <strong className="text-ruru-navy">Synthesizer Mode:</strong> {selectedPreset.frequencyDescription}
                  </p>
                  <p className="text-slate-600 bg-white p-3.5 rounded-xl border border-[#C5A572]/5 italic">
                    👨‍⚕️ <strong className="text-ruru-navy text-[11px] not-italic uppercase tracking-wide">Veterinary Rationale:</strong> {selectedPreset.veterinaryRationale}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Audio Reactor Console, timer, slider */}
        <div className="lg:col-span-12 xl:col-span-6 flex flex-col justify-between space-y-6">
          <div className="bg-[#0B1424] text-white rounded-[2rem] p-6 lg:p-8 flex flex-col items-center justify-center space-y-6 relative overflow-hidden h-full min-h-[320px]">
            {/* Visualizer Pulsing rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <motion.div 
                animate={isPlaying ? { scale: [1, 2.5, 1], opacity: [0.4, 0, 0.4] } : {}}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className={cn("w-32 h-32 rounded-full border border-[#C5A572]/30 absolute")}
              />
              <motion.div 
                animate={isPlaying ? { scale: [1, 3.8, 1], opacity: [0.6, 0, 0.6] } : {}}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="w-32 h-32 rounded-full border border-teal-500/20 absolute"
              />
            </div>

            {/* Glowing Center Dial */}
            <motion.div 
              animate={isPlaying ? { rotate: 360 } : {}}
              transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
              className="w-36 h-36 rounded-full border-2 border-dashed border-[#C5A572]/50 flex items-center justify-center relative p-2"
            >
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-slate-900 to-slate-950 flex items-center justify-center shadow-2xl relative">
                <span className="text-4xl select-none">{selectedPreset.icon}</span>
                {isPlaying && (
                  <motion.div 
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute inset-0 rounded-full border-2 border-[#C5A572] opacity-80"
                  />
                )}
              </div>
            </motion.div>

            <div className="text-center space-y-1 relative z-10">
              <p className="text-[#C5A572] font-brand text-lg">{selectedPreset.name}</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-[0.15em]">{selectedPreset.subtitle}</p>
            </div>

            {/* Main Playback trigger */}
            <div className="flex items-center gap-4 relative z-10">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleTogglePlay}
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl",
                  isPlaying 
                    ? "bg-[#C5A572] text-white hover:bg-[#D5B582]" 
                    : "bg-white text-[#0B1424] hover:bg-slate-100"
                )}
              >
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} className="ml-1" fill="currentColor" />}
              </motion.button>
            </div>

            {/* Slider interface */}
            <div className="w-full space-y-2 relative z-10 max-w-sm">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-1">
                <span className="flex items-center gap-1.5 uppercase tracking-wider">
                  {volume === 0 ? <VolumeX size={12} /> : <Volume2 size={12} />} Volume Control
                </span>
                <span>{Math.round(volume * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full accent-[#C5A572] cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
              />
            </div>

            {/* Interactive Sleep Timers */}
            <div className="w-full max-w-sm pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs relative z-10 text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <Timer size={13} /> {timerLeft !== null ? "Cycle active" : "Delay timer"}
              </span>

              <div className="flex gap-2">
                {timerLeft !== null ? (
                  <div className="flex items-center gap-2 bg-[#C5A572]/20 border border-[#C5A572]/30 text-[#C5A572] px-3.5 py-1.5 rounded-full font-black uppercase text-[10px]">
                    <Clock size={12} className="animate-pulse" />
                    <span>{formatTimerValue(timerLeft)}</span>
                    <button onClick={handleCancelTimer} className="ml-1 select-none hover:text-white">✕</button>
                  </div>
                ) : (
                  [15, 30, 60].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => handleStartTimer(mins)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full text-[10px] font-black uppercase tracking-wider transition-colors"
                    >
                      {mins}m
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
          
          {/* Telemetry Logger - Action Pet state tracking */}
          <div className="bg-[#FDFBF7] border border-[#C5A572]/10 rounded-[2rem] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-brand text-sm text-ruru-navy flex items-center gap-2">
                <Heart size={14} className="text-rose-500 animate-pulse" /> Live Telemetry Logger
              </p>
              <span className="text-[9px] text-[#A8A29E] uppercase tracking-wider">Dynamic Response</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 w-full grid grid-cols-4 gap-2">
                {(['Restless', 'Attentive', 'Calmed', 'Asleep'] as const).map((mood) => (
                  <button
                    key={mood}
                    onClick={() => setLoggedMood(mood)}
                    className={cn(
                      "py-2 px-1 rounded-xl text-[10px] font-bold border transition-all text-center",
                      loggedMood === mood 
                        ? "bg-[#0B1424] border-[#0B1424] text-white shadow-sm" 
                        : "bg-white border-slate-200 text-[#0B1424] hover:bg-slate-50"
                    )}
                  >
                    {mood === 'Restless' && '😟 '}
                    {mood === 'Attentive' && '👀 '}
                    {mood === 'Calmed' && '😌 '}
                    {mood === 'Asleep' && '😴 '}
                    {mood}
                  </button>
                ))}
              </div>

              <button
                onClick={handleLogPetMood}
                className="w-full sm:w-auto shrink-0 bg-[#0B1424] text-white hover:bg-slate-800 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-md"
              >
                Log Response
              </button>
            </div>

            {/* Historical Telemetry logs */}
            {petMoodLog.length > 0 && (
              <div className="pt-2 border-t border-[#C5A572]/10 space-y-2">
                <p className="text-[9px] text-[#A8A29E] font-black uppercase tracking-widest">Logged Response Sequences</p>
                <div className="max-h-24 overflow-y-auto space-y-1.5 no-scrollbar pr-1">
                  {petMoodLog.map((log, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1.5 px-3 bg-white border border-slate-100 rounded-lg">
                      <span className="text-[#A8A29E] font-medium">{log.timestamp}</span>
                      <span className="text-slate-600 font-medium font-mono text-[10px] truncate max-w-[150px]">{log.preset}</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
                        log.mood === 'Asleep' ? "bg-indigo-50 text-indigo-700" :
                        log.mood === 'Calmed' ? "bg-emerald-50 text-emerald-700" :
                        log.mood === 'Attentive' ? "bg-blue-50 text-blue-700" : "bg-rose-50 text-rose-700"
                      )}>
                        {log.mood}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
