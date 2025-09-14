'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { useRideStore } from '@/store/rides';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CreateRideRequest } from '@/types';
import MapWrapper from '@/components/maps/MapWrapper';
import PaymentModal from '@/components/payments/PaymentModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProfileSettings from '@/components/profile/ProfileSettings';
import { calculateDistance, formatDistance, estimateTravelTime } from '@/utils/distance';

export default function RiderDashboard() {
  const { user, logout } = useAuthStore();
  const { rides, currentRide, createRide, getMyRides, isLoading } = useRideStore();
  
  const [pickupAddress, setPickupAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([37.7749, -122.4194]);
  const [isMapReady, setIsMapReady] = useState(false);
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [rideForPayment, setRideForPayment] = useState<any>(null);

  // Calculate distance when both coordinates are available
  const distance = pickupCoords && destinationCoords 
    ? calculateDistance(pickupCoords, destinationCoords)
    : null;

  // Updated handlePaymentSuccess function with proper error handling
  const handlePaymentSuccess = async () => {
    try {
      console.log('Payment successful, refreshing rides...');
      
      // 1. Refresh ride data from backend
      await getMyRides();
      
      // 2. Close the payment modal
      setShowPaymentModal(false);
      
      // 3. Clear the ride for payment
      setRideForPayment(null);
      
      // 4. Show success message
      toast.success('Payment completed successfully!');
      
      console.log('Payment success: rides refreshed and modal closed');
    } catch (error) {
      console.error('Failed to refresh rides after payment:', error);
      toast.error('Payment succeeded but failed to refresh ride data');
      
      // Still close the modal even if refresh fails
      setShowPaymentModal(false);
      setRideForPayment(null);
    }
  };

  // Handle manual payment trigger
  const handlePayNow = (ride: any) => {
    console.log('Manual payment triggered for ride:', ride.id);
    setRideForPayment(ride);
    setShowPaymentModal(true);
  };

  // Initialize map
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMapReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Get location and fetch rides
  useEffect(() => {
    if (navigator.geolocation && isMapReady) {
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

    // Fetch rides on component mount
    getMyRides().catch((error) => {
      toast.error(error.message);
    });
  }, [getMyRides, isMapReady]);

  // Debug logging for rides
  useEffect(() => {
    console.log('Current rides status:', rides.map(ride => ({
      id: ride.id.substring(0, 8),
      status: ride.status,
      payment_status: ride.payment_status
    })));
  }, [rides]);

  // Updated useEffect for payment modal - check for rides needing payment
  useEffect(() => {
    console.log('Checking rides for payment requirements. Total rides:', rides.length);
    
    // Find rides that need payment
    const awaitingPaymentRide = rides.find(ride => 
      ride.status === 'awaiting_payment' && 
      ride.payment_status === 'pending'
    );
    
    console.log('Awaiting payment ride found:', awaitingPaymentRide?.id || 'none');
    
    if (awaitingPaymentRide && !showPaymentModal) {
      console.log('Showing payment modal for ride:', awaitingPaymentRide.id);
      setRideForPayment(awaitingPaymentRide);
      setShowPaymentModal(true);
    } else if (!awaitingPaymentRide && showPaymentModal && rideForPayment) {
      // Close modal if no awaiting payment rides and modal is open
      console.log('No awaiting payment rides found, but modal is open. Checking if current ride is paid...');
      const currentRideStatus = rides.find(r => r.id === rideForPayment.id);
      if (currentRideStatus && (currentRideStatus.status === 'completed' || currentRideStatus.payment_status === 'paid')) {
        console.log('Current ride is now paid/completed, closing modal');
        setShowPaymentModal(false);
        setRideForPayment(null);
      }
    }
  }, [rides, showPaymentModal, rideForPayment]);

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
      case 'awaiting_payment': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'awaiting_payment': return 'Awaiting Payment';
      default: return status.replace('_', ' ');
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

      <Tabs defaultValue="rides" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rides">My Rides</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="rides">
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
                
                {/* Distance and Time Display */}
                {distance && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-800">Trip Details</p>
                        <p className="text-xs text-blue-600">Estimated straight-line distance</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-700">
                          {formatDistance(distance)}
                        </p>
                        <p className="text-xs text-blue-600">
                          ~{estimateTravelTime(distance)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Map */}
                <div className="h-64">
                  {isMapReady ? (
                    <MapWrapper
                      center={mapCenter}
                      markers={mapMarkers}
                      onMapClick={handleMapClick}
                      className="h-full w-full"
                    />
                  ) : (
                    <div className="h-full w-full bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
                      <div className="text-gray-500">Loading map...</div>
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-gray-600">
                  Click on the map to set pickup and destination locations
                  {distance && (
                    <span className="block mt-1 text-blue-600 font-medium">
                      Distance: {formatDistance(distance)} • Est. time: {estimateTravelTime(distance)}
                    </span>
                  )}
                </p>
                
                <Button
                  onClick={handleRequestRide}
                  disabled={isLoading || !pickupCoords || !destinationCoords}
                  className="w-full"
                >
                  {isLoading ? 'Requesting...' : 
                    distance ? `Request Ride (${formatDistance(distance)})` : 'Request Ride'
                  }
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
                        {getStatusText(currentRide.status)}
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
                    
                    {currentRide.status === 'awaiting_payment' && (
                      <Button 
                        onClick={() => handlePayNow(currentRide)}
                        className="w-full mt-4"
                      >
                        Pay Now - ${(currentRide.estimated_fare / 100).toFixed(2)}
                      </Button>
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
                                {getStatusText(ride.status)}
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
                              ${((ride.final_fare || ride.estimated_fare) / 100).toFixed(2)}
                            </p>
                            {ride.driver && (
                              <p className="text-sm text-gray-600">
                                {ride.driver.first_name} {ride.driver.last_name}
                              </p>
                            )}
                            
                            {ride.status === 'awaiting_payment' && ride.payment_status === 'pending' && (
                              <Button 
                                size="sm" 
                                onClick={() => handlePayNow(ride)}
                                className="mt-2"
                              >
                                Pay Now
                              </Button>
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
        </TabsContent>

        <TabsContent value="profile">
          <ProfileSettings />
        </TabsContent>
      </Tabs>

      {/* Payment Modal */}
      {rideForPayment && (
        <PaymentModal
          ride={rideForPayment}
          isOpen={showPaymentModal}
          onClose={() => {
            console.log('Payment modal closed manually');
            setShowPaymentModal(false);
            setRideForPayment(null);
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}