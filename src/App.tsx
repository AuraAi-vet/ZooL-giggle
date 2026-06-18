// src/App.tsx
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from './lib/firebase';
import { getUserProfile, createUserProfile } from './services/dbService';

import LoginView from './views/LoginView';
import RoleSelectionView from './views/RoleSelectionView';
import PetOwnerDashboardView from './views/PetOwnerDashboardView';
import ClinicianDashboardView from './views/ClinicianDashboardView';
import ServiceProviderDashboardView from './views/ServiceProviderDashboardView';
import AdminDashboardView from './views/AdminDashboardView';
import UnifiedSidebar from './components/UnifiedSidebar';
import SettingsView from './views/SettingsView';
import NotificationsDrawer from './components/NotificationsDrawer';
import CommandPalette from './components/CommandPalette';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Track the active application view
  const [activeView, setActiveView] = useState<'dashboard' | 'settings'>('dashboard');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let unsubscribeNotifs: () => void;
    // Listen for live authentication state changes
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setAuthUser(user);
          
          // Subscribe to unread notifications count
          import('./services/dbService').then(({ subscribeToNotifications }) => {
            unsubscribeNotifs = subscribeToNotifications(user.uid, (notifs) => {
              const count = notifs.filter(n => !n.read).length;
              setUnreadCount(count);
            });
          });

          // Fetch their specific role from our new Firestore collection
          const profile = await getUserProfile(user.uid);
          
          if (profile) {
            setUserRole(profile.roleId);
          } else {
            // If no profile exists, they are a new user. 
            // userRole stays null, forcing the RoleSelectionView to render.
            setUserRole(null);
          }
        } else {
          setAuthUser(null);
          setUserRole(null);
          if (unsubscribeNotifs) {
            unsubscribeNotifs();
            setUnreadCount(0);
          }
        }
      } catch (error) {
        console.error("Auth state change error:", error);
      } finally {
        setIsInitializing(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeNotifs) unsubscribeNotifs();
    };
  }, []);

  // Handle first-time setup when they pick a role
  const handleRoleSelection = async (roleId: string) => {
    if (!authUser) return;

    const newProfile = {
      uid: authUser.uid,
      email: authUser.email || '',
      roleId: roleId,
      displayName: authUser.displayName || 'ZooL User',
      createdAt: Date.now(),
    };

    // Save their new role to Firestore
    await createUserProfile(newProfile);
    
    // Log the setup activity
    import('./services/dbService').then(({ logActivity }) => {
      logActivity(authUser.uid, 'Account Created', `Role configured as ${roleId}`);
    });
    
    setUserRole(roleId);
  };

  // Secure Firebase Logout Handler
  const handleSecureLogout = async () => {
    try {
      await signOut(auth);
      setUserRole(null);
      setAuthUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="relative flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-extrabold text-3xl shadow-xl z-10">
            Z
          </div>
          <div className="absolute inset-0 bg-slate-900 rounded-2xl animate-ping opacity-20"></div>
          <h2 className="mt-6 text-xl font-bold text-slate-800">ZooL Workspace</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Authenticating session...</p>
        </div>
      </div>
    );
  }

  // 1. Not logged into Google at all
  if (!authUser) {
    return <LoginView />;
  }

  // 2. Logged into Google, but hasn't picked a ZooL role yet
  if (!userRole) {
    return <RoleSelectionView onSelectRole={handleRoleSelection} />;
  }

  // 3. Fully authenticated and role verified -> Route to appropriate dashboard
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      
      {/* Unified Navigation Layer */}
      <UnifiedSidebar 
        userRole={userRole} 
        onLogout={handleSecureLogout} 
        onNavigate={setActiveView} 
        activeView={activeView}
        displayName={authUser.displayName || 'ZooL User'} 
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        unreadNotificationsCount={unreadCount}
      />

      <NotificationsDrawer 
        isOpen={isNotificationsOpen} 
        onClose={() => setIsNotificationsOpen(false)} 
      />
      
      <CommandPalette onNavigate={setActiveView} userRole={userRole} />

      {/* Main Dashboard Content Area */}
      <main className="flex-1 overflow-x-hidden pt-16 md:pt-0"> {/* pt-16 accounts for mobile top bar */}
        <div className="h-full">
          <ErrorBoundary>
            {/* Conditional Rendering Logic: Show Settings OR the Dashboard */}
            {activeView === 'settings' ? (
              <SettingsView />
            ) : (
              <>
                {userRole === 'role_owner_01' && <PetOwnerDashboardView />}
                {userRole === 'role_vet_02' && <ClinicianDashboardView />}
                {userRole === 'role_admin_03' && <AdminDashboardView />}
                {userRole === 'role_service_04' && <ServiceProviderDashboardView />}
              </>
            )}
          </ErrorBoundary>
        </div>
      </main>

    </div>
  );
}
