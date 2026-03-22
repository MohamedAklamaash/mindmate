import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { USER_ID_KEY } from '../constants';

interface UserState {
  userId: string | null;
  userName: string | null;
  emotion: string | null;
  sentiment: string | null;
  isAuthenticated: boolean;
  setUser: (id: string, name: string) => void;
  setEmotion: (emotion: string | null) => void;
  setSentiment: (sentiment: string | null) => void;
  clearUser: () => void;
}

// Only persist userId + userName (identity), not chat data
export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userId: null,
      userName: null,
      emotion: null,
      sentiment: null,
      isAuthenticated: false,
      setUser: (id, name) => set({ userId: id, userName: name, isAuthenticated: true }),
      setEmotion: (emotion) => set({ emotion }),
      setSentiment: (sentiment) => set({ sentiment }),
      clearUser: () => set({ userId: null, userName: null, emotion: null, sentiment: null, isAuthenticated: false }),
    }),
    {
      name: USER_ID_KEY,
      partialize: (state) => ({ userId: state.userId, userName: state.userName, isAuthenticated: state.isAuthenticated }),
    }
  )
);
