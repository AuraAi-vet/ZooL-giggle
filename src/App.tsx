// src/App.tsx
import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from './lib/firebase';
import { getUserProfile, createUserProfile } from './services/dbService';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore, ApplicationRole } from './store/useAppStore';

import LoginView from './views/LoginView';
import RoleSelectionView from './views/RoleSelectionView';
import PetOwnerDashboardView from './views/PetOwnerDashboardView';
import ClinicianDashboardView from './views/ClinicianDashboardView';
import ServiceProviderDashboardView from './views/ServiceProviderDashboardView';
import AdminDashboardView from './views/AdminDashboardView';
import UnifiedSidebar from './components/UnifiedSidebar';
import SettingsView from './views/SettingsView';
import InboxView from './views/InboxView';
import ZooLAIStudioView from './views/ZooLAIStudioView';
import TestingDashboardView from './views/TestingDashboardView';
import NotificationsDrawer from './components/NotificationsDrawer';
import CommandPalette from './components/CommandPalette';
import { ErrorBoundary } from './components/ErrorBoundary';
import AnimatedLogo from './components/AnimatedLogo';
import SessionTimerOverlay from './components/SessionTimerOverlay';
import { usePerfMonitor } from './lib/perfMonitor';
import { useInteractionTracker } from './lib/interactionLogger';

import ExternalProviderOnboardingView from './views/ExternalProviderOnboardingView';
import ZoolHelpWidget from './components/ZoolHelpWidget';
import ConnectionIndicator from './components/ConnectionIndicator';

export default function App() {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [isInitializing, setIsInitializing] = useState(true);
  const [isBiometricSession, setIsBiometricSession] = useState(false);
  
  // Initialize telemetry
  usePerfMonitor();
  useInteractionTracker();
  
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Track the active application view
  const [activeView, setActiveView] = useState<'dashboard' | 'settings' | 'inbox' | 'ai-studio' | 'testing'>('dashboard');

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Only subscribe to auth state changes if we are not in a mocking biometric session
    if (isBiometricSession) return;
    
    let unsubscribeNotifs: () => void;
    // Listen for live authentication state changes
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setAuthUser(user);
          
          // Subscribe to unread notifications count
          import('./services/dbService').then(({ subscribeToNotifications }) => {
            try {
              unsubscribeNotifs = subscribeToNotifications(user.uid, (notifs) => {
                const count = notifs.filter(n => !n.read).length;
                setUnreadCount(count);
              });
            } catch (e) {
              console.warn("Notifications subscription failed:", e);
            }
          });

          try {
            // Fetch their specific role from our new Firestore collection
            const profile = await getUserProfile(user.uid);
            
            if (profile) {
              setUserRole(profile.roleId);
              setApplicationStatus(profile.applicationStatus || 'none');
            } else {
              // If no profile exists, they are a new user. 
              setUserRole(null);
              setApplicationStatus('none');
              currentRole = profile.roleId as ApplicationRole;
            }
          } catch (profileError) {
            console.error("Failed to fetch user profile, defaulting to null:", profileError);
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
  }, [isBiometricSession]);

  const handleBiometricSuccess = async (uid: string) => {
    setIsInitializing(true);
    setIsBiometricSession(true); // Flag to ignore natural Firebase auth changes
    try {
      if (!auth.currentUser) {
        const { signInAnonymously } = await import('firebase/auth');
        await signInAnonymously(auth);
      }
      const profile = await getUserProfile(uid);
      if (profile) {
        setAuthUser({
          uid,
          email: profile.email || 'biometric@zool.com',
          displayName: profile.displayName || 'ZooL User'
        } as FirebaseUser);
        setUserRole(profile.roleId);
      } else {
        // Fallback or user needs to complete setup
        setAuthUser({
          uid,
          email: 'biometric@zool.com',
          displayName: 'ZooL User'
        } as FirebaseUser);
      }
    } catch (err) {
      console.error(err);
      setIsBiometricSession(false);
    } finally {
      setIsInitializing(false);
    }
  };

  // Handle first-time setup when they pick a role
  const handleRoleSelection = async (roleId: string) => {
    if (!authUser) return;

    try {
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
        logActivity(authUser.uid, 'Account Created', `Role configured as ${roleId}`).catch(console.error);
      });
      
      setUserRole(roleId);
      setApplicationStatus(newProfile.applicationStatus || 'none');
      setRole(roleId as ApplicationRole);
    } catch (err) {
      console.error("Failed to save role selection:", err);
      // Even if saving to Firestore fails, we can allow the user to proceed in memory
      // if we are running in an environment where Firestore fails (e.g. timeout)
      setUserRole(roleId);
    }
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FAF8F5]">
        <div className="relative flex flex-col items-center">
          <AnimatedLogo size="lg" className="mb-4 z-10 text-slate-900" />
          <div className="absolute inset-x-8 top-4 bottom-8 bg-cyan-200/50 rounded-full animate-ping opacity-30 shadow-[0_0_80px_rgba(6,182,212,0.5)]"></div>
          <h2 className="mt-4 text-2xl font-extrabold text-slate-800 font-display">ZooL Workspace</h2>
          <p className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
            Authenticating session...
          </p>
        </div>
      </div>
    );
  }

  // 1. Not logged into Google at all
  if (!authUser) {
    if (hash.startsWith('#claim-booking=')) {
      const clinicName = decodeURIComponent(hash.split('=')[1]);
      return <ExternalProviderOnboardingView onClose={() => { setHash(''); window.location.hash = ''; }} clinicName={clinicName} />;
    }
    return <LoginView onBiometricSuccess={handleBiometricSuccess} />;
  }

  // 2. Logged into Google, but hasn't picked a ZooL role yet
  if (!userRole) {
    if (hash.startsWith('#claim-booking=')) {
      const clinicName = decodeURIComponent(hash.split('=')[1]);
      return <ExternalProviderOnboardingView onClose={() => { setHash(''); window.location.hash = ''; }} clinicName={clinicName} />;
    }
    return <RoleSelectionView onSelectRole={handleRoleSelection} />;
  }

  // 3. Fully authenticated and role verified -> Route to appropriate dashboard
  return (
    <div className="flex min-h-screen bg-[#0B1120] relative">
      <div className="absolute inset-0 bg-[#F8FAFC] md:rounded-l-3xl md:m-4 ml-0 md:ml-72 overflow-hidden pointer-events-none z-0"></div>
      
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
      <SessionTimerOverlay />

      {/* Main Dashboard Content Area */}
      <main className="flex-1 overflow-x-hidden pt-16 md:pt-4 md:px-8 relative z-10 w-full mb-4"> 
        <div className="h-full bg-white md:bg-transparent rounded-t-3xl md:rounded-none shadow-sm md:shadow-none min-h-screen md:min-h-0">
          <ErrorBoundary>
            {/* Conditional Rendering Logic: Show Settings, Inbox, OR the Dashboard */}
            <AnimatePresence mode="wait">
              {hash.startsWith('#claim-booking=') ? (
                <motion.div
                  key="claim"
                  initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -15, filter: 'blur(8px)' }}
                  transition={{ duration: 0.4, type: 'spring', bounce: 0, ease: 'easeOut' }}
                >
                  <ExternalProviderOnboardingView onClose={() => {
                    setHash('');
                    window.location.hash = '';
                  }} clinicName={decodeURIComponent(hash.split('=')[1])} />
                </motion.div>
              ) : activeView === 'settings' ? (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -15, filter: 'blur(8px)' }}
                  transition={{ duration: 0.4, type: 'spring', bounce: 0, ease: 'easeOut' }}
                >
                  <SettingsView />
                </motion.div>
              ) : activeView === 'inbox' ? (
                <motion.div
                  key="inbox"
                  initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -15, filter: 'blur(8px)' }}
                  transition={{ duration: 0.4, type: 'spring', bounce: 0, ease: 'easeOut' }}
                >
                  <InboxView />
                </motion.div>
              ) : activeView === 'ai-studio' ? (
                <motion.div
                  key="ai-studio"
                  initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -15, filter: 'blur(8px)' }}
                  transition={{ duration: 0.4, type: 'spring', bounce: 0, ease: 'easeOut' }}
                >
                  <ZooLAIStudioView />
                </motion.div>
              ) : activeView === 'testing' ? (
                <motion.div
                  key="testing"
                  initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -15, filter: 'blur(8px)' }}
                  transition={{ duration: 0.4, type: 'spring', bounce: 0, ease: 'easeOut' }}
                >
                  <TestingDashboardView />
                </motion.div>
              ) : (
                <motion.div
                  key={`dashboard-${userRole}`}
                  initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -15, filter: 'blur(8px)' }}
                  transition={{ duration: 0.4, type: 'spring', bounce: 0, ease: 'easeOut' }}
                >
                  {userRole === 'role_owner_01' && <PetOwnerDashboardView />}
                  {userRole === 'role_vet_02' && <ClinicianDashboardView />}
                  {userRole === 'role_admin_03' && <AdminDashboardView />}
                  {userRole === 'role_service_04' && <ServiceProviderDashboardView />}
                </motion.div>
              )}
            </AnimatePresence>
          </ErrorBoundary>
        </div>
      </main>

      <ZoolHelpWidget />
      <div className="fixed bottom-6 left-6 z-[90]">
        <ConnectionIndicator />
      </div>
    </div>
  );
}
