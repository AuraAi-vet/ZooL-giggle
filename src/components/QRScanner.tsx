import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Flashlight, FlashlightOff } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onError: (error: Error) => void;
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(true);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [supportsTorch, setSupportsTorch] = useState<boolean>(false);

  const toggleTorch = async () => {
    if (!videoRef.current || !videoRef.current.srcObject) return;
    try {
      const stream = videoRef.current.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      
      await track.applyConstraints({
        advanced: [{ torch: !torchOn }] as any
      });
      setTorchOn(!torchOn);
    } catch (err) {
      console.error("Failed to toggle torch:", err);
    }
  };

  useEffect(() => {
    let stream: MediaStream | null = null;
    let requestAnimationFrameId: number;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS Safari
          videoRef.current.play();
          requestAnimationFrameId = requestAnimationFrame(tick);

          // Check for torch capability
          const track = stream.getVideoTracks()[0];
          const capabilities = track.getCapabilities() as any;
          if (capabilities && capabilities.torch) {
            setSupportsTorch(true);
          }
        }
      } catch (err) {
        setHasCamera(false);
        onError(err instanceof Error ? err : new Error(String(err)));
      }
    };

    const tick = () => {
      if (!isActive) return;
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            });

            if (code) {
              onScan(code.data);
            }
          }
        }
      }
      requestAnimationFrameId = requestAnimationFrame(tick);
    };

    if (isActive) {
      startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      cancelAnimationFrame(requestAnimationFrameId);
    };
  }, [onScan, onError, isActive]);

  if (!hasCamera) {
    return (
      <div className="bg-slate-100 p-6 rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center">
        <p className="text-sm text-slate-500 font-bold mb-2">Camera access denied</p>
        <p className="text-xs text-slate-400">Please allow camera permissions to scan QR codes.</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden bg-black aspect-square max-w-sm mx-auto shadow-inner border-2 border-slate-800">
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" />
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Scanner overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none border-[12px] border-black/40">
        {supportsTorch && (
          <button
            onClick={toggleTorch}
            className="absolute top-4 right-4 z-20 p-2 bg-black/60 rounded-full text-white pointer-events-auto hover:bg-black/80 transition-colors"
          >
            {torchOn ? <FlashlightOff size={20} /> : <Flashlight size={20} />}
          </button>
        )}
        <div className="w-full h-full border-2 border-teal-500/50 relative">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-teal-400 rounded-tl-sm -ml-1 -mt-1" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-teal-400 rounded-tr-sm -mr-1 -mt-1" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-teal-400 rounded-bl-sm -ml-1 -mb-1" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-teal-400 rounded-br-sm -mr-1 -mb-1" />
          {/* Scanning line animation */}
          <div className="w-full h-1 bg-teal-400 shadow-[0_0_8px_2px_rgba(45,212,191,0.5)] absolute animate-[scan_2s_ease-in-out_infinite]" 
            style={{
               animation: 'scan 2s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate'
            }}
          />
        </div>
      </div>
    </div>
  );
}
