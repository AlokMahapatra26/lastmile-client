'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, MapPin, CreditCard, Shield } from 'lucide-react';

export default function HomePage() {
  const { user, isHydrated } = useAuthStore(); // NEW: Also get isHydrated
  const router = useRouter();

  useEffect(() => {
    // Only redirect if hydration is complete AND user exists
    if (isHydrated && user) {
      router.push('/dashboard');
    }
  }, [user, router, isHydrated]); // NEW: Include isHydrated

  // NEW: Show loading while hydrating
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

  // Don't render anything if user exists (redirect in progress)
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Car className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">UberClone</span>
          </div>
          <div className="space-x-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Rest of your home page content... */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Go anywhere with <span className="text-blue-600">UberClone</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Request a ride, hop in, and go. Or become a driver and earn money on your schedule.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/register">
              <Button size="lg" className="px-8 py-3">
                Book a Ride
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="lg" className="px-8 py-3">
                Drive & Earn
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <MapPin className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              <CardTitle>Easy Pickup</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Set your pickup location with just a few taps on our interactive map.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Car className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <CardTitle>Quick Rides</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Get matched with nearby drivers and reach your destination fast.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CreditCard className="h-12 w-12 text-purple-600 mx-auto mb-2" />
              <CardTitle>Easy Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Secure payment processing with Stripe. Pay with your card seamlessly.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Shield className="h-12 w-12 text-red-600 mx-auto mb-2" />
              <CardTitle>Safe & Secure</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Your safety is our priority. All rides are tracked and secure.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to get started?
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Join thousands of riders and drivers who trust UberClone for their transportation needs.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto px-8 py-3">
                Sign Up as Rider
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-3">
                Sign Up as Driver
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-16 border-t">
        <div className="text-center text-gray-600">
          <p>&copy; 2025 UberClone. A demo ride-sharing application.</p>
          <p className="mt-2 text-sm">
            Built with Next.js, Express.js, Supabase, and Stripe
          </p>
        </div>
      </footer>
    </div>
  );
}
