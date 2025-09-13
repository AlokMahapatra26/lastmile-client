'use client';

import { useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/store/auth';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { token } = useAuthStore();

  useEffect(() => {
    // Set token in localStorage if it exists in store
    if (token) {
      localStorage.setItem('token', token);
    }
  }, [token]);

  return <>{children}</>;
}
