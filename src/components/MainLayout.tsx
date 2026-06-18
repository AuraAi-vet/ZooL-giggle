import React from 'react';
import { cn } from '../lib/utils';
import { ZooLLogo } from './ZooLLogo';
import { NavButton, SidebarNavButton } from './NavButton';

interface MainLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: 'owner' | 'vet' | 'provider' | 'admin';
}

export function MainLayout({ children, activeTab, setActiveTab, role }: MainLayoutProps) {
  // Define nav links based on role
  const getNavLinks = () => {
    switch (role) {
      case 'vet':
        return [
          { id: 'vet', label: 'Dashboard', icon: <div /> }, // Placeholder, logic will be updated
          { id: 'appointments', label: 'Schedule', icon: <div /> },
          { id: 'analytics', label: 'Intelligence', icon: <div /> },
        ];
      case 'owner':
      default:
        return [
          { id: 'home', label: 'Home', icon: <div /> },
          { id: 'health', label: 'Health', icon: <div /> },
          { id: 'community', label: 'Community', icon: <div /> },
          { id: 'ai', label: 'AI', icon: <div /> },
        ];
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col sm:flex-row">
      {/* Sidebar Navigation */}
      <nav className="hidden sm:flex flex-col items-center py-8 w-24 bg-white border-r border-ruru-teal/10 z-50">
        <ZooLLogo className="mb-8" />
        <div className="flex-1 flex flex-col gap-4">
            {/* Logic to map links */}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
