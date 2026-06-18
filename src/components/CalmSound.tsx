import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Volume2, Sparkles, Sliders } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface SoundPreset {
  id: string;
  name: string;
  frequency: string;
  icon: string;
  color: string;
}

const PRESETS: SoundPreset[] = [
  {
    id: 'feline_purr',
    name: 'Therapeutic Purr',
    frequency: '25Hz Feline Resonance',
    icon: '🐱',
    color: 'from-[#C5A572] to-[#E5D5B2]'
  },
  {
    id: 'pink_mask',
    name: 'Deep Canopy Rain',
    frequency: '180Hz Audio Bubble',
    icon: '🌧️',
    color: 'from-emerald-700 to-emerald-950'
  },
  {
    id: 'solfeggio_harmony',
    name: 'Solfeggio healing',
    frequency: '432Hz Sound Therapy',
    icon: '✨',
    color: 'from-[#8B5CF6] to-[#A78BFA]'
  }
];

export function CalmSound() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeId, setActiveId] = useState('feline_purr');
  const [volume, setVolume] = useState(0.4);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const mainGainRef = useRef<GainNode | null>(null);
  
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);
  const noiseNodeRef = useRef<ScriptProcessorNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const lfoGainRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);

  const stopAudio = () => {
    try {
      if (osc1Ref.current) { osc1Ref.current.stop(); osc1Ref.current.disconnect(); osc1Ref.current = null; }
      if (osc2Ref.current) { osc2Ref.current.stop(); osc2Ref.current.disconnect(); osc2Ref.current = null; }
      if (noiseNodeRef.current) { noiseNodeRef.current.disconnect(); noiseNodeRef.current = null; }
      if (lfoRef.current) { lfoRef.current.stop(); lfoRef.current.disconnect(); lfoRef.current = null; }
      if (lfoGainRef.current) { lfoGainRef.current.disconnect(); lfoGainRef.current = null; }
      if (filterNodeRef.current) { filterNodeRef.current.disconnect(); filterNodeRef.current = null; }
    } catch (e) {
      console.warn("Muffling synthesizer nodes safely.", e);
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

    if (activeId === 'feline_purr') {
      const osc1 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(28, ctx.currentTime);

      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(56, ctx.currentTime);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(95, ctx.currentTime);

      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(1.5, ctx.currentTime);

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(0.35, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.7, ctx.currentTime);

      osc1.connect(oscGain);
      osc2.connect(oscGain);
      oscGain.connect(filter);
      filter.connect(mainGain);

      osc1.start();
      osc2.start();
      lfo.start();

      osc1Ref.current = osc1;
      osc2Ref.current = osc2;
      filterNodeRef.current = filter;
      lfoRef.current = lfo;
      lfoGainRef.current = lfoGain;

    } else if (activeId === 'pink_mask') {
      let lastOut = 0.0;
      const noiseProcessor = ctx.createScriptProcessor(4096, 0, 1);
      noiseProcessor.onaudioprocess = (e) => {
        const outputBuffer = e.outputBuffer;
        const channelData = outputBuffer.getChannelData(0);
        for (let i = 0; i < outputBuffer.length; i++) {
          const white = Math.random() * 2 - 1;
          channelData[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = channelData[i];
          channelData[i] *= 4.5;
        }
      };

      const lpFilter = ctx.createBiquadFilter();
      lpFilter.type = 'lowpass';
      lpFilter.frequency.setValueAtTime(240, ctx.currentTime);

      noiseProcessor.connect(lpFilter);
      lpFilter.connect(mainGain);

      noiseNodeRef.current = noiseProcessor;
      filterNodeRef.current = lpFilter;

    } else if (activeId === 'solfeggio_harmony') {
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(432, ctx.currentTime);

      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(528, ctx.currentTime);

      const blendGain = ctx.createGain();
      blendGain.gain.setValueAtTime(0.3, ctx.currentTime);

      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.12, ctx.currentTime);

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

  useEffect(() => {
    if (isPlaying && mainGainRef.current && audioCtxRef.current) {
      mainGainRef.current.gain.setValueAtTime(volume, audioCtxRef.current.currentTime);
    }
  }, [volume, isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      startAudio();
    } else {
      stopAudio();
    }
    return () => stopAudio();
  }, [activeId, isPlaying]);

  const handleToggle = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      toast.success(`Acoustic Solace Active: ${PRESETS.find(p => p.id === activeId)?.name}`);
    } else {
      setIsPlaying(false);
    }
  };

  return (
    <div className="bg-[#0B1424] text-white p-6 relative overflow-hidden flex flex-col justify-between h-full group" id="calm-sound-bento-card">
      {/* Background decor & waves representing auditory resonance */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#C5A572]/5 to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 blur-xl rounded-full" />
      
      <div className="space-y-4 relative z-10 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#C5A572]">
            <Sparkles size={14} className="animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Physiological Calm</span>
          </div>
          <AnimatePresence>
            {isPlaying && (
              <motion.span 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full"
              >
                Transmitting
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div>
          <h3 className="text-2xl font-brand text-white tracking-tight">Pet Zen Sound waves</h3>
          <p className="text-xs text-slate-400">Veterinary engineered frequencies for companion animal stabilization.</p>
        </div>

        {/* Presets Grid */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          {PRESETS.map((p) => {
            const isSelected = activeId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setActiveId(p.id);
                  if (!isPlaying) setIsPlaying(true);
                }}
                className={cn(
                  "p-2.5 rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 transition-all outline-none border",
                  isSelected
                    ? "bg-[#C5A572] border-[#C5A572] text-ruru-navy shadow-lg shadow-[#C5A572]/20 scale-105"
                    : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                )}
              >
                <span className="text-xl">{p.icon}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider line-clamp-1">{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-6 relative z-10 w-full space-y-4">
        {/* Play/Pause main lever */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl">
            <Volume2 size={13} className="text-[#C5A572]" />
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full accent-[#C5A572] cursor-pointer h-1 bg-white/10 rounded-lg appearance-none"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggle}
            className={cn(
              "p-3.5 rounded-2xl flex items-center justify-center shadow-lg outline-none",
              isPlaying 
                ? "bg-emerald-600 hover:bg-emerald-500 text-white" 
                : "bg-white hover:bg-slate-100 text-[#0B1424]"
            )}
          >
            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
