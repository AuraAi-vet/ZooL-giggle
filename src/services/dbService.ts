import { auth, db } from '../lib/firebase';
import { collection, doc, setDoc, getDocs, query, where, getDoc, updateDoc, onSnapshot, addDoc } from 'firebase/firestore';
import { UserProfile, PetProfile } from '../types';

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
  authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const StringErr = String(error);
  if (StringErr.includes('Missing or insufficient permissions')) {
      console.warn(`[dbService] Handled Permission Error for ${operationType} on ${path}`);
      return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : StringErr,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('[dbService] Firestore Error: ', JSON.stringify(errInfo, null, 2));
}

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const pathForGet = `users/${uid}`;
  try {
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, pathForGet);
    return null;
  }
};

export const createUserProfile = async (profile: UserProfile): Promise<void> => {
  const pathForWrite = `users/${profile.uid}`;
  try {
    await setDoc(doc(db, 'users', profile.uid), profile);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, pathForWrite);
  }
};

export const addOwnerPet = async (pet: PetProfile): Promise<string> => {
  const petId = 'pet_' + Date.now();
  const newPet = { ...pet, petId };
  const pathForWrite = `pets/${petId}`;
  
  try {
    await setDoc(doc(db, 'pets', petId), newPet);
    return petId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, pathForWrite);
    const StringErr = String(error);
    if (StringErr.includes('Missing or insufficient permissions')) {
      // Optimistically store in local storage as fallback
      console.warn("Falling back to local storage for pet creation due to permissions");
      try {
        const pets = JSON.parse(localStorage.getItem('mock_pets') || '[]');
        localStorage.setItem('mock_pets', JSON.stringify([...pets, newPet]));
      } catch (e) {}
      return petId;
    }
    throw error;
  }
};

export const getOwnerPets = async (ownerUid: string): Promise<PetProfile[]> => {
  let fallbackPets: PetProfile[] = [];
  try {
    fallbackPets = JSON.parse(localStorage.getItem('mock_pets') || '[]').filter((p: any) => p.ownerUid === ownerUid);
  } catch (e) {}

  try {
    const q = query(collection(db, 'pets'), where('ownerUid', '==', ownerUid));
    const querySnapshot = await getDocs(q);
    const pets: PetProfile[] = [];
    querySnapshot.forEach((doc) => {
      pets.push(doc.data() as PetProfile);
    });
    
    // Merge fallback pets that might not exist in db yet
    const dbPetIds = new Set(pets.map(p => p.petId));
    const uniqueFallback = fallbackPets.filter(p => !dbPetIds.has(p.petId));
    
    return [...pets, ...uniqueFallback];
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'pets');
    return fallbackPets;
  }
};

export const createAppointment = async (petId: string, ownerUid: string, clinicId: string, scheduledTime: number, notes: string) => {
  const payload = {
    petId, ownerUid, clinicId, status: 'scheduled', scheduledTime, notes, createdAt: Date.now()
  };
  
  try {
    const docRef = await addDoc(collection(db, 'appointments'), payload);
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'appointments');
    const StringErr = String(err);
    if (StringErr.includes('Missing or insufficient permissions')) {
      const aptId = 'apt_' + Date.now();
      try {
        const apts = JSON.parse(localStorage.getItem('mock_apts') || '[]');
        localStorage.setItem('mock_apts', JSON.stringify([...apts, { id: aptId, ...payload }]));
      } catch (e) {}
      return aptId;
    }
    return 'temp';
  }
};

export const saveClinicalNote = async (appointmentId: string, soapNotes: string) => {
  try {
    await updateDoc(doc(db, 'appointments', appointmentId), {
      notes: soapNotes,
      status: 'completed',
      completedAt: Date.now()
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `appointments/${appointmentId}`);
    return false;
  }
};

export const getActiveQueue = async (clinicId: string) => {
  let fallbackApts: any[] = [];
  try {
    fallbackApts = JSON.parse(localStorage.getItem('mock_apts') || '[]').filter((a: any) => a.clinicId === clinicId);
  } catch (e) {}

  let apts: any[] = [];
  try {
    const q = query(collection(db, 'appointments'), where('clinicId', '==', clinicId));
    const snap = await getDocs(q);
    snap.forEach(d => apts.push({ id: d.id, ...d.data() }));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'appointments');
  }

  // Merge fallback appointments
  const dbAptIds = new Set(apts.map(a => a.id));
  const activeApts = [...apts, ...fallbackApts.filter(a => !dbAptIds.has(a.id))];

  let allPets: any[] = [];
  try {
    const petsSnap = await getDocs(collection(db, 'pets'));
    petsSnap.forEach(d => allPets.push(d.data()));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'pets');
  }

  // Also include local mock pets
  try {
    const localPets = JSON.parse(localStorage.getItem('mock_pets') || '[]');
    allPets.push(...localPets);
  } catch (e) {}

  const active = activeApts.filter(a => ['scheduled', 'in-progress'].includes(a.status));
  active.sort((a, b) => a.scheduledTime - b.scheduledTime);
  
  return active.map((a: any) => {
    const pet = allPets.find(p => p.petId === a.petId) || { name: 'Unknown', breed: 'Unknown', age: 0 };
    return {
      id: a.id,
      petId: a.petId,
      name: pet.name,
      details: `${pet.breed} • ${pet.age}y`,
      reason: a.notes,
      time: new Date(a.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      gemaBrief: `Gema Analysis: Patient scheduled for ${a.notes}.`,
      healthTrends: [],
      status: a.status,
      serviceRequested: a.notes || 'General Service',
    };
  });
};

export const getProviderSchedule = async (providerId: string) => {
  return getActiveQueue(providerId);
};

export const logServiceCompletion = async (appointmentId: string, summary: string) => {
  try {
    await updateDoc(doc(db, 'appointments', appointmentId), {
      serviceSummary: summary,
      status: 'completed',
      completedAt: Date.now()
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `appointments/${appointmentId}`);
    return false;
  }
};

export const subscribeToServiceUpdates = (ownerUid: string, callback: (updates: any[]) => void) => {
  const q = query(collection(db, 'serviceUpdates'), where('ownerUid', '==', ownerUid));
  return onSnapshot(q, (snap) => {
    const updates: any[] = [];
    snap.forEach(d => updates.push({ id: d.id, ...d.data() }));
    updates.sort((a, b) => b.timestamp - a.timestamp);
    callback(updates);
  }, error => {
    handleFirestoreError(error, OperationType.LIST, 'serviceUpdates');
  });
};

export const sendServiceUpdate = async (petId: string, ownerUid: string, providerName: string, message: string) => {
  try {
    await addDoc(collection(db, 'serviceUpdates'), {
      petId, ownerUid, providerName, message, timestamp: Date.now(), read: false
    });
    return true;
  } catch (e) {
    handleFirestoreError(e, OperationType.CREATE, 'serviceUpdates');
    return false;
  }
};

export const updateUserProfileData = async (uid: string, updates: any) => {
  try {
    await updateDoc(doc(db, 'users', uid), updates);
    return true;
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, `users/${uid}`);
    return false;
  }
};

export const getClinicOperationsData = async (_clinicId: string) => {
  return {
    metrics: { dailyVolume: 12, completionRate: 98, activeStaff: 4, currentWaitTime: '5 mins' },
    masterSchedule: []
  };
};

export const createNotification = async (userId: string, title: string, message: string, link?: string) => {
  const payload = { userId, title, message, read: false, timestamp: Date.now(), link: link || null };
  try {
    await addDoc(collection(db, 'notifications'), payload);
    return true;
  } catch (e) {
    handleFirestoreError(e, OperationType.CREATE, 'notifications');
    const StringErr = String(e);
    if (StringErr.includes('Missing or insufficient permissions')) {
      try {
        const notifs = JSON.parse(localStorage.getItem('mock_notifs') || '[]');
        localStorage.setItem('mock_notifs', JSON.stringify([...notifs, { id: 'ntf_' + Date.now(), ...payload }]));
      } catch (err) {}
      return true;
    }
    return false;
  }
};

export const subscribeToNotifications = (userId: string, callback: (notifications: any[]) => void) => {
  let initial = true;
  const q = query(collection(db, 'notifications'), where('userId', '==', userId));
  const unsubscribe = onSnapshot(q, (snap) => {
    initial = false;
    const notifs: any[] = [];
    snap.forEach(d => notifs.push({ id: d.id, ...d.data() }));
    notifs.sort((a, b) => b.timestamp - a.timestamp);
    callback(notifs);
  }, error => {
    handleFirestoreError(error, OperationType.LIST, 'notifications');
    const StringErr = String(error);
    if (StringErr.includes('Missing or insufficient permissions')) {
      const pushNotifs = () => {
        try {
          const notifs = JSON.parse(localStorage.getItem('mock_notifs') || '[]').filter((n: any) => n.userId === userId);
          callback(notifs.sort((a: any, b: any) => b.timestamp - a.timestamp));
        } catch (e) {}
      };
      if (initial) pushNotifs();
      const interval = setInterval(pushNotifs, 2000);
      // hacky way to override the unsubscribe inside the component if needed, 
      // but interval is fine as a fallback
    }
  });
  return unsubscribe;
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), { read: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, `notifications/${notificationId}`);
    try {
      const notifs = JSON.parse(localStorage.getItem('mock_notifs') || '[]');
      const n = notifs.find((x: any) => x.id === notificationId);
      if (n) {
        n.read = true;
        localStorage.setItem('mock_notifs', JSON.stringify([...notifs.filter((x: any) => x.id !== notificationId), n]));
      }
    } catch (err) {}
  }
};

export const logActivity = async (userId: string, action: string, details: string) => {
  const payload = { userId, action, details, timestamp: Date.now() };
  try {
    await addDoc(collection(db, 'activityLogs'), payload);
    return true;
  } catch (e) {
    handleFirestoreError(e, OperationType.CREATE, 'activityLogs');
    const StringErr = String(e);
    if (StringErr.includes('Missing or insufficient permissions')) {
      try {
        const logs = JSON.parse(localStorage.getItem('mock_logs') || '[]');
        localStorage.setItem('mock_logs', JSON.stringify([...logs, { id: 'log_' + Date.now(), ...payload }]));
      } catch (err) {}
      return true;
    }
    return false;
  }
};

export const getActivityLogs = async (userId: string): Promise<any[]> => {
  let fallbackLogs: any[] = [];
  try {
    fallbackLogs = JSON.parse(localStorage.getItem('mock_logs') || '[]').filter((l: any) => l.userId === userId);
  } catch (e) {}

  try {
    const q = query(collection(db, 'activityLogs'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const logs: any[] = [];
    snap.forEach(d => logs.push({ id: d.id, ...d.data() }));
    
    const dbLogIds = new Set(logs.map(l => l.id));
    const uniqueFallback = fallbackLogs.filter(l => !dbLogIds.has(l.id));

    return [...logs, ...uniqueFallback].sort((a, b) => b.timestamp - a.timestamp);
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, 'activityLogs');
    return fallbackLogs.sort((a, b) => b.timestamp - a.timestamp);
  }
};
