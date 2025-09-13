'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { useRideStore } from '@/store/rides';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DriverEarnings from '../drivers/DriverEarnings';


// NEW: Helper function to get initial online status from localStorage
const getInitialOnlineStatus = () => {
  if (typeof window !== 'undefined') {
    const storedStatus = localStorage.getItem('driver-online-status');
    return storedStatus === 'true';
  }
  return false; // Default offline for SSR
};

// NEW: Helper function to persist online status
const persistOnlineStatus = (status: boolean) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('driver-online-status', status.toString());
  }
};

export default function DriverDashboard() {
  const { user, logout } = useAuthStore();
  const { 
    availableRides, 
    currentRide, 
    initializeDriverRides,
    acceptRide, 
    updateRideStatus,
    isLoading 
  } = useRideStore();
  
  // NEW: Initialize from localStorage
  const [isOnline, setIsOnline] = useState(getInitialOnlineStatus);
  const [isInitialized, setIsInitialized] = useState(false);

  // NEW: Helper function to update online status with persistence
  const updateOnlineStatus = (status: boolean) => {
    setIsOnline(status);
    persistOnlineStatus(status);
  };

  // Initialize driver rides on component mount
  useEffect(() => {
    const initializeRides = async () => {
      try {
        await initializeDriverRides();
        setIsInitialized(true);
        
        // If driver has a current ride, they should be considered online
        const state = useRideStore.getState();
        if (state.currentRide && ['accepted', 'picked_up', 'in_progress'].includes(state.currentRide.status)) {
          updateOnlineStatus(true); // Use the new function
        }
      } catch (error: any) {
        console.error('Failed to initialize driver rides:', error);
        toast.error('Failed to load ride data');
        setIsInitialized(true);
      }
    };

    initializeRides();
  }, []);

  useEffect(() => {
    // Only start polling if online and initialized
    if (isOnline && isInitialized) {
      console.log('Driver is online, starting ride polling');
      
      // Poll for new available rides every 30 seconds when online (only if no current ride)
      const interval = setInterval(() => {
        const state = useRideStore.getState();
        if (!state.currentRide || ['completed', 'cancelled'].includes(state.currentRide.status)) {
          state.getAvailableRides();
        }
      }, 30000);
      
      return () => clearInterval(interval);
    } else if (isInitialized) {
      console.log('Driver is offline');
    }
  }, [isOnline, isInitialized]);

  useEffect(() => {
    // Update location when online
    if (isOnline && navigator.geolocation) {
      console.log('Starting location updates');
      
      const updateLocation = () => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              await api.put('/api/users/location', {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              });
              console.log('Location updated');
            } catch (error) {
              console.error('Failed to update location:', error);
            }
          },
          (error) => {
            console.error('Error getting location:', error);
          }
        );
      };

      updateLocation();
      const interval = setInterval(updateLocation, 60000); // Update every minute
      
      return () => {
        console.log('Stopping location updates');
        clearInterval(interval);
      };
    }
  }, [isOnline]);

  const handleGoOnline = () => {
    console.log('Driver going online');
    updateOnlineStatus(true); // Use the new function
    
    // Refresh available rides when going online (if no current ride)
    if (!currentRide || ['completed', 'cancelled'].includes(currentRide.status)) {
      useRideStore.getState().getAvailableRides();
    }
    
    toast.success('You are now online and available for rides');
  };

  const handleGoOffline = () => {
    console.log('Driver going offline');
    updateOnlineStatus(false); // Use the new function
    toast.success('You are now offline');
  };

  const handleAcceptRide = async (rideId: string) => {
    try {
      await acceptRide(rideId);
      toast.success('Ride accepted!');
      updateOnlineStatus(true); // Ensure driver stays online after accepting
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!currentRide) return;
    
    try {
      await updateRideStatus(currentRide.id, status);
      toast.success(`Ride status updated to ${status.replace('_', ' ')}`);
      
      // If ride is completed, driver can go offline if they want
      if (['completed', 'cancelled'].includes(status)) {
        toast.success('Ride completed! You can go offline or continue receiving rides.');
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'picked_up': return 'bg-purple-100 text-purple-800';
      case 'in_progress': return 'bg-indigo-100 text-indigo-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRideStatusActions = () => {
    if (!currentRide) return null;

    switch (currentRide.status) {
      case 'accepted':
        return (
          <Button onClick={() => handleUpdateStatus('picked_up')}>
            Mark as Picked Up
          </Button>
        );
      case 'picked_up':
        return (
          <Button onClick={() => handleUpdateStatus('in_progress')}>
            Start Trip
          </Button>
        );
      case 'in_progress':
        return (
          <Button onClick={() => handleUpdateStatus('completed')}>
            Complete Trip
          </Button>
        );
      default:
        return null;
    }
  };

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading driver dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
  <div className="p-6">
    {/* Header */}
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold">Driver Dashboard</h1>
        <p className="text-gray-600">Welcome, {user?.first_name}!</p>
        <p className="text-sm">
          Status: <span className={`font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </p>
      </div>
      <div className="flex items-center gap-4">
        <Button
          variant={isOnline ? "destructive" : "default"}
          onClick={isOnline ? handleGoOffline : handleGoOnline}
          disabled={isLoading}
        >
          {isOnline ? 'Go Offline' : 'Go Online'}
        </Button>
        <Button variant="outline" onClick={logout}>
          Logout
        </Button>
      </div>
    </div>

    {/* Tabs for Rides and Earnings */}
    <Tabs defaultValue="rides" className="space-y-4">
      <TabsList>
        <TabsTrigger value="rides">Rides</TabsTrigger>
        <TabsTrigger value="earnings">Earnings</TabsTrigger>
      </TabsList>

      {/* Rides Tab Content */}
      <TabsContent value="rides">
        {/* Show current ride status */}
        {currentRide && ['accepted', 'picked_up', 'in_progress'].includes(currentRide.status) && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 font-medium">
              You have an active ride in status: <Badge className={getStatusColor(currentRide.status)}>
                {currentRide.status.replace('_', ' ')}
              </Badge>
            </p>
          </div>
        )}

        {!isOnline ? (
          <Card>
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-medium mb-2">You're offline</h3>
              <p className="text-gray-600 mb-4">
                Go online to start receiving ride requests
              </p>
              <Button onClick={handleGoOnline}>
                Go Online
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Ride */}
            {currentRide && ['accepted', 'picked_up', 'in_progress'].includes(currentRide.status) && (
              <Card>
                <CardHeader>
                  <CardTitle>Current Ride</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Status:</span>
                      <Badge className={getStatusColor(currentRide.status)}>
                        {currentRide.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Rider:</span>
                      <p className="text-sm text-gray-600">
                        {currentRide.rider?.first_name} {currentRide.rider?.last_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {currentRide.rider?.phone_number}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Pickup:</span>
                      <p className="text-sm text-gray-600">{currentRide.pickup_address}</p>
                    </div>
                    <div>
                      <span className="font-medium">Destination:</span>
                      <p className="text-sm text-gray-600">{currentRide.destination_address}</p>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Gross Fare:</span>
                      <span>${(currentRide.estimated_fare / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Your Earnings (80%):</span>
                      <span className="text-green-600 font-semibold">
                        ${((currentRide.estimated_fare * 0.8) / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {getRideStatusActions()}
                </CardContent>
              </Card>
            )}

            {/* Available Rides - Only show if no current ride */}
            {(!currentRide || ['completed', 'cancelled'].includes(currentRide.status)) && (
              <Card className={currentRide && ['accepted', 'picked_up', 'in_progress'].includes(currentRide.status) ? "lg:col-span-1" : "lg:col-span-2"}>
                <CardHeader>
                  <CardTitle>Available Rides</CardTitle>
                </CardHeader>
                <CardContent>
                  {availableRides.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No rides available at the moment
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {availableRides.map((ride) => (
                        <div key={ride.id} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium">
                                {ride.rider?.first_name} {ride.rider?.last_name}
                              </p>
                              <p className="text-sm text-gray-600">
                                Gross: ${(ride.estimated_fare / 100).toFixed(2)}
                              </p>
                              <p className="text-sm text-green-600 font-medium">
                                You earn: ${((ride.estimated_fare * 0.8) / 100).toFixed(2)}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleAcceptRide(ride.id)}
                              disabled={isLoading}
                            >
                              Accept
                            </Button>
                          </div>
                          <div className="space-y-1 text-sm">
                            <p>
                              <span className="font-medium">From:</span> {ride.pickup_address}
                            </p>
                            <p>
                              <span className="font-medium">To:</span> {ride.destination_address}
                            </p>
                            <p className="text-gray-500">
                              Requested {new Date(ride.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </TabsContent>

      {/* Earnings Tab Content */}
      <TabsContent value="earnings">
        <DriverEarnings />
      </TabsContent>
    </Tabs>
  </div>
);

}
