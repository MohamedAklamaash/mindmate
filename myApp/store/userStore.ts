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
  firestoreId?: string; // Add Firestore document ID
};

// Define the store type
type UserStore = {
  userType: 'user' | 'therapist' | null;
  user: User | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  needsNickname: boolean;
  onboardingStage: 'none' | 'namePage' | 'questionOne' | 'questionTwo' | 'questionThree' | 'questionFour' | 'questionFive' | 'questionSix' | 'questionSeven' | 'questionEight' | 'questionNine' | 'questionTen';
  u_id: string | null; // Persistent user ID from Firestore
  setUserType: (type: 'user' | 'therapist') => void;
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setNeedsNickname: (needs: boolean) => void;
  setOnboardingStage: (stage: 'none' | 'namePage' | 'questionOne' | 'questionTwo' | 'questionThree' | 'questionFour' | 'questionFive' | 'questionSix' | 'questionSeven' | 'questionEight' | 'questionNine' | 'questionTen') => void;
  setUserFirestoreId: (firestoreId: string) => void; // Add method to set Firestore ID
  setUserId: (u_id: string) => void; // Add method to set persistent user ID
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
      needsNickname: false,
      onboardingStage: 'none',
      u_id: null,
      setUserType: (type) => set({ userType: type }),
      setUser: (user) => set({ user }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setNeedsNickname: (needs) => set({ needsNickname: needs }),
      setOnboardingStage: (stage) => set({ onboardingStage: stage }),
      setUserFirestoreId: (firestoreId) => set((state) => ({ 
        user: state.user ? { ...state.user, firestoreId } : null 
      })),
      setUserId: (u_id) => set({ u_id }),
      signOut: () => set({ user: null, isAuthenticated: false, u_id: null }),
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