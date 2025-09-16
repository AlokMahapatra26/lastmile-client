import axios from 'axios';

/**
 * Generate cache key for coordinates
 */
function getCacheKey(lat: number, lng: number): string {
  return `addr_${lat.toFixed(6)}_${lng.toFixed(6)}`;
}

/**
 * Get cached address from localStorage
 */
function getCachedAddress(lat: number, lng: number): string | null {
  try {
    const key = getCacheKey(lat, lng);
    const cached = localStorage.getItem(key);
    
    if (cached) {
      const data = JSON.parse(cached);
      
      // Check if cache is expired (optional - cache for 7 days)
      const cacheAge = Date.now() - data.timestamp;
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
      
      if (cacheAge < maxAge) {
        return data.address;
      } else {
        // Remove expired cache
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.warn('Error reading from cache:', error);
  }
  
  return null;
}

/**
 * Cache address in localStorage
 */
function cacheAddress(lat: number, lng: number, address: string): void {
  try {
    const key = getCacheKey(lat, lng);
    const data = {
      address,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Error caching address:', error);
  }
}

/**
 * Fetch address with caching support
 */
export async function fetchAddress(lat: number, lng: number): Promise<string> {
  // First check cache
  const cached = getCachedAddress(lat, lng);
  if (cached) {
    console.log('Address loaded from cache');
    return cached;
  }

  // If not in cache, fetch from API
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        lat,
        lon: lng,
        format: 'json',
        'accept-language': 'en'
      },
      headers: {
        'User-Agent': 'YourRideApp/1.0'
      },
      timeout: 10000 // 10 second timeout
    });

    const address = response.data?.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    
    // Cache the result
    cacheAddress(lat, lng, address);
    console.log('Address fetched from API and cached');
    
    return address;
  } catch (error) {
    console.error('Failed to fetch address:', error);
    
    // Return coordinates as fallback
    const fallback = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    
    // Cache the fallback to avoid repeated failures
    cacheAddress(lat, lng, fallback);
    
    return fallback;
  }
}

/**
 * Fetch short address with caching support
 */
export async function fetchShortAddress(lat: number, lng: number): Promise<string> {
  // Check cache with short address key
  const shortKey = `short_${getCacheKey(lat, lng)}`;
  
  try {
    const cached = localStorage.getItem(shortKey);
    if (cached) {
      const data = JSON.parse(cached);
      const cacheAge = Date.now() - data.timestamp;
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      if (cacheAge < maxAge) {
        console.log('Short address loaded from cache');
        return data.address;
      }
    }
  } catch (error) {
    console.warn('Error reading short address cache:', error);
  }

  // Fetch from API if not cached
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        lat,
        lon: lng,
        format: 'json',
        'accept-language': 'en'
      },
      headers: {
        'User-Agent': 'YourRideApp/1.0'
      },
      timeout: 10000
    });

    let shortAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    
    if (response.data && response.data.address) {
      const { house_number, road, city, town, village, state } = response.data.address;
      
      // Build a clean short address
      let address = '';
      if (house_number && road) {
        address = `${house_number} ${road}`;
      } else if (road) {
        address = road;
      }
      
      const location = city || town || village || state;
      if (location) {
        address += address ? `, ${location}` : location;
      }
      
      shortAddress = address || response.data.display_name || shortAddress;
    }
    
    // Cache the short address
    try {
      localStorage.setItem(shortKey, JSON.stringify({
        address: shortAddress,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Error caching short address:', error);
    }
    
    console.log('Short address fetched from API and cached');
    return shortAddress;
  } catch (error) {
    console.error('Failed to fetch short address:', error);
    
    const fallback = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    
    // Cache the fallback
    try {
      localStorage.setItem(shortKey, JSON.stringify({
        address: fallback,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Error caching fallback address:', error);
    }
    
    return fallback;
  }
}

/**
 * Clear address cache (useful for debugging)
 */
export function clearAddressCache(): void {
  try {
    const keys = Object.keys(localStorage);
    const addressKeys = keys.filter(key => 
      key.startsWith('addr_') || key.startsWith('short_addr_')
    );
    
    addressKeys.forEach(key => localStorage.removeItem(key));
    console.log(`Cleared ${addressKeys.length} cached addresses`);
  } catch (error) {
    console.warn('Error clearing address cache:', error);
  }
}

/**
 * Get cache statistics
 */
export function getAddressCacheStats(): { count: number; sizeKB: number } {
  try {
    const keys = Object.keys(localStorage);
    const addressKeys = keys.filter(key => 
      key.startsWith('addr_') || key.startsWith('short_addr_')
    );
    
    const totalSize = addressKeys.reduce((size, key) => {
      const value = localStorage.getItem(key) || '';
      return size + (key.length + value.length) * 2; // 2 bytes per character
    }, 0);
    
    return {
      count: addressKeys.length,
      sizeKB: Math.round(totalSize / 1024)
    };
  } catch (error) {
    console.warn('Error calculating cache stats:', error);
    return { count: 0, sizeKB: 0 };
  }
}