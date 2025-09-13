'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import RiderDashboard from '@/components/rides/RiderDashboard';
import DriverDashboard from '@/components/rides/DriverDashboard';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user.user_type === 'rider' ? <RiderDashboard /> : <DriverDashboard />}
    </div>
  );
}
