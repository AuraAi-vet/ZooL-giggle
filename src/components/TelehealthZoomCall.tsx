import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Video } from 'lucide-react';
import { toast } from 'sonner';
import DailyIframe from '@daily-co/daily-js';

interface TelehealthZoomCallProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  vetName: string;
  petName: string;
  testMode?: boolean;
}

export function TelehealthZoomCall({
  isOpen,
  onClose,
  appointmentId,
  vetName,
  petName,
  testMode = false
}: TelehealthZoomCallProps) {
  const [status, setStatus] = useState<'initializing' | 'active' | 'ended'>('initializing');
  const containerRef = useRef<HTMLDivElement>(null);
  const callFrameRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) return;

    setStatus('initializing');
    const initTimer = setTimeout(() => {
      if (containerRef.current && !callFrameRef.current) {
        callFrameRef.current = DailyIframe.createFrame(containerRef.current, {
          iframeStyle: {
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '2.5rem',
          },
          showLeaveButton: false, // We'll use our own leave button if needed, or let them use it
        });

        // Use a test room for demo purposes. 
        // In a real app this URL would be dynamically generated per session
        const demoRoomUrl = 'https://ai-studio-demo.daily.co/zool-telehealth-demo';

        callFrameRef.current.join({ url: demoRoomUrl })
          .then(() => {
            setStatus('active');
            toast.success("WebRTC Telehealth Session Joined.");
          })
          .catch((err: any) => {
            console.error("Daily.co join failed", err);
            toast.warning("Failed to connect to telemedicine server.");
          });

        callFrameRef.current.on('left-meeting', () => {
          handleEndCall();
        });
      }
    }, 1000);

    return () => {
      clearTimeout(initTimer);
      if (callFrameRef.current) {
        callFrameRef.current.leave();
        callFrameRef.current.destroy();
        callFrameRef.current = null;
      }
    };
  }, [isOpen]);

  const handleEndCall = () => {
    if (callFrameRef.current) {
      callFrameRef.current.leave();
    }
    setStatus('ended');
    toast.success("Telehealth Session Disconnected.");
    setTimeout(() => {
      onClose();
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" id="telehealth-zoom-overlay">
        
        {status === 'initializing' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-6 z-10"
          >
            <div className="relative">
              <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              <Video className="absolute inset-0 m-auto text-blue-500 animate-pulse" size={28} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-brand font-semibold text-white tracking-tight">
                Establishing WebRTC Connection...
              </h3>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-mono">
                Meeting ID: WEBRTC-{appointmentId.slice(0, 4).toUpperCase()}
              </p>
            </div>
          </motion.div>
        )}

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="w-full h-full max-w-7xl max-h-[90vh] bg-[#0B1424] border border-white/10 rounded-[2.5rem] relative flex flex-col shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="h-16 shrink-0 bg-white/5 border-b border-white/10 flex items-center justify-between px-6 z-10">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-500">
                🔴 LIVE TELEMEDICINE
              </span>
              <span className="text-slate-400 text-xs hidden sm:inline">|</span>
              <span className="text-xs text-slate-300 font-medium hidden sm:inline">
                Patient: {petName} • Provider: {vetName}
              </span>
            </div>
            <button 
              onClick={handleEndCall}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors"
            >
              End Session
            </button>
          </div>

          {/* Daily.co Iframe Container */}
          <div className="flex-1 w-full h-full relative" ref={containerRef}>
            {/* The daily iframe will be injected here */}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
