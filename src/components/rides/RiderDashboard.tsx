'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAuthStore } from '@/store/auth';
import { useRideStore } from '@/store/rides';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CreateRideRequest } from '@/types';

// Dynamically import map to avoid SSR issues
const MapComponent = dynamic(() => import('@/components/maps/MapComponent'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-200 animate-pulse rounded-lg" />
});

export default function RiderDashboard() {
  const { user, logout } = useAuthStore();
  const { rides, currentRide, createRide, getMyRides, isLoading } = useRideStore();
  
  const [pickupAddress, setPickupAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([37.7749, -122.4194]); // Default to SF

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
          setMapCenter(coords);
          setPickupCoords(coords);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Unable to get your location. Please set pickup manually.');
        }
      );
    }

    getMyRides().catch((error) => {
      toast.error(error.message);
    });
  }, [getMyRides]);

  const handleMapClick = (lat: number, lng: number) => {
    if (!pickupCoords) {
      setPickupCoords([lat, lng]);
      setPickupAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      toast.success('Pickup location set');
    } else if (!destinationCoords) {
      setDestinationCoords([lat, lng]);
      setDestinationAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      toast.success('Destination set');
    } else {
      // Reset and set new pickup
      setPickupCoords([lat, lng]);
      setDestinationCoords(null);
      setPickupAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      setDestinationAddress('');
      toast.success('Pickup location updated');
    }
  };

  const handleRequestRide = async () => {
    if (!pickupCoords || !destinationCoords) {
      toast.error('Please set both pickup and destination locations');
      return;
    }

    const rideData: CreateRideRequest = {
      pickupLatitude: pickupCoords[0],
      pickupLongitude: pickupCoords[1],
      pickupAddress,
      destinationLatitude: destinationCoords[0],
      destinationLongitude: destinationCoords[1],
      destinationAddress,
      rideType: 'standard'
    };

    try {
      await createRide(rideData);
      toast.success('Ride requested successfully!');
      // Reset form
      setPickupCoords(null);
      setDestinationCoords(null);
      setPickupAddress('');
      setDestinationAddress('');
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

  const mapMarkers = [
    ...(pickupCoords ? [{
      position: pickupCoords,
      popup: 'Pickup Location'
    }] : []),
    ...(destinationCoords ? [{
      position: destinationCoords,
      popup: 'Destination'
    }] : [])
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user?.first_name}!</h1>
          <p className="text-gray-600">Book your rides here</p>
        </div>
        <Button variant="outline" onClick={logout}>
          Logout
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Book a Ride */}
        <Card>
          <CardHeader>
            <CardTitle>Book a Ride</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="pickup">Pickup Address</Label>
              <Input
                id="pickup"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="Enter pickup location or click on map"
              />
            </div>
            <div>
              <Label htmlFor="destination">Destination Address</Label>
              <Input
                id="destination"
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                placeholder="Enter destination or click on map"
              />
            </div>
            
            {/* Map */}
            <div className="h-64">
              <MapComponent
                center={mapCenter}
                markers={mapMarkers}
                onMapClick={handleMapClick}
                className="h-full w-full"
              />
            </div>
            
            <p className="text-sm text-gray-600">
              Click on the map to set pickup and destination locations
            </p>
            
            <Button
              onClick={handleRequestRide}
              disabled={isLoading || !pickupCoords || !destinationCoords}
              className="w-full"
            >
              {isLoading ? 'Requesting...' : 'Request Ride'}
            </Button>
          </CardContent>
        </Card>

        {/* Current Ride */}
        {currentRide && (
          <Card>
            <CardHeader>
              <CardTitle>Current Ride</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Status:</span>
                  <Badge className={getStatusColor(currentRide.status)}>
                    {currentRide.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">From:</span>
                  <p className="text-sm text-gray-600">{currentRide.pickup_address}</p>
                </div>
                <div>
                  <span className="font-medium">To:</span>
                  <p className="text-sm text-gray-600">{currentRide.destination_address}</p>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Estimated Fare:</span>
                  <span>${(currentRide.estimated_fare / 100).toFixed(2)}</span>
                </div>
                {currentRide.driver && (
                  <div>
                    <span className="font-medium">Driver:</span>
                    <p className="text-sm text-gray-600">
                      {currentRide.driver.first_name} {currentRide.driver.last_name}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ride History */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ride History</CardTitle>
          </CardHeader>
          <CardContent>
            {rides.length === 0 ? (
              <p className="text-gray-500">No rides yet</p>
            ) : (
              <div className="space-y-3">
                {rides.map((ride) => (
                  <div key={ride.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getStatusColor(ride.status)}>
                            {ride.status.replace('_', ' ')}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {new Date(ride.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm">
                          <span className="font-medium">From:</span> {ride.pickup_address}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">To:</span> {ride.destination_address}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          ${(ride.final_fare || ride.estimated_fare) / 100}
                        </p>
                        {ride.driver && (
                          <p className="text-sm text-gray-600">
                            {ride.driver.first_name} {ride.driver.last_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
