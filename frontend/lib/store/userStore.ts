import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { USER_ID_KEY } from '../constants';

export type UserRole = 'user' | 'therapist';

interface UserState {
  userId: string | null;
  userRole: UserRole | null;
  userName: string | null;
  emotion: string | null;
  sentiment: string | null;
  isAuthenticated: boolean;
  setUser: (id: string, role: UserRole, name: string) => void;
  setUserId: (id: string) => void;
  setEmotion: (emotion: string | null) => void;
  setSentiment: (sentiment: string | null) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userId: null,
      userRole: null,
      userName: null,
      emotion: null,
      sentiment: null,
      isAuthenticated: false,
      setUser: (id, role, name) => set({ userId: id, userRole: role, userName: name, isAuthenticated: true }),
      setUserId: (id) => set({ userId: id }),
      setEmotion: (emotion) => set({ emotion }),
      setSentiment: (sentiment) => set({ sentiment }),
      clearUser: () => set({ userId: null, userRole: null, userName: null, emotion: null, sentiment: null, isAuthenticated: false }),
    }),
    {
      name: USER_ID_KEY,
    }
  )
);
