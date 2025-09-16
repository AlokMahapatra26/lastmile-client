import api from './api';
import { Ride } from '@/types'; // Import your Ride interface

// Define specific API response types
interface CancelRideResponse {
  message: string;
  ride: Ride;
}

interface DeclineRideResponse {
  message: string;
  ride: Ride;
}

// Type for axios error structure
interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
    status?: number;
  };
  message?: string;
}

/**
 * Cancel ride as a rider
 * @param rideId - The unique identifier of the ride to cancel
 * @param reason - Optional reason for cancellation
 * @returns Promise that resolves to the API response
 */
export async function cancelRide(
  rideId: string, 
  reason?: string
): Promise<CancelRideResponse> {
  try {
    const response = await api.post<CancelRideResponse>(`/api/rides/${rideId}/cancel`, {
      reason
    });
    return response.data;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.response?.data?.error || 
      apiError.message || 
      'Failed to cancel ride'
    );
  }
}

/**
 * Decline ride as a driver
 * @param rideId - The unique identifier of the ride to decline
 * @param reason - Optional reason for declining
 * @returns Promise that resolves to the API response
 */
export async function declineRide(
  rideId: string, 
  reason?: string
): Promise<DeclineRideResponse> {
  try {
    const response = await api.post<DeclineRideResponse>(`/api/rides/${rideId}/decline`, {
      reason
    });
    return response.data;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw new Error(
      apiError.response?.data?.error || 
      apiError.message || 
      'Failed to decline ride'
    );
  }
}


/**
 * Submit rating and review for a ride
 */
export async function submitRating(
  rideId: string, 
  rating: number | null, 
  review: string = ''
): Promise<any> {
  try {
    const response = await api.post(`/api/rides/${rideId}/rate`, {
      rating,
      review
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to submit rating');
  }
}

/**
 * Get ratings for a ride
 */
export async function getRideRatings(rideId: string): Promise<any> {
  try {
    const response = await api.get(`/api/rides/${rideId}/ratings`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to get ratings');
  }
}

