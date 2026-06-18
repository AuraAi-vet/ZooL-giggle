import { create } from 'zustand';

interface UseCommerceStore {
  isOffline: boolean;
  showMap: boolean;
  pendingMutationsCount: number;
  bookings: Array<any>;
  addBooking: (booking: any) => void;
  hasPendingMutations: () => boolean;
  setPendingMutationsCount: (count: number) => void;
  toggleMap: () => void;
}

export const useCommerceStore = create<UseCommerceStore>((set, get) => ({
  isOffline: false,
  showMap: true,
  pendingMutationsCount: 0,
  bookings: [],
  addBooking: (booking) => {
    set((state) => ({ 
      bookings: [...state.bookings, booking],
      pendingMutationsCount: state.pendingMutationsCount + 1 
    }));
    // Simulate automated offline sync after 2.5 seconds
    setTimeout(() => {
      set((state) => ({ pendingMutationsCount: Math.max(0, state.pendingMutationsCount - 1) }));
    }, 2500);
  },
  hasPendingMutations: () => {
    return get().pendingMutationsCount > 0;
  },
  setPendingMutationsCount: (count: number) => set({ pendingMutationsCount: count }),
  toggleMap: () => set((state) => ({ showMap: !state.showMap })),
}));
