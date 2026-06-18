import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Syringe, FileText, UserPlus, FileHeart, CalendarOff, CalendarClock, ChevronRight } from 'lucide-react';
import { PetProfile } from '../types';

interface PetDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pet: PetProfile | undefined;
}

export default function PetDetailsModal({ isOpen, onClose, pet }: PetDetailsModalProps) {
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!pet) return null;

  // Mock Expanded Medical History
  const medicalHistory = [
    { id: 1, date: 'Oct 12, 2023', diagnosis: 'Healthy', notes: 'Annual wellness exam completed. Vitals are completely normal, weight maintained.', doc: 'Dr. Neha Sharma' },
    { id: 2, date: 'Mar 04, 2023', diagnosis: 'Mild Dermatitis', notes: 'Prescribed topical cream for slight rash. Likely environmental allergy.', doc: 'Dr. Arvind Desai' },
  ];

  // Mock Vaccine Records
  const vaccines = [
    { id: 1, name: 'Rabies (1-year)', dateGiven: 'Dec 05, 2023', nextDue: 'Dec 05, 2024', status: 'active' },
    { id: 2, name: 'DHPP', dateGiven: 'Sep 10, 2023', nextDue: 'Sep 10, 2024', status: 'active' },
    { id: 3, name: 'Bordetella', dateGiven: 'Aug 15, 2023', nextDue: 'Feb 15, 2024', status: 'due' },
  ];

  // Mock Assigned Clinicians
  const clinicians = [
    { id: 1, name: 'Dr. Neha Sharma', role: 'Primary Veterinarian', contact: 'ZooL Pet Clinic - Trivandrum' },
    { id: 2, name: 'Dr. Arvind Desai', role: 'Dermatology Specialist', contact: 'Metro Animal Specialists' },
  ];

  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVars = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring" as const, stiffness: 350, damping: 30 }}
            className="fixed inset-0 m-auto z-[101] w-full max-w-4xl max-h-[90vh] bg-[#F8FAFC] rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-white border-b border-slate-200 flex justify-between items-center z-10 shrink-0">
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-3 font-display">
                <FileHeart className="w-5 h-5 text-indigo-500" />
                Comprehensive Health Record
              </h2>
              <button 
                onClick={onClose} 
                className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-8">
              
              <motion.div 
                variants={containerVars} 
                initial="hidden" 
                animate="show" 
                className="flex flex-col gap-8"
              >
                {/* Pet Info Banner */}
                <motion.div variants={itemVars} className="flex items-center gap-5 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full opacity-50 -z-10"></div>
                  <img 
                    src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=200&auto=format&fit=crop" 
                    alt={pet.name} 
                    className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 font-display">{pet.name}</h3>
                    <p className="text-slate-500 font-medium">{pet.breed} • {pet.age} years old</p>
                  </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Column 1: History & Vaccines */}
                  <div className="flex flex-col gap-8">
                    {/* Expanded Medical History */}
                    <motion.section variants={itemVars}>
                       <h4 className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
                         <FileText className="w-4 h-4" />
                         Medical History
                       </h4>
                       <div className="space-y-4">
                         {medicalHistory.map(record => (
                           <div key={record.id} className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm group hover:border-indigo-100 transition-colors">
                             <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-slate-800">{record.diagnosis}</span>
                                <span className="text-xs font-medium text-slate-400">{record.date}</span>
                             </div>
                             <p className="text-sm text-slate-600 mb-4 leading-relaxed">{record.notes}</p>
                             <div className="flex items-center justify-between">
                               <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md inline-block">
                                 {record.doc}
                               </div>
                               <button className="text-xs font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors opacity-0 group-hover:opacity-100">
                                  View Notes <ChevronRight className="w-3 h-3" />
                               </button>
                             </div>
                           </div>
                         ))}
                       </div>
                    </motion.section>

                    {/* Vaccine Records */}
                    <motion.section variants={itemVars}>
                      <h4 className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
                         <Syringe className="w-4 h-4" />
                         Vaccine Records
                      </h4>
                      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                        {vaccines.map((vax, index) => (
                          <div key={vax.id} className={`p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors ${index !== vaccines.length - 1 ? 'border-b border-slate-100' : ''}`}>
                            <div>
                              <div className="font-bold text-slate-800 flex items-center gap-2">
                                {vax.name}
                                {vax.status === 'due' && (
                                  <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Due</span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 mt-1 flex items-center gap-4">
                                <span className="flex items-center gap-1"><CalendarClock className="w-3.5 h-3.5 text-slate-400"/> {vax.dateGiven}</span>
                                <span className="flex items-center gap-1"><CalendarOff className="w-3.5 h-3.5 text-slate-400"/> Due: {vax.nextDue}</span>
                              </div>
                            </div>
                            <div>
                               {vax.status === 'active' ? (
                                 <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                               ) : (
                                 <div className="w-2.5 h-2.5 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(225,29,72,0.4)] animate-pulse"></div>
                               )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.section>
                  </div>

                  {/* Column 2: Clinicians */}
                  <div className="flex flex-col gap-8">
                    <motion.section variants={itemVars}>
                      <h4 className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
                         <UserPlus className="w-4 h-4" />
                         Care Team
                      </h4>
                      <div className="space-y-4">
                        {clinicians.map(cli => (
                          <div key={cli.id} className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex items-start gap-4 hover:border-indigo-100 transition-colors group cursor-pointer">
                             <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold text-lg group-hover:bg-blue-100 transition-colors">
                               {cli.name.split(' ')[1]?.[0] || 'D'}
                             </div>
                             <div className="flex-1">
                               <h5 className="font-bold text-slate-800 mb-0.5">{cli.name}</h5>
                               <p className="text-sm font-medium text-slate-500">{cli.role}</p>
                               <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                                  <p className="text-xs text-indigo-600 font-medium">{cli.contact}</p>
                                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                               </div>
                             </div>
                          </div>
                        ))}
                      </div>
                    </motion.section>
                  </div>

                </div>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
