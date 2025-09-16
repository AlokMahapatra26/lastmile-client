import { useShortAddress } from '@/hooks/useAddress';

interface AddressDisplayProps {
  lat: number;
  lng: number;
  fallback?: string;
  className?: string;
}

export function AddressDisplay({ lat, lng, fallback, className = "text-sm text-gray-600" }: AddressDisplayProps) {
  const { address, isLoading } = useShortAddress(lat, lng);

  if (isLoading) {
    return (
      <div className={className}>
        <span className="animate-pulse">Loading address...</span>
      </div>
    );
  }

  return (
    <p className={className}>
      {address || fallback || `${lat.toFixed(6)}, ${lng.toFixed(6)}`}
    </p>
  );
}
