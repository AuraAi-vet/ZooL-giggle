import { UserProfile, Service, Appointment } from '../types';

export const canManageServices = (profile: UserProfile): boolean => {
  return profile.role === 'provider';
};

export const canManageThisService = (profile: UserProfile, service: Service): boolean => {
  return profile.role === 'provider' && service.providerId === profile.uid;
};

export const canManageAppointments = (profile: UserProfile): boolean => {
  return profile.role === 'provider' || profile.role === 'vet';
};

export const canManageThisAppointment = (profile: UserProfile, appointment: Appointment): boolean => {
  // Simple check: vetId or (if service provider, check service provider id later)
  return profile.role === 'provider' || profile.role === 'vet';
};

export const canAccessClientData = (profile: UserProfile): boolean => {
  return profile.role === 'provider' || profile.role === 'vet';
};
