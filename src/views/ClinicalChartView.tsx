import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { ArrowLeft, Activity, Heart, Droplet, FileText, QrCode, Sparkles } from 'lucide-react';

import ExportToDocsButton from '../components/ExportToDocsButton';

interface Patient {
  id: number;
  serviceName: string;
  serviceType: string;
  date: string;
  time: string;
  petName: string;
  petType: string;
  status: string;
}

interface ClinicalChartViewProps {
  patient: Patient;
  onBack: () => void;
}

export default function ClinicalChartView({ patient, onBack }: ClinicalChartViewProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showQr, setShowQr] = useState<boolean>(false);
  const [clinicalNotes, setClinicalNotes] = useState("Patient appears responsive and stable upon preliminary assessment. Heart rate is within normal limits for species / breed profile. Scheduling routine diagnostic checks for later this afternoon.");
  const [isSummarizing, setIsSummarizing] = useState(false);

  useEffect(() => {
    // Generate QR code encoding the patient ID
    const generateQR = async () => {
      try {
        const payload = `patient:${patient.id}`;
        const dataUrl = await QRCode.toDataURL(payload, {
          width: 256,
          margin: 2,
          color: {
            dark: '#0f766e', // teal-700
            light: '#ffffff'
          }
        });
        setQrCodeUrl(dataUrl);
      } catch (err) {
        console.error('Failed to generate QR code', err);
      }
    };
    generateQR();
  }, [patient.id]);

  const handleSummarize = async () => {
    if (!clinicalNotes.trim()) return;
    setIsSummarizing(true);
    try {
      const response = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawNotes: clinicalNotes, patientContext: patient })
      });
      if(response.ok) {
        const data = await response.json();
        setClinicalNotes(data.response);
      }
    } catch(err) {
      console.error(err);
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200/50 shadow-xs">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Roster
        </button>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black tracking-widest uppercase bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-100">
            {patient.serviceType}
          </span>
          <span className="text-[10px] font-mono text-slate-400">ID: {patient.id}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Patient Identity & QR */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/50 shadow-xs flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-full flex items-center justify-center text-teal-800 text-3xl font-black mb-4 shadow-sm border border-teal-200">
              {patient.petName.charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-slate-900">{patient.petName}</h2>
            <p className="text-sm font-mono text-slate-500 mt-1">{patient.petType}</p>
            
            <div className="w-full h-px bg-slate-100 my-5" />

            <div className="w-full flex-col flex gap-2 text-left text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Date</span>
                <span className="text-slate-700 font-mono">{patient.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Time</span>
                <span className="text-slate-700 font-mono">{patient.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Facility</span>
                <span className="text-slate-700 font-bold">{patient.serviceName}</span>
              </div>
            </div>
            
            <div className="w-full mt-6">
              {!showQr ? (
                <button
                  onClick={() => setShowQr(true)}
                  className="w-full py-3 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-700 text-xs font-black uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <QrCode size={16} />
                  Generate Identity QR
                </button>
              ) : (
                <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                  <div className="p-3 bg-white border-2 border-slate-100 rounded-2xl shadow-sm mb-3">
                    {qrCodeUrl && <img src={qrCodeUrl} alt="Patient QR Code" className="w-40 h-40" />}
                  </div>
                  <button
                    onClick={() => setShowQr(false)}
                    className="text-[10px] uppercase font-bold text-slate-400 hover:text-slate-600 tracking-wider"
                  >
                    Hide Code
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Biometrics & Clinical Notes */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/50 shadow-xs relative overflow-hidden">
             
             {/* IoT Telemetry Background Pattern */}
             <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>

            <div className="flex items-center justify-between mb-6 relative z-10">
               <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                 <Activity size={16} className="text-rose-500" />
                 IoT Edge Telemetry Stream
               </h3>
               <div className="flex items-center gap-2">
                 <span className="text-[10px] font-mono text-slate-400">VIA MQTT BROKER</span>
                 <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
               </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
              <div className="border border-slate-200 p-4 rounded-2xl bg-white shadow-sm flex flex-col gap-1.5 transition-all hover:-translate-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Heart size={10} className="text-rose-500" /> Heart Rate
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-800 font-mono">112</span>
                  <span className="text-[10px] text-rose-500 font-bold uppercase">BPM</span>
                </div>
              </div>

              <div className="border border-slate-200 p-4 rounded-2xl bg-white shadow-sm flex flex-col gap-1.5 transition-all hover:-translate-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Activity size={10} className="text-emerald-500" /> Core Temp
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-800 font-mono">101.5</span>
                  <span className="text-[10px] text-emerald-600 font-bold uppercase">°F</span>
                </div>
              </div>

              <div className="border border-slate-200 p-4 rounded-2xl bg-white shadow-sm flex flex-col gap-1.5 transition-all hover:-translate-y-1">
                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Activity size={10} className="text-blue-500" /> Activity Index
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-800 font-mono">840</span>
                  <span className="text-[10px] text-blue-600 font-bold uppercase">/1000</span>
                </div>
              </div>

              <div className="border border-slate-200 p-4 rounded-2xl bg-white shadow-sm flex flex-col gap-1.5 transition-all hover:-translate-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Droplet size={10} className="text-indigo-500" /> Sleep State
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-black text-slate-800 font-display tracking-tight">ACTIVE</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/50 shadow-xs flex-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2 mb-4">
              <FileText size={16} className="text-indigo-500" />
              Clinical Notes
            </h3>
            
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-4">
              <p className="text-xs text-amber-800 font-medium">Trial Admission Notice</p>
              <p className="text-[10px] text-amber-700/80 mt-1">Patient admitted under complimentary premium trial layer. Ensure all essential diagnostics are logged locally.</p>
            </div>

            <textarea 
              className="w-full h-48 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-700 outline-none focus:border-indigo-500 resize-none font-mono"
              placeholder="Enter clinical observations..."
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
            />
            <div className="flex justify-between items-center mt-3">
              <button 
                onClick={handleSummarize}
                disabled={isSummarizing}
                className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors disabled:opacity-50"
              >
                {isSummarizing ? (
                  <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Sparkles size={14} />
                )}
                {isSummarizing ? 'Structuring...' : 'AI Auto-SOAP'}
              </button>
              <div className="flex items-center gap-3">
                <ExportToDocsButton content={clinicalNotes} title={`Clinical SOAP: ${patient.petName} - ${patient.date}`} />
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors shadow-sm">
                  Save Note to Chain
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
