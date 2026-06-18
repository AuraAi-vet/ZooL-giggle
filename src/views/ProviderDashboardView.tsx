import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, ShoppingBag, Activity, Plus, Search, Clock, ChevronRight, TrendingUp, LayoutDashboard, Star, Zap, MapPin, CreditCard, Briefcase, User, Download, Building2, LogOut, ArrowUpRight, X, Trash2, Edit2, CalendarDays } from 'lucide-react';
import { Calendar as ReactBigCalendar, momentLocalizer } from 'react-big-calendar';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Pet, Appointment, Service, UserProfile } from '../types';
import { cn } from '../lib/utils';
import { canManageServices, canManageAppointments, canAccessClientData } from '../lib/permissions';
import { useServiceStore } from '../store/useServiceStore';
import { useStore } from '../store/useStore';

const localizer = momentLocalizer(moment);

interface ProviderDashboardViewProps {
  appointments: Appointment[];
  userProfile: UserProfile;
  vets: UserProfile[]; // Other providers/vets in network
  onCompleteAppointment: (id: string) => void;
  onUpdateAvailability: (date: string, time: string) => void;
}

export function ProviderDashboardView({ 
  appointments, 
  userProfile,
  vets,
  onCompleteAppointment,
  onUpdateAvailability
}: ProviderDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'queue' | 'services' | 'customers' | 'analytics' | 'schedule'>('overview');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState<{ isOpen: boolean, onConfirm: () => void }>({ isOpen: false, onConfirm: () => {} });
  const [searchQuery, setSearchQuery] = useState('');
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('0');
  const [newServiceDuration, setNewServiceDuration] = useState('60');

  const { services, initializeListeners: initServiceListeners, addService, updateService, deleteService } = useServiceStore();
  const { blockedSlots } = useStore();
  
  useEffect(() => {
    const unsubServices = initServiceListeners(userProfile.uid);
    return () => {
        unsubServices();
    };
  }, [userProfile.uid, initServiceListeners]);

  const isShop = userProfile.providerType === 'shop';

  const calendarEvents = React.useMemo(() => {
    const aptEvents = appointments.map(apt => ({
      id: apt.id,
      title: `${apt.petName} - ${apt.serviceName}`,
      start: new Date(`${apt.date}T${apt.time}`),
      end: new Date(new Date(`${apt.date}T${apt.time}`).getTime() + 60 * 60 * 1000),
      isApt: true
    }));
    
    const blockEvents = blockedSlots
      .filter(slot => slot.vetId === userProfile.uid)
      .map(slot => ({
        id: slot.id,
        title: slot.reason ? `Blocked: ${slot.reason}` : `Blocked Slot`,
        start: new Date(`${slot.date}T${slot.time}`),
        end: new Date(new Date(`${slot.date}T${slot.time}`).getTime() + 60 * 60 * 1000),
        isApt: false
      }));

    return [...aptEvents, ...blockEvents];
  }, [appointments, blockedSlots, userProfile.uid]);

  const handleOpenAddModal = () => {
    setEditingServiceId(null);
    setNewServiceName('');
    setNewServicePrice('0');
    setNewServiceDuration('60');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (service: Service) => {
    setEditingServiceId(service.id);
    setNewServiceName(service.name);
    setNewServicePrice(service.price?.toString() || '0');
    setNewServiceDuration(service.description || '60');
    setShowAddModal(true);
  };

  const handleSaveService = async () => {
    const serviceData = {
      name: newServiceName,
      type: (isShop ? 'shop' : 'groomer') as Service['type'],
      providerId: userProfile.uid,
      rating: 0,
      address: userProfile.location || '',
      image: '',
      price: parseInt(newServicePrice),
      description: newServiceDuration
    };

    if (editingServiceId) {
      await updateService(editingServiceId, serviceData as Partial<Service>);
    } else {
      await addService(serviceData as Omit<Service, 'id'>);
    }
    
    setNewServiceName('');
    setNewServicePrice('0');
    setNewServiceDuration('60');
    setEditingServiceId(null);
    setShowAddModal(false);
  };

  // Permissions usage
  const canManageService = canManageServices(userProfile);
  const canManageApt = canManageAppointments(userProfile);

  const stats = [
    { label: 'Fiscal Velocity', value: `₹${(appointments.filter(a => a.status === 'completed').length * 500).toLocaleString()}`, sub: 'Estimated', icon: CreditCard, color: 'text-ruru-teal', bg: 'bg-[#FDFBF7]' },
    { label: activeTab === 'services' ? 'Listed Nodes' : 'Live Bookings', value: activeTab === 'services' ? services.length.toString() : appointments.filter(a => a.status === 'confirmed').length.toString(), sub: 'Active', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50/50' },
    { label: 'New Demand', value: appointments.filter(a => a.status === 'pending').length.toString(), sub: 'Pending', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50/50' },
    { label: 'System Trust', value: '4.8', sub: 'Calculated', icon: Star, color: 'text-purple-500', bg: 'bg-purple-50/50' },
  ];

  const providerAppointments = appointments.filter(apt => (apt.status !== 'completed' && apt.status !== 'cancelled') || activeTab === 'queue');
  const filteredAppointments = providerAppointments.filter(apt => 
    apt.petName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    apt.serviceName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFBF7] font-sans pb-32">
      {/* 1. Header Area with Master Controls */}
      <header className="bg-white border-b border-ruru-navy/5 px-6 py-8 md:px-12 md:py-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start justify-between gap-8 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-[2.5rem] overflow-hidden bg-white shadow-xl p-2 border border-ruru-navy/5 relative group shrink-0">
              <img src={userProfile.image} alt={userProfile.name} className="w-full h-full object-cover rounded-[2rem] group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                 <h1 className="text-4xl sm:text-5xl font-brand text-ruru-navy tracking-tighter leading-none italic">{userProfile.businessName || userProfile.name}</h1>
                 <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">Certified Alpha Node</div>
              </div>
              <p className="text-[#A8A29E] text-xs font-bold flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5"><MapPin size={14} className="text-blue-500" /> {userProfile.location}</span>
                <span className="flex items-center gap-1.5"><Briefcase size={14} className="text-blue-500" /> {userProfile.providerType?.toUpperCase()} INFRASTRUCTURE</span>
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-white text-ruru-navy px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest border border-ruru-navy/5 shadow-sm hover:shadow-md transition-all"
            >
              <Download size={16} className="text-blue-500" /> Log
            </motion.button>
            {canManageService && (
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleOpenAddModal}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-ruru-navy text-white px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-ruru-navy/15"
              >
                <Plus size={16} /> Scale Ops
              </motion.button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto mt-8 flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: 'overview', label: 'Command Center' },
            { id: 'queue', label: 'Live Stream' },
            { id: 'services', label: isShop ? 'Inventory Manager' : 'Clinical Protocol' },
            { id: 'customers', label: isShop ? 'Patron Network' : 'Patient Records' },
            { id: 'analytics', label: 'Economic Intel' },
            { id: 'schedule', label: 'Calendar' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-6 py-3 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-ruru-navy text-white shadow-xl shadow-ruru-navy/10" 
                  : "bg-transparent text-ruru-navy/50 hover:bg-[#F5F5F0] hover:text-ruru-navy"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* 2. Main Operational Master View */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 space-y-8 mt-4">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 xl:grid-cols-12 gap-8"
            >
              {/* 1. Tactical Stats */}
              <div className="xl:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                  <motion.div 
                    key={stat.label} 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white border border-ruru-navy/5 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-3 mb-3 relative z-10">
                      <div className={cn("p-2 rounded-xl", stat.color, stat.bg)}>
                        <stat.icon size={18} />
                      </div>
                      <span className="text-[9px] font-black text-[#A8A29E] uppercase tracking-[0.2em]">{stat.label}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-brand text-ruru-navy tracking-tighter group-hover:text-blue-600 transition-colors italic">{stat.value}</span>
                        <span className="text-[9px] font-black text-emerald-500 uppercase">{stat.sub}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* 2. Primary Analytics Bento */}
              <section className="xl:col-span-7 bg-white border border-ruru-navy/5 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#FDFBF7] rounded-bl-[20rem] -mr-64 -mt-64 transition-transform group-hover:scale-110 duration-1000 blur-2xl opacity-50" />
                <div className="relative z-10 space-y-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-2xl font-brand text-ruru-navy tracking-tight leading-none mb-2">{isShop ? 'Revenue Projection' : 'Clinical Throughput'}</h2>
                      <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#A8A29E] flex items-center gap-2">
                        <Activity size={12} className="text-blue-500" /> {isShop ? 'Financial Pulse Index' : 'Clinic Vitality Index'}: Stable
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-ruru-navy shadow-[0_0_10px_rgba(15,23,42,0.3)]" />
                         <span className="text-[9px] font-black text-[#A8A29E] uppercase tracking-widest">Projection</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-[#E5E5E0]" />
                         <span className="text-[9px] font-black text-[#A8A29E] uppercase tracking-widest">Baseline</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-64 mt-4 w-full relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[
                        { name: 'W1', value: 40, baseline: 30 },
                        { name: 'W2', value: 70, baseline: 40 },
                        { name: 'W3', value: 55, baseline: 35 },
                        { name: 'W4', value: 95, baseline: 50 },
                        { name: 'W5', value: 65, baseline: 40 },
                        { name: 'W6', value: 85, baseline: 45 },
                        { name: 'W7', value: 100, baseline: 50 },
                      ]} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0B192C" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#0B192C" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E0" opacity={0.5} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#A8A29E', fontWeight: 'bold' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#A8A29E', fontWeight: 'bold' }} />
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}
                          itemStyle={{ fontSize: '12px', fontWeight: 'bold' }} 
                          labelStyle={{ fontSize: '10px', color: '#A8A29E', marginBottom: '4px', textTransform: 'uppercase' }}
                        />
                        <Area type="monotone" dataKey="baseline" stroke="#E5E5E0" strokeWidth={2} fill="none" />
                        <Area type="monotone" dataKey="value" stroke="#0B192C" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>

              <section className="xl:col-span-5 flex flex-col gap-6">
                <div className="bg-ruru-navy rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-xl flex-1 flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32 transition-opacity opacity-0 group-hover:opacity-100 duration-1000" />
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.2)] group-hover:rotate-12 transition-transform">
                        <TrendingUp size={24} className="text-blue-400" />
                      </div>
                      <div>
                         <h3 className="text-[9px] font-black text-blue-400 uppercase tracking-[0.4em] mb-1">Impact Sector</h3>
                         <p className="text-xl font-brand tracking-tight">{isShop ? 'Market Dominance' : 'Patient Care Outcomes'}</p>
                      </div>
                    </div>
                    <p className="text-[#A8A29E] text-sm leading-relaxed font-medium">
                      {isShop ? 'Facility visibility surged by 42% this quarter. Neural signals indicate prime opportunity for premium service rollout.' : 'Clinical precision improved by 28%. Data suggests focus on specialized diagnostics to enhance community trust.'}
                    </p>
                  </div>
                  <button className="w-full mt-6 py-4 bg-blue-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-blue-500 transition-all shadow-lg group-hover:translate-y-[-2px]">
                    {isShop ? 'Optimize Digital Footprint' : 'Optimize Clinical Protocols'}
                  </button>
                </div>

                <div className="bg-white border border-ruru-navy/5 rounded-[2.5rem] p-8 flex items-center gap-6 shadow-sm">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-50 flex items-center justify-center border border-emerald-100 shrink-0">
                    <Zap size={24} className="text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="text-[9px] font-black text-[#A8A29E] uppercase tracking-[0.4em] mb-1">Neural Forecast</h4>
                    <p className="text-lg font-brand text-ruru-navy tracking-tight leading-snug italic">
                      {isShop ? '15% Demand Spike Predicted for Grooming Hub.' : 'High Alert: Seasonal Symptom Increase Predicted.'}
                    </p>
                  </div>
                </div>
              </section>

              {/* 3. Operational Queue (Condensed Overview) */}
              <section className="xl:col-span-12 space-y-6 pt-4">
                <div className="flex items-center justify-between px-2">
                   <div className="flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-ruru-navy rounded-full" />
                      <h2 className="text-[10px] font-black text-[#A8A29E] uppercase tracking-[0.4em]">Live Admission Stream</h2>
                   </div>
                   <button onClick={() => setActiveTab('queue')} className="text-[9px] font-black text-blue-500 uppercase tracking-[0.3em] hover:underline px-4 py-2 bg-blue-50/50 rounded-full">Full Monitoring</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {providerAppointments.slice(0, 3).map((apt, idx) => (
                    <motion.div 
                      key={apt.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white border border-ruru-navy/5 p-6 rounded-[2rem] hover:shadow-lg transition-all group flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-ruru-navy rounded-[1.25rem] flex items-center justify-center text-white shadow-xl shadow-ruru-navy/20 group-hover:rotate-6 transition-transform">
                             <Clock size={20} />
                          </div>
                          <div>
                             <p className="text-[9px] font-black text-[#A8A29E] uppercase tracking-widest mb-1">{apt.time}</p>
                             <h4 className="text-lg font-brand tracking-tight text-ruru-navy">{apt.petName}</h4>
                          </div>
                        </div>
                        <span className={cn(
                          "px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border",
                          apt.status === 'confirmed' ? "bg-blue-50 text-blue-600 border-blue-100" :
                          apt.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-100" :
                          "bg-[#FDFBF7] text-[#A8A29E] border-ruru-navy/10"
                        )}>
                          {apt.status}
                        </span>
                      </div>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-center text-xs">
                           <span className="font-black text-[#A8A29E] uppercase tracking-widest text-[8px]">Requested Ops</span>
                           <span className="font-bold text-ruru-navy truncate max-w-[120px]">{apt.serviceName}</span>
                        </div>
                        <div className="w-full h-1 bg-[#F5F5F0] rounded-full overflow-hidden">
                           <div className="w-2/3 h-full bg-blue-500 rounded-full" />
                        </div>
                      </div>

                      <button 
                        onClick={() => onCompleteAppointment(apt.id)}
                        className="w-full py-3 bg-[#F5F5F0] text-ruru-navy rounded-[1.25rem] text-[9px] font-black uppercase tracking-widest hover:bg-ruru-navy hover:text-white transition-all active:scale-95"
                      >
                        Process Node
                      </button>
                    </motion.div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'queue' && (
             <motion.div 
              key="queue"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
             >
               <div className="relative max-w-md mx-auto xl:mx-0">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#A8A29E]" size={16} />
                  <input 
                    type="text"
                    placeholder="Search active stream..."
                    className="w-full bg-white border border-ruru-navy/5 rounded-[1.5rem] py-4 pl-12 pr-6 text-xs font-bold shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>

               <div className="bg-white border border-ruru-navy/5 rounded-[2.5rem] overflow-hidden shadow-sm">
                 <div className="divide-y divide-[#F5F5F0]">
                    {filteredAppointments.length > 0 ? (
                      filteredAppointments.map((apt, idx) => (
                         <motion.div 
                          key={apt.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex flex-col md:flex-row items-center justify-between px-6 md:px-10 py-6 hover:bg-[#F5F5F0] transition-colors group"
                         >
                            <div className="flex items-center gap-6 flex-1 w-full md:w-auto">
                              <div className="text-center w-20 shrink-0">
                                <p className="text-[9px] font-black text-[#A8A29E] uppercase tracking-widest mb-1 italic">Schedule</p>
                                <p className="text-2xl font-brand text-ruru-navy tracking-tighter">{apt.time}</p>
                              </div>
                              <div className="h-10 w-px bg-ruru-navy/10 hidden md:block" />
                              <div className="flex items-center gap-4">
                                 <div className="w-14 h-14 bg-[#FDFBF7] rounded-[1.25rem] flex items-center justify-center shadow-sm border border-ruru-navy/5 group-hover:scale-105 transition-transform duration-500 text-[#A8A29E]">
                                    <User size={24} />
                                 </div>
                                 <div>
                                    <h4 className="text-lg font-brand text-ruru-navy tracking-tight">{apt.petName}</h4>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                       <span className="px-3 py-1 bg-ruru-navy text-white rounded-lg text-[9px] font-black uppercase tracking-widest">{apt.serviceName}</span>
                                       <span className="text-[10px] font-bold text-[#A8A29E] uppercase">{apt.id.slice(0, 8)}</span>
                                    </div>
                                 </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between w-full md:w-auto mt-4 md:mt-0 gap-8 sm:border-l sm:border-ruru-navy/5 sm:pl-8">
                               <div className="text-left md:text-right">
                                  <p className="text-[9px] font-black text-[#A8A29E] uppercase tracking-widest mb-1">Health Record</p>
                                  <div className="flex items-center gap-1.5 text-emerald-500">
                                     <Activity size={14} />
                                     <span className="text-[10px] font-black uppercase italic">Synced</span>
                                  </div>
                               </div>
                               <button 
                                 onClick={() => onCompleteAppointment(apt.id)}
                                 className="w-12 h-12 rounded-[1.25rem] flex items-center justify-center bg-ruru-navy text-white shadow-lg hover:scale-110 active:scale-95 transition-all group-hover:bg-blue-600"
                               >
                                  <ArrowUpRight size={20} />
                               </button>
                            </div>
                         </motion.div>
                      ))
                    ) : (
                      <div className="p-16 text-center space-y-4">
                         <div className="w-16 h-16 bg-[#FDFBF7] rounded-[1.5rem] flex items-center justify-center mx-auto text-[#A8A29E] shadow-sm">
                            <Clock size={24} />
                         </div>
                         <div>
                            <h3 className="text-xl font-brand text-ruru-navy tracking-tight mb-2">Silent Stream</h3>
                            <p className="text-[#A8A29E] text-sm max-w-sm mx-auto font-medium italic">
                               No active nodes detected matching your search criteria in the regional facility OS.
                            </p>
                         </div>
                      </div>
                    )}
                 </div>
               </div>
             </motion.div>
          )}

          {activeTab === 'schedule' && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 bg-white rounded-[2.5rem] border border-ruru-navy/5 shadow-sm h-[600px]">
                <ReactBigCalendar
                  localizer={localizer}
                  events={calendarEvents}
                  startAccessor="start"
                  endAccessor="end"
                  defaultView="month"
                  selectable
                  onSelectSlot={(slotInfo) => {
                    setShowConfirmationModal({
                       isOpen: true,
                       onConfirm: () => onUpdateAvailability(moment(slotInfo.start).format('YYYY-MM-DD'), moment(slotInfo.start).format('HH:mm'))
                    });
                  }}
                  style={{ height: '100%' }}
                />
             </motion.div>
          )}

          {activeTab === 'services' && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-ruru-navy/5 shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                      <h3 className="text-xl font-brand text-ruru-navy">Service Catalog</h3>
                      <button onClick={handleOpenAddModal} className="flex items-center gap-2 bg-ruru-navy text-white px-5 py-3 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-ruru-navy/15 hover:bg-blue-600 transition-all">
                        <Plus size={16}/> Add Service
                      </button>
                  </div>
                  <div className="space-y-4">
                    {services.map(s => (
                        <div key={s.id} className="flex justify-between items-center p-6 bg-[#FDFBF7] rounded-[1.5rem] border border-ruru-navy/5 hover:border-ruru-navy/10 transition-colors">
                          <div className="flex-1">
                            <p className="font-brand text-xl text-ruru-navy tracking-tight">{s.name}</p>
                            <div className="flex items-center gap-4 mt-2">
                                <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-lg">{s.type}</p>
                                <p className="text-xs text-[#A8A29E] font-medium flex items-center gap-1"><Clock size={12}/> {s.description} min</p>
                            </div>
                          </div>
                          <div className="text-right mr-8">
                             <p className="text-lg font-brand text-ruru-navy">₹{s.price}</p>
                             <p className="text-[9px] text-[#A8A29E] uppercase tracking-widest">Rate</p>
                          </div>
                          <div className="flex gap-2">
                             <button onClick={() => handleOpenEditModal(s)} className="p-3 text-blue-500 bg-blue-50 rounded-[1rem] hover:bg-blue-100 transition-colors"><Edit2 size={16} /></button>
                             <button onClick={() => deleteService(s.id)} className="p-3 text-red-500 bg-red-50 rounded-[1rem] hover:bg-red-100 transition-colors"><Trash2 size={16} /></button>
                          </div>
                       </div>
                    ))}
                  </div>
                </div>
             </motion.div>
          )}

          {(activeTab === 'customers' || activeTab === 'analytics') && (
             <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white border border-ruru-navy/5 rounded-[2.5rem] overflow-hidden shadow-sm min-h-[50vh] flex items-center justify-center p-12"
             >
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 bg-ruru-navy rounded-[1.5rem] flex items-center justify-center mx-auto text-white shadow-xl animate-bounce duration-[2000ms]">
                    <Activity size={32} className="text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-brand text-ruru-navy tracking-tight capitalize mb-3">Tactical indexing: {activeTab}</h3>
                    <p className="text-[#A8A29E] text-sm max-w-sm mx-auto font-medium italic">
                       Fetching real-time encrypted streams from the Kerala AHD regional node. Indexing facility metrics into your local command memory.
                    </p>
                  </div>
                  <div className="flex justify-center gap-1.5">
                     {[1,2,3].map(i => (
                       <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                     ))}
                  </div>
                </div>
             </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      {/* Add Product/Service Modal */}
      <AnimatePresence>
        {showConfirmationModal.isOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfirmationModal({ isOpen: false, onConfirm: () => {} })} className="absolute inset-0 bg-ruru-navy/60 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 40 }} className="bg-white rounded-[2rem] p-8 relative z-10 shadow-2xl w-full max-w-sm">
                <h3 className="text-xl font-brand text-ruru-navy mb-2">Confirm Action</h3>
                <p className="text-sm text-[#A8A29E] mb-8 font-medium">Are you sure you want to proceed with this action? This can be updated later from the calendar.</p>
                <div className="flex gap-4">
                  <button onClick={() => setShowConfirmationModal({ isOpen: false, onConfirm: () => {} })} className="flex-1 py-3 text-[10px] font-black uppercase text-ruru-navy bg-[#F5F5F0] rounded-[1rem]">Cancel</button>
                  <button onClick={() => { showConfirmationModal.onConfirm(); setShowConfirmationModal({ isOpen: false, onConfirm: () => {} }) }} className="flex-1 py-3 text-[10px] font-black uppercase text-white bg-ruru-navy rounded-[1rem]">Confirm</button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-ruru-navy/60 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-white/95 backdrop-blur-3xl w-full max-w-md rounded-[2.5rem] p-8 relative z-10 shadow-2xl border border-white/20"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-1.5 h-1.5 bg-ruru-teal rounded-full" />
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#A8A29E]">Business Expansion</p>
                  </div>
                  <h2 className="text-2xl font-brand text-ruru-navy">{editingServiceId ? 'Edit' : 'New'} {isShop ? 'Inventory Item' : 'Clinical Service'}</h2>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 bg-[#F5F5F0] rounded-[1.25rem] text-[#A8A29E] hover:text-ruru-navy hover:bg-[#E5E5E0] transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5 mb-8">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-[#A8A29E] uppercase tracking-widest ml-2">Name / Title</label>
                  <input type="text" value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} placeholder={isShop ? "e.g. Organic Puppy Food" : "e.g. Advanced Dental Scaling"} className="w-full bg-[#FDFBF7] border border-ruru-navy/10 rounded-[1.25rem] py-3.5 px-5 text-sm outline-none focus:border-ruru-navy/30 transition-colors" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-[#A8A29E] uppercase tracking-widest ml-2">Price (₹)</label>
                    <input type="number" value={newServicePrice} onChange={(e) => setNewServicePrice(e.target.value)} placeholder="0.00" className="w-full bg-[#FDFBF7] border border-ruru-navy/10 rounded-[1.25rem] py-3.5 px-5 text-sm outline-none focus:border-ruru-navy/30 transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-[#A8A29E] uppercase tracking-widest ml-2">{isShop ? 'Stock' : 'Duration (min)'}</label>
                    <input type="text" value={newServiceDuration} onChange={(e) => setNewServiceDuration(e.target.value)} placeholder={isShop ? "100" : "60"} className="w-full bg-[#FDFBF7] border border-ruru-navy/10 rounded-[1.25rem] py-3.5 px-5 text-sm outline-none focus:border-ruru-navy/30 transition-colors" />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handleSaveService}
                  className="flex-1 py-4 bg-ruru-navy text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-[#2D2A26]/20 transition-all hover:bg-[#1A1816]"
                >
                  {editingServiceId ? 'Update Listing' : 'Create Listing'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
