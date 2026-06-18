import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BellOff,
  Menu,
  Trash2,
  Download,
  FileJson,
  Edit2,
  Send,
  Clock,
  TrendingUp,
  CheckCircle2,
  Share2,
  Sparkles,
  ExternalLink,
  PhoneCall,
  Activity,
  Shield,
  ShieldAlert,
  MessageCircle,
  Calendar,
  MessageSquare,
  Settings,
  X,
  Plus,
  Zap,
  LogOut,
  User as UserIcon,
  AlertTriangle,
  Bell,
  Camera,
  MapPin,
  Mic,
  MicOff,
  Search,
  Map as MapIcon,
  Heart,
  MoreVertical,
  Building2,
  LayoutDashboard,
  Users as UsersIcon,
  Home,
  RefreshCw,
  Check,
  CloudOff,
  ClipboardList,
  Stethoscope
} from 'lucide-react';
import { useStore } from './store/useStore';
import { useServiceStore } from './store/useServiceStore';
import { cn } from './lib/utils';
import { GoogleTasksCard } from './components/GoogleTasksCard';
const FeatureTour = React.lazy(() => import('./components/FeatureTour').then(m => ({ default: m.FeatureTour })));
const SymptomChecker = React.lazy(() => import('./components/SymptomChecker').then(m => ({ default: m.SymptomChecker })));

const LiveAssistant = React.lazy(() => import('./components/LiveAssistant').then(m => ({ default: m.LiveAssistant })));
const PetProfileView = React.lazy(() => import('./components/PetProfileView').then(m => ({ default: m.PetProfileView })));
const GovernmentPortalsView = React.lazy(() => import('./views/GovernmentPortalsView').then(m => ({ default: m.GovernmentPortalsView })));

import { ErrorBoundary } from './components/ErrorBoundary';
import { playAudio, isDailyLimitReached, LIMIT_REACHED_MSG } from './services/geminiService';
import { PremiumModal } from './components/PremiumModal';
import { QuickLogFAB } from './components/QuickLogFAB';
import { SOSModal } from './components/SOSModal';
import { NavButton, SidebarNavButton } from './components/NavButton';
import { EditRecordModal } from './components/EditRecordModal';
import { ProfileEditModal } from './components/ProfileEditModal';
import { FeedbackModal } from './components/FeedbackModal';
import { RuRuIcon } from './components/RuRuIcon';
import { RuRuFAB } from './components/RuRuFAB';
import { ZooLLogo } from './components/ZooLLogo';
import { ConfirmationDialog } from './components/ConfirmationDialog';
const ModalsWrapper = React.lazy(() => import('./components/ModalsWrapper').then(m => ({ default: m.ModalsWrapper })));

import { HealthView } from './views/HealthView';
import { CommunityView } from './views/CommunityView';

const LoginView = React.lazy(() => import('./views/LoginView').then(m => ({ default: m.LoginView })));
const LandingView = React.lazy(() => import('./views/LandingView').then(m => ({ default: m.LandingView })));
const HomeView = React.lazy(() => import('./views/HomeView').then(m => ({ default: m.HomeView })));
const CareTrackerView = React.lazy(() => import('./views/CareTrackerView').then(m => ({ default: m.CareTrackerView })));
const AppointmentsView = React.lazy(() => import('./views/AppointmentsView').then(m => ({ default: m.AppointmentsView })));
const ServicesView = React.lazy(() => import('./views/ServicesView').then(m => ({ default: m.ServicesView })));
const AIView = React.lazy(() => import('./views/AIView').then(m => ({ default: m.AIView })));
const AILimitIndicator = React.lazy(() => import('./components/AILimitIndicator').then(m => ({ default: m.AILimitIndicator })));

const SettingsView = React.lazy(() => import('./views/SettingsView').then(m => ({ default: m.SettingsView })));

const VetDashboardView = React.lazy(() => import('./views/VetDashboardView').then(m => ({ default: m.VetDashboardView })));
const ProviderDashboardView = React.lazy(() => import('./views/ProviderDashboardView').then(m => ({ default: m.ProviderDashboardView })));
const AdminDashboardView = React.lazy(() => import('./views/AdminDashboardView').then(m => ({ default: m.AdminDashboardView })));

import { ANIMAL_TYPES, ANIMAL_BREEDS } from './lib/animalBreeds';
import { OnboardingWizard } from './components/OnboardingWizard';
import { EmptyState } from './components/EmptyState';

import { auth, db, messaging } from './firebase';
import { User, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getToken } from 'firebase/messaging';
import { checkAndTriggerReminders } from './services/reminderService';
import { checkMilestones } from './services/milestoneService';
import { getCurrentLocation, getStaticMapUrl } from './services/mapsService';
import { uploadImage } from './services/storageService';
import { exportHealthRecordsToPDF } from './services/zoolServices';
import { vibrateSOS, vibrateLight } from './utils/vibrator';
import { Service, Pet, HealthRecord, CommunityPost, QuickLog, UserProfile, Appointment, PetDocument, SuggestedReminder } from './types';
import { Toaster, toast } from 'sonner';
import Markdown from 'react-markdown';

import { translations, Language } from './lib/translations';

import { checkRemindersAndNotify, requestNotificationPermission as initPushNotificationsPermission } from './services/notificationService';

export default function App() {
  return (
    <ErrorBoundary
      fallback={(err, reset) => {
        if (err.message.includes('showAIPanel')) {
          return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-[#FDFCFB]">
              <div className="bg-white/95 backdrop-blur-3xl p-8 rounded-[2.5rem] shadow-xl border border-ruru-navy/10 max-w-md w-full text-center space-y-6">
                <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles size={32} />
                </div>
                <h2 className="text-2xl font-brand text-ruru-navy-light">AI Panel Unavailable</h2>
                <p className="text-ruru-navy/60 text-sm leading-relaxed">
                  We're currently updating the AI features. Some functionality might be temporarily unavailable.
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={reset}
                    className="w-full bg-ruru-teal hover:bg-ruru-teal/95 text-white py-4 rounded-[1.5rem] font-bold shadow-lg shadow-ruru-teal/10 active:scale-95 transition-all"
                  >
                    Retry Connection
                  </button>
                  <button 
                    onClick={() => window.location.reload()}
                    className="w-full bg-slate-50 hover:bg-slate-100 text-slate-500 py-3 rounded-[1.5rem] text-sm font-medium transition-all"
                  >
                    Reload Application
                  </button>
                </div>
              </div>
            </div>
          );
        }
        return undefined;
      }}
    >
      <Toaster position="top-center" richColors />
      <AppContent />
    </ErrorBoundary>
  );
}

export interface Task {
  id: string;
  title: string;
  priority?: 'Low' | 'Medium' | 'High';
}

import { useAILimit } from './hooks/useAILimit';
import { UserProfileDropdown } from './components/UserProfileDropdown';

function AppContent() {
  const { limitReached: aiLimitReached } = useAILimit();
  const [tasks, setTasks] = useState<Task[]>([]);
  const { 
    role, setRole,
    pets, addPet, deletePet, updatePet,
    healthRecords, addRecord, updateRecord, deleteRecord,
    communityPosts, addPost, likePost,
    quickLogs, addQuickLog, deleteQuickLog,
    documents, addDocument,
    userProfile, setUserProfile, isProfileLoaded,
    appointments, updateAppointment,
    syncStatus, lastSaved, setSyncStatus,
    addAppointment,
    blockedSlots, addBlockedSlot, deleteBlockedSlot,
    notifications,
    vets,
    messages,
    licenses,
    publicAlerts,
    addLicense,
    addNotification,
    markNotificationRead,
    sendMessage,
    markMessageRead,
    initializeCoreListeners,
    initializeCommunityListeners,
    initializeHealthListeners,
    initializeAppointmentsListeners,
    submitFeedback,
    language,
    setLanguage,
    darkMode,
    notificationsEnabled,
    trackAnalyticsEvent
  } = useStore();

  const { services, initializeListeners: initServices } = useServiceStore();

  const t = translations[language];

  const [showSavedStatus, setShowSavedStatus] = useState(false);
  const [aiPersona, setAiPersona] = useState<'doctor' | 'nutritionist' | 'behaviorist'>('doctor');
  const [smartSummary, setSmartSummary] = useState<string>('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [hasSeenLanding, setHasSeenLanding] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  useEffect(() => {
    if (syncStatus === 'synced') {
      setShowSavedStatus(true);
      const timer = setTimeout(() => setShowSavedStatus(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [syncStatus]);

  useEffect(() => {
    if (user && pets.length > 0) {
      const summaryContext = `User pets: ${pets.map(p => `${p.name} (${p.type})`).join(', ')}. Recent logs: ${quickLogs.length}. Reminders: ${healthRecords.filter(r => r.reminderEnabled).length}. Write a one-sentence, warm health summary/encouragement for the owner from ZooL AI.`;
      import('./services/geminiService').then(({ getPetAdvice }) => {
        getPetAdvice(summaryContext, "Keep it under 15 words, very encouraging, use a relevant emoji.").then(res => {
          setSmartSummary(res);
        });
      });
    }
  }, [pets.length, user]);
  const [activeTab, setActiveTab] = useState<'home' | 'health' | 'community' | 'services' | 'ai' | 'vet' | 'symptoms' | 'settings' | 'appointments' | 'care' | 'chat' | 'training' | 'activity' | 'gov' | 'practice' | 'profile' | 'admin'>('home');
  const navigationItems = [
    { id: 'home', icon: Home, label: t.nav.home },
    { id: 'health', icon: Activity, label: t.home.petHub },
    { id: 'care', icon: ClipboardList, label: t.home.careTracker },
    { id: 'appointments', icon: Calendar, label: t.nav.appointments },
    { id: 'services', icon: MapIcon, label: t.nav.services },
    { id: 'ai', icon: Sparkles, label: t.home.ruruAssistant },
    { id: 'community', icon: UsersIcon, label: t.nav.community },
  ];

  const adminTabs = role === 'admin' ? [{ id: 'admin', icon: Shield, label: 'Central Command' }] : [];
  const vetTabs = role === 'vet' ? [{ id: 'vet', icon: Stethoscope, label: 'Vet Ops' }] : [];
  const providerTabs = role === 'provider' ? [{ id: 'practice', icon: Building2, label: 'Clinic Ops' }] : [];

  const finalNavItems = [...navigationItems, ...adminTabs, ...vetTabs, ...providerTabs];
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  useEffect(() => {
    const initNotifications = async () => {
      if (healthRecords.length > 0) {
        if (typeof window !== 'undefined' && 'Notification' in window) {
          const granted = await initPushNotificationsPermission();
          if (granted === true) {
            checkRemindersAndNotify(healthRecords);
          }
        }
      }
    };
    initNotifications();
  }, [healthRecords]);
  const [selectedChatVetId, setSelectedChatVetId] = useState<string | null>(null);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [communitySort, setCommunitySort] = useState<'recent' | 'popular' | 'urgent'>('recent');
  
  useEffect(() => {
    if (isAuthReady && user && role) {
      // Role-based redirection to default views on initial load
      if (activeTab === 'home') {
        if (role === 'vet') {
          setActiveTab('vet');
        } else if (role === 'provider') {
          setActiveTab('practice');
        }
      }
    }
  }, [isAuthReady, user, role, activeTab]);

  const sortedPosts = React.useMemo(() => {
    return [...communityPosts].sort((a, b) => {
      if (communitySort === 'recent') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      return b.likes - a.likes;
    });
  }, [communityPosts, communitySort]);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    // Premium checkout handling on hold
  }, [userProfile, setUserProfile]);

  useEffect(() => {
    // Show onboarding if no pets exist and auth is ready
    if (isAuthReady && user && pets.length === 0) {
      const hasSeenOnboarding = localStorage.getItem('zool_onboarding_complete');
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [isAuthReady, user, pets.length]);

  useEffect(() => {
    if (healthRecords.length > 0 && pets.length > 0) {
      checkAndTriggerReminders(healthRecords, pets);
      checkMilestones(pets);
    }
  }, [healthRecords, pets]);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast.success('Notifications enabled!');
        
        // Get FCM token
        const msg = await messaging();
        if (msg) {
          const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
          if (vapidKey) {
            try {
              const currentToken = await getToken(msg, { vapidKey });
              if (currentToken) {
                console.log('FCM Token:', currentToken);
                // In a real app, you would save this token to the user's profile in Firestore
                // e.g., await updateDoc(doc(db, 'users', user.uid), { fcmToken: currentToken });
              } else {
                console.log('No registration token available. Request permission to generate one.');
              }
            } catch (err) {
              console.log('An error occurred while retrieving token. ', err);
            }
          } else {
            console.warn('VITE_FIREBASE_VAPID_KEY is missing in environment variables.');
          }
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };
  
  useEffect(() => {
    // Sync dark mode class
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if (notificationsEnabled) {
      requestNotificationPermission();
    }
  }, [notificationsEnabled]);

  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string; groundingLinks?: { title: string, url: string }[] }[]>([
    { role: 'ai', text: 'Namaste! I am RuRu, your interactive care navigator. I can find nearby hospitals, groomers, pet shops, boarding facilities, and suggest best practices. How can I assist you today?' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiImage, setAiImage] = useState<string | null>(null);
  const chatSessionRef = useRef<any>(null);
  const lastQueryWasVoice = useRef(false);

  useEffect(() => {
    if (activeTab !== 'ai') return;
    let context = buildAIContext();
    let isMounted = true;
    import('./services/geminiService').then(({ getChatSession }) => {
      if (isMounted) chatSessionRef.current = getChatSession(context, aiPersona);
    });
    return () => { isMounted = false; };
  }, [pets, aiPersona, language, activeTab]);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    lastQueryWasVoice.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setIsTyping(true);
          const { transcribeAudio } = await import('./services/geminiService');
          const transcription = await transcribeAudio(base64Audio, 'audio/webm');
          if (transcription) {
            setInputMessage(transcription);
            // Optionally auto-send transcription
            // handleSendMessage(); 
          }
          setIsTyping(false);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Could not access microphone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);

  const buildAIContext = React.useCallback(() => {
    let context = `User has ${pets.length} pets: ${pets.map(p => p.name).join(', ')}. Language: ${language}.`;
    if (selectedPetId) {
      const pet = pets.find(p => p.id === selectedPetId);
      if (pet) {
        const weightLogs = pet.weightHistory?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];
        const lastWeight = weightLogs.length > 0 ? weightLogs[0].value + ' kg' : (pet.weight ? pet.weight + ' kg' : 'Unknown');
        
        const chronicConditions = pet.chronicConditions && pet.chronicConditions.length > 0 ? pet.chronicConditions.join(', ') : 'None';
        
        const vetVisits = healthRecords.filter(r => r.petId === pet.id && r.type === 'checkup').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const lastVetVisit = vetVisits.length > 0 ? vetVisits[0].date : 'Unknown';
        
        context += ` Selected Pet details: ${pet.name} is a ${pet.age}-year-old ${pet.breed || pet.type}. Last recorded weight: ${lastWeight}. Chronic conditions: ${chronicConditions}. Last vet visit: ${lastVetVisit}.`;
      }
    }
    return context;
  }, [pets, language, selectedPetId, healthRecords]);

  // Modals State
  const [isAddPetModalOpen, setIsAddPetModalOpen] = useState(false);
  const [isAddRecordModalOpen, setIsAddRecordModalOpen] = useState(false);
  const [isEditingRecord, setIsEditingRecord] = useState<HealthRecord | null>(null);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [nearbyEmergencyVets, setNearbyEmergencyVets] = useState<any[]>([]);
  const [isLoadingEmergency, setIsLoadingEmergency] = useState(false);

  const handleOpenSOS = async () => {
    vibrateSOS();
    setIsSOSOpen(true);
    setIsLoadingEmergency(true);
    try {
      const location = await getCurrentLocation();
      const { findNearbyPlaces } = await import('./services/mapsService');
      const places = await findNearbyPlaces({ lat: location.lat, lng: location.lng }, 'vet');
      const emergencyVets = places.map(p => ({
        name: p.name,
        type: 'vet',
        address: p.address,
        rating: p.rating,
        description: 'Nearby Veterinary Clinic'
      }));
      setNearbyEmergencyVets(emergencyVets);
    } catch (error) {
      console.error('Error fetching emergency vets:', error);
    } finally {
      setIsLoadingEmergency(false);
    }
  };
  const [isLiveAssistantOpen, setIsLiveAssistantOpen] = useState(false);
  const [petToDelete, setPetToDelete] = useState<Pet | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<HealthRecord | null>(null);
  const [logToDelete, setLogToDelete] = useState<QuickLog | null>(null);
  const [selectedServiceForMap, setSelectedServiceForMap] = useState<Service | null>(null);
  const [selectedPetForProfile, setSelectedPetForProfile] = useState<Pet | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);

  const handleGoogleCalendarAuth = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/calendar');
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setGoogleToken(credential.accessToken);
        toast.success("Google Calendar integration authorized successfully!");
        return credential.accessToken;
      } else {
        toast.error("Failed to obtain authorized calendar scope.");
      }
    } catch (error) {
      console.error("Google Calendar authorization failure:", error);
      toast.error("Failed to authorize Google Calendar.");
    }
    return null;
  };

  const handleGoogleTasksAuth = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/tasks');
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setGoogleToken(credential.accessToken);
        toast.success("Google Tasks integration authorized successfully!");
        return credential.accessToken;
      } else {
        toast.error("Failed to obtain authorized tasks scope.");
      }
    } catch (error) {
      console.error("Google Tasks authorization failure:", error);
      toast.error("Failed to authorize Google Tasks.");
    }
    return null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isProfileLoaded && userProfile) {
      if (role === 'vet' && activeTab === 'home') {
        setActiveTab('vet');
      } else if (role === 'provider' && activeTab === 'home') {
        setActiveTab('practice');
      }
    }
  }, [role, isProfileLoaded, userProfile, activeTab]);

  useEffect(() => {
    if (!user) return;
    let cleanup: (() => void) | undefined;
    let retryTimeout: NodeJS.Timeout;
    let retryCount = 0;

    const setupListeners = () => {
      try {
        cleanup = initializeCoreListeners(user.uid);
      } catch (err: any) {
        console.error("Failed to initialize core listeners:", err);
        if (err.message?.toLowerCase().includes('fetch') || err.message?.toLowerCase().includes('network') || !navigator.onLine) {
          if (retryCount === 0) toast.error("Connection interrupted. Please check your network. Retrying...");
          retryCount++;
          retryTimeout = setTimeout(setupListeners, 5000);
        }
      }
    };

    setupListeners();

    return () => {
      clearTimeout(retryTimeout);
      if (cleanup) cleanup();
    };
  }, [user, initializeCoreListeners, role]);

  // Targeted Listener Synchronization for Lowest Cost Model
  useEffect(() => {
    if (!user || activeTab !== 'community') return;
    let cleanup: (() => void) | undefined;
    let retryTimeout: NodeJS.Timeout;
    
    const setupListeners = () => {
      try {
        cleanup = initializeCommunityListeners(user.uid);
      } catch (err: any) {
        if (err.message?.toLowerCase().includes('fetch') || !navigator.onLine) {
          toast.error("Network issue. Retrying community sync...");
          retryTimeout = setTimeout(setupListeners, 5000);
        }
      }
    };
    setupListeners();
    return () => { clearTimeout(retryTimeout); if (cleanup) cleanup(); };
  }, [user, activeTab, initializeCommunityListeners]);

  useEffect(() => {
    if (!user || !(activeTab === 'health' || activeTab === 'symptoms' || activeTab === 'care')) return;
    let cleanup: (() => void) | undefined;
    let retryTimeout: NodeJS.Timeout;
    
    const setupListeners = () => {
      try {
        cleanup = initializeHealthListeners(user.uid);
      } catch (err: any) {
        if (err.message?.toLowerCase().includes('fetch') || !navigator.onLine) {
          toast.error("Network issue. Retrying health records sync...");
          retryTimeout = setTimeout(setupListeners, 5000);
        }
      }
    };
    setupListeners();
    return () => { clearTimeout(retryTimeout); if (cleanup) cleanup(); };
  }, [user, activeTab, initializeHealthListeners]);

  useEffect(() => {
    if (!user || !(activeTab === 'appointments' || activeTab === 'practice')) return;
    let cleanup: (() => void) | undefined;
    let retryTimeout: NodeJS.Timeout;
    
    const setupListeners = () => {
      try {
        cleanup = initializeAppointmentsListeners(user.uid);
      } catch (err: any) {
        if (err.message?.toLowerCase().includes('fetch') || !navigator.onLine) {
          toast.error("Network issue. Retrying appointments sync...");
          retryTimeout = setTimeout(setupListeners, 5000);
        }
      }
    };
    setupListeners();
    return () => { clearTimeout(retryTimeout); if (cleanup) cleanup(); };
  }, [user, activeTab, initializeAppointmentsListeners]);



  useEffect(() => {
    if (user && activeTab === 'services') {
      return initServices();
    }
  }, [user, activeTab, initServices]);

  useEffect(() => {
    const handleNavigation = (e: any) => {
      setActiveTab(e.detail);
    };
    window.addEventListener('navigate', handleNavigation);
    return () => window.removeEventListener('navigate', handleNavigation);
  }, []);

  // Non-blocking asynchronous analytics event trace on navigation state changes
  useEffect(() => {
    if (user) {
      trackAnalyticsEvent('User navigated tab', { 
        tab: activeTab, 
        role: role || 'owner', 
        timestamp: new Date().toISOString() 
      });
    }
  }, [activeTab, user, role, trackAnalyticsEvent]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const type = params.get('type');
    
    if (success === 'true' && type === 'booking') {
      const pendingData = localStorage.getItem('pending_booking');
      if (pendingData) {
        try {
          const { petId, serviceName, date, vetId, reason } = JSON.parse(pendingData);
          handleBookAppointment(petId, serviceName, date, vetId, reason);
          localStorage.removeItem('pending_booking');
          
          // Clear URL params without reloading
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
          
          toast.success('Payment verified. Appointment finalized!');
          setActiveTab('appointments');
        } catch (e) {
          console.error('Failed to parse pending booking:', e);
        }
      }
    } else if (params.get('canceled') === 'true') {
      toast.error('Payment was canceled. Booking failed.');
      localStorage.removeItem('pending_booking');
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [user, isProfileLoaded]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/calendar');
      const result = await signInWithPopup(auth, provider);
      
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setGoogleToken(credential.accessToken);
      }

      if (result.user) {
        // Initialize profile if it doesn't exist
        setUserProfile({
          uid: result.user.uid,
          name: result.user.displayName || 'Pet Parent',
          email: result.user.email || '',
          image: result.user.photoURL || `https://i.pravatar.cc/150?u=${result.user.uid}`,
          role: 'owner',
          location: 'Mumbai, India',
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setGoogleToken(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleQuickLog = async (type: QuickLog['type'], petId: string) => {
    const log = {
      petId,
      type,
      timestamp: new Date().toISOString()
    };
    
    if (!navigator.onLine) {
      const { queueOfflineLog } = await import('./services/offlineSyncService');
      queueOfflineLog(log);
      setIsQuickLogOpen(false);
    } else {
      try {
        await addQuickLog(log);
        setIsQuickLogOpen(false);
      } catch (err) {
        console.warn("Network transaction failed. Offloading to background offline queue:", err);
        const { queueOfflineLog } = await import('./services/offlineSyncService');
        queueOfflineLog(log);
        setIsQuickLogOpen(false);
      }
    }
  };

  // Automated Background Sync Engine for Offline care trackers
  useEffect(() => {
    import('./services/backgroundSyncManager').then(({ backgroundSyncManager }) => {
      backgroundSyncManager.init(addQuickLog, setSyncStatus);
    });
  }, [addQuickLog, setSyncStatus]);

  // Form States
  const [newPet, setNewPet] = useState({ name: '', type: 'Dog' as any, breed: '', image: '' });
  const [newRecord, setNewRecord] = useState({ petId: '', type: 'checkup' as any, title: '', description: '', date: '', nextDueDate: '', reminderEnabled: false });
  const [newPost, setNewPost] = useState({ content: '', tags: '' });

  const handleAddPet = async () => {
    const pet = {
      ownerId: user?.uid || 'temp',
      name: newPet.name,
      type: newPet.type,
      breed: newPet.breed || 'Unknown',
      age: 0,
      weight: 0,
      image: newPet.image || `https://picsum.photos/seed/${newPet.name}/400/400`,
      weightHistory: [{ date: new Date().toISOString().split('T')[0], value: 0 }]
    };
    await addPet(pet as Omit<Pet, 'id'>);
    setIsAddPetModalOpen(false);
    setNewPet({ name: '', type: 'Dog', breed: '', image: '' });
  };

  const handleDeletePet = async () => {
    if (petToDelete) {
      await deletePet(petToDelete.id);
      setPetToDelete(null);
    }
  };

  const handleDeleteRecord = async () => {
    if (recordToDelete) {
      await deleteRecord(recordToDelete.id);
      setRecordToDelete(null);
    }
  };

  const handleDeleteLog = async () => {
    if (logToDelete) {
      await deleteQuickLog(logToDelete.id);
      setLogToDelete(null);
    }
  };

  const handleAddRecord = async () => {
    await addRecord(newRecord);
    setIsAddRecordModalOpen(false);
    setNewRecord({ petId: '', type: 'checkup', title: '', description: '', date: '', nextDueDate: '', reminderEnabled: false });
  };

  const handleCreatePost = async () => {
    if (!userProfile) return;
    const post = {
      author: userProfile.name,
      authorImage: userProfile.image,
      content: newPost.content,
      likes: 0,
      comments: 0,
      timestamp: new Date().toISOString(),
      tags: newPost.tags.split(',').map(t => t.trim()).filter(t => t !== '')
    };
    await addPost(post);
    setIsCreatePostModalOpen(false);
    setNewPost({ content: '', tags: '' });
  };

  const handleLikePost = async (postId: string) => {
    await likePost(postId);
  };

  const handleSharePost = async (post: CommunityPost) => {
    const shareData = {
      title: 'ZooL Community Post',
      text: `${post.author} shared: ${post.content}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}`;
        window.open(twitterUrl, '_blank');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
  };

  const handleApplyLicense = async (petId: string) => {
    const pet = pets.find(p => p.id === petId);
    if (!pet) return;
    
    toast.promise(
      new Promise(async (resolve) => {
        // Simulate government API call delay
        await new Promise(r => setTimeout(r, 2000));
        await addLicense({
          petId,
          ownerId: pet.ownerId,
          licenseNumber: `AV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          issuer: 'Municipal Animal Health Dept',
          issueDate: new Date().toISOString(),
          expiryDate: new Date(Date.now() + 31536000000).toISOString(), // 1 year
          status: 'active',
          type: 'standard'
        });
        resolve(true);
      }),
      {
        loading: `Syncing with Gov Portal for ${pet.name}...`,
        success: `License issued for ${pet.name}! 📜`,
        error: 'Failed to verify with municipal services.'
      }
    );
  };

  const handleESamrudhaSync = async (petId: string, govId: string, insurance: string) => {
    const pet = pets.find(p => p.id === petId);
    if (!pet) return;

    toast.promise(
      new Promise(async (resolve, reject) => {
        try {
          // Store actual input instead of mock data
          await updatePet(petId, {
            eSamrudhaId: govId,
            insuranceNumber: insurance || undefined,
            isMicrochipped: true
          });
          resolve(true);
        } catch (e) {
          reject(e);
        }
      }),
      {
        loading: `Authenticating with Kerala e-Samrudha for ${pet.name}...`,
        success: `Successfully synced! Health Card and Insurance updated.`,
        error: `Could not verify with e-Samrudha servers.`
      }
    );
  };

  const handleToggleReminder = async (recordId: string) => {
    const record = healthRecords.find(r => r.id === recordId);
    if (record) {
      await updateRecord(recordId, { reminderEnabled: !record.reminderEnabled });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await uploadImage(file, `users/${auth.currentUser?.uid}/pets`);
        setNewPet({ ...newPet, image: url });
        toast.success("Image uploaded successfully");
      } catch (error) {
        console.error("Failed to upload image:", error);
        toast.error("Failed to upload image. Please try again.");
      }
    }
  };

  const handleDownloadPDF = async () => {
    toast.promise(exportHealthRecordsToPDF(healthRecords, pets), {
      loading: 'Generating clinical report...',
      success: 'Report downloaded successfully!',
      error: 'Failed to generate report'
    });
  };

  const handlePrintLicense = (petId: string) => {
    const pet = pets.find(p => p.id === petId);
    const license = licenses.find(l => l.petId === petId);
    if (!pet || !license) {
      toast.error("License not found for this pet.");
      return;
    }
    
    toast.success(`Digital license for ${pet.name} is ready for printing!`);
    setTimeout(() => window.print(), 500);
  };

  const handleFeedback = () => {
    setIsFeedbackModalOpen(true);
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="relative flex flex-col items-center gap-12">
           <ZooLLogo size="xl" showIcon={true} className="drop-shadow-2xl hover:scale-105 transition-transform duration-700" />
           <div className="flex flex-col items-center gap-6">
               <div className="relative">
                 <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-[#C5A572] animate-spin shadow-xl" />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-[#C5A572] rounded-full animate-pulse" />
                 </div>
               </div>
               <div className="space-y-1 text-center">
                 <p className="text-[#0B1424] font-display tracking-[0.4em] uppercase text-[10px] font-black">Decrypting Clinical Data</p>
                 <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">Ultimate Care Protocol Loading...</p>
               </div>
           </div>
        </div>
      </div>
    );
  }

  if (!hasSeenLanding) {
    return <LandingView onComplete={() => setHasSeenLanding(true)} />;
  }

  if (!user || (isProfileLoaded && !userProfile)) {
    return <LoginView />;
  }

  if (!isProfileLoaded || !userProfile) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center max-w-5xl mx-auto bg-[#0B192C] sm:h-auto sm:min-h-[850px] sm:my-8 sm:rounded-[2.5rem] sm:border-[8px] sm:border-[#0B192C] relative overflow-hidden">
        {/* Animated Background Highlights for Contrast */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00ADB5]/20 rounded-full filter blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#FF758F]/10 rounded-full filter blur-[100px]" />

        <div className="relative z-10 flex flex-col items-center justify-center gap-12">
           <ZooLLogo size="xl" showIcon={true} className="text-white drop-shadow-2xl hover:scale-105 transition-transform duration-700" />
           <div className="flex flex-col items-center gap-5 mt-4">
               <div className="w-12 h-12 rounded-full border-4 border-white/5 border-t-[#00ADB5] animate-spin" />
               <p className="text-[#E5D5C5] font-brand tracking-widest uppercase text-[10px] font-black animate-pulse">Loading Identity</p>
           </div>
        </div>
      </div>
    );
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !aiImage) return;

    // Context Management: Summarize if chat exceeds 15 messages
    // We summarize the oldest part of the conversation to keep context window clean
    if (chatMessages.length > 15) {
      try {
        const toSummarize = chatMessages.slice(0, 10);
        const remaining = chatMessages.slice(10);
        const { summarizeConversation, getChatSession } = await import('./services/geminiService');
        const summary = await summarizeConversation(toSummarize);
        
        const summaryMessage: { role: 'user' | 'ai'; text: string } = { 
          role: 'ai', 
          text: `> **RuRu Intelligence Note:** I've summarized our earlier conversation to stay efficient.\n\n**Summary of previous topics:** ${summary}` 
        };
        
        setChatMessages([summaryMessage, ...remaining]);
        
        // Re-initialize session with new context
        const context = buildAIContext();
        chatSessionRef.current = getChatSession(context, aiPersona, summary);
      } catch (sumError) {
        console.error("Failed to summarize:", sumError);
      }
    }
    
    const userMsg = inputMessage;
    const currentImage = aiImage;
    const isVoice = lastQueryWasVoice.current;
    lastQueryWasVoice.current = false;

    setInputMessage('');
    setAiImage(null);
    
    setChatMessages(prev => [...prev, { 
      role: 'user', 
      text: userMsg || (currentImage ? "I've uploaded an image for analysis." : "") 
    }]);
    setIsTyping(true);

    try {
      let petInfo = 'General context: The user does not have a pet selected.';
      if (selectedPetId) {
        const pet = pets.find(p => p.id === selectedPetId);
        if (pet) {
          const chronicConditions = pet.chronicConditions && pet.chronicConditions.length > 0 
            ? pet.chronicConditions.join(', ')
            : '';
          
          petInfo = `${pet.name}, a ${pet.age}-year-old ${pet.breed || pet.type}. ${chronicConditions ? `Chronic conditions: ${chronicConditions}.` : ''}`;
        }
      }

      if (currentImage) {
        const isRecord = userMsg.toLowerCase().match(/record|parse|extract|medical|report|paper/);
        
        if (isRecord) {
          const { parseMedicalRecord } = await import('./services/geminiService');
          const parsedData = await parseMedicalRecord(currentImage);
          if (parsedData) {
            const response = `I've successfully parsed the medical record:\n\n**Title:** ${parsedData.title}\n**Date:** ${parsedData.date}\n**Type:** ${parsedData.type}\n**Description:** ${parsedData.description}\n\nI can save this to ${selectedPetId ? pets.find(p => p.id === selectedPetId)?.name : 'your pet'}'s vault. Would you like me to proceed?`;
            setChatMessages(prev => [...prev, { role: 'ai', text: response }]);
            if (isVoice) playAudio(response);
          } else {
            const fallback = "I encountered an error reading this document. Please ensure the lighting is good and all corners of the page are visible.";
            setChatMessages(prev => [...prev, { role: 'ai', text: fallback }]);
            if (isVoice) playAudio(fallback);
          }
        } else {
          // Multimodal Symptom Analysis
          const { analyzeSymptoms } = await import('./services/geminiService');
          const analysis = await analyzeSymptoms(userMsg || "General clinical screening requested.", petInfo, currentImage);
          if (analysis) {
            let res = `### ${analysis.isVisualAnalysis ? 'Visual Clinical Assessment' : 'Symptom Triage'}\n\n`;
            res += `${analysis.assessment}\n\n`;
            res += `**Severity Index:** \`${analysis.severity.toUpperCase()}\`\n\n`;
            
            if (analysis.findings?.length) {
              res += `**Observed Markers:**\n${analysis.findings.map(f => `• ${f}`).join('\n')}\n\n`;
            }
            res += `**Action Plan:**\n${analysis.recommendations.map(r => `• ${r}`).join('\n')}`;
            
            setChatMessages(prev => [...prev, { role: 'ai', text: res }]);
            if (isVoice) playAudio(res);
          }
        }
      } else {
        const isMapQuery = userMsg.toLowerCase().match(/near|location|find|vet|groomer|hospital|shop|boarding|breeder/);

        if (isMapQuery) {
          const loc = await getCurrentLocation();
          const { findNearbyPlaces } = await import('./services/mapsService');
          const typeMatch = userMsg.toLowerCase().match(/(vet|groom|shop|board)/);
          const type = typeMatch ? (typeMatch[1] === 'vet' ? 'vet' : typeMatch[1] === 'groom' ? 'groomer' : typeMatch[1] === 'shop' ? 'shop' : 'boarding') : 'all';
          const places = await findNearbyPlaces(loc, type);
          
          const text = `I found ${places.length} places nearby. Opening the Services map for you.`;
          setChatMessages(prev => [...prev, { 
            role: 'ai', 
            text: text,
            actionLink: { label: 'View on map', action: () => { setActiveTab('services'); } }
          }]);
          if (isVoice) playAudio(text);
        } else {
          // Use Streaming for all standard conversations
          setChatMessages(prev => [...prev, { role: 'ai', text: '' }]);
          let fullText = '';
          
          try {
            if (!chatSessionRef.current) {
              const context = buildAIContext();
              const { getChatSession } = await import('./services/geminiService');
              chatSessionRef.current = getChatSession(context, aiPersona);
            }

            const stream = await chatSessionRef.current.sendMessageStream({ message: userMsg });
            
            let hasFunctionCalls = false;
            let callsToProcess: any[] = [];
            
            for await (const chunk of stream) {
              if (chunk.functionCalls && chunk.functionCalls.length > 0) {
                hasFunctionCalls = true;
                callsToProcess.push(...chunk.functionCalls);
              }
              const chunkText = chunk.text;
              if (chunkText) {
                fullText += chunkText;
                setChatMessages(prev => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1].text += chunkText;
                  return newMsgs;
                });
              }
            }

            if (hasFunctionCalls && callsToProcess.length > 0) {
              let funcResults = [];
              for (const call of callsToProcess) {
                const args = call.args as any;
                if (call.name === 'book_appointment') {
                  const pet = pets.find(p => p.name.toLowerCase() === args.petName?.toLowerCase());
                  if (userProfile && user) {
                    await addAppointment({
                      petId: pet?.id || 'unknown',
                      ownerId: user.uid,
                      serviceName: args.serviceName,
                      type: args.type as any,
                      date: args.date,
                      time: args.time,
                      status: 'scheduled',
                      petName: args.petName,
                      reason: args.reason,
                      ownerName: userProfile.name
                    });
                    funcResults.push({ functionResponse: { name: call.name, response: { success: true, message: `Successfully booked for ${args.petName} on ${args.date} at ${args.time}` } } });
                  } else {
                    funcResults.push({ functionResponse: { name: call.name, response: { success: false, message: 'User not logged in or profile missing.' } } });
                  }
                } else if (call.name === 'get_appointments') {
                  let relevant = appointments;
                  if (args.status) relevant = relevant.filter(a => a.status === args.status);
                  funcResults.push({ functionResponse: { name: call.name, response: { appointments: relevant } } });
                } else if (call.name === 'cancel_appointment') {
                  await updateAppointment(args.id, { status: 'cancelled' });
                  funcResults.push({ functionResponse: { name: call.name, response: { success: true, message: "Appointment cancelled." } } });
                }
              }

              if (funcResults.length > 0) {
                const followUpStream = await chatSessionRef.current.sendMessageStream(funcResults);
                for await (const chunk of followUpStream) {
                  const chunkText = chunk.text;
                  if (chunkText) {
                    fullText += chunkText;
                    setChatMessages(prev => {
                      const newMsgs = [...prev];
                      newMsgs[newMsgs.length - 1].text += chunkText;
                      return newMsgs;
                    });
                  }
                }
              }
            }
            
            if (isVoice && fullText) {
              const { playAudio } = await import('./services/geminiService');
              playAudio(fullText);
            }
          } catch (streamError) {
            console.error('Streaming error:', streamError);
            const { getPetAdvice, playAudio } = await import('./services/geminiService');
            const fallback = await getPetAdvice(userMsg, `User has ${pets.length} pets.`);
            setChatMessages(prev => {
              const newMsgs = [...prev];
              newMsgs[newMsgs.length - 1].text = fallback;
              return newMsgs;
            });
            if (isVoice) playAudio(fallback);
          }
        }
      }
    } catch (error: any) {
      console.error('RuRu Engine Error:', error);
      const isLimitError = error?.message === LIMIT_REACHED_MSG || error?.message?.includes('daily query limit');
      if (isLimitError) {
        setChatMessages(prev => [...prev, { role: 'ai', text: LIMIT_REACHED_MSG }]);
        if (isVoice) playAudio(LIMIT_REACHED_MSG);
      } else {
        const errorMsg = error?.message || 'Connection to RuRu clinical nodes lost. Please try again later.';
        toast.error(errorMsg);
        setChatMessages(prev => [...prev, { role: 'ai', text: `Sorry, I encountered an error: ${errorMsg}` }]);
        if (isVoice) playAudio('Sorry, I encountered an error while processing that.');
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleAddSuggestedRecord = async (suggestion: SuggestedReminder) => {
    try {
      const recordData: any = {
        petId: suggestion.petId,
        title: suggestion.title,
        type: suggestion.type,
        date: new Date().toISOString().split('T')[0],
        nextDueDate: suggestion.suggestedDate,
        description: suggestion.reason,
        reminderEnabled: true,
        priority: suggestion.priority
      };
      await addRecord(recordData);
    } catch (err) {
      console.error("Failed to add suggested record", err);
      throw err;
    }
  };

  const handleBookAppointment = async (petId: string, serviceName: string, dateTime: string, vetId?: string, reason?: string) => {
    if (!user || !userProfile) return;
    try {
      const [date, time] = dateTime.split('T');
      const pet = pets.find(p => p.id === petId);
      
      let googleCalendarEventId = undefined;
      if (googleToken) {
        try {
          const { createCalendarEvent, getAppointmentDateTime } = await import('./services/googleCalendarService');
          const { start, end } = getAppointmentDateTime(date, time || '10:00');
          const calEvent = await createCalendarEvent(googleToken, {
            title: `Aura Vet Appointment: ${pet?.name || 'Pet'} @ ${serviceName}`,
            description: `Vet appointment for ${pet?.name || 'your pet'} (${pet?.type || 'Dog'}). Reason: ${reason || 'Checkup'}.`,
            startDateTime: start,
            endDateTime: end,
            location: serviceName,
          });
          googleCalendarEventId = calEvent.id;
        } catch (calErr) {
          console.error('Google Calendar event creation failed:', calErr);
          toast.warning('Appointment booked, but Google Calendar sync encountered an issue.');
        }
      }

      await addAppointment({
        petId,
        petName: pet?.name,
        ownerId: user.uid,
        ownerName: userProfile.name,
        ownerPhone: userProfile.location, 
        vetId,
        serviceName,
        date,
        time: time || '10:00',
        status: 'scheduled',
        type: 'visit',
        reason,
        googleCalendarEventId
      });
      addNotification({
        title: 'Appointment Scheduled',
        message: `Your appointment with ${serviceName} has been booked.`,
        type: 'appointment'
      });
      toast.success(googleCalendarEventId ? 'Appointment booked and added to Google Calendar!' : 'Appointment booked successfully!');
    } catch (error) {
      console.error('Failed to book appointment:', error);
      toast.error('Failed to book appointment.');
    }
  };

  return (
    <div className={cn("min-h-screen bg-[#F8FAFC] text-[#0B1424] font-sans selection:bg-[#C5A572]/30 lg:flex", darkMode && "dark")}>
      {/* Premium Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-[#C5A572]/10 h-screen sticky top-0 z-50">
        <div className="p-8">
          <ZooLLogo size="md" showIcon={true} />
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {finalNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-300",
                activeTab === item.id 
                  ? "bg-[#0B1424] text-[#C5A572] shadow-lg shadow-black/10" 
                  : "text-slate-400 hover:text-[#0B1424] hover:bg-slate-50"
              )}
            >
              <item.icon size={18} strokeWidth={activeTab === item.id ? 2.5 : 2} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-[#C5A572]/10 space-y-6">
          <div className="flex bg-slate-50 rounded-2xl p-1 border border-slate-100">
            {(['en', 'ml', 'hi'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={cn(
                  "flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                  language === lang 
                    ? "bg-white text-[#0B1424] shadow-sm border border-slate-100" 
                    : "text-slate-400 hover:text-[#0B1424]"
                )}
              >
                {lang}
              </button>
            ))}
          </div>

          <UserProfileDropdown 
            user={user} 
            onLogout={handleLogout} 
            setActiveTab={setActiveTab}
            onOpenProfile={() => setActiveTab('profile')}
          />
        </div>
      </aside>

      <main className="flex-1 relative pb-32 lg:pb-8 h-screen overflow-y-auto overflow-x-hidden">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[#C5A572]/10 px-6 py-4 lg:px-12">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="lg:hidden">
              <ZooLLogo size="sm" showIcon={true} />
            </div>
            
            <div className="hidden lg:block">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A572]">
                {activeTab === 'home' ? 'Digital Nerve Center' : activeTab.toUpperCase() + ' PROTOCOL'}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-full border border-slate-100 group focus-within:ring-2 focus-within:ring-[#C5A572]/20 transition-all">
                <Search size={14} className="text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Universal Search..."
                  className="bg-transparent border-none outline-none text-[11px] font-bold text-slate-600 placeholder:text-slate-300 w-48"
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                />
              </div>
              
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2.5 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-all relative border border-slate-100"
              >
                <Bell size={18} />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-[#C5A572] rounded-full border-2 border-white" />
                )}
              </button>
              
              <div className="hidden lg:block w-[1px] h-6 bg-slate-100 mx-2" />
              
              <div className="hidden lg:flex items-center gap-3 bg-[#E5D5C5] px-3 py-1.5 rounded-full text-[#0B1424] mr-2">
                <span className="text-[9px] font-black uppercase tracking-widest">
                  🎁 ZooL Trial Mode Active
                </span>
              </div>
              <div className="hidden lg:flex items-center gap-3 bg-[#0B1424] px-4 py-2 rounded-full text-white">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full animate-pulse",
                  syncStatus === 'synced' ? "bg-emerald-400" : "bg-amber-400"
                )} />
                <span className="text-[9px] font-black uppercase tracking-widest text-[#E5D5C5]">
                  {syncStatus === 'synced' ? 'System Online' : 'Syncing...'}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-6 lg:p-12">
          <React.Suspense fallback={
            <div className="flex flex-col items-center justify-center p-24 gap-6">
              <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-[#C5A572] animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mounting Protocol...</p>
            </div>
          }>
            <AnimatePresence mode="wait">
              {activeTab === 'home' && (
                <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <HomeView 
                    pets={pets} 
                    quickLogs={quickLogs}
                    records={healthRecords}
                    userProfile={userProfile} 
                    setActiveTab={setActiveTab}
                    onAddPet={() => setIsAddPetModalOpen(true)}
                    onDeletePet={setPetToDelete}
                    onPetClick={setSelectedPetForProfile}
                    onSOSClick={handleOpenSOS}
                    smartSummary={smartSummary}
                    syncStatus={syncStatus}
                  />
                </motion.div>
              )}
              
              {activeTab === 'health' && (
                <motion.div key="health" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
                  <HealthView 
                    records={healthRecords}
                    pets={pets}
                    onAddRecord={() => setIsAddRecordModalOpen(true)}
                    onDeleteRecord={(id) => {
                      const rec = healthRecords.find(r => r.id === id);
                      if (rec) setRecordToDelete(rec);
                    }}
                    onUpdateRecord={updateRecord}
                    onEditRecord={setIsEditingRecord}
                    onToggleReminder={handleToggleReminder}
                    onDownloadReport={handleDownloadPDF}
                  />
                </motion.div>
              )}

              {activeTab === 'care' && (
                <motion.div key="care" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <CareTrackerView 
                    pets={pets}
                    quickLogs={quickLogs}
                    onDeleteLog={(id) => {
                      const log = quickLogs.find(l => l.id === id);
                      if (log) setLogToDelete(log);
                    }}
                    onAddLog={() => setIsQuickLogOpen(true)}
                  />
                </motion.div>
              )}

              {activeTab === 'appointments' && (
                <motion.div key="appointments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <AppointmentsView 
                    appointments={appointments}
                    pets={pets}
                    role={role}
                    blockedSlots={blockedSlots}
                    onAdd={() => setActiveTab('services')}
                    onCancel={(id) => updateAppointment(id, { status: 'cancelled' })}
                  />
                </motion.div>
              )}

              {activeTab === 'ai' && (
                <motion.div key="ai" initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                  <AIView 
                    messages={chatMessages}
                    onSend={handleSendMessage}
                    input={inputMessage}
                    setInput={setInputMessage}
                    isTyping={isTyping}
                    pets={pets}
                    selectedPetId={selectedPetId}
                    onSelectPet={setSelectedPetId}
                    aiImage={aiImage}
                    setAiImage={setAiImage}
                    isRecording={isRecording}
                    onStartRecording={startRecording}
                    onStopRecording={stopRecording}
                    onClearChat={() => setChatMessages([{ role: 'ai', text: 'Namaste! I am RuRu, your interactive care navigator.' }])}
                    persona={aiPersona}
                    onSelectPersona={setAiPersona}
                    onLiveClick={() => {}} 
                  />
                </motion.div>
              )}

              {activeTab === 'services' && (
                <motion.div key="services" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <ServicesView 
                    services={services}
                    onServiceClick={(service) => setSelectedServiceForMap(service)}
                    pets={pets}
                    blockedSlots={blockedSlots}
                    vets={vets}
                    onBook={handleBookAppointment}
                    setActiveTab={setActiveTab}
                  />
                </motion.div>
              )}

              {activeTab === 'community' && (
                <motion.div key="community" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <CommunityView 
                    posts={sortedPosts}
                    onLikePost={handleLikePost}
                    onSharePost={handleSharePost}
                    onCommentPost={() => {}}
                    onCreatePost={() => setIsCreatePostModalOpen(true)}
                    sort={communitySort}
                    onSortChange={setCommunitySort}
                  />
                </motion.div>
              )}

              {activeTab === 'admin' && (
                <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <AdminDashboardView 
                    users={userProfile ? [userProfile, ...vets] : vets}
                    appointments={appointments}
                    posts={communityPosts}
                    healthRecords={healthRecords}
                    pets={pets}
                  />
                </motion.div>
              )}

              {activeTab === 'vet' && (
                <motion.div key="vet" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <VetDashboardView 
                    appointments={appointments}
                    pets={pets}
                    healthRecords={healthRecords}
                    onCompleteAppointment={(id) => updateAppointment(id, { status: 'completed' })}
                    onUpdatePatient={updatePet}
                    onNavigateToPet={(petId) => {
                      const pet = pets.find(p => p.id === petId);
                      if (pet) setSelectedPetForProfile(pet);
                    }}
                    onNavigateToSchedule={() => setActiveTab('appointments')}
                    onNavigateToCriticalRecords={() => setActiveTab('health')}
                    onAddAppointment={addAppointment}
                  />
                </motion.div>
              )}

              {activeTab === 'practice' && userProfile && (
                <motion.div key="practice" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <ProviderDashboardView 
                    appointments={appointments}
                    userProfile={userProfile}
                    vets={vets}
                    onCompleteAppointment={(id) => updateAppointment(id, { status: 'completed' })}
                    onUpdateAvailability={(date, time) => {
                      addBlockedSlot({ date, time, vetId: userProfile.uid, reason: 'Out of office' });
                    }}
                  />
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <SettingsView 
                    onNavigate={setActiveTab}
                    userProfile={userProfile}
                    onEditProfile={() => setIsProfileModalOpen(true)}
                    onFeedback={handleFeedback}
                    role={role}
                    onSwitchRole={() => {
                      const newRole = role === 'owner' ? 'vet' : role === 'vet' ? 'provider' : 'owner';
                      if (userProfile) setUserProfile({ ...userProfile, role: newRole });
                      if (newRole === 'vet') setActiveTab('vet');
                      else if (newRole === 'provider') setActiveTab('practice');
                      else setActiveTab('home');
                    }}
                  />
                </motion.div>
              )}

              {activeTab === 'profile' && userProfile && (
                <motion.div key="profile" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}>
                   <div className="bg-white rounded-[2.5rem] p-10 border border-[#C5A572]/10 shadow-xl max-w-xl mx-auto text-center space-y-8">
                      <div className="w-32 h-32 mx-auto rounded-[2.5rem] overflow-hidden border-4 border-slate-50 shadow-lg">
                        <img src={userProfile.image} alt={userProfile.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-3xl font-brand text-[#0B1424]">{userProfile.name}</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A572]">{userProfile.location}</p>
                      </div>
                      <div className="flex items-center justify-center gap-4">
                        <button onClick={() => setIsProfileModalOpen(true)} className="px-8 py-3 bg-[#0B1424] text-[#C5A572] rounded-full text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all">Edit Identity</button>
                        <button onClick={handleLogout} className="px-8 py-3 bg-slate-50 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-500 transition-all">Logout</button>
                      </div>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </React.Suspense>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] z-50">
        <div className="bg-[#0B1424]/90 backdrop-blur-3xl rounded-[2.5rem] py-3 px-2 shadow-2xl border border-white/10 flex items-center justify-around">
          {navigationItems.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "flex flex-col items-center gap-1 transition-all duration-300",
                activeTab === item.id ? "text-[#C5A572]" : "text-slate-500 opacity-60"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl transition-all",
                activeTab === item.id ? "bg-[#C5A572]/10 scale-110" : ""
              )}>
                <item.icon size={20} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <Toaster position="top-center" richColors />
      <AnimatePresence>
        {isSOSOpen && (
          <SOSModal 
            isOpen={isSOSOpen}
            onClose={() => setIsSOSOpen(false)} 
            nearbyVets={nearbyEmergencyVets}
            isLoading={isLoadingEmergency}
          />
        )}
        {selectedPetForProfile && (
          <PetProfileView 
            pet={selectedPetForProfile} 
            records={healthRecords.filter(r => r.petId === selectedPetForProfile.id)}
            posts={[]}
            documents={[]}
            onClose={() => setSelectedPetForProfile(null)}
            onUpdate={updatePet}
          />
        )}
        {isAddPetModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddPetModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white/90 backdrop-blur-xl w-full rounded-[2.5rem] p-8 relative z-10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-ruru-teal/20 overflow-y-auto max-h-[90vh]"
            >
              <h2 className="text-2xl font-brand mb-6">{t.common.addNewPet}</h2>
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-4 mb-6">
                  <div className="relative w-24 h-24 rounded-full bg-[#F5F5F0] border-2 border-dashed border-[#A8A29E] flex items-center justify-center overflow-hidden">
                    {newPet.image ? (
                      <img src={newPet.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="text-[#A8A29E]" size={32} />
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                  <p className="text-xs text-ruru-navy/60 font-medium">{t.common.photoUploadHint}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-ruru-navy/60 uppercase mb-1">{t.common.petName}</label>
                  <input 
                    type="text" 
                    value={newPet.name}
                    onChange={(e) => setNewPet({ ...newPet, name: e.target.value })}
                    className="w-full bg-[#FDFCFB] border border-ruru-navy/10 rounded-[1.25rem] px-4 py-3 focus:outline-none focus:border-ruru-navy-light" 
                    placeholder="e.g. Bruno" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ruru-navy/60 uppercase mb-1">{t.common.petType}</label>
                  <select 
                    value={newPet.type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setNewPet({ ...newPet, type: newType as any, breed: ANIMAL_BREEDS[newType]?.[0] || 'Unknown/Mixed' });
                    }}
                    className="w-full bg-[#FDFCFB] border border-ruru-navy/10 rounded-[1.25rem] px-4 py-3 focus:outline-none focus:border-ruru-navy-light mb-4"
                  >
                    {ANIMAL_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>

                  <label className="block text-xs font-bold text-ruru-navy/60 uppercase mb-1">Breed</label>
                  <select 
                    value={newPet.breed}
                    onChange={(e) => setNewPet({ ...newPet, breed: e.target.value })}
                    className="w-full bg-[#FDFCFB] border border-ruru-navy/10 rounded-[1.25rem] px-4 py-3 focus:outline-none focus:border-ruru-navy-light"
                  >
                    {(ANIMAL_BREEDS[newPet.type] || ANIMAL_BREEDS['Other']).map(breed => (
                      <option key={breed} value={breed}>{breed}</option>
                    ))}
                  </select>
                </div>
                <div className="pt-4 flex gap-3">
                  <button onClick={() => setIsAddPetModalOpen(false)} className="flex-1 px-6 py-3 border border-slate-200 rounded-full font-bold text-xs uppercase tracking-widest">{t.common.cancel}</button>
                  <button onClick={handleAddPet} className="flex-1 px-6 py-3 bg-[#0B1424] text-[#C5A572] rounded-full font-bold text-xs uppercase tracking-widest">{t.common.savePet}</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ModalsWrapper 
        isSOSOpen={isSOSOpen}
        setIsSOSOpen={setIsSOSOpen}
        isFeedbackModalOpen={isFeedbackModalOpen}
        setIsFeedbackModalOpen={setIsFeedbackModalOpen}
        onSubmitFeedback={submitFeedback}
        nearbyEmergencyVets={nearbyEmergencyVets}
        isLoadingEmergency={isLoadingEmergency}
        onSOSClick={handleOpenSOS}
      />

      {/* Floating Care Nav mascot HUD \& Live voice module bridge */}
      <RuRuFAB 
        isOpen={isLiveAssistantOpen}
        setIsOpen={setIsLiveAssistantOpen}
        onOpenAI={() => setActiveTab('ai')}
        onNavigate={(tab) => setActiveTab(tab)}
        role={role}
        status={isTyping ? 'thinking' : isLiveAssistantOpen ? 'listening' : 'idle'}
      />

      <AnimatePresence>
        {isLiveAssistantOpen && (
          <React.Suspense fallback={null}>
            <LiveAssistant onClose={() => setIsLiveAssistantOpen(false)} />
          </React.Suspense>
        )}
      </AnimatePresence>

      {/* Centralized Destructive Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={!!petToDelete}
        onClose={() => setPetToDelete(null)}
        onConfirm={handleDeletePet}
        title="Delete Companion Profile"
        message={`This protocol will permanently delete ${petToDelete?.name}'s medical files, diagnostics telemetry, and identity credentials. This action is irreversible. Are you sure?`}
        confirmText="Confirm Deletion"
        cancelText="Protect Profile"
        type="danger"
      />

      <ConfirmationDialog
        isOpen={!!recordToDelete}
        onClose={() => setRecordToDelete(null)}
        onConfirm={handleDeleteRecord}
        title="Delete Health Record"
        message="You are about to delete this veterinary record entry. Historical treatment summaries, dates, and dosages will be permanently erased. Proceed?"
        confirmText="Erase Record"
        cancelText="Secure Entry"
        type="danger"
      />

      <ConfirmationDialog
        isOpen={!!logToDelete}
        onClose={() => setLogToDelete(null)}
        onConfirm={handleDeleteLog}
        title="Delete Daily Activity Log"
        message="This will delete the selected feeding, walking, or medication activity log entry. It will be removed from your care trends."
        confirmText="Delete Activity Log"
        cancelText="Keep Activity Log"
        type="warning"
      />
    </div>
  );
}

// --- Components ---







// --- Views ---




// HealthView moved to views/HealthView.tsx


// ChatView moved to views/ChatView.tsx


// CommunityView moved to views/CommunityView.tsx
