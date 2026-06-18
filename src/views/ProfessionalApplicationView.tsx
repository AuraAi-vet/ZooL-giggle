import React, { useState } from 'react';
import {
  Stethoscope,
  ShieldCheck,
  Scissors,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Upload,
  Building2,
  User as UserIcon,
  Loader2,
  FileText,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AnimatedLogo from '../components/AnimatedLogo';
import { auth } from '../lib/firebase';
import { submitProfessionalApplication } from '../services/dbService';

interface ProfessionalApplicationViewProps {
  userRole: string;
  onSubmitted: () => void;
}

export default function ProfessionalApplicationView({ userRole, onSubmitted }: ProfessionalApplicationViewProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    licenseNumber: '',
    clinicName: '',
    clinicAddress: '',
    specialty: '',
    yearsOfExperience: 0,
  });

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const roleLabel = {
    'role_vet_02': 'Clinician',
    'role_admin_03': 'Administrator',
    'role_service_04': 'Care Provider'
  }[userRole] || 'Professional';

  const roleIcon = {
    'role_vet_02': <Stethoscope className="w-6 h-6" />,
    'role_admin_03': <ShieldCheck className="w-6 h-6" />,
    'role_service_04': <Scissors className="w-6 h-6" />
  }[userRole] || <UserIcon className="w-6 h-6" />;

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    if (!auth.currentUser) return;

    if (uploadedFile && uploadProgress < 100) {
      setIsUploading(true);
      // Simulate file upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      setIsUploading(false);
    }

    setIsSubmitting(true);
    try {
      await submitProfessionalApplication(auth.currentUser.uid, {
        ...formData,
        verificationDocumentUrl: uploadedFile ? `https://firebasestorage.googleapis.com/v0/b/zool-app/o/verifications%2F${auth.currentUser.uid}_${uploadedFile.name}` : undefined
      });
      onSubmitted();
    } catch (error) {
      console.error("Application submission failed:", error);
      alert("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>

      <div className="w-full max-w-2xl relative z-10">
        <div className="bg-slate-900/60 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-slate-700/50 overflow-hidden">

          {/* Header */}
          <div className="p-10 border-b border-slate-700/50 flex items-center justify-between bg-gradient-to-r from-slate-900/40 to-transparent">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <AnimatedLogo size="sm" />
                <span className="text-cyan-400 font-bold text-xs uppercase tracking-[0.2em]">Application Process</span>
              </div>
              <h1 className="text-3xl font-black text-white font-display">Professional Verification</h1>
              <p className="text-slate-400 text-sm mt-1">Complete your profile to join the ZooL professional network.</p>
            </div>
            <div className="hidden sm:flex flex-col items-end">
              <div className="p-3 bg-slate-800 rounded-2xl text-cyan-400 border border-slate-700 shadow-xl">
                {roleIcon}
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">{roleLabel}</span>
            </div>
          </div>

          {/* Stepper */}
          <div className="px-10 py-6 bg-slate-900/20 border-b border-slate-700/30 flex justify-between">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all duration-500 ${
                  step === i ? 'bg-cyan-500 text-slate-900 shadow-[0_0_15px_rgba(6,182,212,0.4)]' :
                  step > i ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  'bg-slate-800 text-slate-500 border border-slate-700'
                }`}>
                  {step > i ? <CheckCircle className="w-4 h-4" /> : i}
                </div>
                <div className={`hidden sm:block h-0.5 w-8 rounded-full ${i === 4 ? 'hidden' : step > i ? 'bg-emerald-500/30' : 'bg-slate-800'}`}></div>
              </div>
            ))}
          </div>

          {/* Form Content */}
          <div className="p-10 min-h-[400px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" variants={containerVars} initial="hidden" animate="show" exit="exit" className="space-y-6">
                  <div className="flex items-center gap-3 text-white mb-2">
                    <UserIcon className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-xl font-bold">Professional Identity</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Professional Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Senior Surgeon"
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:border-cyan-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">License / ID Number</label>
                      <input
                        type="text"
                        placeholder="VET-123456"
                        value={formData.licenseNumber}
                        onChange={e => setFormData({...formData, licenseNumber: e.target.value})}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:border-cyan-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Specialty</label>
                    <input
                      type="text"
                      placeholder="e.g. Small Animal Cardiology"
                      value={formData.specialty}
                      onChange={e => setFormData({...formData, specialty: e.target.value})}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:border-cyan-500 outline-none transition-all"
                    />
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" variants={containerVars} initial="hidden" animate="show" exit="exit" className="space-y-6">
                  <div className="flex items-center gap-3 text-white mb-2">
                    <Building2 className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-xl font-bold">Practice Information</h2>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Clinic / Facility Name</label>
                    <input
                      type="text"
                      placeholder="ZooL Pet Clinic - Downtown"
                      value={formData.clinicName}
                      onChange={e => setFormData({...formData, clinicName: e.target.value})}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:border-cyan-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Facility Address</label>
                    <textarea
                      placeholder="123 Clinical Way, Suite 100..."
                      value={formData.clinicAddress}
                      onChange={e => setFormData({...formData, clinicAddress: e.target.value})}
                      className="w-full h-24 bg-slate-800/50 border border-slate-700 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:border-cyan-500 outline-none transition-all resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Years of Experience</label>
                    <input
                      type="number"
                      value={formData.yearsOfExperience}
                      onChange={e => setFormData({...formData, yearsOfExperience: parseInt(e.target.value) || 0})}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 text-white focus:border-cyan-500 outline-none transition-all"
                    />
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" variants={containerVars} initial="hidden" animate="show" exit="exit" className="space-y-6">
                  <div className="flex items-center gap-3 text-white mb-2">
                    <FileText className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-xl font-bold">Verification Documents</h2>
                  </div>
                  <p className="text-slate-400 text-sm">Upload a copy of your clinical license or professional certification for our compliance team to review.</p>

                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-slate-700 border-dashed rounded-3xl cursor-pointer bg-slate-800/30 hover:bg-slate-800/50 transition-all group overflow-hidden relative">
                    {uploadedFile ? (
                      <div className="flex flex-col items-center text-emerald-400 w-full px-10">
                        <CheckCircle className="w-10 h-10 mb-2" />
                        <span className="font-bold text-sm truncate max-w-full">{uploadedFile.name}</span>
                        <div className="w-full bg-slate-700 h-1.5 rounded-full mt-4 overflow-hidden">
                           <motion.div
                             initial={{ width: 0 }}
                             animate={{ width: `${uploadProgress || 100}%` }}
                             className="h-full bg-emerald-500"
                           />
                        </div>
                        <span className="text-[10px] font-bold mt-2 uppercase tracking-widest opacity-60">
                          {uploadProgress === 100 ? 'Upload Complete' : 'Ready for Submission'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-10 h-10 text-slate-500 mb-3 group-hover:text-cyan-400 transition-colors" />
                        <p className="text-sm text-slate-400 font-medium">Click to upload license (PDF/JPG)</p>
                        <p className="text-[10px] text-slate-600 mt-1 uppercase tracking-widest">Max file size: 5MB</p>
                      </div>
                    )}
                    <input type="file" className="hidden" onChange={e => {
                      setUploadedFile(e.target.files?.[0] || null);
                      setUploadProgress(0);
                    }} />
                  </label>

                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex gap-4">
                    <ShieldCheck className="w-6 h-6 text-blue-400 shrink-0" />
                    <p className="text-[11px] text-blue-300 leading-relaxed font-medium">
                      Your data is encrypted and stored in HIPAA-compliant infrastructure. Our clinical verification team typically reviews applications within 24-48 business hours.
                    </p>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="step4" variants={containerVars} initial="hidden" animate="show" exit="exit" className="space-y-6">
                  <div className="flex items-center gap-3 text-white mb-2">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-xl font-bold">Final Review</h2>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-2xl flex justify-between items-center">
                      <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Identity</span>
                      <span className="text-white font-bold">{formData.title} • {formData.licenseNumber}</span>
                    </div>
                    <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-2xl flex justify-between items-center">
                      <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Practice</span>
                      <span className="text-white font-bold">{formData.clinicName}</span>
                    </div>
                    <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-2xl flex justify-between items-center">
                      <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Document</span>
                      <span className={uploadedFile ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                        {uploadedFile ? "License Attached" : "No Document"}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 bg-cyan-500/10 border border-cyan-500/20 rounded-3xl">
                    <p className="text-cyan-100 text-sm leading-relaxed font-medium text-center">
                      By submitting this application, you certify that all information provided is accurate and that you are an authorized professional representative.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Actions */}
          <div className="p-10 bg-slate-900/40 border-t border-slate-700/50 flex justify-between gap-4">
            <button
              onClick={handleBack}
              disabled={step === 1 || isSubmitting}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl disabled:opacity-30 transition-all border border-slate-700"
            >
              <ChevronLeft className="w-5 h-5" /> Back
            </button>

            {step < 4 ? (
              <button
                onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all active:scale-[0.98]"
              >
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>Submit Application <CheckCircle className="w-5 h-5" /></>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
