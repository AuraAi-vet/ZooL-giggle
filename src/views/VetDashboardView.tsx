import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { QRScanner } from '../components/QRScanner';
import { useCommerceStore } from '../store/useCommerceStore';
import { useShallow } from 'zustand/react/shallow';
import { Activity, QrCode, Search, ChevronRight, User, Stethoscope, Printer } from 'lucide-react';
import ClinicalChartView from './ClinicalChartView';
import QRCode from 'qrcode';
import ActivePatientCard from '../components/ActivePatientCard';

export default function VetDashboardView() {
  const [scanning, setScanning] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [qrCodeUrls, setQrCodeUrls] = useState<Record<number, string>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const bookings = useCommerceStore(useShallow((state) => state.bookings));

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (isPrinting) {
      const generateAllQRs = async () => {
        const urls: Record<number, string> = {};
        for (const patient of bookings) {
          try {
            urls[patient.id] = await QRCode.toDataURL(`patient:${patient.id}`, { width: 150 });
          } catch (e) {
            console.error(e);
          }
        }
        setQrCodeUrls(urls);
        setTimeout(() => {
          window.print();
        }, 500);
      };
      generateAllQRs();
    }
  }, [isPrinting, bookings]);

  const handleScan = (data: string) => {
    // The QR code contains "patient:<id>"
    if (data.startsWith('patient:')) {
      const patientId = parseInt(data.replace('patient:', ''), 10);
      const patient = bookings.find((b) => b.id === patientId);
      
      if (patient) {
        // Vibrate for feedback
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]); // Short vibration pattern
        }
        setScanning(false);
        setToast({ message: `Scan Successful: ${patient.petName}`, type: 'success' });
        setSelectedPatientId(patientId);
      }
    }
  };

  const handleError = (error: Error) => {
    console.error('QR Scanner error:', error);
  };

  // If a patient is selected, show their clinical chart
  if (selectedPatientId) {
    const patient = bookings.find((b) => b.id === selectedPatientId);
    if (patient) {
      return (
        <div id="clinical-chart-view">
          <ClinicalChartView 
            patient={patient} 
            onBack={() => setSelectedPatientId(null)} 
          />
        </div>
      );
    }
  }

  if (isPrinting) {
    return (
      <div className="bg-white p-8 absolute inset-0 z-50 print:block">
        <div className="flex justify-between items-center mb-8 print:hidden">
          <h1 className="text-2xl font-bold">Print Preview</h1>
          <button onClick={() => setIsPrinting(false)} className="px-4 py-2 bg-slate-200 rounded-lg font-bold">Close Preview</button>
        </div>
        <div className="grid grid-cols-3 gap-8">
          {bookings.map(patient => (
            <div key={patient.id} className="border border-slate-300 p-4 rounded-xl flex flex-col items-center text-center">
              <h2 className="font-bold text-lg">{patient.petName}</h2>
              <p className="text-sm text-slate-500">{patient.petType}</p>
              {qrCodeUrls[patient.id] && (
                <img src={qrCodeUrls[patient.id]} alt={`QR for ${patient.petName}`} className="w-32 h-32 mt-4 inline-block" />
              )}
              <p className="text-xs font-mono mt-2">ID: {patient.id}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-6" id="clinical-chart-view"
    >
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/50 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 blur-3xl rounded-full" />
        <span className="text-[10px] font-black tracking-widest uppercase text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
          Veterinary Portal
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-3 font-display">
          Vet Dashboard
        </h1>
        <p className="text-xs text-slate-500 mt-2 max-w-md leading-relaxed">
          Scan patient QR codes for instant clinical chart access or browse your daily admission roster.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Scanner Module */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/50 shadow-xs flex flex-col gap-6 h-fit">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <QrCode size={16} className="text-blue-600" />
                Chart Scanner
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Scan client-provided codes to pull medical history.
              </p>
            </div>
          </div>

          {scanning ? (
            <div className="flex flex-col gap-4">
              <QRScanner onScan={handleScan} onError={handleError} />
              <button
                onClick={() => setScanning(false)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold uppercase tracking-wide text-xs rounded-xl transition-colors"
              >
                Cancel Scan
              </button>
            </div>
          ) : (
            <button
              onClick={() => setScanning(true)}
              className="w-full aspect-video flex flex-col items-center justify-center gap-3 bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl hover:bg-blue-100/50 hover:border-blue-300 transition-all group"
            >
              <div className="p-4 bg-white rounded-full shadow-sm text-blue-500 group-hover:scale-110 transition-transform">
                <QrCode size={24} />
              </div>
              <span className="text-sm font-bold text-blue-700">Activate Camera to Scan</span>
            </button>
          )}
        </div>

        {/* Daily Patient Roster */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/50 shadow-xs flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Stethoscope size={16} className="text-blue-600" />
              Today's Admissions ({bookings.length})
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsPrinting(true)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-full transition-colors"
                title="Bulk Print QR Codes"
              >
                <Printer size={16} />
              </button>
              <div className="relative hidden md:block">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search..."
                  className="text-xs bg-slate-50 border border-slate-200 rounded-full pl-8 pr-4 py-1.5 outline-none focus:border-blue-500 w-32 focus:w-40 transition-all"
                />
              </div>
            </div>
          </div>

          {bookings.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-slate-100 rounded-2xl bg-slate-50">
              <User size={32} className="text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-600">No active patients</p>
              <p className="text-xs text-slate-400 mt-1">Patients booked via Concierge will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[400px]">
              {bookings.map((patient) => (
                <ActivePatientCard
                  key={patient.id}
                  petName={patient.petName}
                  speciesBreed={patient.petType}
                  avatarUrl="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=269&h=269&auto=format&fit=crop"
                  healthStatus={patient.id % 3 === 0 ? "ACTION_NEEDED" : (patient.id % 2 === 0 ? "MONITORING" : "CLEAR")}
                  nextMilestone="Next appointment in 3 days"
                  onClick={() => setSelectedPatientId(patient.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      {toast && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-3 rounded-xl shadow-lg border border-blue-500 z-50"
        >
          <p className="text-xs font-bold">{toast.message}</p>
        </motion.div>
      )}
    </motion.div>
  );
}
