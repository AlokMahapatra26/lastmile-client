'use client';

import dynamic from 'next/dynamic';
import { ComponentProps } from 'react';

// Dynamically import the MapComponent with no SSR
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-96 w-full bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
      <div className="text-gray-500">Loading map...</div>
    </div>
  )
});

// Re-export with the same props
export default function MapWrapper(props: ComponentProps<typeof MapComponent>) {
  return <MapComponent {...props} />;
}
