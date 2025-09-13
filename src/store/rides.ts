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
  initializeDriverRides: () => Promise<void>; // NEW: Initialize driver state
}

export const useRideStore = create<RideState>((set, get) => ({
  rides: [],
  currentRide: null,
  availableRides: [],
  isLoading: false,

  // NEW: Initialize driver rides on load
  initializeDriverRides: async () => {
    set({ isLoading: true });
    try {
      // Get driver's rides first
      const myRidesResponse = await api.get('/api/rides/my-rides');
      const myRides = myRidesResponse.data.rides;
      
      // Find current active ride (accepted, picked_up, or in_progress)
      const currentRide = myRides.find((ride: Ride) => 
        ['accepted', 'picked_up', 'in_progress'].includes(ride.status)
      );
      
      // Get available rides only if no current ride
      let availableRides = [];
      if (!currentRide) {
        const availableResponse = await api.get('/api/rides/available');
        availableRides = availableResponse.data.rides;
      }
      
      set({ 
        rides: myRides,
        currentRide: currentRide || null,
        availableRides,
        isLoading: false 
      });
      
      console.log('Driver rides initialized:', {
        myRides: myRides.length,
        currentRide: currentRide?.id || 'none',
        availableRides: availableRides.length
      });
      
    } catch (error: any) {
      set({ isLoading: false });
      console.error('Failed to initialize driver rides:', error);
      throw new Error(error.response?.data?.error || 'Failed to initialize rides');
    }
  },

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
      const rides = response.data.rides;
      
      // Update current ride if it exists in the fetched rides
      const state = get();
      const updatedCurrentRide = state.currentRide 
        ? rides.find((ride: Ride) => ride.id === state.currentRide?.id) || state.currentRide
        : rides.find((ride: Ride) => ['accepted', 'picked_up', 'in_progress'].includes(ride.status));
      
      set({ 
        rides,
        currentRide: updatedCurrentRide || null,
        isLoading: false 
      });
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.error || 'Failed to fetch rides');
    }
  },

  getAvailableRides: async () => {
    // Don't fetch available rides if driver has a current ride
    const state = get();
    if (state.currentRide && ['accepted', 'picked_up', 'in_progress'].includes(state.currentRide.status)) {
      console.log('Driver has current ride, skipping available rides fetch');
      return;
    }
    
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
      
      set(state => {
        const updatedRides = state.rides.map(ride => 
          ride.id === rideId ? updatedRide : ride
        );
        
        // If ride is completed or cancelled, clear current ride
        const updatedCurrentRide = ['completed', 'cancelled'].includes(status) 
          ? null 
          : state.currentRide?.id === rideId ? updatedRide : state.currentRide;
        
        return {
          rides: updatedRides,
          currentRide: updatedCurrentRide
        };
      });
      
      // If ride completed, refresh available rides
      if (['completed', 'cancelled'].includes(status)) {
        get().getAvailableRides();
      }
      
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update ride status');
    }
  },
}));
