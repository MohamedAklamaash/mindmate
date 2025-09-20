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
  currentEmotion: string | null; // Current emotion from app-exit analysis
  setUserType: (type: 'user' | 'therapist') => void;
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setNeedsNickname: (needs: boolean) => void;
  setOnboardingStage: (stage: 'none' | 'namePage' | 'questionOne' | 'questionTwo' | 'questionThree' | 'questionFour' | 'questionFive' | 'questionSix' | 'questionSeven' | 'questionEight' | 'questionNine' | 'questionTen') => void;
  setUserFirestoreId: (firestoreId: string) => void; // Add method to set Firestore ID
  setUserId: (u_id: string) => void; // Add method to set persistent user ID
  setCurrentEmotion: (emotion: string | null) => void; // Add method to set current emotion
  getUserEmail: () => string | null; // Helper method to get user email
  signOut: () => void;
};

// Create the store with persistence
export const useUserStore = create<UserStore>()(  
  persist(
    (set, get) => ({
      userType: null,
      user: null,
      isAuthenticated: false,
      hydrated: false,
      needsNickname: false,
      onboardingStage: 'none',
      u_id: null,
      currentEmotion: null,
      setUserType: (type) => set({ userType: type }),
      setUser: (user) => {
        console.log('Setting user in store with email:', user?.email); // Debug log
        set({ user });
      },
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setNeedsNickname: (needs) => set({ needsNickname: needs }),
      setOnboardingStage: (stage) => set({ onboardingStage: stage }),
      setUserFirestoreId: (firestoreId) => set((state) => ({ 
        user: state.user ? { ...state.user, firestoreId } : null 
      })),
      setUserId: (u_id) => set({ u_id }),
      setCurrentEmotion: (emotion) => set({ currentEmotion: emotion }),
      getUserEmail: () => {
        const state = get();
        return state.user?.email || null;
      },
      signOut: () => set({ user: null, isAuthenticated: false, u_id: null, currentEmotion: null }),
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