import { create } from 'zustand';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  query, 
  where,
  onSnapshot
} from 'firebase/firestore';
import { Service, InventoryItem } from '../types';

interface ServiceStore {
  services: Service[];
  inventoryItems: InventoryItem[];
  addService: (service: Omit<Service, 'id'>) => Promise<void>;
  updateService: (id: string, service: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => Promise<void>;
  initializeListeners: (providerId?: string) => () => void;
}

export const useServiceStore = create<ServiceStore>((set) => ({
  services: [],
  inventoryItems: [],
  addService: async (service) => {
    await addDoc(collection(db, 'services'), service);
  },
  updateService: async (id, service) => {
    await updateDoc(doc(db, 'services', id), service);
  },
  deleteService: async (id) => {
    await deleteDoc(doc(db, 'services', id));
  },
  addInventoryItem: async (item) => {
    await addDoc(collection(db, 'inventoryItems'), item);
  },
  initializeListeners: (providerId?: string) => {
    let servicesQuery;
    
    if (providerId) {
      servicesQuery = query(collection(db, 'services'), where('providerId', '==', providerId));
    } else {
      servicesQuery = collection(db, 'services');
    }

    const unsubServices = onSnapshot(servicesQuery, (snapshot) => {
      const services = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
      set({ services });
    }, (error) => {
      console.error("Failed to fetch services:", error);
    });

    let inventoryQuery;
    if (providerId) {
      inventoryQuery = query(collection(db, 'inventoryItems'), where('providerId', '==', providerId));
    } else {
      inventoryQuery = collection(db, 'inventoryItems'); // Optional, mainly for app admins
    }

    const unsubInventory = onSnapshot(inventoryQuery, (snapshot) => {
      const inventoryItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
      set({ inventoryItems });
    }, (error) => {
      console.error("Failed to fetch inventory:", error);
    });

    return () => {
      unsubServices();
      unsubInventory();
    };
  }
}));
