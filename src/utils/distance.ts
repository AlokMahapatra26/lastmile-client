/**
 * Calculate distance between two coordinates using Haversine formula
 * @param coord1 [latitude, longitude] of first point
 * @param coord2 [latitude, longitude] of second point
 * @returns distance in kilometers
 */
export function calculateDistance(
  coord1: [number, number], 
  coord2: [number, number]
): number {
  const toRad = (x: number) => (x * Math.PI) / 180;

  const R = 6371; // Earth's radius in kilometers
  const [lat1, lon1] = coord1;
  const [lat2, lon2] = coord2;
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance; // Distance in kilometers
}

/**
 * Format distance for display
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
}

/**
 * Estimate travel time (rough calculation)
 * Assumes average city driving speed of 30 km/h
 */
export function estimateTravelTime(distanceKm: number): string {
  const avgSpeedKmh = 30; // Average city speed
  const timeHours = distanceKm / avgSpeedKmh;
  const timeMinutes = Math.round(timeHours * 60);
  
  if (timeMinutes < 60) {
    return `${timeMinutes} min`;
  }
  
  const hours = Math.floor(timeMinutes / 60);
  const minutes = timeMinutes % 60;
  return `${hours}h ${minutes}m`;
}
