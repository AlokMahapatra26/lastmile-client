import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

interface User {
  created_at: string | number | Date;
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  user_type: 'rider' | 'driver';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isHydrated: boolean; // NEW: Track hydration state
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  setHydrated: (state: boolean) => void; // NEW: Method to set hydration state
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  userType: 'rider' | 'driver';
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isHydrated: false, // NEW: Initially false

      setHydrated: (state: boolean) => {
        set({ isHydrated: state });
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/api/auth/login', { email, password });
          const { user, token } = response.data;
          
          localStorage.setItem('token', token);
          set({ user, token, isLoading: false });
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(error.response?.data?.error || 'Login failed');
        }
      },

      register: async (userData: RegisterData) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/api/auth/register', userData);
          const { user, token } = response.data;
          
          localStorage.setItem('token', token);
          set({ user, token, isLoading: false });
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(error.response?.data?.error || 'Registration failed');
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null });
      },

      updateProfile: async (data: Partial<User>) => {
        try {
          const response = await api.put('/api/users/profile', data);
          const { user } = response.data;
          set({ user });
        } catch (error: any) {
          throw new Error(error.response?.data?.error || 'Profile update failed');
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
      onRehydrateStorage: () => (state) => {
        // NEW: Called when data is loaded from localStorage
        console.log('Auth state rehydrated:', state);
        state?.setHydrated(true);
      },
    }
  )
);
