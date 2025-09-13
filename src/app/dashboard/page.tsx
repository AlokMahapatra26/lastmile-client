'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import RiderDashboard from '@/components/rides/RiderDashboard';
import DriverDashboard from '@/components/rides/DriverDashboard';

export default function DashboardPage() {
  const { user, isHydrated } = useAuthStore(); // NEW: Also get isHydrated
  const router = useRouter();

  useEffect(() => {
    // Only redirect if hydration is complete AND user is null
    if (isHydrated && !user) {
      router.push('/login');
    }
  }, [user, router, isHydrated]); // NEW: Include isHydrated in dependencies

  // NEW: Show loading state while hydrating
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading if user is null after hydration (redirect in progress)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user.user_type === 'rider' ? <RiderDashboard /> : <DriverDashboard />}
    </div>
  );
}
