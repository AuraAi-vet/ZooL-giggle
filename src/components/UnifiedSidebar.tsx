import { useState } from 'react';
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
  Bell,
  Mail,
  Globe
} from 'lucide-react';
import AnimatedLogo from './AnimatedLogo';
import { useLanguage } from '../lib/i18n';

interface SidebarProps {
  userRole: string;
  onLogout: () => void;
  onNavigate: (view: 'dashboard' | 'settings' | 'inbox' | 'ai-studio') => void;
  activeView: 'dashboard' | 'settings' | 'inbox' | 'ai-studio';
  displayName?: string;
  onOpenNotifications: () => void;
  unreadNotificationsCount?: number;
}

export default function UnifiedSidebar({ userRole, onLogout, onNavigate, activeView, displayName = "ZooL User", onOpenNotifications, unreadNotificationsCount = 0 }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  // Helper to handle navigation and auto-close mobile menu
  const handleNavClick = (view: 'dashboard' | 'settings' | 'inbox' | 'ai-studio') => {
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
    <div className="flex flex-col h-full bg-white/70 backdrop-blur-2xl border-r border-slate-200/60 shadow-[8px_0_30px_-15px_rgba(0,0,0,0.05)] w-64 md:w-72 relative overflow-hidden">
      {/* Decorative ZooL */}
      <div className="absolute top-[-100px] left-[-100px] w-64 h-64 bg-cyan-400/10 rounded-full blur-[80px] pointer-events-none"></div>

      {/* Brand Header */}
      <div className="p-8 border-b border-slate-200/50 flex flex-col items-center justify-center relative z-10">
        <AnimatedLogo size="md" className="scale-110 mb-2" />
        <div className="flex items-center gap-1.5 mt-2 px-3 py-1 bg-gradient-to-r from-slate-900 to-slate-800 rounded-full shadow-md text-white">
           <svg className="w-3 h-3 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" />
           </svg>
           <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-50">PRO CONNECT</span>
        </div>
      </div>

      {/* User Profile Snippet */}
      <div className="p-6 border-b border-slate-200/50 flex items-center justify-between relative z-10 bg-white/40">
        <div className="overflow-hidden">
          <p className="font-bold text-slate-800 truncate mb-1">{displayName}</p>
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold backdrop-blur-md ${roleDetails.color}`}>
            {roleDetails.icon}
            {roleDetails.label}
          </div>
        </div>
        <button 
          onClick={onOpenNotifications} 
          className="relative p-2.5 bg-white shadow-sm border border-slate-200/60 hover:bg-slate-50 hover:scale-105 active:scale-95 text-slate-600 rounded-xl transition-all flex-shrink-0"
        >
          <Bell className="w-5 h-5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-rose-500 border-2 border-white rounded-full text-[9px] font-bold text-white">
              {unreadNotificationsCount}
            </span>
          )}
        </button>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar relative z-10">
        <button 
          onClick={() => handleNavClick('dashboard')}
          aria-label={t('dashboard')}
          className={`flex items-center gap-3 w-full p-3.5 rounded-xl font-bold transition-all border ${
            activeView === 'dashboard' 
              ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 translate-x-1 border-slate-800' 
              : 'text-slate-500 bg-transparent border-transparent hover:bg-slate-100 hover:text-slate-800 hover:translate-x-1'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          {t('dashboard')}
        </button>

        <button 
          onClick={() => handleNavClick('ai-studio')}
          aria-label="ZooL AI Studio"
          className={`flex items-center gap-3 w-full p-3.5 rounded-xl font-bold transition-all border ${
            activeView === 'ai-studio' 
              ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 translate-x-1 border-cyan-400' 
              : 'text-slate-500 bg-transparent border-transparent hover:bg-slate-100 hover:text-slate-800 hover:translate-x-1'
          }`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
             <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" fill="currentColor"/>
          </svg>
          ZooL AI Studio
        </button>

        <button 
          onClick={() => handleNavClick('inbox')}
          aria-label={t('inbox')}
          className={`flex items-center gap-3 w-full p-3.5 rounded-xl font-bold transition-all border ${
            activeView === 'inbox' 
              ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 translate-x-1 border-slate-800' 
              : 'text-slate-500 bg-transparent border-transparent hover:bg-slate-100 hover:text-slate-800 hover:translate-x-1'
          }`}
        >
          <Mail className="w-5 h-5" />
          {t('inbox')}
        </button>
        <button 
          onClick={() => handleNavClick('settings')}
          aria-label={t('settings')}
          className={`flex items-center gap-3 w-full p-3.5 rounded-xl font-bold transition-all border ${
            activeView === 'settings' 
              ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 translate-x-1 border-slate-800' 
              : 'text-slate-500 bg-transparent border-transparent hover:bg-slate-100 hover:text-slate-800 hover:translate-x-1'
          }`}
        >
          <Settings className="w-5 h-5" />
          {t('settings')}
        </button>
      </nav>

      {/* Language Switcher */}
      <div className="p-4 border-t border-slate-200/50 flex flex-col gap-3 relative z-10 bg-white/40">
        <div className="flex items-center gap-2 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
           <Globe className="w-3.5 h-3.5" />
           {t('selectLanguage')}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(['en', 'ml', 'hi'] as const).map((lang) => (
             <button 
               key={lang}
               onClick={() => setLanguage(lang)}
               className={`py-2 text-xs font-bold rounded-lg border transition-all ${language === lang ? 'bg-cyan-50 text-cyan-700 border-cyan-200 shadow-sm' : 'bg-white text-slate-500 border-slate-200/60 hover:bg-slate-50 hover:border-slate-300'}`}
             >
               {lang.toUpperCase()}
             </button>
          ))}
        </div>
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-200/50 relative z-10">
        <button 
          onClick={onLogout}
          className="flex items-center justify-center gap-2 w-full p-3.5 rounded-xl text-rose-600 font-bold bg-rose-50 hover:bg-rose-100 transition-all border border-rose-100/50 active:scale-95"
        >
          <LogOut className="w-5 h-5" />
          {t('logout')}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-white border-b border-slate-200 p-4 flex justify-between items-center z-[100]">
        <div className="flex items-center gap-2">
           <AnimatedLogo size="sm" />
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
          className="md:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[90]"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container (Hidden on mobile unless toggled) */}
      <aside className={`
        fixed inset-y-0 left-0 z-[100] transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <NavContent />
      </aside>
    </>
  );
}
