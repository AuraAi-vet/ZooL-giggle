// src/types.ts

// 1. Users Collection
export interface UserProfile {
  uid: string;           // Firebase Auth UID
  email: string;
  roleId: string;        // e.g., 'role_owner_01', 'role_vet_02'
  displayName: string;
  language?: string;
  preferences?: {
    emailNotifications: boolean;
    smsNotifications: boolean;
  };
  createdAt: number;     // Unix timestamp
}

// 2. Pets Collection (Linked to UserProfile)
export interface PetProfile {
  petId: string;
  ownerUid: string;      // Links back to UserProfile.uid
  name: string;
  species: string;       // e.g., 'Dog', 'Cat'
  breed: string;         // e.g., 'Samoyed'
  age: number;
  weightKg: number;
  imageUrl?: string;     // URL to profile image
  trialModeActive: boolean;
}

// 3. Appointments Collection (The Booking Pipeline)
export interface Appointment {
  id?: string;
  appointmentId?: string;

  petId: string;
  ownerUid: string;
  clinicId: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  scheduledTime: number; // Unix timestamp
  notes: string;         // E.g., "ZooL scratching coat"
}

// 4. Activity Logs Collection
export interface ActivityLog {
  id: string;            // Firestore document ID
  userId: string;        // Firebase Auth UID
  action: string;        // E.g., "Updated profile", "Scheduled appointment"
  details: string;       // E.g., "Changed email address to x@y.com"
  timestamp: number;     // Unix timestamp
}

// 5. Notifications Collection
export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: number;
  link?: string;
}
