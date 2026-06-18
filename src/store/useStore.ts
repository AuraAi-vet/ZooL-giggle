import { create } from 'zustand';
import { toast } from 'sonner';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import localforage from 'localforage';
import { Pet, HealthRecord, CommunityPost, QuickLog, PetDocument, UserProfile, Appointment, PetNotification, Message, TrainingProgress, ActivityLog, PetLicense, PublicAlert, BlockedSlot, UserTask } from '../types';

const analyticsStore = localforage.createInstance({
  name: 'zool-analytics',
  storeName: 'pending-events'
});

export interface AnalyticsEvent {
  id: string;
  userId: string;
  event: string;
  properties: Record<string, any>;
  timestamp: string;
}
import { db, auth } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  documentId,
  orderBy,
  limit,
  addDoc
} from 'firebase/firestore';

const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // User-friendly feedback
  if (errorMessage.includes('Missing or insufficient permissions')) {
    toast.error('Permission denied: You do not have access to this data.');
  } else if (errorMessage.includes('quota') || errorMessage.includes('Resource exhausted') || errorMessage.includes('Quota exceeded')) {
    toast.error('Database limit exceeded. Please try again later.');
  } else if (errorMessage.includes('offline') || errorMessage.includes('Failed to get document')) {
    toast.error('Network issue detected. Please check your connection.');
  } else {
    toast.error('An error occurred while syncing data.');
  }

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface AppState {
  // State for onboarding/tours
  isFeatureTourShown: boolean;
  setFeatureTourShown: (shown: boolean) => void;
  
  isProfileLoaded: boolean;

  nearbyPlaces: any[];
  setNearbyPlaces: (places: any[]) => void;

  // Existing state
  role: 'owner' | 'vet' | 'provider';
  setRole: (role: 'owner' | 'vet' | 'provider') => void;
  
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile) => void;
  
  vets: UserProfile[];
  setVets: (vets: UserProfile[]) => void;
  
  pets: Pet[];
  setPets: (pets: Pet[]) => void;
  addPet: (pet: Omit<Pet, 'id'>) => Promise<void>;
  updatePet: (id: string, pet: Partial<Pet>) => Promise<void>;
  deletePet: (id: string) => Promise<void>;
  
  healthRecords: HealthRecord[];
  addRecord: (record: Omit<HealthRecord, 'id' | 'ownerId'>) => Promise<void>;
  updateRecord: (id: string, record: Partial<HealthRecord>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  
  communityPosts: CommunityPost[];
  setCommunityPosts: (posts: CommunityPost[]) => void;
  addPost: (post: Omit<CommunityPost, 'id'>) => Promise<void>;
  likePost: (id: string) => Promise<void>;
  
  quickLogs: QuickLog[];
  addQuickLog: (log: Omit<QuickLog, 'id' | 'ownerId'>) => Promise<void>;
  deleteQuickLog: (id: string) => Promise<void>;
  
  documents: PetDocument[];
  addDocument: (doc: Omit<PetDocument, 'id' | 'ownerId'>) => Promise<void>;
  
  appointments: Appointment[];
  addAppointment: (appointment: Omit<Appointment, 'id'>) => Promise<void>;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => Promise<void>;
  
  notifications: PetNotification[];
  addNotification: (notification: Omit<PetNotification, 'id' | 'read' | 'timestamp' | 'userId'>) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  
  messages: Message[];
  sendMessage: (message: Omit<Message, 'id' | 'timestamp' | 'read'>) => Promise<void>;
  markMessageRead: (id: string) => Promise<void>;
  
  trainingProgress: TrainingProgress[];
  updateTrainingProgress: (moduleId: number, steps: number) => Promise<void>;
  activityLogs: ActivityLog[];
  addActivity: (log: Omit<ActivityLog, 'id' | 'ownerId'>) => Promise<void>;
  
  licenses: PetLicense[];
  addLicense: (license: Omit<PetLicense, 'id'>) => Promise<void>;
  
  userTasks: UserTask[];
  addUserTask: (task: Omit<UserTask, 'id' | 'userId'>) => Promise<void>;
  updateUserTask: (id: string, task: Partial<UserTask>) => Promise<void>;
  deleteUserTask: (id: string) => Promise<void>;
  
  publicAlerts: PublicAlert[];
  
  submitFeedback: (feedback: { type: 'issue' | 'feature' | 'bug' | 'general', message: string, email?: string }) => Promise<void>;
  
  syncStatus: 'synced' | 'syncing' | 'error';
  setSyncStatus: (status: 'synced' | 'syncing' | 'error') => void;
  lastSaved: string | null;

  blockedSlots: BlockedSlot[];
  addBlockedSlot: (slot: Omit<BlockedSlot, 'id'>) => Promise<void>;
  deleteBlockedSlot: (id: string) => Promise<void>;

  // Cached Map/Service Data
  cachedLocation: { lat: number; lng: number } | null;
  setCachedLocation: (loc: { lat: number; lng: number }) => void;
  cachedNearbyPlaces: any[];
  setCachedNearbyPlaces: (places: any[]) => void;
  cachedAIServices: any[];
  setCachedAIServices: (services: any[]) => void;
  cachedAIAdvice: string;
  setCachedAIAdvice: (advice: string) => void;

  // Language support
  language: 'en' | 'ml' | 'hi';
  setLanguage: (lang: 'en' | 'ml' | 'hi') => void;

  darkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;

  trackAnalyticsEvent: (event: string, properties?: Record<string, any>) => Promise<void>;
  flushAnalyticsEvents: () => Promise<void>;

  initializeCoreListeners: (userId: string) => () => void;
  initializeCommunityListeners: (userId: string) => () => void;
  initializeHealthListeners: (userId: string) => () => void;
  initializeAppointmentsListeners: (userId: string) => () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      isFeatureTourShown: false,
      setFeatureTourShown: (isFeatureTourShown) => set({ isFeatureTourShown }),
      
      isProfileLoaded: false,
      nearbyPlaces: [],
      setNearbyPlaces: (places) => set({ nearbyPlaces: places }),

      role: 'owner',
      setRole: (role) => set({ role }),
      
      userProfile: null,
      setUserProfile: async (userProfile) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        set({ syncStatus: 'syncing' });
        try {
          await setDoc(doc(db, 'users', userId), userProfile);
          set({ userProfile, syncStatus: 'synced', lastSaved: new Date().toISOString() });
        } catch (error) {
          set({ syncStatus: 'error' });
          handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
        }
      },
      
      vets: [],
      setVets: (vets) => set({ vets }),
      
      pets: [],
      setPets: (pets) => set({ pets }),
      addPet: async (pet) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        set({ syncStatus: 'syncing' });
        try {
          await addDoc(collection(db, 'pets'), { ...pet, ownerId: userId });
          set({ syncStatus: 'synced', lastSaved: new Date().toISOString() });
        } catch (error) {
          set({ syncStatus: 'error' });
          handleFirestoreError(error, OperationType.CREATE, 'pets');
        }
      },
      updatePet: async (id, updatedPet) => {
        set({ syncStatus: 'syncing' });
        try {
          const { id: _id, ...data } = updatedPet as any;
          await updateDoc(doc(db, 'pets', id), data);
          set({ syncStatus: 'synced', lastSaved: new Date().toISOString() });
        } catch (error) {
          set({ syncStatus: 'error' });
          handleFirestoreError(error, OperationType.UPDATE, `pets/${id}`);
        }
      },
      deletePet: async (id) => {
        set({ syncStatus: 'syncing' });
        try {
          await deleteDoc(doc(db, 'pets', id));
          set({ syncStatus: 'synced', lastSaved: new Date().toISOString() });
        } catch (error) {
          set({ syncStatus: 'error' });
          handleFirestoreError(error, OperationType.DELETE, `pets/${id}`);
        }
      },
      
      healthRecords: [],
      addRecord: async (record) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        set({ syncStatus: 'syncing' });
        try {
          await addDoc(collection(db, 'healthRecords'), { ...record, ownerId: userId });
          // Invalidate AI cache when new record added
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('zool_vet_cache_insights')) localStorage.removeItem(key);
          });
          set({ syncStatus: 'synced', lastSaved: new Date().toISOString() });
        } catch (error) {
          set({ syncStatus: 'error' });
          handleFirestoreError(error, OperationType.CREATE, 'healthRecords');
        }
      },
      updateRecord: async (id, updatedRecord) => {
        set({ syncStatus: 'syncing' });
        try {
          const { id: _id, ...data } = updatedRecord as any;
          await updateDoc(doc(db, 'healthRecords', id), data);
          
          // Check for vaccination auto-share triggers if verifiedByGov is set to true
          if (data.verifiedByGov === true) {
            const currentRecord = get().healthRecords.find(r => r.id === id);
            if (currentRecord && currentRecord.type === 'vaccination') {
              const isAutoShareEnabled = localStorage.getItem('zool_gmail_auto_share') === 'true';
              const autoShareEmail = localStorage.getItem('zool_gmail_auto_share_email');
              const gmailToken = localStorage.getItem('zool_gmail_token');
              if (isAutoShareEnabled && autoShareEmail && gmailToken) {
                try {
                  toast.loading("Auto-sharing vaccination record...", { id: "gmail-autoshare" });
                  const { sendEmailViaGmail, generateClinicalEmailBody } = await import('../services/gmailService');
                  const currentPet = get().pets.find(p => p.id === currentRecord.petId);
                  const subject = `[ZooL Auto-Share] Vaccination Record for ${currentPet ? currentPet.name.toUpperCase() : 'PET'}`;
                  const bodyText = generateClinicalEmailBody({ ...currentRecord, ...data }, currentPet);
                  await sendEmailViaGmail(gmailToken, autoShareEmail, subject, bodyText);
                  toast.success(`Automatically shared vaccination record with ${autoShareEmail}`, { id: "gmail-autoshare" });
                } catch (e: any) {
                  console.error("Failed to auto-share vaccination record", e);
                  toast.error(`Auto-share failed: ${e.message || 'unknown error'}`, { id: "gmail-autoshare" });
                }
              }
            }
          }

          // Invalidate AI cache on update
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('zool_vet_cache_insights')) localStorage.removeItem(key);
          });
          set({ syncStatus: 'synced', lastSaved: new Date().toISOString() });
        } catch (error) {
          set({ syncStatus: 'error' });
          handleFirestoreError(error, OperationType.UPDATE, `healthRecords/${id}`);
        }
      },
      deleteRecord: async (id) => {
        set({ syncStatus: 'syncing' });
        try {
          await deleteDoc(doc(db, 'healthRecords', id));
          set({ syncStatus: 'synced', lastSaved: new Date().toISOString() });
        } catch (error) {
          set({ syncStatus: 'error' });
          handleFirestoreError(error, OperationType.DELETE, `healthRecords/${id}`);
        }
      },
      
      communityPosts: [],
      setCommunityPosts: (communityPosts) => set({ communityPosts }),
      addPost: async (post) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        set({ syncStatus: 'syncing' });
        try {
          await addDoc(collection(db, 'communityPosts'), { 
            ...post, 
            authorId: userId,
            timestamp: new Date().toISOString()
          });
          set({ syncStatus: 'synced', lastSaved: new Date().toISOString() });
        } catch (error) {
          set({ syncStatus: 'error' });
          handleFirestoreError(error, OperationType.CREATE, 'communityPosts');
        }
      },
      likePost: async (id) => {
        const post = get().communityPosts.find(p => p.id === id);
        if (!post) return;
        set({ syncStatus: 'syncing' });
        try {
          await updateDoc(doc(db, 'communityPosts', id), {
            likes: post.liked ? post.likes - 1 : post.likes + 1,
            liked: !post.liked
          });
          set({ syncStatus: 'synced', lastSaved: new Date().toISOString() });
        } catch (error) {
          set({ syncStatus: 'error' });
          handleFirestoreError(error, OperationType.UPDATE, `communityPosts/${id}`);
        }
      },
      
      quickLogs: [],
      addQuickLog: async (log) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        set({ syncStatus: 'syncing' });
        try {
          await addDoc(collection(db, 'quickLogs'), { ...log, ownerId: userId });
          set({ syncStatus: 'synced', lastSaved: new Date().toISOString() });
        } catch (error) {
          set({ syncStatus: 'error' });
          handleFirestoreError(error, OperationType.CREATE, 'quickLogs');
        }
      },
      deleteQuickLog: async (id) => {
        set({ syncStatus: 'syncing' });
        try {
          await deleteDoc(doc(db, 'quickLogs', id));
          set({ syncStatus: 'synced', lastSaved: new Date().toISOString() });
        } catch (error) {
          set({ syncStatus: 'error' });
          handleFirestoreError(error, OperationType.DELETE, `quickLogs/${id}`);
        }
      },
      
      documents: [],
      addDocument: async (docData) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        set({ syncStatus: 'syncing' });
        try {
          await addDoc(collection(db, 'petDocuments'), { ...docData, ownerId: userId });
          set({ syncStatus: 'synced', lastSaved: new Date().toISOString() });
        } catch (error) {
          set({ syncStatus: 'error' });
          handleFirestoreError(error, OperationType.CREATE, 'petDocuments');
        }
      },

      appointments: [],
      addAppointment: async (appointment) => {
        set({ syncStatus: 'syncing' });
        try {
          await addDoc(collection(db, 'appointments'), appointment);
          set({ syncStatus: 'synced', lastSaved: new Date().toISOString() });
        } catch (error) {
          set({ syncStatus: 'error' });
          handleFirestoreError(error, OperationType.CREATE, 'appointments');
        }
      },
      updateAppointment: async (id, updatedAppointment) => {
        set({ syncStatus: 'syncing' });
        try {
          const { id: _id, ...data } = updatedAppointment as any;
          await updateDoc(doc(db, 'appointments', id), data);
          set({ syncStatus: 'synced', lastSaved: new Date().toISOString() });
        } catch (error) {
          set({ syncStatus: 'error' });
          handleFirestoreError(error, OperationType.UPDATE, `appointments/${id}`);
        }
      },

      notifications: [],
      addNotification: async (notification) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        set({ syncStatus: 'syncing' });
        try {
          await addDoc(collection(db, 'notifications'), {
            ...notification,
            userId,
            timestamp: new Date().toISOString(),
            read: false
          });
          set({ syncStatus: 'synced', lastSaved: new Date().toISOString() });
        } catch (error) {
          set({ syncStatus: 'error' });
          handleFirestoreError(error, OperationType.CREATE, 'notifications');
        }
      },
      markNotificationRead: async (id) => {
        set({ syncStatus: 'syncing' });
        try {
          await updateDoc(doc(db, 'notifications', id), { read: true });
          set({ syncStatus: 'synced', lastSaved: new Date().toISOString() });
        } catch (error) {
          set({ syncStatus: 'error' });
          handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
        }
      },

      userTasks: [],
      addUserTask: async (task) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        set({ syncStatus: 'syncing' });
        try {
          await addDoc(collection(db, 'userTasks'), { 
            ...task, 
            userId,
            createdAt: new Date().toISOString()
          });
          set({ syncStatus: 'synced', lastSaved: new Date().toISOString() });
        } catch (error) {
          set({ syncStatus: 'error' });
          handleFirestoreError(error, OperationType.CREATE, 'userTasks');
        }
      },
      updateUserTask: async (id, updatedTask) => {
        set({ syncStatus: 'syncing' });
        try {
          const { id: _id, ...data } = updatedTask as any;
          await updateDoc(doc(db, 'userTasks', id), data);
          set({ syncStatus: 'synced', lastSaved: new Date().toISOString() });
        } catch (error) {
          set({ syncStatus: 'error' });
          handleFirestoreError(error, OperationType.UPDATE, `userTasks/${id}`);
        }
      },
      deleteUserTask: async (id) => {
        set({ syncStatus: 'syncing' });
        try {
          await deleteDoc(doc(db, 'userTasks', id));
          set({ syncStatus: 'synced', lastSaved: new Date().toISOString() });
        } catch (error) {
          set({ syncStatus: 'error' });
          handleFirestoreError(error, OperationType.DELETE, `userTasks/${id}`);
        }
      },

      messages: [],
      sendMessage: async (message) => {
        set({ syncStatus: 'syncing' });
        try {
          await addDoc(collection(db, 'messages'), {
            ...message,
            timestamp: new Date().toISOString(),
            read: false
          });
          set({ syncStatus: 'synced', lastSaved: new Date().toISOString() });
        } catch (error) {
          set({ syncStatus: 'error' });
          handleFirestoreError(error, OperationType.CREATE, 'messages');
        }
      },
      markMessageRead: async (id) => {
        set({ syncStatus: 'syncing' });
        try {
          await updateDoc(doc(db, 'messages', id), { read: true });
          set({ syncStatus: 'synced', lastSaved: new Date().toISOString() });
        } catch (error) {
          set({ syncStatus: 'error' });
          handleFirestoreError(error, OperationType.UPDATE, `messages/${id}`);
        }
      },

      trainingProgress: [],
      updateTrainingProgress: async (moduleId, steps) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        const progress = get().trainingProgress.find(p => p.moduleId === moduleId);
        const isCompleted = steps >= 5; // Assuming 5 steps for now
        
        set({ syncStatus: 'syncing' });
        try {
          if (progress) {
            await updateDoc(doc(db, 'trainingProgress', progress.id), { 
              completedSteps: steps,
              isCompleted 
            });
          } else {
            await addDoc(collection(db, 'trainingProgress'), {
              userId,
              moduleId,
              completedSteps: steps,
              isCompleted
            });
          }
          set({ syncStatus: 'synced', lastSaved: new Date().toISOString() });
        } catch (error) {
          set({ syncStatus: 'error' });
          handleFirestoreError(error, OperationType.WRITE, 'trainingProgress');
        }
      },
      activityLogs: [],
      addActivity: async (log) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        set({ syncStatus: 'syncing' });
        try {
          await addDoc(collection(db, 'activityLogs'), { ...log, ownerId: userId });
          set({ syncStatus: 'synced', lastSaved: new Date().toISOString() });
        } catch (error) {
          set({ syncStatus: 'error' });
          handleFirestoreError(error, OperationType.CREATE, 'activityLogs');
        }
      },

      licenses: [],
      addLicense: async (license) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        set({ syncStatus: 'syncing' });
        try {
          await addDoc(collection(db, 'licenses'), { ...license, ownerId: userId });
          set({ syncStatus: 'synced', lastSaved: new Date().toISOString() });
        } catch (error) {
          set({ syncStatus: 'error' });
          handleFirestoreError(error, OperationType.CREATE, 'licenses');
        }
      },

      publicAlerts: [],

      submitFeedback: async (feedback) => {
        const userId = auth.currentUser?.uid;
        set({ syncStatus: 'syncing' });
        try {
          await addDoc(collection(db, 'feedback'), {
            ...feedback,
            userId: userId || 'anonymous',
            timestamp: new Date().toISOString()
          });
          set({ syncStatus: 'synced', lastSaved: new Date().toISOString() });
        } catch (error) {
          set({ syncStatus: 'error' });
          handleFirestoreError(error, OperationType.CREATE, 'feedback');
        }
      },
      
      syncStatus: 'synced',
      setSyncStatus: (syncStatus) => set({ syncStatus }),
      lastSaved: null,

      blockedSlots: [],
      addBlockedSlot: async (slot) => {
        set({ syncStatus: 'syncing' });
        try {
          await addDoc(collection(db, 'blockedSlots'), slot);
          set({ syncStatus: 'synced', lastSaved: new Date().toISOString() });
        } catch (error) {
          set({ syncStatus: 'error' });
          handleFirestoreError(error, OperationType.CREATE, 'blockedSlots');
        }
      },
      deleteBlockedSlot: async (id) => {
        set({ syncStatus: 'syncing' });
        try {
          await deleteDoc(doc(db, 'blockedSlots', id));
          set({ syncStatus: 'synced', lastSaved: new Date().toISOString() });
        } catch (error) {
          set({ syncStatus: 'error' });
          handleFirestoreError(error, OperationType.DELETE, `blockedSlots/${id}`);
        }
      },

      cachedLocation: null,
      setCachedLocation: (cachedLocation) => set({ cachedLocation }),
      cachedNearbyPlaces: [],
      setCachedNearbyPlaces: (cachedNearbyPlaces) => set({ cachedNearbyPlaces }),
      cachedAIServices: [],
      setCachedAIServices: (cachedAIServices) => set({ cachedAIServices }),
      cachedAIAdvice: '',
      setCachedAIAdvice: (cachedAIAdvice) => set({ cachedAIAdvice }),

      language: 'en',
      setLanguage: (language) => set({ language }),

      darkMode: false,
      setDarkMode: (darkMode) => set({ darkMode }),
      notificationsEnabled: true,
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),

      trackAnalyticsEvent: async (event: string, properties: Record<string, any> = {}) => {
        const userId = auth.currentUser?.uid || 'anonymous';
        const newEvent: AnalyticsEvent = {
          id: Math.random().toString(36).substring(2, 11),
          userId,
          event,
          properties,
          timestamp: new Date().toISOString()
        };

        // Fire-and-forget: we do NOT wait for write inside main execution flow!
        // This is non-blocking to prevent UI stutters during clinic hours.
        (async () => {
          try {
            const currentEvents: AnalyticsEvent[] = (await analyticsStore.getItem<AnalyticsEvent[]>('events')) || [];
            currentEvents.push(newEvent);
            await analyticsStore.setItem('events', currentEvents);
            
            console.log(`[Analytics] Event buffered in IndexedDB: ${event}`, properties);

            // Flush triggers automatically if buffer threshold is reached
            if (currentEvents.length >= 5) {
              get().flushAnalyticsEvents().catch(err => {
                console.error('[Analytics] Background autocascade failed:', err);
              });
            }
          } catch (err) {
            console.error('[Analytics/localForage] Write error:', err);
          }
        })();
      },

      flushAnalyticsEvents: async () => {
        try {
          const events: AnalyticsEvent[] = (await analyticsStore.getItem<AnalyticsEvent[]>('events')) || [];
          if (events.length === 0) return;

          // Clear instantly to prevent any potential double submission or race conditions
          await analyticsStore.setItem('events', []);

          console.log(`[Analytics] Flushing ${events.length} batched logs in non-blocking background thread...`);

          // Execute Firestore uploads in the background parallel stack
          const batchPromises = events.map(async (ev) => {
            try {
              // Write to aiInteractionLogs (which handles telemetry & user analytics seamlessly)
              await addDoc(collection(db, 'aiInteractionLogs'), {
                userId: ev.userId,
                eventType: ev.event,
                metadata: ev.properties,
                timestamp: ev.timestamp,
                buffered: true
              });
            } catch (error) {
              console.error(`[Analytics/Firestore] Outbound stream failed for event ${ev.id}, re-queuing:`, error);
              // Safe fallback: append back to the localForage queue
              try {
                const current: AnalyticsEvent[] = (await analyticsStore.getItem<AnalyticsEvent[]>('events')) || [];
                current.push(ev);
                await analyticsStore.setItem('events', current);
              } catch (reQueueErr) {
                console.error('[Analytics/localForage] Re-queue write error:', reQueueErr);
              }
            }
          });

          // Run concurrently in background
          Promise.allSettled(batchPromises).then(() => {
            console.log(`[Analytics] Batch sync batch run completed.`);
          });

        } catch (error) {
          console.error('[Analytics] Failed to fetch events for sync:', error);
        }
      },

      initializeCoreListeners: (userId: string) => {
        const unsubscribes: (() => void)[] = [];
        const role = get().role;

        // Auto-flush queue periodically on initialization
        const flushTimer = setInterval(() => {
          get().flushAnalyticsEvents().catch(console.error);
        }, 15000); // Check and flush every 15s

        unsubscribes.push(() => clearInterval(flushTimer));

        // User Profile
        unsubscribes.push(onSnapshot(doc(db, 'users', userId), (snapshot) => {
          if (snapshot.exists()) {
            const profile = snapshot.data() as UserProfile;
            set({ userProfile: profile, role: profile.role, isProfileLoaded: true });
          } else {
            set({ isProfileLoaded: true, userProfile: null });
          }
        }, (error) => handleFirestoreError(error, OperationType.GET, `users/${userId}`)));

        // Vets
        // Under strict rules, we cannot list all users. We just skip this or get our own profile.
        set({ vets: [] });

        // Pets
        // Query must match the strict rule: resource.data.ownerId == request.auth.uid
        const petsQuery = query(collection(db, 'pets'), where('ownerId', '==', userId), limit(50));
          
        unsubscribes.push(onSnapshot(petsQuery, (snapshot) => {
          const pets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pet));
          set({ pets });
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'pets')));
        
        // Notifications
        // Query must match strict rule: resource.data.userId == request.auth.uid
        const notificationsQuery = query(collection(db, 'notifications'), where('userId', '==', userId), limit(50));
        unsubscribes.push(onSnapshot(notificationsQuery, (snapshot) => {
          const notifications = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as PetNotification))
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          set({ notifications });
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'notifications')));

        return () => unsubscribes.forEach(unsub => unsub());
      },

      initializeCommunityListeners: (userId: string) => {
        const unsubscribes: (() => void)[] = [];
        const postsQuery = query(
          collection(db, 'communityPosts'), 
          limit(20)
        );
        unsubscribes.push(onSnapshot(postsQuery, (snapshot) => {
          const posts = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as CommunityPost))
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          set({ communityPosts: posts });
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'communityPosts')));
        return () => unsubscribes.forEach(unsub => unsub());
      },

      initializeHealthListeners: (userId: string) => {
        const unsubscribes: (() => void)[] = [];
        const role = get().role;
        const recordsQuery = (role === 'vet' || role === 'provider')
          ? query(collection(db, 'healthRecords'), limit(20))
          : query(collection(db, 'healthRecords'), where('ownerId', '==', userId), limit(50));
        unsubscribes.push(onSnapshot(recordsQuery, (snapshot) => {
          const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HealthRecord));
          set({ healthRecords: records });
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'healthRecords')));

        const logsQuery = (role === 'vet' || role === 'provider')
          ? query(collection(db, 'quickLogs'), limit(10))
          : query(collection(db, 'quickLogs'), where('ownerId', '==', userId), limit(50));
        unsubscribes.push(onSnapshot(logsQuery, (snapshot) => {
          const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuickLog));
          set({ quickLogs: logs });
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'quickLogs')));

        const docsQuery = (role === 'vet' || role === 'provider')
          ? query(collection(db, 'petDocuments'), limit(10))
          : query(collection(db, 'petDocuments'), where('ownerId', '==', userId), limit(50));
        unsubscribes.push(onSnapshot(docsQuery, (snapshot) => {
          const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PetDocument));
          set({ documents: docs });
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'petDocuments')));

        return () => unsubscribes.forEach(unsub => unsub());
      },

      initializeAppointmentsListeners: (userId: string) => {
        const unsubscribes: (() => void)[] = [];
        const role = get().role;
        const appointmentsQuery = (role === 'vet' || role === 'provider')
          ? query(collection(db, 'appointments'), where('vetId', '==', userId), limit(50))
          : query(collection(db, 'appointments'), where('ownerId', '==', userId), limit(50));
        unsubscribes.push(onSnapshot(appointmentsQuery, (snapshot) => {
          const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
          set({ appointments });
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'appointments')));

        const blockedSlotsQuery = query(collection(db, 'blockedSlots'), where('vetId', '>=', ''), limit(100));
        unsubscribes.push(onSnapshot(blockedSlotsQuery, (snapshot) => {
          const blockedSlots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlockedSlot));
          set({ blockedSlots });
        }, (error) => handleFirestoreError(error, OperationType.LIST, 'blockedSlots')));
        
        return () => unsubscribes.forEach(unsub => unsub());
      },


    }),
    {
      name: 'zool-storage',
      storage: createJSONStorage(() => idbStorage),
    }
  )
);
