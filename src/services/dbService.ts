// src/services/dbService.ts
import { doc, getDoc, setDoc, collection, query, where, getDocs, orderBy, updateDoc, addDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { UserProfile, PetProfile, Appointment } from '../types';

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
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Fetch a user's role profile after they authenticate
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'users/' + uid);
    return null;
  }
};

// Create a new user profile on first login
export const createUserProfile = async (profile: UserProfile): Promise<void> => {
  await setDoc(doc(db, 'users', profile.uid), profile);
};

// Fetch pets belonging to a specific owner
export const getOwnerPets = async (ownerUid: string): Promise<PetProfile[]> => {
  const petsRef = collection(db, 'pets');
  const q = query(petsRef, where('ownerUid', '==', ownerUid));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => doc.data() as PetProfile);
};

// Create a new appointment from the Pet Owner dashboard
export const createAppointment = async (
  petId: string, 
  ownerUid: string, 
  clinicId: string, 
  scheduledTime: number, 
  notes: string
) => {
  try {
    const appointmentsRef = collection(db, 'appointments');
    
    // We use addDoc to let Firestore auto-generate the document ID
    const newDoc = await addDoc(appointmentsRef, {
      petId,
      ownerUid,
      clinicId,
      status: 'scheduled',
      scheduledTime,
      notes,
      createdAt: Date.now()
    });

    // Update the document to include its own auto-generated ID for easier querying later
    await updateDoc(newDoc, {
      appointmentId: newDoc.id
    });

    return newDoc.id;
  } catch (error) {
    console.error("Error creating appointment:", error);
    throw error;
  }
};

// Save clinical SOAP notes and mark the appointment as completed
export const saveClinicalNote = async (appointmentId: string, soapNotes: string) => {
  try {
    const appointmentRef = doc(db, 'appointments', appointmentId);
    
    await updateDoc(appointmentRef, {
      notes: soapNotes,
      status: 'completed', // Updates the status so they drop out of the active queue
      completedAt: Date.now()
    });
    
    return true;
  } catch (error) {
    console.error("Error saving clinical note:", error);
    throw error;
  }
};

// Fetch today's active queue for a specific clinic
export const getActiveQueue = async (clinicId: string) => {
  const appointmentsRef = collection(db, 'appointments');
  
  // Query appointments scheduled for this clinic that are not completed or cancelled
  const q = query(
    appointmentsRef,
    where('clinicId', '==', clinicId),
    where('status', 'in', ['scheduled', 'in-progress'])
  );

  const querySnapshot = await getDocs(q);
  
  // Sort docs manually by scheduledTime to avoid requiring a composite index
  const sortedDocs = [...querySnapshot.docs].sort((a, b) => {
    return (a.data().scheduledTime || 0) - (b.data().scheduledTime || 0);
  });

  const queueData = [];

  // Loop through appointments and fetch the associated pet data
  for (const docSnapshot of sortedDocs) {
    const appointment = docSnapshot.data() as Appointment;
    
    // Fetch the pet profile linked to this appointment
    const petRef = collection(db, 'pets');
    const petQuery = query(petRef, where('petId', '==', appointment.petId));
    const petSnapshot = await getDocs(petQuery);
    
    if (!petSnapshot.empty) {
      const pet = petSnapshot.docs[0].data() as PetProfile;
      
      // Construct the unified queue object
      queueData.push({
        id: appointment.appointmentId,
        petId: pet.petId,
        name: pet.name,
        details: `${pet.breed} • ${pet.age}y`,
        reason: appointment.notes,
        time: new Date(appointment.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        gemaBrief: `Gema Analysis: Patient scheduled for ${appointment.notes}. Please review recent logs.`,
        healthTrends: [
          { month: 'Jan', weight: pet.weightKg - 1, heartRate: 85 },
          { month: 'Feb', weight: pet.weightKg - 0.5, heartRate: 82 },
          { month: 'Mar', weight: pet.weightKg + 0.2, heartRate: 88 },
          { month: 'Apr', weight: pet.weightKg, heartRate: 86 },
        ]
      });
    }
  }

  return queueData;
};

// Fetch today's schedule for non-medical service providers
export const getProviderSchedule = async (providerId: string) => {
  const appointmentsRef = collection(db, 'appointments');
  
  // Assuming non-medical services have a specific clinicId or a new 'type' field.
  // For this example, we query by the provider's specific location ID.
  const q = query(
    appointmentsRef,
    where('clinicId', '==', providerId),
    where('status', 'in', ['scheduled', 'in-progress'])
  );

  const querySnapshot = await getDocs(q);
  
  // Sort docs manually by scheduledTime
  const sortedDocs = [...querySnapshot.docs].sort((a, b) => {
    return (a.data().scheduledTime || 0) - (b.data().scheduledTime || 0);
  });

  const scheduleData = [];

  for (const docSnapshot of sortedDocs) {
    const appointment = docSnapshot.data() as Appointment;
    const petRef = collection(db, 'pets');
    const petQuery = query(petRef, where('petId', '==', appointment.petId));
    const petSnapshot = await getDocs(petQuery);
    
    if (!petSnapshot.empty) {
      const pet = petSnapshot.docs[0].data() as PetProfile;
      
      scheduleData.push({
        id: appointment.appointmentId,
        petId: pet.petId,
        name: pet.name,
        details: `${pet.breed} • ${pet.age}y`,
        serviceRequested: appointment.notes, // e.g., "Full Groom & Nail Trim"
        time: new Date(appointment.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        // Safe, non-medical behavioral data
        behavioralNotes: "Friendly, but anxious around clippers. Treats highly recommended." 
      });
    }
  }
  return scheduleData;
};

// Log completed service tasks without touching medical records
export const logServiceCompletion = async (appointmentId: string, summary: string) => {
  const appointmentRef = doc(db, 'appointments', appointmentId);
  await updateDoc(appointmentRef, {
    serviceSummary: summary,
    status: 'completed',
    completedAt: Date.now()
  });
  return true;
};

// Send a secure update from the Service Provider to the Pet Owner
export const sendServiceUpdate = async (
  petId: string, 
  ownerUid: string, 
  providerName: string, 
  message: string
) => {
  try {
    const updatesRef = collection(db, 'serviceUpdates');
    await addDoc(updatesRef, {
      petId,
      ownerUid,
      providerName,
      message,
      timestamp: Date.now(),
      read: false // Can be used later for notification badges
    });
    return true;
  } catch (error) {
    console.error("Error sending service update:", error);
    throw error;
  }
};

// Subscribe to unread updates for the Pet Owner Dashboard in real-time
export const subscribeToServiceUpdates = (ownerUid: string, callback: (updates: any[]) => void) => {
  const updatesRef = collection(db, 'serviceUpdates');
  const q = query(
    updatesRef, 
    where('ownerUid', '==', ownerUid)
  );
  
  // Returns an unsubscribe function to clean up the listener
  return onSnapshot(q, (snapshot) => {
    const updates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Sort on client side to avoid requiring a composite index
    updates.sort((a: any, b: any) => b.timestamp - a.timestamp);
    callback(updates);
  }, (error: any) => {
    handleFirestoreError(error, OperationType.LIST, 'serviceUpdates');
  });
};

// Update User Profile Settings
export const updateUserProfileData = async (uid: string, updates: any) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, updates);
    return true;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
};

// Fetch high-level operational metrics and the master schedule
export const getClinicOperationsData = async (clinicId: string) => {
  const appointmentsRef = collection(db, 'appointments');
  
  // Get all appointments for today across all providers
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const q = query(
    appointmentsRef,
    where('clinicId', '==', clinicId),
    where('scheduledTime', '>=', startOfDay.getTime()),
    where('scheduledTime', '<=', endOfDay.getTime())
  );

  const querySnapshot = await getDocs(q);
  
  // Sort docs manually by scheduledTime
  const sortedDocs = [...querySnapshot.docs].sort((a, b) => {
    return (a.data().scheduledTime || 0) - (b.data().scheduledTime || 0);
  });
  
  let totalVolume = 0;
  let completedCount = 0;
  const masterSchedule = [];

  for (const docSnapshot of sortedDocs) {
    const apt = docSnapshot.data() as Appointment;
    totalVolume++;
    if (apt.status === 'completed') completedCount++;

    // Push simplified data for the master schedule
    masterSchedule.push({
      id: apt.appointmentId,
      time: new Date(apt.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: apt.status,
      type: apt.notes.includes('Trial') ? 'Trial Care' : 'Standard',
      petId: apt.petId
    });
  }

  return {
    metrics: {
      dailyVolume: totalVolume,
      completionRate: totalVolume > 0 ? Math.round((completedCount / totalVolume) * 100) : 0,
      activeStaff: 4, // Mocked for now
      currentWaitTime: '15 mins' // Mocked for now
    },
    masterSchedule
  };
};

// Notifications System
export const createNotification = async (userId: string, title: string, message: string, link?: string) => {
  try {
    const notifsRef = collection(db, 'notifications');
    const newDoc = await addDoc(notifsRef, {
      userId,
      title,
      message,
      read: false,
      timestamp: Date.now(),
      link: link || null
    });
    await updateDoc(newDoc, { id: newDoc.id });
    return newDoc.id;
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

export const subscribeToNotifications = (userId: string, callback: (notifications: any[]) => void) => {
  const notifsRef = collection(db, 'notifications');
  const q = query(
    notifsRef,
    where('userId', '==', userId)
  );
  
  return onSnapshot(q, (snapshot) => {
    const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    notifs.sort((a: any, b: any) => b.timestamp - a.timestamp);
    callback(notifs);
  }, (error: any) => {
    handleFirestoreError(error, OperationType.LIST, 'notifications');
  });
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const notifRef = doc(db, 'notifications', notificationId);
    await updateDoc(notifRef, { read: true });
  } catch (error) {
    console.error("Error marking notification read:", error);
  }
};

export const logActivity = async (userId: string, action: string, details: string) => {
  try {
    const logsRef = collection(db, 'activityLogs');
    const newDoc = await addDoc(logsRef, {
      userId,
      action,
      details,
      timestamp: Date.now()
    });
    
    // Optional: update with the doc ID if needed via updateDoc
    await updateDoc(newDoc, { id: newDoc.id });
    
    return newDoc.id;
  } catch (error) {
    console.error("Error logging activity:", error);
    // Don't throw for activity logging, as it shouldn't block the main flow.
  }
};

export const getActivityLogs = async (userId: string): Promise<any[]> => {
  try {
    const logsRef = collection(db, 'activityLogs');
    const q = query(
      logsRef,
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const logs = querySnapshot.docs.map(doc => doc.data());
    // Sort client-side to avoid requiring a composite index
    return logs.sort((a: any, b: any) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return [];
  }
};