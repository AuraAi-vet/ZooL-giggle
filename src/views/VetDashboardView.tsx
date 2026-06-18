import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Clock, 
  Stethoscope, 
  Activity, 
  Search, 
  ArrowUpRight,
  ClipboardList,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  Radar,
  ChevronRight,
  LogOut,
  Plus,
  Edit2,
  Trash2
} from 'lucide-react';
import { Pet, Appointment, HealthRecord } from '../types';
import { cn } from '../lib/utils';
import { BiospatialRadar } from '../components/BiospatialRadar';
import { QuickActions } from '../components/QuickActions';
import { DiagnosticTool } from '../components/DiagnosticTool';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { toast } from 'sonner';

interface VetDashboardViewProps {
  appointments: Appointment[];
  pets: Pet[];
  healthRecords: HealthRecord[];
  onCompleteAppointment: (id: string) => void;
  onUpdatePatient: (petId: string, updates: Partial<Pet>) => void;
  onNavigateToPet: (petId: string) => void;
  onNavigateToSchedule: () => void;
  onNavigateToCriticalRecords: () => void;
  onAddAppointment?: (appointment: Partial<Appointment>) => void;
  onJoinTelehealth?: (appointment: Appointment) => void;
}

export function VetDashboardView({ 
  appointments, 
  pets, 
  healthRecords,
  onCompleteAppointment,
  onNavigateToPet,
  onNavigateToSchedule,
  onNavigateToCriticalRecords,
  onAddAppointment,
  onJoinTelehealth
}: VetDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'services'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDiagnosticToolOpen, setIsDiagnosticToolOpen] = useState(false);
  const [selectedDiagnosticPet, setSelectedDiagnosticPet] = useState<Pet | null>(null);
  
  // Local service management for demo
  const [services, setServices] = useState([
      { id: '1', name: 'General Consultation', type: 'Clinical', duration: 30, price: 500, description: 'Comprehensive checkup and physical examination.' },
      { id: '2', name: 'Vaccination', type: 'Wellness', duration: 15, price: 300, description: 'Standard vaccinations and booster shots.' },
      { id: '3', name: 'Dental Cleaning', type: 'Clinical', duration: 60, price: 1200, description: 'Professional teeth scaling and polishing.' },
  ]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', type: 'Clinical', duration: 30, price: 500, description: '' });

  const [showBookModal, setShowBookModal] = useState(false);
  const [bookData, setBookData] = useState({ petId: '', serviceName: '', type: 'visit', date: '', time: '' });

  const handleCompleteClick = (aptId: string, petName: string) => {
    toast(`Complete appointment for ${petName}?`, {
      description: "This action will update the session status to completed.",
      action: {
        label: "Complete",
        onClick: () => {
          onCompleteAppointment(aptId);
          toast.success(`Appointment for ${petName} completed successfully!`);
        }
      }
    });
  };

  const handleBookAppointment = () => {
    if (onAddAppointment && bookData.petId && bookData.serviceName && bookData.date && bookData.time) {
      const pet = pets.find(p => p.id === bookData.petId);
      onAddAppointment({
        petId: bookData.petId,
        petName: pet?.name,
        ownerId: pet?.ownerId || 'temp',
        serviceName: bookData.serviceName,
        type: bookData.type as any,
        date: bookData.date,
        time: bookData.time,
        status: 'pending'
      });
      setShowBookModal(false);
      setBookData({ petId: '', serviceName: '', type: 'visit', date: '', time: '' });
    }
  };

  const handleOpenAddModal = () => { setFormData({ name: '', type: 'Clinical', duration: 30, price: 500, description: '' }); setShowAddModal(true); setEditingServiceId(null); };
  const handleOpenEditModal = (service: any) => { setFormData(service); setShowAddModal(true); setEditingServiceId(service.id); };
  const deleteService = (id: string) => setServices(services.filter(s => s.id !== id));
  const handleSaveService = () => {
    if (editingServiceId) {
      setServices(services.map(s => s.id === editingServiceId ? { ...formData, id: editingServiceId } : s));
    } else {
      setServices([...services, { ...formData, id: Date.now().toString() }]);
    }
    setShowAddModal(false);
  };

  const filteredQuickFind = pets.filter(p => 
    !searchQuery || 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.includes(searchQuery) ||
    p.breed.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const todayAppointments = appointments.filter(apt => apt.status !== 'completed' && apt.status !== 'cancelled');

  const stats = [
    { label: 'Load', value: todayAppointments.length.toString(), sub: 'Patients', icon: ClipboardList, color: 'text-blue-500', bg: 'bg-blue-50/50' },
    { label: 'Urgent', value: appointments.filter(a => a.status === 'confirmed').length.toString(), sub: 'Ops', icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-50/50' },
    { label: 'Active', value: pets.length.toString(), sub: 'Nodes', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50/50' }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFBF7] font-sans pb-32">
      <header className="bg-white border-b border-ruru-navy/5 px-6 py-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-ruru-navy rounded-[1rem] flex items-center justify-center shadow-lg shadow-ruru-navy/10">
                <Sparkles size={16} className="text-blue-400" />
              </div>
              <div>
                <span className="block font-brand text-xl text-ruru-navy tracking-tight leading-none">ZooL Vet OS</span>
                <span className="block text-[8px] font-black uppercase tracking-[0.3em] text-ruru-navy/40">Clinical Grid</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
                {['overview', 'analytics', 'services'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={cn(
                        "px-4 py-2 rounded-[1rem] text-[10px] font-black uppercase tracking-widest transition-all",
                        activeTab === tab 
                          ? "bg-ruru-navy text-white shadow-sm" 
                          : "bg-transparent text-ruru-navy/50 hover:bg-[#F5F5F0] hover:text-ruru-navy"
                      )}
                    >
                      {tab}
                    </button>
                ))}
            </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        {activeTab === 'overview' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {stats.map((stat, idx) => (
                <div key={stat.label} className="bg-white border border-ruru-navy/5 rounded-[2rem] p-6 shadow-sm flex items-center gap-4">
                     <div className={cn("p-3 rounded-2xl", stat.bg, stat.color)}>
                        <stat.icon size={20} />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-[#A8A29E] uppercase tracking-widest">{stat.label}</p>
                        <p className="text-2xl font-brand text-ruru-navy">{stat.value} <span className="text-xs text-[#A8A29E] font-medium">{stat.sub}</span></p>
                     </div>
                </div>
            ))}
            
            <div className="md:col-span-3 bg-white border border-ruru-navy/5 rounded-[2.5rem] p-6 shadow-sm">
                 <h2 className="text-[10px] font-black text-[#A8A29E] uppercase tracking-[0.3em] mb-6">Active Patient Stream</h2>
                 {todayAppointments.length > 0 ? (
                    <div className="space-y-4">
                        {todayAppointments.map(apt => (
                             <div key={apt.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4.5 rounded-[1.5rem] bg-[#FDFBF7] hover:bg-white border border-ruru-navy/5 gap-4">
                                <div className="flex items-center gap-4">
                                     <span className="font-brand text-lg text-ruru-navy w-16">{apt.time}</span>
                                     <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-ruru-navy/5 text-ruru-navy/40">
                                       <Users size={16} />
                                     </div>
                                     <div>
                                        <div className="flex items-center gap-2">
                                          <p className="text-sm font-bold text-ruru-navy">{apt.petName}</p>
                                          {apt.type === 'telehealth' && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                              <span className="w-1 h-1 bg-emerald-500 rounded-full animate-ping" />
                                              Telehealth
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[9px] font-black uppercase text-[#A8A29E]">{apt.serviceName}</p>
                                     </div>
                                </div>
                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                    {apt.type === 'telehealth' && (
                                      <button 
                                        onClick={() => onJoinTelehealth?.(apt)}
                                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-1.5 transition-all text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/10"
                                      >
                                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                        JOIN CONSULT
                                      </button>
                                    )}
                                    <button 
                                      onClick={() => handleCompleteClick(apt.id, apt.petName || 'Patient')} 
                                      className="p-3 bg-ruru-navy hover:bg-emerald-600 active:scale-95 text-white rounded-2xl flex items-center justify-center transition-all shadow-sm"
                                      title="Complete Appointment"
                                    >
                                        <ArrowUpRight size={14} />
                                    </button>
                                </div>
                             </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-sm text-[#A8A29E]">No pending appointments.</div>
                )}
            </div>
          </motion.div>
        )}
      </main>

      <AnimatePresence>
        {showBookModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowBookModal(false)}
              className="absolute inset-0 bg-ruru-navy/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 pb-4 border-b border-ruru-navy/5 flex justify-between items-center">
                <h2 className="text-2xl font-brand text-ruru-navy">Book Appointment</h2>
              </div>
              <div className="p-8 space-y-6 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#A8A29E] mb-2 px-1">Select Patient</label>
                    <select 
                      className="w-full bg-[#F5F5F0] border-none rounded-2xl p-4 text-sm font-bold text-ruru-navy focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none"
                      value={bookData.petId}
                      onChange={(e) => setBookData({...bookData, petId: e.target.value})}
                    >
                      <option value="" disabled>Choose a patient...</option>
                      {pets.map(p => <option key={p.id} value={p.id}>{p.name} ({p.breed})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#A8A29E] mb-2 px-1">Service</label>
                    <select 
                      className="w-full bg-[#F5F5F0] border-none rounded-2xl p-4 text-sm font-bold text-ruru-navy focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none"
                      value={bookData.serviceName}
                      onChange={(e) => setBookData({...bookData, serviceName: e.target.value})}
                    >
                      <option value="" disabled>Choose a service...</option>
                      {services.map(s => <option key={s.id} value={s.name}>{s.name} - ₹{s.price}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#A8A29E] mb-2 px-1">Type</label>
                    <select 
                      className="w-full bg-[#F5F5F0] border-none rounded-2xl p-4 text-sm font-bold text-ruru-navy focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none"
                      value={bookData.type}
                      onChange={(e) => setBookData({...bookData, type: e.target.value})}
                    >
                      <option value="visit">Clinic Visit</option>
                      <option value="telehealth">Telehealth</option>
                      <option value="grooming">Grooming</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-[#A8A29E] mb-2 px-1">Date</label>
                      <input 
                        type="date"
                        className="w-full bg-[#F5F5F0] border-none rounded-2xl p-4 text-sm font-bold text-ruru-navy focus:ring-2 focus:ring-blue-500/20 outline-none"
                        value={bookData.date}
                        onChange={(e) => setBookData({...bookData, date: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-[#A8A29E] mb-2 px-1">Time</label>
                      <input 
                        type="time"
                        className="w-full bg-[#F5F5F0] border-none rounded-2xl p-4 text-sm font-bold text-ruru-navy focus:ring-2 focus:ring-blue-500/20 outline-none"
                        value={bookData.time}
                        onChange={(e) => setBookData({...bookData, time: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-8 pt-4 bg-[#FDFBF7] border-t border-ruru-navy/5 flex items-center justify-end gap-4 mt-auto">
                <button 
                  onClick={() => setShowBookModal(false)}
                  className="px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-ruru-navy/50 hover:bg-ruru-navy/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleBookAppointment}
                  disabled={!bookData.petId || !bookData.serviceName || !bookData.date || !bookData.time}
                  className="px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest bg-ruru-navy text-white shadow-xl shadow-ruru-navy/20 hover:bg-ruru-navy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Confirm Booking
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-ruru-navy/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 pb-4 border-b border-ruru-navy/5 flex justify-between items-center">
                <h2 className="text-2xl font-brand text-ruru-navy">{editingServiceId ? 'Edit Service' : 'Add New Service'}</h2>
              </div>
              <div className="p-8 space-y-6 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#A8A29E] mb-2 px-1">Service Name</label>
                    <input 
                      type="text"
                      className="w-full bg-[#F5F5F0] border-none rounded-2xl p-4 text-sm font-bold text-ruru-navy focus:ring-2 focus:ring-blue-500/20 outline-none"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Wellness Exam"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-[#A8A29E] mb-2 px-1">Type</label>
                      <select 
                        className="w-full bg-[#F5F5F0] border-none rounded-2xl p-4 text-sm font-bold text-ruru-navy focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none"
                        value={formData.type}
                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                      >
                        <option value="Clinical">Clinical</option>
                        <option value="Wellness">Wellness</option>
                        <option value="Surgery">Surgery</option>
                        <option value="Grooming">Grooming</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-[#A8A29E] mb-2 px-1">Duration (Min)</label>
                      <input 
                        type="number"
                        className="w-full bg-[#F5F5F0] border-none rounded-2xl p-4 text-sm font-bold text-ruru-navy focus:ring-2 focus:ring-blue-500/20 outline-none"
                        value={formData.duration}
                        onChange={(e) => setFormData({...formData, duration: Number(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#A8A29E] mb-2 px-1">Price (₹)</label>
                    <input 
                      type="number"
                      className="w-full bg-[#F5F5F0] border-none rounded-2xl p-4 text-sm font-bold text-ruru-navy focus:ring-2 focus:ring-blue-500/20 outline-none"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#A8A29E] mb-2 px-1">Description</label>
                    <textarea 
                      className="w-full bg-[#F5F5F0] border-none rounded-2xl p-4 text-sm font-bold text-ruru-navy focus:ring-2 focus:ring-blue-500/20 outline-none min-h-[100px] resize-none"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Briefly describe the service..."
                    />
                  </div>
                </div>
              </div>
              <div className="p-8 pt-4 bg-[#FDFBF7] border-t border-ruru-navy/5 flex items-center justify-end gap-4 mt-auto">
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-ruru-navy/50 hover:bg-ruru-navy/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveService}
                  disabled={!formData.name}
                  className="px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest bg-blue-500 text-white shadow-xl shadow-blue-500/20 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Save Service
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
