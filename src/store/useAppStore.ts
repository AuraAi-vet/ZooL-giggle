import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';
import { PetProfile } from '../types';

export type ApplicationRole = 'role_owner_01' | 'role_vet_02' | 'role_admin_03' | 'role_service_04' | null;

interface AppState {
  // Auth State
  user: FirebaseUser | null;
  role: ApplicationRole;
  isInitializing: boolean;
  
  // Data State
  pets: PetProfile[];
  activePetId: string | null;
  
  // Actions
  setAuth: (user: FirebaseUser | null, role: ApplicationRole) => void;
  setRole: (role: ApplicationRole) => void;
  setInitializing: (isInitializing: boolean) => void;
  
  setPets: (pets: PetProfile[]) => void;
  setActivePetId: (id: string | null) => void;
  addPet: (pet: PetProfile) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  role: null,
  isInitializing: true,
  
  pets: [],
  activePetId: null,

  setAuth: (user, role) => set({ user, role, isInitializing: false }),
  setRole: (role) => set({ role }),
  setInitializing: (isInitializing) => set({ isInitializing }),
  
  setPets: (pets) => set((state) => ({ 
    pets, 
    activePetId: state.activePetId || (pets.length > 0 ? pets[0].petId : null) 
  })),
  setActivePetId: (id) => set({ activePetId: id }),
  addPet: (pet) => set((state) => ({ 
    pets: [...state.pets, pet],
    activePetId: state.activePetId || pet.petId
  })),
}));
