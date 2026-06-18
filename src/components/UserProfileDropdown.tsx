import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, Settings, UserCircle, Shield, Briefcase, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';
import { User } from 'firebase/auth';

interface UserProfileDropdownProps {
  user: User | null;
  onLogout: () => void;
  setActiveTab: (tab: 'settings' | 'profile' | 'vet' | 'practice') => void;
  onOpenProfile: () => void;
}

export function UserProfileDropdown({ user, onLogout, setActiveTab, onOpenProfile }: UserProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { userProfile, role } = useStore();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleIcon = () => {
    switch (role) {
      case 'vet': return <Shield size={14} className="text-blue-500" />;
      case 'provider': return <Briefcase size={14} className="text-amber-500" />;
      default: return null;
    }
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'vet': return 'Veterinarian';
      case 'provider': return 'Provider';
      default: return 'Pet Owner';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white/80 border border-ruru-teal/20 rounded-full p-1 pr-3 hover:shadow-sm transition-all shadow-sm"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden bg-ruru-teal/10 flex items-center justify-center">
          {user?.photoURL ? (
            <img src={user.photoURL} alt={userProfile?.name || 'Profile'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <UserCircle size={20} className="text-ruru-navy/60" />
          )}
        </div>
        <div className="flex flex-col items-start hidden sm:flex">
          <span className="text-xs font-bold text-ruru-navy truncate max-w-[80px]">
            {userProfile?.name?.split(' ')[0] || 'User'}
          </span>
          <span className="text-[9px] text-ruru-navy/60 font-semibold uppercase tracking-wider flex items-center gap-1">
            {getRoleLabel()} {getRoleIcon()}
          </span>
        </div>
        <ChevronDown size={14} className={cn("text-ruru-navy/40 transition-transform", isOpen && "rotate-180")} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-ruru-teal/10 overflow-hidden z-[100]"
          >
            <div className="p-4 border-b border-ruru-navy/5 bg-ruru-teal/5">
              <p className="font-bold text-sm text-ruru-navy truncate">{userProfile?.name || 'ZooL User'}</p>
              <p className="text-xs text-ruru-navy/60 truncate">{user?.email}</p>
              <div className="mt-2 flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-ruru-teal">
                {getRoleIcon()} {getRoleLabel()} Account
              </div>
            </div>

            <div className="p-2 space-y-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenProfile();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-ruru-navy-light hover:bg-ruru-teal/10 transition-colors"
              >
                <UserCircle size={16} /> My Profile
              </button>
              
              <button
                onClick={() => {
                  setIsOpen(false);
                  setActiveTab('settings');
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-ruru-navy-light hover:bg-ruru-teal/10 transition-colors"
              >
                <Settings size={16} /> Settings
              </button>

              {role === 'vet' && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setActiveTab('vet');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <Shield size={16} /> Vet Dashboard
                </button>
              )}

               {role === 'provider' && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setActiveTab('practice');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-amber-600 hover:bg-amber-50 transition-colors"
                >
                  <Briefcase size={16} /> Provider Dashboard
                </button>
              )}
            </div>

            <div className="p-2 border-t border-ruru-navy/5">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
