import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, X, Volume2, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { GoogleGenAI, Modality } from "@google/genai";
import { checkLimits, LIMIT_REACHED_MSG } from '../services/geminiService';
import { RuRuIcon } from './RuRuIcon';

import { useStore } from '../store/useStore';

export const LiveAssistant: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { role } = useStore();
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'listening' | 'speaking' | 'error'>('idle');

  useEffect(() => {
    if (error) setStatus('error');
    else if (isSpeaking) setStatus('speaking');
    else if (isListening) setStatus('listening');
    else setStatus('idle');
  }, [error, isListening, isSpeaking, isConnected]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);
  const volumeRef = useRef(0);

  // Initialize Live API Session
  useEffect(() => {
    const limitCheck = checkLimits('live-session', 10000); // 10s rate limit for session creations
    if (!limitCheck.allowed) {
      if (limitCheck.reason === 'DAILY_CAP') {
        setError(LIMIT_REACHED_MSG);
      } else {
        setError("Rate limit exceeded. Please wait a moment.");
      }
      return;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
    
    const connect = async () => {
      try {
        const session = await ai.live.connect({
          model: import.meta.env.VITE_GEMINI_LIVE_MODEL || "gemini-3.1-flash-live-preview",
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
            },
            systemInstruction: { parts: [{ text: "You are RuRu, a highly empathetic and multirole pet care assistant. You are in a live voice conversation with a pet owner who may be anxious or facing an emergency. Your role is to be a support and application features facilitator. Keep your responses concise, conversational, and supportive. Always acknowledge their feelings first ('I understand this is stressful', 'Take a deep breath'). If the user mentions an emergency (e.g., severe bleeding, unresponsive pet, suspected poisoning), advise them clearly and calmly to use the SOS feature or visit a vet immediately. Do not provide definitive medical diagnoses. IMPORTANT: Keep in mind the context is India. Be aware of local environmental factors (e.g., intense heat, monsoon seasons, and how they impact pet health/common diseases like Tick Fever or Parvovirus). Examples: User: 'My dog ate chocolate, I'm panicking!' RuRu: 'I know this is scary, but please take a deep breath. Chocolate toxicity is a serious emergency. Please use the SOS button or contact an emergency vet right away.'" }] },
          },
          callbacks: {
            onopen: () => {
              setIsConnected(true);
              setError(null);
            },
            onmessage: async (message) => {
              if (message.serverContent?.modelTurn?.parts) {
                const audioPart = message.serverContent.modelTurn.parts.find(p => p.inlineData);
                if (audioPart?.inlineData?.data) {
                  const binaryString = atob(audioPart.inlineData.data);
                  const bytes = new Uint8Array(binaryString.length);
                  for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                  }
                  const pcmData = new Int16Array(bytes.buffer);
                  audioQueueRef.current.push(pcmData);
                  if (!isPlayingRef.current) {
                    playNextInQueue();
                  }
                }
              }
              
              if (message.serverContent?.interrupted) {
                audioQueueRef.current = [];
                setIsSpeaking(false);
              }

              if (message.serverContent?.modelTurn?.parts?.[0]?.text) {
                setResponse(prev => prev + message.serverContent!.modelTurn!.parts[0].text);
              }
            },
            onerror: (err) => {
              console.error("Live API Error:", err);
              setError("Connection error. Please try again.");
            },
            onclose: () => {
              setIsConnected(false);
            }
          }
        });
        sessionRef.current = session;
      } catch (err) {
        console.error("Failed to connect to Live API:", err);
        setError("Failed to initialize AI session.");
      }
    };

    connect();

    return () => {
      if (sessionRef.current) sessionRef.current.close();
      stopAudioCapture();
    };
  }, []);

  const playNextInQueue = async () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsSpeaking(false);
      return;
    }

    isPlayingRef.current = true;
    setIsSpeaking(true);
    const pcmData = audioQueueRef.current.shift()!;
    
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    const buffer = audioContextRef.current.createBuffer(1, pcmData.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < pcmData.length; i++) {
      channelData[i] = pcmData[i] / 32768;
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.onended = playNextInQueue;
    source.start();
  };

  const startAudioCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      }
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
        volumeRef.current = Math.sqrt(sum / inputData.length);

        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        
        if (sessionRef.current && isConnected) {
          const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
          sessionRef.current.sendRealtimeInput({
            media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
          });
        }
      };

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      processorRef.current = processor;
      setIsListening(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
      setError("Microphone access denied.");
    }
  };

  const stopAudioCapture = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    if (isListening) {
      stopAudioCapture();
    } else {
      startAudioCapture();
      setResponse('');
    }
  };

  // Visualization
  useEffect(() => {
    if (!isListening && !isSpeaking) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const bars = 20;
    const barWidth = 4;
    const gap = 2;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FFFFFF';

      for (let i = 0; i < bars; i++) {
        const height = (volumeRef.current * 400 + 10) * (Math.random() * 0.5 + 0.5);
        const x = i * (barWidth + gap);
        const y = (canvas.height - height) / 2;
        ctx.fillRect(x, y, barWidth, height);
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [isListening, isSpeaking]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-ruru-navy flex flex-col items-center justify-center p-8 text-white bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"
    >
      <button 
        onClick={onClose}
        className="absolute top-10 right-10 p-4 hover:bg-white/10 rounded-full transition-colors backdrop-blur-md border border-white/5"
      >
        <X size={28} />
      </button>

      <div className="flex-1 flex flex-col items-center justify-center space-y-16 w-full max-w-md relative z-10">
        <div className="relative">
          <motion.div
            animate={{
              scale: isListening || isSpeaking ? [1, 1.25, 1] : 1,
              opacity: isListening || isSpeaking ? [0.4, 0.8, 0.4] : 0.1
            }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="absolute inset-0 bg-ruru-teal rounded-full blur-[4rem]"
          />
          <div className="relative w-48 h-48 bg-white/5 backdrop-blur-2xl rounded-[2.5rem] flex items-center justify-center border border-white/10 shadow-[0_0_80px_rgba(52,181,199,0.15)] rotate-45">
            <div className="-rotate-45">
              {/* @ts-ignore - TS2322 fix for status type mismatch */}
              <RuRuIcon role={role} className="w-24 h-24" status={status === 'error' ? 'alert' : (status as 'idle' | 'listening' | 'speaking')} />
            </div>
          </div>
        </div>

        <div className="text-center space-y-6 min-h-[140px] flex flex-col justify-center w-full">
          <AnimatePresence mode="wait">
            {error ? (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-3 text-red-400 bg-red-400/10 px-6 py-4 rounded-[2.5rem] border border-red-400/20">
                <AlertCircle size={20} />
                <p className="text-sm font-medium tracking-tight">{error}</p>
              </motion.div>
            ) : !isConnected ? (
              <motion.div key="connecting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex justify-center gap-1.5 opacity-50">
                  <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-1.5 h-1.5 rounded-full bg-ruru-teal-pale"></motion.span>
                  <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }} className="w-1.5 h-1.5 rounded-full bg-ruru-teal-pale"></motion.span>
                  <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.6 }} className="w-1.5 h-1.5 rounded-full bg-ruru-teal-pale"></motion.span>
                </div>
                <p className="text-ruru-teal-pale/50 uppercase tracking-[0.3em] text-[10px] font-black">Establishing RuRu Core Link</p>
              </motion.div>
            ) : isListening ? (
              <motion.div key="listening" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-ruru-teal animate-pulse shadow-sm shadow-ruru-teal/50" />
                  <p className="text-ruru-teal text-[10px] font-black uppercase tracking-[0.3em]">Microphone Active</p>
                </div>
                <p className="text-2xl font-brand italic text-white/90 tracking-tight">Speak now, I'm analyzing...</p>
              </motion.div>
            ) : isSpeaking ? (
              <motion.div key="speaking" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-ruru-magenta animate-pulse shadow-sm shadow-ruru-magenta/50" />
                  <p className="text-ruru-magenta text-[10px] font-black uppercase tracking-[0.3em]">RuRu Synthesizing</p>
                </div>
                <p className="text-xl leading-relaxed px-6 font-medium text-white/80 tracking-tight">{response || "..."}</p>
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <h2 className="text-4xl font-brand tracking-tighter">How can I assist?</h2>
                <p className="text-ruru-teal-pale/60 text-sm font-medium">Activate the receptor to begin live dialogue.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <canvas 
          ref={canvasRef} 
          width={180} 
          height={80} 
          className={cn("transition-opacity duration-700 pointer-events-none", (isListening || isSpeaking) ? "opacity-100" : "opacity-0")}
        />

        <button
          onClick={toggleListening}
          disabled={!isConnected}
          className={cn(
            "w-28 h-28 rounded-[2.5rem] flex items-center justify-center transition-all duration-700 shadow-2xl disabled:opacity-30 relative overflow-hidden group",
            isListening ? "bg-ruru-pink-dark shadow-ruru-pink-dark/20 rotate-12 scale-105" : "bg-white/95 backdrop-blur-3xl text-ruru-navy hover:bg-ruru-pink-pale"
          )}
        >
          {isListening && <div className="absolute inset-0 bg-white/20 animate-ping opacity-20" />}
          {isListening ? <MicOff size={44} strokeWidth={2} className="relative z-10 text-white" /> : <Mic size={44} strokeWidth={2} className="relative z-10 text-ruru-navy group-hover:scale-110 transition-transform duration-500 group-hover:text-ruru-magenta" />}
        </button>
      </div>

      <div className="mt-auto flex items-center gap-4 text-ruru-teal-pale/40 text-[9px] font-black uppercase tracking-[0.4em]">
        <Volume2 size={16} />
        <span>Gemini Multimodal Live API</span>
      </div>
    </motion.div>
  );
};
