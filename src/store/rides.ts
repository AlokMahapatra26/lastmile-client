import { create } from 'zustand';
import api from '@/lib/api';
import { Ride, CreateRideRequest } from '@/types';

interface RideState {
  rides: Ride[];
  currentRide: Ride | null;
  availableRides: Ride[];
  isLoading: boolean;
  createRide: (rideData: CreateRideRequest) => Promise<Ride>;
  getMyRides: () => Promise<void>;
  getAvailableRides: () => Promise<void>;
  acceptRide: (rideId: string) => Promise<void>;
  updateRideStatus: (rideId: string, status: string) => Promise<void>;
}

export const useRideStore = create<RideState>((set, get) => ({
  rides: [],
  currentRide: null,
  availableRides: [],
  isLoading: false,

  createRide: async (rideData: CreateRideRequest) => {
    set({ isLoading: true });
    try {
      const response = await api.post('/api/rides/request', rideData);
      const newRide = response.data.ride;
      
      set(state => ({
        rides: [newRide, ...state.rides],
        currentRide: newRide,
        isLoading: false
      }));
      
      return newRide;
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.error || 'Failed to create ride');
    }
  },

  getMyRides: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/api/rides/my-rides');
      set({ rides: response.data.rides, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.error || 'Failed to fetch rides');
    }
  },

  getAvailableRides: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/api/rides/available');
      set({ availableRides: response.data.rides, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.error || 'Failed to fetch available rides');
    }
  },

  acceptRide: async (rideId: string) => {
    try {
      const response = await api.post(`/api/rides/${rideId}/accept`);
      const updatedRide = response.data.ride;
      
      set(state => ({
        availableRides: state.availableRides.filter(ride => ride.id !== rideId),
        currentRide: updatedRide,
        rides: [updatedRide, ...state.rides.filter(ride => ride.id !== rideId)]
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to accept ride');
    }
  },

  updateRideStatus: async (rideId: string, status: string) => {
    try {
      const response = await api.put(`/api/rides/${rideId}/status`, { status });
      const updatedRide = response.data.ride;
      
      set(state => ({
        rides: state.rides.map(ride => 
          ride.id === rideId ? updatedRide : ride
        ),
        currentRide: state.currentRide?.id === rideId ? updatedRide : state.currentRide
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update ride status');
    }
  },
}));
