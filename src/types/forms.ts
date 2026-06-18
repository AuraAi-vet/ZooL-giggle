/**
 * Form-related TypeScript interfaces
 * Replaces 'any' types for better type safety
 */

export interface UserProfileForm {
  displayName: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  language: 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja';
}

export interface Booking {
  id: string;
  petId: string;
  clinicId: string;
  timestamp: number;
  description: string;
  userId: string;
}

export interface CatalogItem {
  id: string;
  providerId: string;
  type: 'service' | 'product';
  name: string;
  description: string;
  price: number;
  duration?: number;
  stock?: number;
  isActive?: boolean;
}

export interface OperationsData {
  metrics: {
    dailyVolume: number;
    completionRate: number;
    activeStaff: number;
    currentWaitTime: string;
  };
  masterSchedule: Appointment[];
}

export interface Appointment {
  id: string;
  time: string;
  type: string;
  status: 'pending' | 'completed' | 'cancelled';
}
