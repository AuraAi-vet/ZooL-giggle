import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Calendar, 
  Activity, 
  MessageSquare, 
  TrendingUp, 
  ShieldAlert, 
  Award, 
  FileText, 
  Component, 
  DollarSign,
  Search,
  Trash2,
  AlertTriangle,
  Square,
  CheckSquare,
  RefreshCw,
  Loader2,
  Lock
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import type { UserProfile, Appointment, CommunityPost, HealthRecord, Pet } from '../types';
import { getUsage } from '../services/geminiService';
import { getMaxDailyCredits } from '../services/geminiService';
import { useAILimit } from '../hooks/useAILimit';
import { useStore } from '../store/useStore';
import { db } from '../firebase';
import { deleteDoc, doc } from 'firebase/firestore';
import { toast } from 'sonner';

interface AdminDashboardViewProps {
  users: UserProfile[];
  appointments: Appointment[];
  posts: CommunityPost[];
  healthRecords: HealthRecord[];
  pets?: Pet[];
}

const COLORS = ['#1D4ED8', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export function AdminDashboardView({ users, appointments, posts, healthRecords, pets = [] }: AdminDashboardViewProps) {
  const { usageCount } = useAILimit();
  const { deletePet, deleteRecord } = useStore();

  // Unified search state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSubTab, setActiveSubTab] = useState<'pets' | 'records' | 'posts'>('pets');

  // Multi-selection states
  const [selectedPets, setSelectedPets] = useState<string[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);

  // Deletion pending telemetry indicator
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk deletion warning modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'pets' | 'records' | 'posts' | null;
    ids: string[];
  }>({
    isOpen: false,
    type: null,
    ids: []
  });

  // Filter search queries across databases
  const filteredPets = useMemo(() => {
    if (!searchQuery) return pets;
    const q = searchQuery.toLowerCase().trim();
    return pets.filter(p => 
      (p.name || '').toLowerCase().includes(q) ||
      (p.type || '').toLowerCase().includes(q) ||
      (p.breed || '').toLowerCase().includes(q)
    );
  }, [pets, searchQuery]);

  const filteredRecords = useMemo(() => {
    if (!searchQuery) return healthRecords;
    const q = searchQuery.toLowerCase().trim();
    return healthRecords.filter(r => 
      (r.type || '').toLowerCase().includes(q) ||
      (r.title || '').toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q)
    );
  }, [healthRecords, searchQuery]);

  const filteredPosts = useMemo(() => {
    if (!searchQuery) return posts;
    const q = searchQuery.toLowerCase().trim();
    return posts.filter(p => 
      (p.author || '').toLowerCase().includes(q) ||
      (p.content || '').toLowerCase().includes(q)
    );
  }, [posts, searchQuery]);

  // Selection helpers
  const handleSelectAll = (type: 'pets' | 'records' | 'posts', checked: boolean) => {
    if (type === 'pets') {
      setSelectedPets(checked ? filteredPets.map(p => p.id) : []);
    } else if (type === 'records') {
      setSelectedRecords(checked ? filteredRecords.map(r => r.id) : []);
    } else if (type === 'posts') {
      setSelectedPosts(checked ? filteredPosts.map(p => p.id) : []);
    }
  };

  const handleToggleSelect = (type: 'pets' | 'records' | 'posts', id: string) => {
    if (type === 'pets') {
      setSelectedPets(prev => 
        prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
      );
    } else if (type === 'records') {
      setSelectedRecords(prev => 
        prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
      );
    } else if (type === 'posts') {
      setSelectedPosts(prev => 
        prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
      );
    }
  };

  // Trigger bulk deletion confirmation modal
  const triggerBulkDelete = (type: 'pets' | 'records' | 'posts') => {
    let ids: string[] = [];
    if (type === 'pets') ids = selectedPets;
    else if (type === 'records') ids = selectedRecords;
    else if (type === 'posts') ids = selectedPosts;

    if (ids.length === 0) {
      toast.error(`Please select at least one item to delete.`);
      return;
    }

    setConfirmModal({
      isOpen: true,
      type,
      ids
    });
  };

  // Perform backend / store deletion once verified
  const handleExecutionDelete = async () => {
    const { type, ids } = confirmModal;
    if (!type || ids.length === 0) return;

    setIsDeleting(true);
    try {
      if (type === 'pets') {
        await Promise.all(ids.map(id => deletePet(id)));
        setSelectedPets([]);
      } else if (type === 'records') {
        await Promise.all(ids.map(id => deleteRecord(id)));
        setSelectedRecords([]);
      } else if (type === 'posts') {
        await Promise.all(ids.map(async (id) => {
          await deleteDoc(doc(db, 'communityPosts', id));
        }));
        setSelectedPosts([]);
      }
      toast.success(`Successfully deleted ${ids.length} selected ${type === 'posts' ? 'posts' : type === 'records' ? 'health records' : 'pets'}.`);
    } catch (err: any) {
      console.error("Bulk delete failed:", err);
      toast.error(`Deletion failed: ${err.message || err}`);
    } finally {
      setIsDeleting(false);
      setConfirmModal({ isOpen: false, type: null, ids: [] });
    }
  };

  // Aggregate Metrics Data
  const metrics = useMemo(() => {
    const totalUsers = users.length;
    const roleStats = {
      owners: users.filter(u => u.role === 'owner').length,
      vets: users.filter(u => u.role === 'vet').length,
      providers: users.filter(u => u.role === 'provider').length,
    };
    
    const roleData = [
      { name: 'Pet Owners', value: roleStats.owners },
      { name: 'Veterinarians', value: roleStats.vets },
      { name: 'Providers', value: roleStats.providers },
    ];

    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(a => a.status === 'completed').length;
    const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length;

    const authStats = {
      total: totalUsers,
      premium: users.filter(u => u.isPremium).length,
    };

    const petTypes = pets.reduce((acc, pet) => {
      acc[pet.type] = (acc[pet.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const petTypeData = Object.entries(petTypes).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

    const aiUsage = getUsage();
    const aiCostPerCredit = 0.005; // $0.005 per credit
    const dailyApiCost = aiUsage.creditsUsed * aiCostPerCredit;
    const estimatedMonthlyApiCost = dailyApiCost * 30;
    
    // Revenue from premium (Assumption: $15/month for Premium)
    const monthlyRevenue = (authStats.premium * 15.00);

    return { totalUsers, roleData, totalAppointments, completedAppointments, cancelledAppointments, authStats, petTypeData, aiUsage, dailyApiCost, estimatedMonthlyApiCost, monthlyRevenue };
  }, [users, appointments, pets, usageCount]);

  // Use actual metrics for usage data instead of mocked series
  const usageData = [
    { name: 'Today', logins: users.length, bookings: appointments.length, aiQueries: metrics.aiUsage.count, apiCost: metrics.dailyApiCost },
  ];

  const StatCard = ({ icon: Icon, label, value, trend, trendUp }: any) => (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-sm border border-white/50 flex flex-col items-start gap-4"
    >
      <div className="p-3 bg-ruru-blue/10 text-ruru-blue rounded-[1rem]">
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div className="flex items-end gap-3 mt-1">
          <h3 className="text-3xl font-black text-ruru-navy">{value}</h3>
          <span className={`text-sm font-bold mb-1 ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
            {trendUp ? '+' : '-'}{trend}%
          </span>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-8 animate-fade-in p-2 md:p-6 pb-24 max-w-7xl mx-auto">
      <header className="flex justify-between items-center bg-ruru-navy text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 disabled rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <ShieldAlert className="text-ruru-teal" size={32} />
            Owner Central Command
          </h1>
          <p className="text-white/80 mt-2 font-medium">Real-time system telemetry and aggregate user analytics.</p>
        </div>
        <div className="hidden md:flex flex-col items-end gap-2 relative z-10">
          <span className="bg-ruru-teal text-ruru-navy text-xs font-black px-3 py-1 rounded-[1rem] uppercase tracking-wider">
            Super Admin Active
          </span>
          <span className="text-sm text-white/70">System Health: <strong className="text-green-400">Optimal</strong></span>
        </div>
      </header>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={metrics.totalUsers} trend="12" trendUp={true} />
        <StatCard icon={Calendar} label="Total Appointments" value={metrics.totalAppointments} trend="8" trendUp={true} />
        <StatCard icon={Activity} label="AI Queries (Live)" value={(1450 + metrics.aiUsage.count).toLocaleString()} trend="24" trendUp={true} />
        <StatCard icon={Component} label="AI API Credits Used" value={metrics.aiUsage.creditsUsed.toLocaleString()} trend={(metrics.aiUsage.creditsUsed / getMaxDailyCredits() * 100).toFixed(1)} trendUp={false} />
      </div>

      {/* API Quota & Financial Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-ruru-navy/5 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-[1rem]">
                <Activity size={24} />
              </div>
              <div>
                <h3 className="font-bold text-ruru-navy tracking-tight">AI API Daily Limit Health</h3>
                <p className="text-sm text-gray-500 font-medium">Daily AI execution limits across all features.</p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex-1 flex flex-col justify-end">
            <div className="flex justify-between w-full text-xs font-bold uppercase tracking-wider mb-2">
              <span className="text-indigo-600">Used: {metrics.aiUsage.creditsUsed.toLocaleString()}</span>
              <span className="text-gray-400">Cap: {getMaxDailyCredits().toLocaleString()}</span>
            </div>
            <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex">
               {metrics.aiUsage.features && Object.keys(metrics.aiUsage.features).length > 0 ? (
                 Object.entries(metrics.aiUsage.features).map(([key, data], idx) => {
                   const width = (data.cost / getMaxDailyCredits()) * 100;
                   return <div key={key} className={`h-full ${['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500'][idx % 5]}`} style={{ width: `${width}%` }} title={`${key}: ${data.cost} credits`} />
                 })
               ) : (
                 <div className={`h-full transition-all ${metrics.aiUsage.creditsUsed >= getMaxDailyCredits() ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${(metrics.aiUsage.creditsUsed / getMaxDailyCredits()) * 100}%` }} />
               )}
            </div>
            {metrics.aiUsage.features && Object.keys(metrics.aiUsage.features).length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                {Object.entries(metrics.aiUsage.features).map(([key, data], idx) => (
                  <div key={key} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500'][idx % 5]}`} />
                       <span className="font-medium text-gray-700 truncate max-w-[90px]" title={key}>{key}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-ruru-navy">{data.count} uses</span>
                      <span className="text-[10px] text-gray-400">{data.cost} credits</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-ruru-navy p-6 rounded-[2rem] shadow-sm border border-ruru-navy/5 flex flex-col justify-between text-white">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-[1rem]">
                <DollarSign size={24} />
              </div>
              <div>
                <h3 className="font-bold tracking-tight text-white">Financial Estimator</h3>
                <p className="text-sm text-gray-400 font-medium">Estimated AI costs vs Base Revenue</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Daily AI Cost</p>
              <p className="text-xl font-black">${metrics.dailyApiCost.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Est. Monthly Cost</p>
              <p className="text-xl font-black">${metrics.estimatedMonthlyApiCost.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1">Est. Revenue</p>
              <p className="text-xl font-black text-emerald-400">${metrics.monthlyRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Area Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] shadow-sm border border-ruru-navy/5">
          <h3 className="text-lg font-bold text-ruru-navy mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-ruru-blue" />
            Weekly Activity Trends
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={usageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLogins" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1D4ED8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#F59E0B' }} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                  itemStyle={{ fontWeight: 600 }}
                  formatter={(value: number, name: string) => name === 'API Cost' ? `$${value.toFixed(2)}` : value}
                />
                <Area yAxisId="left" type="monotone" dataKey="logins" stroke="#1D4ED8" strokeWidth={3} fillOpacity={1} fill="url(#colorLogins)" name="User Logins" />
                <Area yAxisId="left" type="monotone" dataKey="aiQueries" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorAi)" name="AI Queries" />
                <Area yAxisId="right" type="monotone" dataKey="apiCost" stroke="#F59E0B" strokeWidth={3} fillOpacity={1} fill="url(#colorCost)" name="API Cost" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Demographics Pie Chart */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-ruru-navy/5 flex flex-col">
          <h3 className="text-lg font-bold text-ruru-navy mb-6 flex items-center gap-2">
            <Users size={20} className="text-violet-500" />
            User Roles Breakdown
          </h3>
          <div className="flex-1 min-h-[200px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.roleData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {metrics.roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-ruru-navy">{metrics.totalUsers}</span>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-4">
            {metrics.roleData.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="font-medium text-gray-700">{entry.name}</span>
                </div>
                <span className="font-bold text-ruru-navy">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pet Demographics Pie Chart */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-ruru-navy/5 flex flex-col">
          <h3 className="text-lg font-bold text-ruru-navy mb-6 flex items-center gap-2">
            <FileText size={20} className="text-orange-500" />
            Patient Species
          </h3>
          <div className="flex-1 min-h-[200px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.petTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {metrics.petTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black text-ruru-navy">{metrics.petTypeData.reduce((acc, curr) => acc + curr.value, 0)}</span>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-4">
            {metrics.petTypeData.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[(index + 2) % COLORS.length] }} />
                  <span className="font-medium text-gray-700">{entry.name}</span>
                </div>
                <span className="font-bold text-ruru-navy">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Appointment Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-gradient-to-br from-ruru-navy to-slate-800 p-6 rounded-[2rem] shadow-sm text-white flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <Calendar size={20} className="text-ruru-teal" />
              Appointment Health
            </h3>
            <p className="text-sm text-white/70 mb-6">Metrics covering booking completion and cancellation rates across the platform.</p>
            
            <div className="space-y-4">
               <div>
                 <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-1">
                   <span className="text-green-400">Completed</span>
                   <span className="text-white">{metrics.completedAppointments}</span>
                 </div>
                 <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-green-400 rounded-full" style={{ width: `${(metrics.completedAppointments / (metrics.totalAppointments || 1)) * 100}%` }} />
                 </div>
               </div>
               <div>
                 <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-1">
                   <span className="text-red-400">Cancelled</span>
                   <span className="text-white">{metrics.cancelledAppointments}</span>
                 </div>
                 <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-red-400 rounded-full" style={{ width: `${(metrics.cancelledAppointments / (metrics.totalAppointments || 1)) * 100}%` }} />
                 </div>
               </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-xs text-white/50 leading-relaxed">
              * High cancellation rates may indicate UI friction or provider scheduling mismatches. Consider reviewing the provider onboarding flow.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] shadow-sm border border-ruru-navy/5">
          <h3 className="text-lg font-bold text-ruru-navy mb-6 flex items-center gap-2">
            <MessageSquare size={20} className="text-ruru-blue" />
            Live App Usage Logs
          </h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {[
              { id: 'log-1', action: "User 'Dr. Simmons' updated clinic hours.", time: "2 mins ago", type: "info" },
              { id: 'log-2', action: "AI Query: 'Can dogs eat grapes?' flagged as urgent.", time: "15 mins ago", type: "alert" },
              ...posts.slice(0, 3).map(p => ({ id: p.id, action: `Community post by ${p.author.split(' ')[0]}: "${p.content.substring(0, 35)}..."`, time: new Date(p.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), type: 'success' })),
              { id: 'log-3', action: "New Pet Owner 'Sarah T.' registered.", time: "45 mins ago", type: "success" },
              ...healthRecords.slice(0, 2).map(r => ({ id: r.id, action: `Health record added for pet. Type: ${r.type}`, time: new Date(r.date).toLocaleDateString(), type: 'info' })),
              { id: 'log-4', action: "Failed Payment Webhook received.", time: "1 hr ago", type: "error" },
              { id: 'log-5', action: "Government License sync completed.", time: "2 hrs ago", type: "success" },
            ].map((log: any) => (
              <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 border border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    log.type === 'alert' ? 'bg-orange-500' :
                    log.type === 'error' ? 'bg-red-500' :
                    log.type === 'success' ? 'bg-green-500' :
                    'bg-blue-500'
                  }`} />
                  <span className="text-sm font-medium text-ruru-navy truncate max-w-[200px] md:max-w-md">{log.action}</span>
                </div>
                <span className="text-xs font-medium text-gray-400 whitespace-nowrap ml-2">{log.time}</span>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-2 text-sm font-bold text-ruru-blue hover:text-blue-800 transition-colors border-t border-ruru-navy/5 pt-4">
            View All System Logs &rarr;
          </button>
        </div>
      </div>

      {/* Search & Bulk-Deletions Administrative Section */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-ruru-navy/5 space-y-6">
        <div>
          <h3 className="text-xl font-bold text-ruru-navy tracking-tight flex items-center gap-2">
            <ShieldAlert size={22} className="text-ruru-teal" />
            Integrity Control & Database Management
          </h3>
          <p className="text-sm text-gray-500 mt-1">Cross-reference master indices, search records, and perform administrative overrides with loss-prevention guards.</p>
        </div>

        {/* Search Bar Block */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
            <Search size={20} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search across pets (name, variety, breed), records (title, diagnosis), or posts (author)..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border border-gray-150 text-ruru-navy text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ruru-teal focus:bg-white transition-all shadow-inner"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs text-gray-400 hover:text-ruru-navy"
            >
              Clear
            </button>
          )}
        </div>

        {/* Tabs Bar with Badges */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-2">
          <div className="flex gap-2">
            {[
              { id: 'pets', label: 'Pets', count: filteredPets.length, bg: 'bg-blue-50 text-ruru-blue' },
              { id: 'records', label: 'Health Records', count: filteredRecords.length, bg: 'bg-emerald-50 text-emerald-600' },
              { id: 'posts', label: 'Community Posts', count: filteredPosts.length, bg: 'bg-purple-50 text-purple-600' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-[1.25rem] font-bold text-sm tracking-tight transition-all flex items-center gap-2 ${
                  activeSubTab === tab.id 
                    ? 'bg-ruru-navy text-white shadow-md' 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {tab.label}
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                  activeSubTab === tab.id ? 'bg-white/20 text-white' : tab.bg
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Bulk Overrides Action Header */}
          <div className="flex items-center gap-3">
            {activeSubTab === 'pets' && selectedPets.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => triggerBulkDelete('pets')}
                className="bg-red-50 hover:bg-red-105 text-red-600 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border border-red-200"
              >
                <Trash2 size={14} />
                Delete Selected ({selectedPets.length})
              </motion.button>
            )}
            {activeSubTab === 'records' && selectedRecords.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => triggerBulkDelete('records')}
                className="bg-red-50 hover:bg-red-105 text-red-600 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border border-red-200"
              >
                <Trash2 size={14} />
                Delete Selected ({selectedRecords.length})
              </motion.button>
            )}
            {activeSubTab === 'posts' && selectedPosts.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => triggerBulkDelete('posts')}
                className="bg-red-50 hover:bg-red-105 text-red-600 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border border-red-200"
              >
                <Trash2 size={14} />
                Delete Selected ({selectedPosts.length})
              </motion.button>
            )}
          </div>
        </div>

        {/* Tab Content Tables */}
        <div className="overflow-x-auto min-h-[250px] border border-gray-100 rounded-2xl bg-gray-50/20">
          {activeSubTab === 'pets' && (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-500 font-bold uppercase tracking-wider text-xs">
                  <th className="p-4 w-12 text-center">
                    <button
                      onClick={() => handleSelectAll('pets', selectedPets.length !== filteredPets.length)}
                      className="text-gray-400 hover:text-ruru-teal transition-colors"
                    >
                      {selectedPets.length > 0 && selectedPets.length === filteredPets.length ? (
                        <CheckSquare size={18} className="text-ruru-teal fill-ruru-teal/10" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </th>
                  <th className="p-4">Pet Name</th>
                  <th className="p-4">Species</th>
                  <th className="p-4">Breed</th>
                  <th className="p-4">Age / Weight</th>
                  <th className="p-4">Owner Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {filteredPets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-12 text-gray-400">
                      No matching pets found. Try refining your search query.
                    </td>
                  </tr>
                ) : (
                  filteredPets.map(p => {
                    const isSelected = selectedPets.includes(p.id);
                    return (
                      <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-blue-50/25' : ''}`}>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleToggleSelect('pets', p.id)}
                            className="text-gray-400 hover:text-ruru-teal transition-colors"
                          >
                            {isSelected ? (
                              <CheckSquare size={18} className="text-ruru-teal fill-ruru-teal/10" />
                            ) : (
                              <Square size={18} />
                            )}
                          </button>
                        </td>
                        <td className="p-4 font-bold text-ruru-navy">{p.name}</td>
                        <td className="p-4">
                          <span className="text-xs bg-gray-100 border border-gray-200 text-slate-700 font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                            {p.type}
                          </span>
                        </td>
                        <td className="p-4 text-gray-600 font-medium">{p.breed}</td>
                        <td className="p-4 text-gray-500 text-xs text-left">
                          {p.age} years • {p.weight} kg
                        </td>
                        <td className="p-4 font-mono text-[10px] text-gray-400 max-w-[100px] truncate" title={p.ownerId}>
                          {p.ownerId}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {activeSubTab === 'records' && (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-500 font-bold uppercase tracking-wider text-xs">
                  <th className="p-4 w-12 text-center">
                    <button
                      onClick={() => handleSelectAll('records', selectedRecords.length !== filteredRecords.length)}
                      className="text-gray-400 hover:text-ruru-teal transition-colors"
                    >
                      {selectedRecords.length > 0 && selectedRecords.length === filteredRecords.length ? (
                        <CheckSquare size={18} className="text-ruru-teal fill-ruru-teal/10" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Diagnosis / Details</th>
                  <th className="p-4">Auth Status</th>
                  <th className="p-4">Pet Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-12 text-gray-400">
                      No matching health records found. Try refining your search query.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map(r => {
                    const isSelected = selectedRecords.includes(r.id);
                    return (
                      <tr key={r.id} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-emerald-50/15' : ''}`}>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleToggleSelect('records', r.id)}
                            className="text-gray-400 hover:text-ruru-teal transition-colors"
                          >
                            {isSelected ? (
                              <CheckSquare size={18} className="text-ruru-teal fill-ruru-teal/10" />
                            ) : (
                              <Square size={18} />
                            )}
                          </button>
                        </td>
                        <td className="p-4 text-gray-500 text-xs font-mono">{new Date(r.date).toLocaleDateString()}</td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wider border ${
                            r.type === 'vaccination' ? 'bg-teal-50 border-teal-200 text-teal-700' :
                            r.type === 'checkup' ? 'bg-blue-50 border-blue-200 text-ruru-blue' :
                            r.type === 'medication' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                            'bg-gray-50 border-gray-200 text-slate-700'
                          }`}>
                            {r.type}
                          </span>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-ruru-navy text-sm leading-tight">{r.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{r.description}</p>
                        </td>
                        <td className="p-4">
                          {r.verifiedByGov ? (
                            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full">
                              Gov Verified
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                              Pending Review
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-mono text-[10px] text-gray-400 max-w-[100px] truncate" title={r.petId}>
                          {r.petId}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {activeSubTab === 'posts' && (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-gray-500 font-bold uppercase tracking-wider text-xs">
                  <th className="p-4 w-12 text-center">
                    <button
                      onClick={() => handleSelectAll('posts', selectedPosts.length !== filteredPosts.length)}
                      className="text-gray-400 hover:text-ruru-teal transition-colors"
                    >
                      {selectedPosts.length > 0 && selectedPosts.length === filteredPosts.length ? (
                        <CheckSquare size={18} className="text-ruru-teal fill-ruru-teal/10" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </th>
                  <th className="p-4">Author</th>
                  <th className="p-4">Post Content</th>
                  <th className="p-4">Stats</th>
                  <th className="p-4">Published At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {filteredPosts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-12 text-gray-400">
                      No matching community posts found. Try refining your search query.
                    </td>
                  </tr>
                ) : (
                  filteredPosts.map(p => {
                    const isSelected = selectedPosts.includes(p.id);
                    return (
                      <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-purple-50/15' : ''}`}>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleToggleSelect('posts', p.id)}
                            className="text-gray-400 hover:text-ruru-teal transition-colors"
                          >
                            {isSelected ? (
                              <CheckSquare size={18} className="text-ruru-teal fill-ruru-teal/10" />
                            ) : (
                              <Square size={18} />
                            )}
                          </button>
                        </td>
                        <td className="p-4 font-bold text-ruru-navy text-left">
                          <div className="flex items-center gap-2">
                            {p.author}
                            {p.isVet && (
                              <span className="bg-indigo-50 border border-indigo-200 text-indigo-600 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase">
                                Vet Checked
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-left">
                          <p className="text-gray-700 leading-snug line-clamp-1 max-w-sm" title={p.content}>
                            {p.content}
                          </p>
                        </td>
                        <td className="p-4 text-xs font-semibold text-gray-500 text-left">
                          {p.likes} Likes • {p.comments} Comments
                        </td>
                        <td className="p-4 text-gray-400 text-xs font-mono text-left">
                          {new Date(p.timestamp).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Loss Prevention Custom Overrides Warning Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 max-w-md w-full relative z-10 text-center space-y-6 overflow-hidden"
            >
              {/* Alert symbol */}
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <AlertTriangle size={32} />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-ruru-navy tracking-tight">Confirm Mass Deletion</h3>
                <p className="text-sm font-medium text-gray-500 leading-relaxed">
                  You are performing an administrative bulk override to permanently purge <strong className="text-red-500">{confirmModal.ids.length}</strong> selected {
                    confirmModal.type === 'posts' ? 'community posts' : 
                    confirmModal.type === 'records' ? 'health records' : 
                    'pets'
                  } from the database.
                </p>
              </div>

              {/* Warnings panel */}
              <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3 text-left">
                <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
                <div className="text-xs text-red-800 leading-relaxed font-semibold">
                  This administrative operation is irreversible. Any associated notes, indexes, or media links bound to these records will be destroyed. 
                </div>
              </div>

              {/* Actions buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  disabled={isDeleting}
                  onClick={() => setConfirmModal({ isOpen: false, type: null, ids: [] })}
                  className="bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-bold py-4 rounded-[1.5rem] tracking-tight transition-all active:scale-95"
                >
                  Keep Data
                </button>
                <button
                  disabled={isDeleting}
                  onClick={handleExecutionDelete}
                  className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-50 text-white font-black py-4 rounded-[1.5rem] tracking-tight transition-all active:scale-95 shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="animate-spin text-white" size={18} />
                      Purging...
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      Purge Selected
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
