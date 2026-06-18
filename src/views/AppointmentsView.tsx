import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  ChevronRight, 
  Clock, 
  MapPin, 
  MoreVertical, 
  Plus, 
  User, 
  Video,
  Lock,
  Unlock,
  AlertCircle,
  Filter,
  X,
  Search
} from 'lucide-react';
import { Appointment, Pet, BlockedSlot } from '../types';
import { cn } from '../lib/utils';
import { useState } from 'react';
import { toast } from 'sonner';
import { createCalendarEvent, getAppointmentDateTime } from '../services/googleCalendarService';

interface AppointmentsViewProps {
  appointments: Appointment[];
  pets: Pet[];
  role: 'owner' | 'vet' | 'provider';
  blockedSlots: BlockedSlot[];
  onAdd: () => void;
  onCancel: (id: string) => void;
  onUpdateStatus?: (id: string, status: Appointment['status']) => void;
  onBlock?: (slot: Omit<BlockedSlot, 'id'>) => void;
  onUnblock?: (id: string) => void;
  googleToken?: string | null;
  onGoogleCalendarAuth?: () => Promise<string | null>;
  onUpdateAppointment?: (id: string, appointment: Partial<Appointment>) => Promise<void>;
}

export function AppointmentsView({ 
  appointments, 
  pets, 
  role,
  blockedSlots,
  onAdd, 
  onCancel,
  onUpdateStatus,
  onBlock,
  onUnblock,
  googleToken,
  onGoogleCalendarAuth,
  onUpdateAppointment
}: AppointmentsViewProps) {
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    petName: '',
    startDate: '',
    endDate: '',
    status: 'all' as 'all' | 'scheduled' | 'completed' | 'cancelled'
  });

  const [blockDate, setBlockDate] = useState(new Date().toISOString().split('T')[0]);
  const [blockTime, setBlockTime] = useState('09:00');
  const [blockReason, setBlockReason] = useState('');

  const filteredAppointments = appointments.filter(app => {
    const pet = pets.find(p => p.id === app.petId);
    const petMatch = !filters.petName || pet?.name.toLowerCase().includes(filters.petName.toLowerCase());
    const dateMatch = (!filters.startDate || app.date >= filters.startDate) && 
                     (!filters.endDate || app.date <= filters.endDate + 'T23:59:59');
    const statusMatch = filters.status === 'all' || app.status === filters.status;
    return petMatch && dateMatch && statusMatch;
  });

  const upcoming = filteredAppointments.filter(a => new Date(a.date) > new Date());
  const past = filteredAppointments.filter(a => new Date(a.date) <= new Date());

  const [isSyncingAll, setIsSyncingAll] = useState(false);

  const handleManualSync = async (app: Appointment) => {
    let token = googleToken;
    if (!token && onGoogleCalendarAuth) {
      token = await onGoogleCalendarAuth();
    }
    if (!token) return;

    try {
      const pet = pets.find(p => p.id === app.petId);
      const { start, end } = getAppointmentDateTime(app.date, app.time);
      const calEvent = await createCalendarEvent(token, {
        title: `Aura Vet Appointment: ${pet?.name || 'Pet'} @ ${app.serviceName}`,
        description: `Vet appointment for ${pet?.name || 'your pet'} (${pet?.type || 'Dog'}). Reason: ${app.reason || 'Checkup'}.`,
        startDateTime: start,
        endDateTime: end,
        location: app.serviceName,
      });

      if (onUpdateAppointment) {
        await onUpdateAppointment(app.id, { googleCalendarEventId: calEvent.id });
      }
      toast.success(`Synced appointment for ${pet?.name || 'Pet'} successfully!`);
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to sync with Google Calendar.");
    }
  };

  const handleSyncAll = async () => {
    let token = googleToken;
    if (!token && onGoogleCalendarAuth) {
      token = await onGoogleCalendarAuth();
    }
    if (!token) return;

    setIsSyncingAll(true);
    let successCount = 0;
    try {
      const unsynced = upcoming.filter(a => !a.googleCalendarEventId && a.status === 'scheduled');
      if (unsynced.length === 0) {
        toast.info("All upcoming appointments are already synced!");
        setIsSyncingAll(false);
        return;
      }
      for (const app of unsynced) {
        try {
          const pet = pets.find(p => p.id === app.petId);
          const { start, end } = getAppointmentDateTime(app.date, app.time);
          const calEvent = await createCalendarEvent(token, {
            title: `Aura Vet Appointment: ${pet?.name || 'Pet'} @ ${app.serviceName}`,
            description: `Vet appointment for ${pet?.name || 'your pet'} (${pet?.type || 'Dog'}). Reason: ${app.reason || 'Checkup'}.`,
            startDateTime: start,
            endDateTime: end,
            location: app.serviceName,
          });
          if (onUpdateAppointment) {
            await onUpdateAppointment(app.id, { googleCalendarEventId: calEvent.id });
          }
          successCount++;
        } catch (singleErr) {
          console.error("Error syncing single appointment:", singleErr);
        }
      }
      if (successCount > 0) {
        toast.success(`Successfully synchronized ${successCount} appointments!`);
      } else {
        toast.warning("Could not synchronize appointments.");
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred during bulk sync.");
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleBlock = () => {
    // Check for conflicting appointments
    const hasConflict = appointments.some(a => 
      a.date === blockDate && a.time === blockTime && a.status !== 'cancelled'
    );

    if (hasConflict) {
      if (!window.confirm("There is an existing appointment for this time slot. Are you sure you want to block it?")) {
        return;
      }
    }

    if (onBlock) {
      onBlock({
        vetId: '', // Filled by caller
        date: blockDate,
        time: blockTime,
        reason: blockReason
      });
      setShowBlockModal(false);
      setBlockReason('');
      toast.success("Availability restricted.");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="px-6 py-10 pb-32 space-y-8 max-w-5xl mx-auto"
    >
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-ruru-teal rounded-full animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-soft-ink/40">
              {role === 'vet' ? 'Clinical Registry' : 'Clinical Schedule'}
            </p>
          </div>
          <h2 className="text-5xl font-display font-semibold text-soft-ink tracking-tight">
            {role === 'vet' ? 'Practitioner Hub' : 'Care Timeline'}
          </h2>
          <p className="text-soft-ink/60 text-lg font-medium max-w-xl">
            {role === 'vet' ? 'Manage your medical consultations and peak clinic availability.' : 'Coordinate your pet\'s specialized healthcare and preventative timeline.'}
          </p>
        </div>
        <div className="flex gap-3">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all border shadow-sm",
              showFilters ? "bg-soft-ink text-white border-soft-ink" : "bg-white text-soft-ink border-soft-blue/30 hover:bg-soft-blue/10"
            )}
          >
            <Filter size={20} />
          </motion.button>
          {role === 'vet' && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowBlockModal(true)}
              className="w-12 h-12 bg-soft-amber text-amber-700 rounded-2xl flex items-center justify-center border border-soft-amber/50 shadow-sm"
            >
              <Lock size={20} />
            </motion.button>
          )}
          <motion.button 
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAdd}
            className="px-6 h-12 bg-ruru-teal text-white rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-ruru-teal/20 transition-all font-display font-semibold"
          >
            <Plus size={22} />
            <span>Schedule</span>
          </motion.button>
        </div>
      </header>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white border border-soft-blue/30 rounded-[2.5rem] p-8 shadow-xl space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-soft-ink/40 ml-1">Subject</label>
                <div className="relative">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-soft-ink/30" />
                  <input 
                    type="text" 
                    placeholder="Search pets..."
                    value={filters.petName}
                    onChange={(e) => setFilters({ ...filters, petName: e.target.value })}
                    className="w-full pl-10 pr-4 py-3.5 bg-soft-slate border border-soft-blue/20 rounded-2xl text-sm placeholder:text-soft-ink/20 focus:outline-none focus:ring-2 focus:ring-ruru-teal/20 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-soft-ink/40 ml-1">Protocol State</label>
                <select 
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                  className="w-full px-4 py-3.5 bg-soft-slate border border-soft-blue/20 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-ruru-teal/20 transition-all appearance-none cursor-pointer"
                >
                  <option value="all">All States</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-soft-ink/40 ml-1">Start Date</label>
                <input 
                  type="date" 
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full px-4 py-3.5 bg-soft-slate border border-soft-blue/20 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-ruru-teal/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-soft-ink/40 ml-1">End Date</label>
                <input 
                  type="date" 
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full px-4 py-3.5 bg-soft-slate border border-soft-blue/20 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-ruru-teal/20 transition-all"
                />
              </div>
            </div>
            <div className="flex justify-between items-center pt-2">
              <p className="text-xs text-soft-ink/40 italic">Filtering {filteredAppointments.length} instances</p>
              <button 
                onClick={() => setFilters({ petName: '', startDate: '', endDate: '', status: 'all' })}
                className="text-[10px] font-black text-ruru-teal uppercase tracking-widest hover:opacity-70 transition-opacity"
              >
                Reset Configuration
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBlockModal && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white border-2 border-soft-amber/30 rounded-[2.5rem] p-10 shadow-2xl space-y-8 relative z-50 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-soft-amber/10 rounded-bl-full -z-10" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-soft-amber text-amber-700 rounded-2xl flex items-center justify-center">
                  <Lock size={22} />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-semibold text-soft-ink">Restrict Availability</h3>
                  <p className="text-sm text-soft-ink/50">Prevent new bookings for this temporal window.</p>
                </div>
              </div>
              <button onClick={() => setShowBlockModal(false)} className="p-2 text-soft-ink/30 hover:text-soft-ink transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-soft-ink/40 ml-2">Target Date</label>
                <input 
                  type="date" 
                  value={blockDate}
                  onChange={(e) => setBlockDate(e.target.value)}
                  className="w-full p-4.5 bg-soft-slate border border-soft-blue/20 rounded-[1.5rem] text-sm focus:ring-2 focus:ring-soft-amber/20 transition-all outline-none"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-soft-ink/40 ml-2">Temporal Marker</label>
                <input 
                  type="time" 
                  value={blockTime}
                  onChange={(e) => setBlockTime(e.target.value)}
                  className="w-full p-4.5 bg-soft-slate border border-soft-blue/20 rounded-[1.5rem] text-sm focus:ring-2 focus:ring-soft-amber/20 transition-all outline-none"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-soft-ink/40 ml-2">Protocol Reason</label>
              <input 
                type="text" 
                placeholder="Private care, clinic maintenance, etc."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="w-full p-4.5 bg-soft-slate border border-soft-blue/20 rounded-[1.5rem] text-sm focus:ring-2 focus:ring-soft-amber/20 transition-all outline-none"
              />
            </div>

            <div className="flex gap-4 pt-2">
              <button 
                onClick={() => setShowBlockModal(false)} 
                className="flex-1 py-4.5 bg-soft-slate text-soft-ink/60 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-soft-blue/10 transition-colors"
              >
                Discard
              </button>
              <button 
                onClick={handleBlock} 
                className="flex-1 py-4.5 bg-amber-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-amber-600/20 hover:bg-amber-700 transition-colors"
              >
                Restrict Slot
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 bg-white border border-soft-blue/30 p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-soft-blue/10 rounded-bl-full transition-transform duration-700 group-hover:scale-125" />
          <p className="text-[9px] uppercase font-black text-soft-ink/30 tracking-[0.25em] mb-4 relative z-10">
            {role === 'vet' ? 'Expected Patients' : 'Pending Sessions'}
          </p>
          <h4 className="text-5xl font-display font-semibold text-soft-ink relative z-10">{upcoming.length}</h4>
        </div>
        <div className="lg:col-span-1 bg-soft-ink p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-tr-full transition-transform duration-700 group-hover:scale-110" />
          <p className="text-[9px] uppercase font-black text-white/40 tracking-[0.25em] mb-4 relative z-10">
            {role === 'vet' ? 'Restricted Capacity' : 'Historical Care'}
          </p>
          <h4 className="text-5xl font-display font-semibold text-white relative z-10">
            {role === 'vet' ? blockedSlots.length : past.length}
          </h4>
        </div>
        <div className="lg:col-span-2 bg-soft-blue border border-soft-blue/30 p-8 rounded-[2.5rem] flex items-center justify-between group overflow-hidden relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,#fff_0%,transparent_70%)] opacity-20 pointer-events-none" />
          <div className="space-y-1 z-10">
            <h5 className="text-xl font-display font-semibold text-soft-ink">Next Engagement</h5>
            <p className="text-soft-ink/60 text-sm font-medium">
              {upcoming[0] ? `Your next consultation starts at ${upcoming[0].time}` : 'No upcoming consultations found.'}
            </p>
          </div>
          <div className="w-14 h-14 bg-white/50 backdrop-blur-md rounded-2xl flex items-center justify-center text-soft-ink transition-transform group-hover:rotate-12 duration-500 z-10">
            <Calendar size={28} />
          </div>
        </div>
      </div>

      {/* Google Calendar Sync Control Banner */}
      <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] border border-soft-blue/20 p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm mt-4">
        <div className="flex items-center gap-5">
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm border",
            googleToken ? "bg-green-100/30 text-green-600 border-green-200" : "bg-ruru-teal/10 text-ruru-teal border-ruru-teal/20"
          )}>
            <Calendar size={24} className={googleToken ? "animate-pulse" : ""} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-display font-semibold text-soft-ink text-base md:text-lg">Google Calendar Sync</h4>
              <span className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border",
                googleToken ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-50 text-slate-500 border-slate-200"
              )}>
                <span className={cn("w-1.5 h-1.5 rounded-full", googleToken ? "bg-green-500 animate-ping" : "bg-slate-400")} />
                {googleToken ? 'Connected' : 'Not Connected'}
              </span>
            </div>
            <p className="text-sm text-soft-ink/60 mt-0.5 max-w-xl">
              {googleToken 
                ? "Your consultations are automatically imported and synchronized securely." 
                : "Synchronize your medical and care routines directly with your personal calendar."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {googleToken && (
            <button
              onClick={handleSyncAll}
              disabled={isSyncingAll}
              className="flex-1 sm:flex-initial px-6 py-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 disabled:opacity-50 text-[10px] font-black uppercase tracking-widest rounded-[1.25rem] transition-all shadow-sm"
            >
              {isSyncingAll ? "Syncing..." : "Sync All Pending"}
            </button>
          )}
          <button
            onClick={googleToken ? undefined : handleSyncAll}
            disabled={!!googleToken}
            className={cn(
              "flex-1 sm:flex-initial px-6 py-4 text-[10px] font-black uppercase tracking-widest rounded-[1.25rem] transition-all shadow-sm",
              googleToken 
                ? "bg-slate-100 text-slate-400 border border-slate-200" 
                : "bg-ruru-teal hover:bg-ruru-teal/90 text-white shadow-xl shadow-ruru-teal/10"
            )}
          >
            {googleToken ? "Sync Active" : "Connect Calendar"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Schedule Column */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-display text-2xl font-semibold text-soft-ink tracking-tight">Active Schedule</h3>
            <div className="flex-1 h-[1px] bg-soft-blue/30 mx-8" />
          </div>

          <div className="space-y-4">
            {role === 'vet' && blockedSlots.map((slot) => (
              <motion.div 
                key={slot.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-soft-amber/10 border border-soft-amber border-dashed rounded-[2rem] p-6 flex flex-col sm:flex-row items-center justify-between gap-6"
              >
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-amber-600 shadow-sm">
                    <Lock size={24} />
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-soft-ink">Restricted Availability</h4>
                    <p className="text-xs text-soft-ink/50 uppercase font-black tracking-widest">{slot.date} • {slot.time}</p>
                    {slot.reason && <p className="text-sm font-medium text-amber-700/60 mt-1 italic">{slot.reason}</p>}
                  </div>
                </div>
                <button 
                  onClick={() => onUnblock?.(slot.id)}
                  className="px-6 py-3 bg-white text-amber-700 hover:bg-amber-50 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest border border-soft-amber ring-4 ring-soft-amber/10 shadow-sm"
                >
                  Lift Restraint
                </button>
              </motion.div>
            ))}

            {upcoming.length > 0 ? upcoming.map((app, idx) => (
              <motion.div 
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white border border-soft-blue/20 rounded-[2.5rem] p-8 space-y-8 group transition-all duration-500 hover:shadow-2xl hover:shadow-soft-blue/10 hover:border-ruru-teal/30"
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-6">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden bg-soft-slate border-2 border-white shadow-soft transition-transform group-hover:-rotate-3 duration-500">
                        <img 
                          src={pets.find(p => p.id === app.petId)?.image || `https://picsum.photos/seed/${app.petId}/200`} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                        {app.type === 'telehealth' ? <Video size={10} className="text-ruru-teal" /> : <MapPin size={10} className="text-blue-500" />}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-2xl font-display font-semibold text-soft-ink tracking-tight group-hover:text-ruru-teal transition-colors">
                        {role === 'vet' ? (pets.find(p => p.id === app.petId)?.name) : app.vetName}
                      </h4>
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border",
                          app.type === 'telehealth' 
                            ? "bg-soft-green text-green-700 border-green-200" 
                            : "bg-soft-blue text-blue-700 border-blue-200"
                        )}>
                          {app.type === 'telehealth' ? 'Virtual Lab' : 'Clinic Presence'}
                        </span>
                        <span className="text-[11px] font-black text-soft-ink/30 uppercase tracking-widest">
                          {role === 'vet' ? `Parent: ${app.vetName}` : `Subject: ${pets.find(p => p.id === app.petId)?.name}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="p-3 text-soft-ink/20 hover:text-soft-ink hover:bg-soft-slate transition-all rounded-2xl">
                    <MoreVertical size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-4 p-5 bg-soft-slate/50 rounded-[1.5rem] border border-soft-blue/20">
                    <Calendar size={18} className="text-soft-ink/30" />
                    <div>
                      <p className="text-[9px] font-black text-soft-ink/30 uppercase tracking-widest">Protocol Date</p>
                      <p className="text-sm font-semibold text-soft-ink">
                        {new Date(app.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-5 bg-soft-slate/50 rounded-[1.5rem] border border-soft-blue/20">
                    <Clock size={18} className="text-soft-ink/30" />
                    <div>
                      <p className="text-[9px] font-black text-soft-ink/30 uppercase tracking-widest">Temporal Window</p>
                      <p className="text-sm font-semibold text-soft-ink">
                        {new Date(app.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Google Calendar Status */}
                <div className="flex items-center justify-between p-4.5 bg-slate-50 border border-slate-200/60 rounded-2xl text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar size={14} className={app.googleCalendarEventId ? "text-green-500 animate-pulse" : "text-slate-400"} />
                    <span className="font-semibold text-slate-700">Google Calendar:</span>
                    <span className={cn(
                      "font-medium",
                      app.googleCalendarEventId ? "text-green-600" : "text-slate-500"
                    )}>
                      {app.googleCalendarEventId ? 'Synced Successfully' : 'Not Connected'}
                    </span>
                  </div>
                  {!app.googleCalendarEventId && app.status === 'scheduled' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleManualSync(app);
                      }}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-700 rounded-lg shadow-sm transition-all"
                    >
                      Sync Now
                    </button>
                  )}
                </div>

                <div className="flex gap-4">
                  {role === 'vet' ? (
                    <>
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onUpdateStatus?.(app.id, 'completed')}
                        className="flex-1 py-4.5 bg-soft-ink text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-soft-ink/20 transition-all"
                      >
                        Finalize Consultation
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onCancel(app.id)}
                        className="px-6 py-4.5 bg-white border-2 border-soft-pink text-pink-600 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-soft-pink/20 transition-all font-sans"
                      >
                        Reschedule
                      </motion.button>
                    </>
                  ) : (
                    <>
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-[2] py-4.5 bg-soft-ink text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-soft-ink/20 transition-all"
                      >
                        {app.type === 'telehealth' ? <Video size={18} /> : <MapPin size={18} />}
                        {app.type === 'telehealth' ? 'Enter Virtual Vault' : 'Activate Spatial Routing'}
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onCancel(app.id)}
                        className="flex-1 py-4.5 bg-white border-2 border-soft-slate text-soft-ink/40 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:border-soft-pink hover:text-pink-600 hover:bg-soft-pink/10 transition-all"
                      >
                        Retract
                      </motion.button>
                    </>
                  )}
                </div>
              </motion.div>
            )) : (
              <div className="text-center py-24 bg-white border-2 border-dashed border-soft-blue/30 rounded-[2.5rem] space-y-6">
                 <div className="w-24 h-24 bg-soft-slate rounded-[2.5rem] flex items-center justify-center mx-auto text-soft-ink/20">
                    <Calendar size={40} />
                 </div>
                 <div className="space-y-1">
                    <p className="text-xl font-display font-semibold text-soft-ink">Timeline Silent</p>
                    <p className="text-sm text-soft-ink/50 font-medium tracking-wide">No active medical engagements scheduled.</p>
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar History Column */}
        <div className="lg:col-span-4 space-y-8">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-display text-2xl font-semibold text-soft-ink tracking-tight opacity-50">History</h3>
          </div>

          <div className="space-y-4">
            {past.length > 0 ? (
              past.slice(0, 5).map((app, idx) => (
                <motion.div 
                  key={app.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white/50 border border-soft-blue/20 rounded-[2rem] p-6 space-y-4 hover:bg-white transition-all duration-500 opacity-60 hover:opacity-100"
                >
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-soft-slate shrink-0 border border-white p-0.5">
                      <img 
                        src={pets.find(p => p.id === app.petId)?.image || `https://picsum.photos/seed/${app.petId}/200`} 
                        alt="" 
                        className="w-full h-full object-cover rounded-xl"
                      />
                    </div>
                    <div>
                      <h5 className="font-display font-semibold text-soft-ink text-sm truncate">{app.vetName}</h5>
                      <p className="text-[10px] text-soft-ink/30 font-black uppercase tracking-widest">
                        {new Date(app.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border text-center",
                    app.status === 'completed' ? "bg-soft-green text-green-700 border-green-200" :
                    app.status === 'cancelled' ? "bg-soft-pink text-pink-700 border-pink-200" :
                    "bg-soft-slate text-soft-ink/40 border-soft-blue/20"
                  )}>
                    {app.status}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="p-12 text-center text-[10px] font-black uppercase tracking-[0.3em] text-soft-ink/20 leading-relaxed border-2 border-dashed border-soft-blue/20 rounded-[2rem]">
                Registry Empty
              </div>
            )}
            
            {past.length > 5 && (
              <button className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-ruru-teal hover:opacity-70 transition-all">
                View Full Archive
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
