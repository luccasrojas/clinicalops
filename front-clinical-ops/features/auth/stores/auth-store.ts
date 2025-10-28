import { create } from 'zustand';
import { User } from '@/types/auth';

type AuthStore = {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  initializeAuth: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('idToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
    set({
      user: null,
      isAuthenticated: false,
    });
  },

  initializeAuth: () => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('accessToken');

      if (userStr && token) {
        try {
          const user = JSON.parse(userStr) as User;
          set({
            user,
            isAuthenticated: true,
          });
        } catch (error) {
          console.error('Error parsing user from localStorage:', error);
          set({
            user: null,
            isAuthenticated: false,
          });
        }
      }
    }
  },
}));
