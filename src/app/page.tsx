'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Car, MapPin, CreditCard, Shield } from 'lucide-react';

export default function HomePage() {
  const { user, isHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && user) {
      router.push('/dashboard');
    }
  }, [user, router, isHydrated]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-neutral-900">
        <div className="text-center">
          <div
            className="h-8 w-8 mx-auto mb-4 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin"
            aria-label="Loading"
            role="status"
          />
          <p className="text-neutral-600">Loading…</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-neutral-900">
        <p className="text-neutral-600">Redirecting to dashboard…</p>
      </div>
    );
  }

  return (
    <div
      className="
        min-h-screen
        bg-white text-neutral-900
        [--accent:theme(colors.black)]
      "
    >
      {/* Header */}
      <header className="border-b border-neutral-200">
        <nav className="container mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-semibold tracking-tight">Lastmile</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button
                variant="ghost"
                className="px-3 h-9 text-neutral-900 hover:bg-neutral-100"
              >
                Sign in
              </Button>
            </Link>
            <Link href="/register">
              <Button
                className="
                  px-3 h-9
                  bg-[var(--accent)] text-white
                  hover:bg-neutral-800
                "
              >
                Get started
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="container mx-auto max-w-5xl px-4">
        <section className="py-14 md:py-20 border-b border-neutral-200">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight">
              Go anywhere with Lastmile
            </h1>
            <p className="mt-4 text-base md:text-lg text-neutral-600">
              Request a ride or drive on your schedule with a clean, distraction‑free experience built for speed and clarity.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/register">
                <Button
                  className="
                    h-10 px-5
                    bg-[var(--accent)] text-white
                    hover:bg-neutral-800
                  "
                >
                  Book a ride
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  variant="outline"
                  className="
                    h-10 px-5
                    border border-neutral-900 text-neutral-900
                    hover:bg-neutral-100
                  "
                >
                  Drive & earn
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-10 md:py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Feature
              icon={<MapPin className="h-5 w-5" aria-hidden />}
              title="Easy pickup"
              desc="Set your pickup with a tap on a clean, zoomable map."
            />
            <Feature
              icon={<Car className="h-5 w-5" aria-hidden />}
              title="Quick rides"
              desc="Get matched with nearby drivers and arrive faster."
            />
            <Feature
              icon={<CreditCard className="h-5 w-5" aria-hidden />}
              title="Simple payments"
              desc="Stripe‑powered, secure card payments with receipts."
            />
            <Feature
              icon={<Shield className="h-5 w-5" aria-hidden />}
              title="Safety first"
              desc="Trips are tracked and protected end‑to‑end."
            />
          </div>
        </section>

        {/* CTA */}
        <section className="py-10 md:py-14 border-t border-neutral-200">
          <div className="max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Ready to start?
            </h2>
            <p className="mt-3 text-neutral-600">
              Join riders and drivers who choose a focused, minimal experience that gets out of the way.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link href="/register">
                <Button
                  className="
                    h-10 px-5
                    bg-[var(--accent)] text-white
                    hover:bg-neutral-800
                  "
                >
                  Sign up as rider
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  variant="outline"
                  className="
                    h-10 px-5
                    border border-neutral-900 text-neutral-900
                    hover:bg-neutral-100
                  "
                >
                  Sign up as driver
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-neutral-200">
        <div className="container mx-auto max-w-5xl px-4 py-6 text-sm text-neutral-600">
          <p>© 2025 Lastmile</p>
        </div>
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Card
      className="
        border border-neutral-200
        rounded-md
        shadow-none
        bg-white
      "
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 flex items-center justify-center border border-neutral-900 rounded-[4px]">
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-medium">{title}</h3>
            <p className="mt-1 text-sm text-neutral-600">{desc}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
