export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  user_type: 'rider' | 'driver';
  current_latitude?: number;
  current_longitude?: number;
  is_active: boolean;
  created_at: string;
  average_rating: number;
  total_ratings: number;
}

export interface Ride {
  id: string;
  rider_id: string;
  driver_id?: string;
  pickup_latitude: number;
  pickup_longitude: number;
  pickup_address: string;
  destination_latitude: number;
  destination_longitude: number;
  destination_address: string;
  status: string;
  estimated_fare: number;
  final_fare?: number;
  payment_status: string;
  payment_intent_id?: string;
  ride_type: string;
  created_at: string;
  updated_at: string;
  paid_at?: string;
  
  // NEW: Add these optional rating fields
  rated_by_rider?: boolean;
  rated_by_driver?: boolean;
  rider_rating?: number;
  driver_rating?: number;
  rider_review?: string;
  driver_review?: string;
  
  // NEW: Add these optional cancellation fields
  cancelled_by?: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  
  // Relations (if you have them)
  rider?: {
    first_name: string;
    last_name: string;
    phone_number: string;
    average_rating?: number;
    total_ratings?: number;
  };
  driver?: {
    first_name: string;
    last_name: string;
    phone_number: string;
    average_rating?: number;
    total_ratings?: number;
  };
}


export interface CreateRideRequest {
  pickupLatitude: number;
  pickupLongitude: number;
  pickupAddress: string;
  destinationLatitude: number;
  destinationLongitude: number;
  destinationAddress: string;
  rideType?: string;
}

export interface Rating {
  id: string;
  ride_id: string;
  rating: number | null;
  review: string | null;
  rated_by: string;
  rated_user: string;
  created_at: string;
  updated_at: string;
}