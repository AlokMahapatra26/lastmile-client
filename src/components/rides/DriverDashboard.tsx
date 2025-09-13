'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { useRideStore } from '@/store/rides';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function DriverDashboard() {
  const { user, logout } = useAuthStore();
  const { availableRides, currentRide, getAvailableRides, acceptRide, updateRideStatus } = useRideStore();
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (isOnline) {
      getAvailableRides();
      // Poll for new rides every 30 seconds when online
      const interval = setInterval(getAvailableRides, 30000);
      return () => clearInterval(interval);
    }
  }, [isOnline, getAvailableRides]);

  useEffect(() => {
    // Update location when online
    if (isOnline && navigator.geolocation) {
      const updateLocation = () => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              await api.put('/api/users/location', {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              });
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
      return () => clearInterval(interval);
    }
  }, [isOnline]);

  const handleAcceptRide = async (rideId: string) => {
    try {
      await acceptRide(rideId);
      toast.success('Ride accepted!');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!currentRide) return;
    
    try {
      await updateRideStatus(currentRide.id, status);
      toast.success(`Ride status updated to ${status.replace('_', ' ')}`);
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Driver Dashboard</h1>
          <p className="text-gray-600">Welcome, {user?.first_name}!</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant={isOnline ? "destructive" : "default"}
            onClick={() => setIsOnline(!isOnline)}
          >
            {isOnline ? 'Go Offline' : 'Go Online'}
          </Button>
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>

      {!isOnline ? (
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-medium mb-2">You're offline</h3>
            <p className="text-gray-600 mb-4">
              Go online to start receiving ride requests
            </p>
            <Button onClick={() => setIsOnline(true)}>
              Go Online
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Ride */}
          {currentRide && (
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
                    <span className="font-medium">Fare:</span>
                    <span>${(currentRide.estimated_fare / 100).toFixed(2)}</span>
                  </div>
                </div>
                {getRideStatusActions()}
              </CardContent>
            </Card>
          )}

          {/* Available Rides */}
          <Card className={currentRide ? "lg:col-span-1" : "lg:col-span-2"}>
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
                            ${(ride.estimated_fare / 100).toFixed(2)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRide(ride.id)}
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
        </div>
      )}
    </div>
  );
}
