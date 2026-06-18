export type PetType = 'dog' | 'cat' | 'bird' | 'other';

export interface WeightEntry {
  date: string;
  value: number;
}

export interface SurgeryRecord {
  date: string;
  procedure: string;
  surgeon: string;
  notes?: string;
}

export interface Pet {
  id: string;
  ownerId: string;
  name: string;
  type: PetType;
  breed: string;
  age: number;
  weight: number;
  image: string;
  birthday?: string;
  anniversary?: string;
  weightHistory?: WeightEntry[];
  eSamrudhaId?: string; // Integrated with Kerala AHD e-Samrudha Portal
  insuranceNumber?: string;
  isMicrochipped?: boolean;
  microchipId?: string;
  bloodGroup?: string;
  allergies?: string[];
  chronicConditions?: string[];
  surgicalHistory?: SurgeryRecord[];
  neutered?: boolean;
  mood?: 'happy' | 'playful' | 'sleepy' | 'calm' | 'anxious' | 'tired';
  healthScore?: number; // 0 to 100
}

export interface HealthRecord {
  id: string;
  petId: string;
  ownerId: string;
  date: string;
  type: 'vaccination' | 'checkup' | 'medication' | 'other';
  title: string;
  description: string;
  clinicalNotes?: string;
  attachments?: string[];
  nextDueDate?: string;
  reminderEnabled?: boolean;
  prescription?: string;
  verifiedByGov?: boolean; // New: Verification by government bodies
  govVerifyId?: string;
}



export interface PetDocument {
  id: string;
  petId: string;
  ownerId: string;
  title: string;
  type: 'report' | 'prescription' | 'certificate';
  date: string;
  imageUrl: string;
}

export interface QuickLog {
  id: string;
  petId: string;
  ownerId: string;
  type: 'food' | 'water' | 'pee' | 'poop' | 'walk' | 'play';
  timestamp: string;
  notes?: string;
}

export interface Service {
  id: string;
  providerId?: string;
  name: string;
  type: 'vet' | 'groomer' | 'boarding' | 'trainer' | 'shop' | 'breeder' | 'farm';
  rating: number;
  address: string;
  phone?: string;
  distance?: string;
  image: string;
  isSubsidized?: boolean;
  pricePoint?: 'budget' | 'standard' | 'premium';
  description?: string;
  tags?: string[];
  price?: number;
}

export interface InventoryItem {
  id: string;
  providerId: string;
  name: string;
  category: 'food' | 'accessory' | 'medicine' | 'other';
  price: number;
  stock: number;
  image?: string;
  description?: string;
}

export interface CommunityPost {
  id: string;
  author: string;
  authorImage: string;
  content: string;
  likes: number;
  comments: number;
  timestamp: string;
  tags: string[];
  liked?: boolean;
  isVet?: boolean;
  isUrgent?: boolean;
  location?: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  image: string;
  email: string;
  role: 'owner' | 'vet' | 'provider' | 'admin';
  providerType?: 'clinic' | 'hospital' | 'groomer' | 'boarding' | 'trainer' | 'shop' | 'breeder' | 'farm';
  location: string;
  onboardingComplete?: boolean;
  businessName?: string;
  professionalLicense?: string;
  isPremium?: boolean;
  bio?: string;
  phone?: string;
  verified?: boolean;
  createdAt: string;
}

export interface Appointment {
  id: string;
  petId: string;
  ownerId: string;
  vetId?: string;
  vetName?: string;
  serviceName: string;
  type: 'visit' | 'telehealth' | 'grooming' | 'other';
  date: string;
  time: string;
  durationMinutes?: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'confirmed' | 'pending';
  reason?: string;
  petName?: string;
  ownerName?: string;
  ownerPhone?: string;
  googleCalendarEventId?: string;
}

export interface PetNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'health' | 'appointment' | 'system';
  timestamp: string;
  read: boolean;
  link?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  iv?: string;
  timestamp: string;
  read: boolean;
}

export interface TrainingProgress {
  id: string;
  userId: string;
  moduleId: number;
  completedSteps: number;
  isCompleted: boolean;
}

export interface ActivityLog {
  id: string;
  petId: string;
  ownerId: string;
  name: string;
  time: string;
  location: string;
  type: 'walk' | 'play' | 'vet' | 'other';
  timestamp: string;
}

export interface BlockedSlot {
  id: string;
  vetId: string;
  date: string;
  time: string;
  reason?: string;
  petId?: string;
}

export interface SuggestedReminder {
  petId: string;
  title: string;
  type: 'vaccination' | 'checkup' | 'medication' | 'other';
  suggestedDate: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
}

export interface PatientSnapshot {
  petId: string;
  vitals: {
    temp?: string;
    heartRate?: string;
    weightTrend: 'stable' | 'increasing' | 'decreasing';
  };
  criticalFindings: string[];
  diagnosticPathways: string[];
  lastSummary: string;
}

export interface ProactiveSuggestion {
  petId: string;
  petName: string;
  type: 'vaccination' | 'checkup' | 'deworming' | 'screening';
  suggestedDate: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
}

export interface ZoolInsight {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  actionLabel?: string;
}

export interface UserTask {
  id: string;
  userId: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
  dueDate?: string;
}

export interface IVetAIService {
  analyzeSymptoms(symptoms: string, petInfo: string, imageBase64?: string): Promise<any>;
  generateSOAPNote(transcript: string): Promise<any>;
  getClinicalAssessment(query: string): Promise<any>;
  transcribeAudio(audioBase64: string, mimeType: string): Promise<string>;
  summarizeConversation(messages: any[]): Promise<string>;
  getPetAdvice(query: string, context: string): Promise<string>;
  getAIReminderSuggestions(pets: any[], records: any[]): Promise<any[]>;
}

export interface PublicAlert {
  id: string;
  title: string;
  message: string;
  type: string;
  severity: 'info' | 'warning' | 'critical' | 'low' | 'medium' | 'high';
  region: string;
  issuedBy?: string;
  timestamp: string;
  authorId?: string;
}

export interface PetLicense {
  id: string;
  petId: string;
  ownerId: string;
  licenseNumber: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'revoked';
  type?: string;
}
