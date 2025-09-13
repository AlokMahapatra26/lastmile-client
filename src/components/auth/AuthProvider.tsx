'use client';

import { useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/store/auth';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { token, setHydrated, isHydrated } = useAuthStore();

  useEffect(() => {
    // Set token in localStorage if it exists in store
    if (token) {
      localStorage.setItem('token', token);
    }

    // Mark as hydrated after a brief delay to ensure persistence has loaded
    if (!isHydrated) {
      const timer = setTimeout(() => {
        setHydrated(true);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [token, isHydrated, setHydrated]);

  return <>{children}</>;
}
