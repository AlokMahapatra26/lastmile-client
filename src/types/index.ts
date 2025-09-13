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
  ride_type: string;
  status: 'requested' | 'accepted' | 'picked_up' | 'in_progress' | 'completed' | 'awaiting_payment' | 'cancelled';
  estimated_fare: number;
  final_fare?: number;
  payment_status: 'pending' | 'paid' | 'failed';
  created_at: string;
  rider?: User;
  driver?: User;
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
