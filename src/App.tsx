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
  CloudOff
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
import { TelehealthConsultation } from './components/TelehealthConsultation';
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
import { Service, Pet, HealthRecord, CommunityPost, QuickLog, UserProfile, Appointment, PetDocument, SuggestedReminder } from './types';
import { Toaster, toast } from 'sonner';
import Markdown from 'react-markdown';

import { translations, Language } from './lib/translations';

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
    syncStatus, setSyncStatus, lastSaved,
    addAppointment,
    blockedSlots, addBlockedSlot, deleteBlockedSlot,
    notifications,
    vets,
    users,
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
    notificationsEnabled
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
  const [activeTelehealthAppointment, setActiveTelehealthAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    if (syncStatus === 'synced') {
      setShowSavedStatus(true);
      const timer = setTimeout(() => setShowSavedStatus(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [syncStatus]);

  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus('synced');
    };
    const handleOffline = () => {
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSyncStatus('offline');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setSyncStatus]);

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
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
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
    if (user) {
      const cleanup = initializeCoreListeners(user.uid);
      return () => cleanup();
    }
  }, [user, initializeCoreListeners, role]);

  // Targeted Listener Synchronization for Lowest Cost Model
  useEffect(() => {
    if (user && activeTab === 'community') {
      return initializeCommunityListeners(user.uid);
    }
  }, [user, activeTab, initializeCommunityListeners]);

  useEffect(() => {
    if (user && (activeTab === 'health' || activeTab === 'symptoms' || activeTab === 'care')) {
      return initializeHealthListeners(user.uid);
    }
  }, [user, activeTab, initializeHealthListeners]);

  useEffect(() => {
    if (user && (activeTab === 'appointments' || activeTab === 'practice')) {
      return initializeAppointmentsListeners(user.uid);
    }
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

  const handleQuickLog = (type: QuickLog['type'], petId: string) => {
    const log = {
      petId,
      type,
      timestamp: new Date().toISOString()
    };
    addQuickLog(log);
    setIsQuickLogOpen(false);
  };

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
      <div className="min-h-screen flex flex-col max-w-md mx-auto bg-[#FDFCFB]">
        <header className="bg-white/95 backdrop-blur-3xl border-b border-ruru-navy/10 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <ZooLLogo size="lg" className="opacity-50 grayscale transition-all duration-700" />
          </div>
          <div className="w-8 h-8 bg-[#F0EBE6] rounded-full animate-pulse" />
        </header>
        <div className="p-6 space-y-8">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="w-48 h-8 bg-[#F0EBE6] rounded animate-pulse" />
              <div className="w-32 h-4 bg-[#F0EBE6] rounded animate-pulse" />
            </div>
            <div className="w-12 h-12 rounded-[1.5rem] bg-[#F0EBE6] animate-pulse" />
          </div>
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-20 h-20 rounded-full bg-[#F0EBE6] animate-pulse" />
                <div className="w-12 h-3 bg-[#F0EBE6] rounded animate-pulse" />
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="w-32 h-6 bg-[#F0EBE6] rounded animate-pulse" />
            {[1, 2].map(i => (
              <div key={i} className="w-full h-24 bg-[#F0EBE6] rounded-[2.5rem] animate-pulse" />
            ))}
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
      <div className="min-h-screen flex flex-col max-w-md mx-auto bg-[#FDFCFB]">
        <header className="bg-white/95 backdrop-blur-3xl border-b border-ruru-navy/10 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <ZooLLogo size="lg" className="opacity-50 grayscale transition-all duration-700" />
          </div>
          <div className="w-8 h-8 bg-[#F0EBE6] rounded-full animate-pulse" />
        </header>
        <div className="p-6 space-y-8">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="w-48 h-8 bg-[#F0EBE6] rounded animate-pulse" />
              <div className="w-32 h-4 bg-[#F0EBE6] rounded animate-pulse" />
            </div>
            <div className="w-12 h-12 rounded-[1.5rem] bg-[#F0EBE6] animate-pulse" />
          </div>
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-20 h-20 rounded-full bg-[#F0EBE6] animate-pulse" />
                <div className="w-12 h-3 bg-[#F0EBE6] rounded animate-pulse" />
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="w-32 h-6 bg-[#F0EBE6] rounded animate-pulse" />
            {[1, 2].map(i => (
              <div key={i} className="w-full h-24 bg-[#F0EBE6] rounded-[2.5rem] animate-pulse" />
            ))}
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
    <div className={cn(
      "min-h-[100dvh] flex flex-col max-w-md mx-auto bg-gradient-to-b from-white to-ruru-teal/5 sm:h-auto sm:min-h-[850px] sm:my-8 sm:rounded-[2.5rem] sm:border-[12px] sm:border-ruru-navy sm:shadow-2xl relative overflow-hidden",
      darkMode && "dark"
    )}>
      {/* Setup & Tours */}
      {userProfile && userProfile.onboardingComplete && <FeatureTour />}
      
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/90 backdrop-blur-2xl border-b border-ruru-teal/10 px-6 py-3 md:py-4 md:px-8 flex items-center justify-between sticky top-0 z-50 shadow-sm"
      >
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => setActiveTab('home')}
        >
          <ZooLLogo size="lg" className="drop-shadow-sm" />
        </div>

        {/* Search filtering for the services list based on user input. Display matching results dynamically. */}
        <div className="hidden md:flex flex-1 max-w-sm mx-4 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-[#A8A29E]" />
          </div>
          <input
            type="text"
            placeholder="Search services dynamically..."
            value={globalSearchQuery}
            onChange={(e) => {
              setGlobalSearchQuery(e.target.value);
              setActiveTab('services');
            }}
            className="w-full bg-white border border-ruru-teal/20 rounded-[2rem] pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ruru-teal/40 transition-shadow shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Sync Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[1.25rem] bg-white/50 border border-ruru-teal/10 shadow-sm backdrop-blur-md transition-all duration-300 hover:bg-white/80 cursor-pointer relative group mr-1 md:mr-3 select-none">
            <div className="relative flex items-center justify-center">
              <span className={cn(
                "absolute inline-flex h-2 w-2 rounded-full opacity-75",
                syncStatus === 'synced' ? "bg-ruru-teal animate-pulse" :
                syncStatus === 'syncing' ? "bg-amber-400 animate-ping" :
                "bg-rose-400 animate-ping"
              )} />
              <div className={cn(
                "relative inline-flex rounded-full h-1.5 w-1.5 transition-all duration-500",
                syncStatus === 'synced' ? "bg-ruru-teal shadow-[0_0_8px_rgba(52,181,199,0.6)]" :
                syncStatus === 'syncing' ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" :
                "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
              )} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider text-ruru-navy/70 whitespace-nowrap">
              {syncStatus === 'synced' ? t.system.cloudSecure : syncStatus === 'syncing' ? t.system.syncing : t.system.disconnected}
            </span>

            {/* Premium Dynamic Tooltip */}
            <div className="absolute top-full mt-2 right-0 hidden group-hover:block bg-ruru-navy text-white text-[9px] font-medium py-1.5 px-3 rounded-lg shadow-lg border border-white/10 w-44 text-center backdrop-blur-md z-50 pointer-events-none transition-all">
              {syncStatus === 'synced' ? 'All pet records fully updated & secure.' :
               syncStatus === 'syncing' ? 'Publishing logs to the neural cloud...' :
               'Offline mode. Local updates will sync on reconnect.'}
            </div>
          </div>

          {/* Quick Language Toggle */}
          <div className="flex bg-white rounded-[2rem] p-1 border border-ruru-teal/20 shadow-sm scale-90 md:scale-100 mr-2">
            {(['en', 'ml', 'hi'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={cn(
                  "px-3 py-1.5 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest transition-all",
                  language === lang 
                    ? "bg-ruru-navy text-white shadow-md" 
                    : "text-ruru-navy/50 hover:text-ruru-navy"
                )}
              >
                {lang}
              </button>
            ))}
          </div>

          {user?.email === 'auraaivet@gmail.com' && (
            <button 
              onClick={() => setActiveTab('admin')}
              className={cn(
                "w-10 h-10 rounded-[1.5rem] flex items-center justify-center transition-colors border",
                activeTab === 'admin' 
                  ? "bg-ruru-navy text-white border-transparent" 
                  : "bg-white text-ruru-navy border-ruru-navy/10 hover:bg-[#F5F5F0]"
              )}
              title="Owner Dashboard"
            >
              <ShieldAlert size={18} />
            </button>
          )}

          <div className="relative">
            <UserProfileDropdown 
              user={user} 
              onLogout={handleLogout} 
              setActiveTab={setActiveTab} 
              onOpenProfile={() => setIsProfileModalOpen(true)} 
            />
          </div>

          <div className="relative">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="w-10 h-10 rounded-[2rem] bg-white border border-ruru-pink/30 flex items-center justify-center text-ruru-navy relative hover:shadow-md transition-all shadow-sm"
              >
                <Bell size={20} />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-ruru-pink rounded-full border-2 border-white" />
                )}
              </motion.button>
              
              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-[60]" 
                      onClick={() => setIsNotificationsOpen(false)} 
                    />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-3xl rounded-[2rem] shadow-2xl border border-ruru-teal/20 z-[70] overflow-hidden"
                  >
                    <div className="p-4 border-b border-ruru-navy/5 flex items-center justify-between bg-ruru-teal/5">
                      <h3 className="font-brand font-bold text-ruru-navy">{t.notifications.title}</h3>
                      <button onClick={() => setIsNotificationsOpen(false)} className="p-1 hover:bg-ruru-teal/10 rounded-full transition-colors">
                        <X size={16} className="text-ruru-navy/60" />
                      </button>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-ruru-navy/60">
                          <BellOff size={32} className="mx-auto mb-2 opacity-20" />
                          <p className="text-sm">{t.notifications.none}</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {notifications.map(n => (
                            <div 
                              key={n.id} 
                              onClick={() => markNotificationRead(n.id)}
                              className={cn(
                                "p-4 border-b border-ruru-navy/10 transition-colors cursor-pointer",
                                n.read ? "opacity-60" : "bg-blue-50/20"
                              )}
                            >
                              <h4 className="font-bold text-sm text-ruru-navy-light">{n.title}</h4>
                              <p className="text-xs text-ruru-navy/60 mt-1">{n.message}</p>
                              <span className="text-[10px] text-[#A8A29E] mt-2 block">
                                {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.header>



      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <React.Suspense fallback={
          <div className="flex-1 flex items-center justify-center p-8">
             <div className="flex flex-col items-center gap-4">
               <div className="w-12 h-12 border-4 border-ruru-navy/10 border-t-ruru-navy-light rounded-full animate-spin" />
               <p className="text-ruru-navy/60 text-sm font-medium animate-pulse">{t.system.loadingView}</p>
             </div>
          </div>
        }>
          <AnimatePresence mode="wait">
            {role === 'owner' && activeTab === 'home' && (
              pets.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh]">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="w-24 h-24 bg-ruru-pink/10 rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border border-ruru-pink/20"
                  >
                    <Heart className="text-ruru-pink" size={36} />
                  </motion.div>
                  <motion.h2 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-3xl font-brand text-ruru-navy mb-3 tracking-tight"
                  >
                    Your Pet Care Journey Starts Here
                  </motion.h2>
                  <motion.p 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-ruru-navy/60 text-sm max-w-sm mx-auto mb-8 leading-relaxed"
                  >
                    We can't find any pets associated with your profile yet. Add your furry friend to unlock intelligent health tracking, AI assistance, and a world of specialized care!
                  </motion.p>
                  <motion.button 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsAddPetModalOpen(true)}
                    className="px-8 py-4 bg-ruru-navy text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-xl shadow-ruru-navy/20 transition-all border border-ruru-navy"
                  >
                    Add Your First Pet
                  </motion.button>
                </div>
              ) : (
                <HomeView 
                  pets={pets} 
                  quickLogs={quickLogs}
                  records={healthRecords}
                  userProfile={userProfile}
                  setActiveTab={setActiveTab} 
                  onAddPet={() => setIsAddPetModalOpen(true)} 
                  onDeletePet={(pet) => setPetToDelete(pet)}
                  onPetClick={(pet) => setSelectedPetForProfile(pet)}
                  onSOSClick={handleOpenSOS}
                  smartSummary={smartSummary}
                  onQuickAction={(type) => pets[0] && handleQuickLog(type as any, pets[0].id)}
                  onSearch={(query) => {
                    setGlobalSearchQuery(query);
                    setActiveTab('services');
                  }}
                  onAddSuggestedRecord={handleAddSuggestedRecord}
                  syncStatus={syncStatus}
                  showSavedStatus={showSavedStatus}
                />
              )
            )}
            {role === 'owner' && activeTab === 'care' && (
              <CareTrackerView 
                key="care-view"
                pets={pets}
                quickLogs={quickLogs}
                onAddLog={() => setIsAddRecordModalOpen(true)}
                onQuickLog={handleQuickLog}
                onDeleteLog={(id) => deleteQuickLog(id)}
              />
            )}
            {(role === 'owner' || role === 'vet') && activeTab === 'appointments' && (
              <AppointmentsView 
                key="appointments-view"
                appointments={appointments}
                pets={pets}
                role={role}
                blockedSlots={blockedSlots.filter(s => role === 'vet' ? s.vetId === user?.uid : true)}
                onAdd={() => setActiveTab('services')}
                onCancel={(id) => updateAppointment(id, { status: 'cancelled' })}
                onUpdateStatus={(id, status) => updateAppointment(id, { status })}
                onBlock={(slot) => addBlockedSlot({ ...slot, vetId: user?.uid || '' })}
                onUnblock={deleteBlockedSlot}
                googleToken={googleToken}
                onGoogleCalendarAuth={handleGoogleCalendarAuth}
                onUpdateAppointment={updateAppointment}
                onJoinTelehealth={setActiveTelehealthAppointment}
              />
            )}
            {role === 'owner' && activeTab === 'health' && (
              <HealthView 
                key="health-view"
                pets={pets} 
                records={healthRecords} 
                onAddRecord={() => setIsAddRecordModalOpen(true)}
                onEditRecord={(record) => setIsEditingRecord(record)}
                onDeleteRecord={(id) => deleteRecord(id)}
                onUpdateRecord={updateRecord}
                onToggleReminder={handleToggleReminder}
                onDownloadReport={handleDownloadPDF}
                onAddSuggestedRecord={handleAddSuggestedRecord}
              />
            )}
            {role === 'owner' && activeTab === 'community' && (
              <motion.div key="community-view" className="flex flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex justify-center gap-4 bg-[#FDFBF7] p-1.5 rounded-[1.5rem] w-full max-w-sm mx-auto mb-2 mt-4 border border-ruru-navy/10">
                  <button
                    onClick={() => setCommunitySort('recent')}
                    className={cn(
                      "flex-1 py-3 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all",
                      communitySort === 'recent' ? "bg-white/95 backdrop-blur-3xl text-ruru-navy shadow-xl" : "text-[#A8A29E] hover:text-ruru-navy"
                    )}
                  >
                    Recent
                  </button>
                  <button
                    onClick={() => setCommunitySort('popular')}
                    className={cn(
                      "flex-1 py-3 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all",
                      communitySort === 'popular' ? "bg-white/95 backdrop-blur-3xl text-ruru-navy shadow-xl" : "text-[#A8A29E] hover:text-ruru-navy"
                    )}
                  >
                    Popular
                  </button>
                </div>
                <CommunityView 
                  posts={sortedPosts} 
                  onCreatePost={() => setIsCreatePostModalOpen(true)}
                  onLikePost={likePost}
                  onCommentPost={(id) => console.log('Comment on', id)}
                  onSharePost={handleSharePost}
                  sort={communitySort}
                  onSortChange={setCommunitySort}
                />
              </motion.div>
            )}
            {role === 'owner' && activeTab === 'services' && (
              <motion.div key="services-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <ServicesView 
                  services={services} 
                  onServiceClick={(service) => setSelectedServiceForMap(service)}
                  pets={pets}
                  blockedSlots={blockedSlots}
                  vets={vets}
                  onBook={handleBookAppointment}
                  setActiveTab={setActiveTab}
                  initialSearchQuery={globalSearchQuery}
                />
              </motion.div>
            )}
            {activeTab === 'ai' && (
              <motion.div key="ai-view" className="flex flex-col h-full relative" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex justify-center gap-2 bg-[#FDFBF7] p-1.5 rounded-[1.5rem] mx-auto mt-4 z-10 border border-ruru-navy/10">
                  <button 
                    title="Doctor: Focuses on clinical health, symptoms, and medical triage."
                    onClick={() => {
                      setAiPersona('doctor');
                      setChatMessages(prev => [...prev, { role: 'ai', text: `Switched to **DOCTOR** mode. How can I assist with your pet's clinical health today?` }]);
                    }}
                    className={cn(
                      "px-4 py-2 rounded-[1.25rem] text-[9px] font-black uppercase tracking-widest transition-all",
                      aiPersona === 'doctor' ? "bg-white/95 backdrop-blur-3xl text-ruru-navy shadow-sm" : "text-[#A8A29E] hover:text-ruru-navy"
                    )}
                  >
                    🩺 Doctor
                  </button>
                  <button 
                    title="Nutritionist: Specializes in dietary plans, food allergies, and weight management."
                    onClick={() => {
                      setAiPersona('nutritionist');
                      setChatMessages(prev => [...prev, { role: 'ai', text: `Switched to **NUTRITIONIST** mode. How can I assist with your pet's diet today?` }]);
                    }}
                    className={cn(
                      "px-4 py-2 rounded-[1.25rem] text-[9px] font-black uppercase tracking-widest transition-all",
                      aiPersona === 'nutritionist' ? "bg-white/95 backdrop-blur-3xl text-ruru-navy shadow-sm" : "text-[#A8A29E] hover:text-ruru-navy"
                    )}
                  >
                    🥩 Nutritionist
                  </button>
                  <button 
                    title="Behaviorist: Helps with training, anxiety, and behavioral correction."
                    onClick={() => {
                      setAiPersona('behaviorist');
                      setChatMessages(prev => [...prev, { role: 'ai', text: `Switched to **BEHAVIORIST** mode. How can I assist with your pet's behavior today?` }]);
                    }}
                    className={cn(
                      "px-4 py-2 rounded-[1.25rem] text-[9px] font-black uppercase tracking-widest transition-all",
                      aiPersona === 'behaviorist' ? "bg-white/95 backdrop-blur-3xl text-ruru-navy shadow-sm" : "text-[#A8A29E] hover:text-ruru-navy"
                    )}
                  >
                    🧠 Behaviorist
                  </button>
                </div>
                <AIView 
                  messages={chatMessages} 
                  onSend={handleSendMessage} 
                  input={inputMessage} 
                  setInput={setInputMessage} 
                  isTyping={isTyping} 
                  pets={pets}
                  selectedPetId={selectedPetId}
                  onSelectPet={setSelectedPetId}
                  onLiveClick={() => setIsLiveAssistantOpen(true)}
                  aiImage={aiImage}
                  setAiImage={setAiImage}
                  isRecording={isRecording}
                  onStartRecording={startRecording}
                  onStopRecording={stopRecording}
                  persona={aiPersona}
                  onSelectPersona={(p) => setAiPersona(p)}
                  onClearChat={() => {
                    setChatMessages([{ role: 'ai', text: 'Namaste! I am ZooL AI. I can help you find vets, groomers, pet shops, boarding, and more. How can I help today?' }]);
                    import('./services/geminiService').then(({ getChatSession }) => {
                      const context = buildAIContext();
                      chatSessionRef.current = getChatSession(context, aiPersona);
                    });
                  }}
                />
                {aiLimitReached && (
                  <div className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-3xl pt-8 pb-12 px-8 z-[50] flex flex-col items-center justify-center border-t border-amber-200">
                    <AlertTriangle size={24} className="text-amber-500 mb-2" />
                    <h3 className="font-brand font-bold text-ruru-navy">Daily API Limit Reached</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#A8A29E] mt-1 text-center max-w-sm">{LIMIT_REACHED_MSG}</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'admin' && user?.email === 'auraaivet@gmail.com' && (
              <motion.div key="admin-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AdminDashboardView 
                  users={users} 
                  appointments={appointments} 
                  posts={communityPosts} 
                  healthRecords={healthRecords} 
                  pets={pets}
                />
              </motion.div>
            )}
            {activeTab === 'gov' && (
              <motion.div key="gov-view" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <GovernmentPortalsView 
                  pets={pets}
                  onESamrudhaSync={handleESamrudhaSync}
                  onApplyLicense={handleApplyLicense}
                  onBack={() => setActiveTab('settings')}
                />
              </motion.div>
            )}
            {activeTab === 'profile' && userProfile && (
              <motion.div 
                key="profile-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="px-6 py-10 max-w-xl mx-auto space-y-8"
              >
                <div className="bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-lg border border-ruru-teal/20 text-center space-y-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-ruru-teal/5 rounded-bl-[5rem] -mr-8 -mt-8" />
                  <div className="w-32 h-32 mx-auto rounded-[2.5rem] overflow-hidden p-1.5 bg-white/95 backdrop-blur-3xl shadow-xl relative z-10 border border-ruru-navy/10">
                    <img src={userProfile.image} alt={userProfile.name} className="w-full h-full object-cover rounded-[2rem]" />
                  </div>
                  <div className="space-y-2 relative z-10">
                    <h3 className="text-3xl font-brand text-ruru-navy tracking-tight">{userProfile.name}</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-ruru-navy/60">Member since {userProfile.createdAt ? new Date(userProfile.createdAt).getFullYear() : new Date().getFullYear()}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 relative z-10">
                    <span className="px-4 py-1.5 bg-ruru-teal/10 text-ruru-navy text-[10px] font-black uppercase tracking-widest rounded-full border border-ruru-teal/30">Verified {role?.toUpperCase() || 'OWNER'}</span>
                    {role === 'owner' && (
                      <span className="px-4 py-1.5 bg-ruru-pink/10 text-ruru-navy text-[10px] font-black uppercase tracking-widest rounded-full border border-ruru-pink/30">{pets.length} Pets Linked</span>
                    )}
                  </div>
                  <div className="pt-8 grid grid-cols-2 gap-4">
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsProfileModalOpen(true)}
                      className="flex items-center justify-center py-4 bg-ruru-navy text-white rounded-[2rem] font-bold gap-2 shadow-xl shadow-ruru-navy/20 transition-all border border-ruru-navy"
                    >
                      <Edit2 size={18} /> Edit Profile
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveTab('settings')}
                      className="flex items-center justify-center py-4 bg-white/50 text-ruru-navy border border-ruru-teal/20 rounded-[2rem] font-bold gap-2 hover:bg-ruru-teal/5 transition-all shadow-sm"
                    >
                      <Settings size={18} /> Settings
                    </motion.button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <motion.div whileHover={{ y: -5 }} className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-6 text-center space-y-2 shadow-sm border border-ruru-teal/10">
                    <p className="text-[9px] font-black text-ruru-navy/60 uppercase tracking-[0.2em]">{role === 'owner' ? 'RuRu Score' : 'Rating'}</p>
                    <p className="text-3xl font-brand text-ruru-navy">{role === 'owner' ? '98' : '4.9'}</p>
                  </motion.div>
                  <motion.div whileHover={{ y: -5 }} className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-6 text-center space-y-2 shadow-sm border border-ruru-teal/10">
                    <p className="text-[9px] font-black text-ruru-navy/60 uppercase tracking-[0.2em]">{role === 'owner' ? 'XP Hub' : 'Clients'}</p>
                    <p className="text-3xl font-brand text-ruru-navy">{role === 'owner' ? '1.2k' : '342'}</p>
                  </motion.div>
                  <motion.div whileHover={{ y: -5 }} className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-6 text-center space-y-2 shadow-sm border border-ruru-teal/10">
                    <p className="text-[9px] font-black text-ruru-navy/60 uppercase tracking-[0.2em]">{role === 'owner' ? 'Level' : 'Years Expr'}</p>
                    <p className="text-3xl font-brand text-ruru-navy">{role === 'owner' ? '12' : '8'}</p>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {role === 'owner' && activeTab === 'symptoms' && (
              <motion.div key="symptoms-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {aiLimitReached ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
                    <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                      <AlertTriangle size={32} />
                    </div>
                    <h2 className="text-2xl font-brand text-ruru-navy mb-4">AI Limit Reached</h2>
                    <p className="text-sm font-medium text-slate-500 max-w-md">{LIMIT_REACHED_MSG}</p>
                  </div>
                ) : (
                  <SymptomChecker />
                )}
              </motion.div>
            )}
            {role === 'vet' && activeTab === 'vet' && (
              <motion.div key="vet-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
                  onNavigateToCriticalRecords={() => toast.info('Navigating to Critical Records...')}                
                  onAddAppointment={addAppointment}
                  onJoinTelehealth={setActiveTelehealthAppointment}
                />
              </motion.div>
            )}
            {role === 'provider' && activeTab === 'practice' && (
              <motion.div key="provider-practice" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ProviderDashboardView 
                  appointments={appointments} 
                  userProfile={userProfile!}
                  vets={vets}
                  onCompleteAppointment={(id) => updateAppointment(id, { status: 'completed' })}
                  onUpdateAvailability={(date, time) => addBlockedSlot({ date, time, vetId: user?.uid || '' })}
                />
              </motion.div>
            )}
            {(role === 'provider' || role === 'vet') && activeTab === 'appointments' && (
              <motion.div key="provider-appointments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AppointmentsView 
                  appointments={appointments}
                  pets={pets}
                  role="vet" 
                  blockedSlots={blockedSlots.filter(s => s.vetId === user?.uid)}
                  onAdd={() => {}}
                  onCancel={(id) => updateAppointment(id, { status: 'cancelled' })}
                  onUpdateStatus={(id, status) => updateAppointment(id, { status })}
                  onBlock={(slot) => addBlockedSlot({ ...slot, vetId: user?.uid || '' })}
                  onUnblock={deleteBlockedSlot}
                  googleToken={googleToken}
                  onGoogleCalendarAuth={handleGoogleCalendarAuth}
                  onUpdateAppointment={updateAppointment}
                  onJoinTelehealth={setActiveTelehealthAppointment}
                />
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div key="settings-view" className="flex flex-col space-y-8 max-w-lg mx-auto py-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <SettingsView 
                  userProfile={userProfile} 
                  onEditProfile={() => setIsProfileModalOpen(true)}
                  onFeedback={handleFeedback}
                  role={role}
        onSwitchRole={() => {
          const newRole = role === 'owner' ? 'vet' : role === 'vet' ? 'provider' : 'owner';
          if (userProfile) {
            setUserProfile({ ...userProfile, role: newRole });
          }
          if (newRole === 'vet') setActiveTab('vet');
          else if (newRole === 'provider') setActiveTab('practice');
          else setActiveTab('home');
        }}
                  onNavigate={setActiveTab}
                />
                
                {/* Task Priority List Added per Requirements */}
                <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-xl border border-ruru-teal/10 mb-8">
                  <h3 className="text-ruru-navy font-brand text-xl mb-6">Owner Tasks & Priorities</h3>
                  <div className="space-y-4">
                    {tasks.length === 0 && <p className="text-sm text-ruru-navy/60 mb-4">No tasks found. Create a new task to manage priorities.</p>}
                    {tasks.map(task => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={task.id} 
                        className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-white/90 backdrop-blur-md rounded-[2rem] border border-ruru-teal/20 shadow-sm"
                      >
                        <span className="font-bold text-sm text-ruru-navy">{task.title}</span>
                        <div className="flex gap-2">
                          {['Low', 'Medium', 'High'].map(p => (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              key={p}
                              className={cn("px-4 py-1.5 text-[10px] uppercase font-black tracking-widest rounded-[1.5rem] transition-all border", task.priority === p ? (p === 'High' ? "bg-ruru-pink text-white border-ruru-pink shadow-md" : "bg-ruru-navy text-white border-ruru-navy shadow-md") : "bg-white/90 text-ruru-navy/50 border-ruru-navy/10 hover:border-ruru-teal/30 hover:text-ruru-navy")}
                              onClick={() => setTasks(tasks.map(t => t.id === task.id ? { ...t, priority: p as any } : t))}
                            >
                              {p}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setTasks([...tasks, { id: Date.now().toString(), title: `New Task ${tasks.length + 1}` }])}
                      className="px-6 py-4 w-full bg-ruru-teal/10 text-ruru-navy rounded-[2rem] font-bold text-[11px] uppercase tracking-widest border border-ruru-teal/20 hover:bg-ruru-teal/20 transition-colors mt-2"
                    >
                      + Add Task
                    </motion.button>
                  </div>
                </div>

                <GoogleTasksCard 
                  googleToken={googleToken} 
                  onGoogleTasksAuth={handleGoogleTasksAuth} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </React.Suspense>
      </main>


      {/* Removed Redundant Quick Action FAB */}

      {/* Consistently Styled Floating UI Elements */}
      {role === 'owner' && (
        <>
          <RuRuFAB 
            role={role}
            onOpenAI={() => setActiveTab('ai')} 
            onNavigate={setActiveTab}
            isOpen={isLiveAssistantOpen}
            setIsOpen={setIsLiveAssistantOpen}
          />
        </>
      )}

      {/* Pet Profile Modal */}
      <AnimatePresence>
        {selectedPetForProfile && (
          <PetProfileView 
            pet={selectedPetForProfile} 
            records={healthRecords.filter(r => r.petId === selectedPetForProfile.id)}
            posts={communityPosts.filter(p => p.author === 'Ananthu')}
            documents={documents.filter(d => d.petId === selectedPetForProfile.id)}
            onClose={() => setSelectedPetForProfile(null)}
            onUpdate={updatePet}
          />
        )}
      </AnimatePresence>

      {/* Add Pet Modal */}
      <AnimatePresence>
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
                  <button onClick={() => setIsAddPetModalOpen(false)} className="flex-1 btn-secondary">{t.common.cancel}</button>
                  <button onClick={handleAddPet} className="flex-1 btn-primary">{t.common.savePet}</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Health Record Modal */}
      <AnimatePresence>
        {isEditingRecord && (
          <EditRecordModal 
            isOpen={!!isEditingRecord}
            onClose={() => setIsEditingRecord(null)}
            record={isEditingRecord}
            pets={pets}
            onSave={(updatedRecord) => updateRecord(isEditingRecord.id, updatedRecord)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isAddRecordModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddRecordModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white/90 backdrop-blur-xl w-full rounded-[2.5rem] p-8 relative z-10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-ruru-teal/20 overflow-y-auto max-h-[90vh]"
            >
              <h2 className="text-2xl font-brand mb-6">Add Health Record</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ruru-navy/60 uppercase mb-1">Pet</label>
                  <select 
                    value={newRecord.petId}
                    onChange={(e) => setNewRecord({ ...newRecord, petId: e.target.value })}
                    className="w-full bg-[#FDFCFB] border border-ruru-navy/10 rounded-[1.25rem] px-4 py-3 focus:outline-none focus:border-ruru-navy-light"
                  >
                    <option value="">Select Pet</option>
                    {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-ruru-navy/60 uppercase mb-1">Record Title</label>
                  <input 
                    type="text" 
                    value={newRecord.title}
                    onChange={(e) => setNewRecord({ ...newRecord, title: e.target.value })}
                    className="w-full bg-[#FDFCFB] border border-ruru-navy/10 rounded-[1.25rem] px-4 py-3 focus:outline-none focus:border-ruru-navy-light" 
                    placeholder="e.g. Annual Vaccination" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-ruru-navy/60 uppercase mb-1">Type</label>
                    <select 
                      value={newRecord.type}
                      onChange={(e) => setNewRecord({ ...newRecord, type: e.target.value as any })}
                      className="w-full bg-[#FDFCFB] border border-ruru-navy/10 rounded-[1.25rem] px-4 py-3 focus:outline-none focus:border-ruru-navy-light"
                    >
                      <option value="vaccination">Vaccination</option>
                      <option value="checkup">Checkup</option>
                      <option value="medication">Medication</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ruru-navy/60 uppercase mb-1">Date</label>
                    <input 
                      type="date" 
                      value={newRecord.date}
                      onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                      className="w-full bg-[#FDFCFB] border border-ruru-navy/10 rounded-[1.25rem] px-4 py-3 focus:outline-none focus:border-ruru-navy-light" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-ruru-navy/60 uppercase mb-1">Description</label>
                  <textarea 
                    value={newRecord.description}
                    onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                    className="w-full bg-[#FDFCFB] border border-ruru-navy/10 rounded-[1.25rem] px-4 py-3 focus:outline-none focus:border-ruru-navy-light h-24 resize-none" 
                    placeholder="Details about the visit..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ruru-navy/60 uppercase mb-1">Next Due Date (Optional)</label>
                  <input 
                    type="date" 
                    value={newRecord.nextDueDate}
                    onChange={(e) => setNewRecord({ ...newRecord, nextDueDate: e.target.value })}
                    className="w-full bg-[#FDFCFB] border border-ruru-navy/10 rounded-[1.25rem] px-4 py-3 focus:outline-none focus:border-ruru-navy-light" 
                  />
                </div>
                {newRecord.nextDueDate && (
                  <div className="flex items-center gap-3 p-3 bg-[#F5F5F0] rounded-[1.5rem]">
                    <button 
                      onClick={() => setNewRecord({ ...newRecord, reminderEnabled: !newRecord.reminderEnabled })}
                      className={cn(
                        "w-10 h-6 rounded-full transition-all relative",
                        newRecord.reminderEnabled ? "bg-ruru-navy-light" : "bg-[#A8A29E]"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white/95 backdrop-blur-3xl rounded-full transition-all",
                        newRecord.reminderEnabled ? "left-5" : "left-1"
                      )} />
                    </button>
                    <span className="text-xs font-medium text-ruru-navy-light">Set reminder for this date</span>
                  </div>
                )}
                <div className="pt-4 flex gap-3">
                  <button onClick={() => setIsAddRecordModalOpen(false)} className="flex-1 btn-secondary">Cancel</button>
                  <button onClick={handleAddRecord} className="flex-1 btn-primary">Add Record</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Post Modal */}
      <AnimatePresence>
        {isCreatePostModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreatePostModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white/90 backdrop-blur-xl w-full rounded-[2.5rem] p-8 relative z-10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-ruru-teal/20"
            >
              <h2 className="text-2xl font-brand mb-6">Create Post</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ruru-navy/60 uppercase mb-1">What's on your mind?</label>
                  <textarea 
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    className="w-full bg-[#FDFCFB] border border-ruru-navy/10 rounded-[1.25rem] px-4 py-3 focus:outline-none focus:border-ruru-navy-light h-32 resize-none" 
                    placeholder="Share an update, ask a question..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ruru-navy/60 uppercase mb-1">Tags (comma separated)</label>
                  <input 
                    type="text" 
                    value={newPost.tags}
                    onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                    className="w-full bg-[#FDFCFB] border border-ruru-navy/10 rounded-[1.25rem] px-4 py-3 focus:outline-none focus:border-ruru-navy-light" 
                    placeholder="e.g. Training, Health, Help" 
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button onClick={() => setIsCreatePostModalOpen(false)} className="flex-1 btn-secondary">Cancel</button>
                  <button onClick={handleCreatePost} className="flex-1 btn-primary">Post</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Pet Confirmation Modal */}
      <AnimatePresence>
        {petToDelete && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPetToDelete(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white/90 backdrop-blur-xl w-full rounded-[2.5rem] p-8 relative z-10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-ruru-teal/20"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h2 className="text-2xl font-brand mb-2">Delete {petToDelete.name}?</h2>
              <p className="text-ruru-navy/60 text-sm mb-8">This action cannot be undone. All records for this pet will be lost.</p>
              <div className="flex gap-3">
                <button onClick={() => setPetToDelete(null)} className="flex-1 btn-secondary">Cancel</button>
                <button onClick={handleDeletePet} className="flex-1 flex items-center justify-center bg-red-500 text-white rounded-full px-6 py-3 font-medium transition-all hover:bg-red-600 active:scale-95">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Service Map Modal */}
      <AnimatePresence>
        {selectedServiceForMap && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedServiceForMap(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white/90 backdrop-blur-xl w-full rounded-[2.5rem] p-6 relative z-10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-ruru-teal/20"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-brand">{selectedServiceForMap.name}</h2>
                  <p className="text-xs text-ruru-navy/60 flex items-center gap-1"><MapPin size={12} /> {selectedServiceForMap.address}</p>
                </div>
                <button onClick={() => setSelectedServiceForMap(null)} className="p-1 hover:bg-[#F5F5F0] rounded-full"><X size={20} /></button>
              </div>
              
              <div className="w-full aspect-video bg-[#F5F5F0] rounded-[1.5rem] flex items-center justify-center relative overflow-hidden border border-ruru-navy/10">
                <img 
                  src={getStaticMapUrl({ lat: 8.5241, lng: 76.9366 }, [{ lat: 8.5241, lng: 76.9366 }])} 
                  alt="Map" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/5 pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500 drop-shadow-lg">
                  <MapPin size={32} fill="currentColor" />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button className="flex-1 btn-secondary flex items-center justify-center gap-2">
                  <PhoneCall size={18} /> Call
                </button>
                <button className="flex-1 btn-primary">Get Directions</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Log FAB */}
      <QuickLogFAB 
        pets={pets} 
        onLog={handleQuickLog} 
        isOpen={isQuickLogOpen} 
        setIsOpen={setIsQuickLogOpen} 
        onNavigate={setActiveTab}
      />

      {/* Profile Edit Modal */}
      <ProfileEditModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        profile={userProfile} 
        onSave={handleUpdateProfile} 
      />

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

      {activeTelehealthAppointment && (
        <TelehealthConsultation 
          appointment={activeTelehealthAppointment}
          pet={pets.find(p => p.id === activeTelehealthAppointment.petId)}
          role={role}
          onClose={() => setActiveTelehealthAppointment(null)}
          addRecord={addRecord}
          updateAppointment={updateAppointment}
        />
      )}

      {/* Refined Navigation Bar (Recipe 8: Clean Utility) */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-lg z-50">
        <div className="relative bg-white/90 backdrop-blur-2xl rounded-[2.5rem] py-2 px-1.5 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.12)] border border-white/50 flex items-center justify-around">
          {/* Firestore Sync Status (Visual feedback during operations) */}
          <AnimatePresence mode="wait">
            {syncStatus && (
              <motion.div
                key={syncStatus}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={syncStatus === 'syncing' 
                  ? { 
                      opacity: 1, 
                      scale: [1, 1.05, 1], 
                      y: 0,
                      transition: { 
                        scale: { repeat: Infinity, duration: 2, ease: "easeInOut" },
                        default: { duration: 0.2 }
                      } 
                    }
                  : { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 25 } }
                }
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                className={cn(
                  "absolute -top-3.5 right-6 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border shadow-md backdrop-blur-md z-50 pointer-events-none transition-colors duration-300",
                  syncStatus === 'syncing' ? "bg-amber-500 text-white border-amber-400/80 shadow-amber-500/10" :
                  syncStatus === 'synced' ? "bg-emerald-500 text-white border-emerald-400/80 shadow-emerald-500/10" :
                  "bg-rose-500 text-white border-rose-400/80 shadow-rose-500/10"
                )}
              >
                {syncStatus === 'syncing' ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                      className="flex items-center justify-center shrink-0"
                    >
                      <RefreshCw className="text-white" size={10} />
                    </motion.div>
                    <span>{t.system.syncing}</span>
                  </>
                ) : syncStatus === 'synced' ? (
                  <>
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: [1, 1.3, 1], rotate: 0 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="flex items-center justify-center shrink-0"
                    >
                      <Check className="text-white" size={10} strokeWidth={3} />
                    </motion.div>
                    <span>{t.system.cloudSecure}</span>
                  </>
                ) : (
                  <>
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                      className="flex items-center justify-center shrink-0"
                    >
                      <CloudOff className="text-white" size={10} />
                    </motion.div>
                    <span>{t.system.disconnected}</span>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {role === 'owner' ? (
            <>
              <SidebarNavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Home size={18} strokeWidth={2.5} />} label={t.nav.home} />
              <SidebarNavButton active={activeTab === 'community'} onClick={() => setActiveTab('community')} icon={<UsersIcon size={18} strokeWidth={2.5} />} label="Social" />
              <div className="relative flex flex-col items-center justify-center p-2 rounded-[1.25rem] w-[4.5rem] h-14 group">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab('ai')}
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-all duration-300 border mb-0.5 z-10",
                    activeTab === 'ai' 
                      ? "bg-[#F5F5F0] border-ruru-navy/10 shadow-black/10" 
                      : "bg-[#FDFCFB] border-ruru-navy/5 shadow-black/5 hover:border-ruru-navy/10"
                  )}
                >
                  <RuRuIcon role={role} size={22} status={activeTab === 'ai' ? 'listening' : 'idle'} className={cn(activeTab === 'ai' ? "drop-shadow-[0_0_4px_rgba(52,181,199,0.5)]" : "opacity-80 grayscale transition-all group-hover:grayscale-0 group-hover:opacity-100")} />
                </motion.button>
                <span className={cn(
                  "text-[10px] font-semibold tracking-wide relative z-10 transition-all duration-300 w-full text-center truncate",
                  activeTab === 'ai' ? "text-ruru-navy opacity-100" : "text-[#A8A29E] opacity-70 group-hover:opacity-90 group-hover:text-ruru-navy/70"
                )}>AI</span>
                {activeTab === 'ai' && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-ruru-teal rounded-full"
                  />
                )}
              </div>
              <SidebarNavButton active={activeTab === 'health'} onClick={() => setActiveTab('health')} icon={<Activity size={18} strokeWidth={2.5} />} label="Health" />
              <SidebarNavButton active={['settings', 'care', 'appointments', 'services', 'gov'].includes(activeTab)} onClick={() => setActiveTab('settings')} icon={<LayoutDashboard size={18} strokeWidth={2.5} />} label="More" />
            </>
          ) : role === 'vet' ? (
            <>
              <SidebarNavButton active={activeTab === 'vet'} onClick={() => setActiveTab('vet')} icon={<LayoutDashboard size={20} />} label="Practice" />
              <SidebarNavButton active={activeTab === 'appointments'} onClick={() => setActiveTab('appointments')} icon={<UsersIcon size={20} />} label="Patients" />
              <div className="relative flex flex-col items-center justify-center p-2 rounded-[1.25rem] w-[4.5rem] h-14 group">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab('ai')}
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-all duration-300 border mb-0.5 z-10",
                    activeTab === 'ai' 
                      ? "bg-[#F5F5F0] border-ruru-navy/10 shadow-black/10" 
                      : "bg-[#FDFCFB] border-ruru-navy/5 shadow-black/5 hover:border-ruru-navy/10"
                  )}
                >
                  <RuRuIcon role={role} size={22} status={activeTab === 'ai' ? 'listening' : 'idle'} className={cn(activeTab === 'ai' ? "drop-shadow-[0_0_4px_rgba(52,181,199,0.5)]" : "opacity-80 grayscale transition-all group-hover:grayscale-0 group-hover:opacity-100")} />
                </motion.button>
                <span className={cn(
                  "text-[10px] font-semibold tracking-wide relative z-10 transition-all duration-300 w-full text-center truncate",
                  activeTab === 'ai' ? "text-ruru-navy opacity-100" : "text-[#A8A29E] opacity-70 group-hover:opacity-90 group-hover:text-ruru-navy/70"
                )}>AI</span>
                {activeTab === 'ai' && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-ruru-teal rounded-full"
                  />
                )}
              </div>
              <SidebarNavButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={<MessageSquare size={20} />} label="Chat" />
              <SidebarNavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={20} />} label="Menu" />
            </>
          ) : (
            <>
              <SidebarNavButton active={activeTab === 'practice'} onClick={() => setActiveTab('practice')} icon={<LayoutDashboard size={20} />} label="Dashboard" />
              <SidebarNavButton active={activeTab === 'appointments'} onClick={() => setActiveTab('appointments')} icon={<Calendar size={20} />} label="Bookings" />
              <div className="relative flex flex-col items-center justify-center p-2 rounded-[1.25rem] w-[4.5rem] h-14 group">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab('ai')}
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-all duration-300 border mb-0.5 z-10",
                    activeTab === 'ai' 
                      ? "bg-[#F5F5F0] border-ruru-navy/10 shadow-black/10" 
                      : "bg-[#FDFCFB] border-ruru-navy/5 shadow-black/5 hover:border-ruru-navy/10"
                  )}
                >
                  <RuRuIcon role={role} size={22} status={activeTab === 'ai' ? 'listening' : 'idle'} className={cn(activeTab === 'ai' ? "drop-shadow-[0_0_4px_rgba(52,181,199,0.5)]" : "opacity-80 grayscale transition-all group-hover:grayscale-0 group-hover:opacity-100")} />
                </motion.button>
                <span className={cn(
                  "text-[10px] font-semibold tracking-wide relative z-10 transition-all duration-300 w-full text-center truncate",
                  activeTab === 'ai' ? "text-ruru-navy opacity-100" : "text-[#A8A29E] opacity-70 group-hover:opacity-90 group-hover:text-ruru-navy/70"
                )}>AI</span>
                {activeTab === 'ai' && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-ruru-teal rounded-full"
                  />
                )}
              </div>
              <SidebarNavButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={<MessageSquare size={20} />} label="Messages" />
              <SidebarNavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={20} />} label="Account" />
            </>
          )}
        </div>
      </nav>

      {/* Live Assistant Overlay */}
      <AnimatePresence>
        {isLiveAssistantOpen && (
          aiLimitReached ? (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsLiveAssistantOpen(false)}
                className="absolute inset-0 bg-ruru-navy/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white rounded-[2.5rem] p-8 max-w-sm text-center shadow-2xl"
              >
                <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-brand text-ruru-navy mb-2">Daily API Limit Reached</h3>
                <p className="text-sm text-slate-500">{LIMIT_REACHED_MSG}</p>
                <button onClick={() => setIsLiveAssistantOpen(false)} className="mt-8 w-full bg-slate-100 text-slate-600 font-black uppercase tracking-widest text-xs py-4 rounded-2xl hover:bg-slate-200 transition-colors">Close</button>
              </motion.div>
            </div>
          ) : (
            <LiveAssistant onClose={() => setIsLiveAssistantOpen(false)} />
          )
        )}
      </AnimatePresence>

      {/* Premium Modal */}
      <PremiumModal 
        isOpen={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)} 
      />

      {/* Onboarding Wizard */}
      {userProfile && !userProfile.onboardingComplete && (
        <OnboardingWizard 
          onComplete={() => {
            // Already handled by onUpdateProfile
          }}
          onAddPet={() => setIsAddPetModalOpen(true)}
          userProfile={userProfile}
          onUpdateProfile={(updates) => {
            const updatedProfile = { ...userProfile!, ...updates };
            setUserProfile(updatedProfile);
            if (updates.onboardingComplete) {
              if (updatedProfile.role === 'vet') {
                setActiveTab('vet');
              } else if (updatedProfile.role === 'provider') {
                setActiveTab('practice');
              } else {
                setActiveTab('home');
              }
            }
          }}
        />
      )}
    </div>
  );
}

// --- Components ---







// --- Views ---




// HealthView moved to views/HealthView.tsx


// ChatView moved to views/ChatView.tsx


// CommunityView moved to views/CommunityView.tsx
