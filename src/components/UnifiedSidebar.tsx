import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  User, 
  Stethoscope, 
  ShieldCheck, 
  Scissors,
  Bell
} from 'lucide-react';

interface SidebarProps {
  userRole: string;
  onLogout: () => void;
  onNavigate: (view: 'dashboard' | 'settings') => void;
  activeView: 'dashboard' | 'settings';
  displayName?: string;
  onOpenNotifications: () => void;
  unreadNotificationsCount?: number;
}

export default function UnifiedSidebar({ userRole, onLogout, onNavigate, activeView, displayName = "ZooL User", onOpenNotifications, unreadNotificationsCount = 0 }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Helper to handle navigation and auto-close mobile menu
  const handleNavClick = (view: 'dashboard' | 'settings') => {
    onNavigate(view);
    setIsMobileOpen(false); // Fixes the mobile menu staying open issue
  };

  // Dynamically set the role badge and icon
  const getRoleDetails = () => {
    switch (userRole) {
      case 'role_owner_01': return { label: 'Pet Parent', icon: <User className="w-4 h-4" />, color: 'text-blue-600 bg-blue-50 border-blue-200' };
      case 'role_vet_02': return { label: 'Clinician', icon: <Stethoscope className="w-4 h-4" />, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
      case 'role_admin_03': return { label: 'Administrator', icon: <ShieldCheck className="w-4 h-4" />, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' };
      case 'role_service_04': return { label: 'Care Provider', icon: <Scissors className="w-4 h-4" />, color: 'text-orange-600 bg-orange-50 border-orange-200' };
      default: return { label: 'User', icon: <User className="w-4 h-4" />, color: 'text-slate-600 bg-slate-50 border-slate-200' };
    }
  };

  const roleDetails = getRoleDetails();

  const NavContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-slate-200/60 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)] w-64 md:w-72">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-extrabold text-xl shadow-md">
          Z
        </div>
        <div>
          <h2 className="font-extrabold text-xl tracking-tight text-slate-900">ZooL</h2>
          <p className="text-xs font-bold text-slate-400">ACCUCARE Platform</p>
        </div>
      </div>

      {/* User Profile Snippet */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <p className="font-bold text-slate-800 truncate mb-2">{displayName}</p>
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${roleDetails.color}`}>
            {roleDetails.icon}
            {roleDetails.label}
          </div>
        </div>
        <button 
          onClick={onOpenNotifications} 
          className="relative p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 border-2 border-white rounded-full"></span>
          )}
        </button>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <button 
          onClick={() => handleNavClick('dashboard')}
          className={`flex items-center gap-3 w-full p-3 rounded-xl font-bold transition-all border ${
            activeView === 'dashboard' 
              ? 'bg-slate-50 text-slate-900 border-slate-200/60 shadow-sm' 
              : 'text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-800 hover:border-slate-200/60'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
        </button>
        <button 
          onClick={() => handleNavClick('settings')}
          className={`flex items-center gap-3 w-full p-3 rounded-xl font-bold transition-all border ${
            activeView === 'settings' 
              ? 'bg-slate-50 text-slate-900 border-slate-200/60 shadow-sm' 
              : 'text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-800 hover:border-slate-200/60'
          }`}
        >
          <Settings className="w-5 h-5" />
          Settings
        </button>
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-100">
        <button 
          onClick={onLogout}
          className="flex items-center justify-center gap-2 w-full p-3 rounded-xl text-rose-600 font-bold hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-100"
        >
          <LogOut className="w-5 h-5" />
          Secure Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-white border-b border-slate-200 p-4 flex justify-between items-center z-40">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold">Z</div>
           <span className="font-bold text-slate-900">ZooL</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onOpenNotifications} 
            className="relative p-2 text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
            )}
          </button>
          <button 
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 bg-slate-100 text-slate-600 rounded-lg"
          >
            {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container (Hidden on mobile unless toggled) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <NavContent />
      </aside>
    </>
  );
}
