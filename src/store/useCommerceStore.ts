import { create } from 'zustand';
import { Booking } from '../types/forms';

interface UseCommerceStore {
  isOffline: boolean;
  showMap: boolean;
  pendingMutationsCount: number;
  bookings: Booking[];
  addBooking: (booking: Booking) => void;
  hasPendingMutations: () => boolean;
  setPendingMutationsCount: (count: number) => void;
  toggleMap: () => void;
  clearPendingBookings: () => void;
}

export const useCommerceStore = create<UseCommerceStore>((set, get) => {
  let timeoutId: NodeJS.Timeout | null = null;

  return {
    isOffline: false,
    showMap: true,
    pendingMutationsCount: 0,
    bookings: [],
    addBooking: (booking: Booking) => {
      set((state) => ({
        bookings: [...state.bookings, booking],
        pendingMutationsCount: state.pendingMutationsCount + 1
      }));

      // Clear previous timeout if exists
      if (timeoutId) clearTimeout(timeoutId);

      // Simulate automated offline sync after 2.5 seconds
      timeoutId = setTimeout(() => {
        set((state) => ({
          pendingMutationsCount: Math.max(0, state.pendingMutationsCount - 1)
        }));
      }, 2500);
    },
    hasPendingMutations: () => get().pendingMutationsCount > 0,
    setPendingMutationsCount: (count: number) => set({ pendingMutationsCount: count }),
    toggleMap: () => set((state) => ({ showMap: !state.showMap })),
    clearPendingBookings: () => {
      if (timeoutId) clearTimeout(timeoutId);
      set({ bookings: [], pendingMutationsCount: 0 });
    }
  };
});
