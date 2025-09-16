import { useState, useEffect } from 'react';
import { fetchAddress, fetchShortAddress } from '@/utils/address';

/**
 * Hook to get full address from coordinates
 */
export function useAddress(lat?: number, lng?: number) {
  const [address, setAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (lat !== undefined && lng !== undefined) {
      setIsLoading(true);
      fetchAddress(lat, lng)
        .then(setAddress)
        .finally(() => setIsLoading(false));
    }
  }, [lat, lng]);

  return { address, isLoading };
}

/**
 * Hook to get short address from coordinates
 */
export function useShortAddress(lat?: number, lng?: number) {
  const [address, setAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (lat !== undefined && lng !== undefined) {
      setIsLoading(true);
      fetchShortAddress(lat, lng)
        .then(setAddress)
        .finally(() => setIsLoading(false));
    }
  }, [lat, lng]);

  return { address, isLoading };
}
