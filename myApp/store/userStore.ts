import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

// Define the secure storage interface for Zustand
const secureStorage = {
  getItem: async (name: string) => {
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string) => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string) => {
    await SecureStore.deleteItemAsync(name);
  },
};

// User type definition
type User = {
  id: string;
  email: string | null;
  name: string | null;
  photoURL: string | null;
};

// Define the store type
type UserStore = {
  userType: 'user' | 'therapist' | null;
  user: User | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  setUserType: (type: 'user' | 'therapist') => void;
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  signOut: () => void;
};

// Create the store with persistence
export const useUserStore = create<UserStore>()(  
  persist(
    (set) => ({
      userType: null,
      user: null,
      isAuthenticated: false,
      hydrated: false,
      setUserType: (type) => set({ userType: type }),
      setUser: (user) => set({ user }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      signOut: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => secureStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hydrated = true;
        }
      },
    }
  )
);