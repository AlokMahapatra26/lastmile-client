'use client';

import { useState, useEffect } from 'react';
import { useShortAddress } from '@/hooks/useAddress';
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
import { formatRupees } from '@/utils/currency';
import { cancelRide } from '@/lib/rideActions'; // Added import for cancellation


export default function RiderDashboard() {
  const { user, logout } = useAuthStore();
  const { rides, currentRide, createRide, getMyRides, isLoading } = useRideStore();
  
  const [pickupAddress, setPickupAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.2961, 85.8245]);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false); // State for cancellation action
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [rideForPayment, setRideForPayment] = useState<any>(null);
  
  const { address: pickupDisplayAddress } = useShortAddress(
    pickupCoords?.[0],
    pickupCoords?.[1]
  );
  const { address: destinationDisplayAddress } = useShortAddress(
    destinationCoords?.[0],
    destinationCoords?.[1]
  );

  const distance = pickupCoords && destinationCoords 
    ? calculateDistance(pickupCoords, destinationCoords)
    : null;

  // New function to handle ride cancellation
  const handleCancelRide = async (ride: any, reason: string = '') => {
    if (!confirm('Are you sure you want to cancel this ride?')) {
      return;
    }

    setIsCancelling(true);
    try {
      await cancelRide(ride.id, reason);
      toast.success('Ride cancelled successfully');
      await getMyRides(); // Refresh rides data
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsCancelling(false);
    }
  };

  // New helper to check if a ride can be cancelled
  const canCancelRide = (ride: any) => {
    return ['requested'].includes(ride.status);
  };

  const handlePaymentSuccess = async () => {
    try {
      await getMyRides();
      setShowPaymentModal(false);
      setRideForPayment(null);
      toast.success('Payment completed successfully!');
    } catch (error) {
      toast.error('Payment succeeded but failed to refresh ride data');
      setShowPaymentModal(false);
      setRideForPayment(null);
    }
  };

  const handlePayNow = (ride: any) => {
    setRideForPayment(ride);
    setShowPaymentModal(true);
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsMapReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (navigator.geolocation && isMapReady) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
          setMapCenter(coords);
          setPickupCoords(coords);
          setPickupAddress('Getting address...');
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Unable to get your location. Please set pickup manually.');
        }
      );
    }
    getMyRides().catch((error) => toast.error(error.message));
  }, [getMyRides, isMapReady]);

  useEffect(() => {
    if (pickupDisplayAddress) setPickupAddress(pickupDisplayAddress);
  }, [pickupDisplayAddress]);

  useEffect(() => {
    if (destinationDisplayAddress) setDestinationAddress(destinationDisplayAddress);
  }, [destinationDisplayAddress]);

  useEffect(() => {
    const awaitingPaymentRide = rides.find(ride => ride.status === 'awaiting_payment');
    if (awaitingPaymentRide && !showPaymentModal) {
      setRideForPayment(awaitingPaymentRide);
      setShowPaymentModal(true);
    }
  }, [rides, showPaymentModal]);

  const handleMapClick = (lat: number, lng: number) => {
    if (!pickupCoords) {
      setPickupCoords([lat, lng]);
      setPickupAddress('Getting address...');
      toast.success('Pickup location set');
    } else if (!destinationCoords) {
      setDestinationCoords([lat, lng]);
      setDestinationAddress('Getting address...');
      toast.success('Destination set');
    } else {
      setPickupCoords([lat, lng]);
      setDestinationCoords(null);
      setPickupAddress('Getting address...');
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
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const mapMarkers = [
    ...(pickupCoords ? [{ position: pickupCoords, popup: 'Pickup Location' }] : []),
    ...(destinationCoords ? [{ position: destinationCoords, popup: 'Destination' }] : [])
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user?.first_name}!</h1>
          <p className="text-gray-600">Book your rides here</p>
        </div>
        <Button variant="outline" onClick={logout}>Logout</Button>
      </div>

      <Tabs defaultValue="rides" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rides">My Rides</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="rides">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Book a Ride</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div>
                  <Label htmlFor="pickup">Pickup Address</Label>
                  <Input id="pickup" value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} placeholder="Enter pickup location or click on map" />
                  {pickupCoords && <p className="text-xs text-gray-500 mt-1">📍 {pickupCoords[0].toFixed(6)}, {pickupCoords[1].toFixed(6)}</p>}
                </div>
                <div>
                  <Label htmlFor="destination">Destination Address</Label>
                  <Input id="destination" value={destinationAddress} onChange={(e) => setDestinationAddress(e.target.value)} placeholder="Enter destination or click on map" />
                  {destinationCoords && <p className="text-xs text-gray-500 mt-1">📍 {destinationCoords[0].toFixed(6)}, {destinationCoords[1].toFixed(6)}</p>}
                </div>
                {distance && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-800">Trip Details</p>
                        <p className="text-xs text-blue-600">Estimated straight-line distance</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-700">{formatDistance(distance)}</p>
                        <p className="text-xs text-blue-600">~{estimateTravelTime(distance)}</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="h-64">
                  {isMapReady ? (
                    <MapWrapper center={mapCenter} markers={mapMarkers} onMapClick={handleMapClick} className="h-full w-full" />
                  ) : (
                    <div className="h-full w-full bg-gray-200 animate-pulse rounded-lg flex items-center justify-center"><div className="text-gray-500">Loading map...</div></div>
                  )}
                </div>
                <Button onClick={handleRequestRide} disabled={isLoading || !pickupCoords || !destinationCoords} className="w-full">
                  {isLoading ? 'Requesting...' : distance ? `Request Ride (${formatDistance(distance)})` : 'Request Ride'}
                </Button>
              </CardContent>
            </Card>

            {currentRide && (
              <Card>
                <CardHeader>
                  <CardTitle>Current Ride</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Status:</span>
                      <Badge className={getStatusColor(currentRide.status)}>{getStatusText(currentRide.status)}</Badge>
                    </div>
                    <div><span className="font-medium">From:</span><p className="text-sm text-gray-600">{currentRide.pickup_address}</p></div>
                    <div><span className="font-medium">To:</span><p className="text-sm text-gray-600">{currentRide.destination_address}</p></div>
                    <div className="flex justify-between"><span className="font-medium">Fare:</span><span>{formatRupees(currentRide.estimated_fare)}</span></div>
                    {currentRide.driver && (
                      <div><span className="font-medium">Driver:</span><p className="text-sm text-gray-600">{currentRide.driver.first_name} {currentRide.driver.last_name}</p></div>
                    )}
                    
                    {/* Action buttons container */}
                    <div className="flex gap-2 mt-4">
                      {canCancelRide(currentRide) && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancelRide(currentRide, 'Changed my mind')}
                          disabled={isLoading || isCancelling}
                        >
                          {isCancelling ? 'Cancelling...' : 'Cancel Ride'}
                        </Button>
                      )}
                      {currentRide.status === 'awaiting_payment' && (
                        <Button onClick={() => handlePayNow(currentRide)} className="flex-1">
                          Pay Now - {formatRupees(currentRide.estimated_fare)}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value='history'>
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Ride History</CardTitle></CardHeader>
              <CardContent>
                {rides.length === 0 ? (<p className="text-gray-500">No rides yet</p>) : (
                  <div className="space-y-3">
                    {rides.map((ride) => (
                      <div key={ride.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getStatusColor(ride.status)}>{getStatusText(ride.status)}</Badge>
                              <span className="text-sm text-gray-500">{new Date(ride.created_at).toLocaleDateString()}</span>
                            </div>
                            {/* Display cancellation info if ride was cancelled */}
                            {ride.status === 'cancelled' && (
                              <p className="text-xs text-red-600 mb-1">
                                Cancelled by {ride.cancelled_by}
                                {ride.cancellation_reason && `: ${ride.cancellation_reason}`}
                              </p>
                            )}
                            <p className="text-sm"><span className="font-medium">From:</span> {ride.pickup_address}</p>
                            <p className="text-sm"><span className="font-medium">To:</span> {ride.destination_address}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatRupees(ride.final_fare || ride.estimated_fare)}</p>
                            {ride.driver && <p className="text-sm text-gray-600">{ride.driver.first_name}</p>}
                            
                            {/* Add cancel button for pending rides in history */}
                            {canCancelRide(ride) && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleCancelRide(ride)}
                                className="mt-2"
                                disabled={isLoading || isCancelling}
                              >
                                {isCancelling ? '...' : 'Cancel'}
                              </Button>
                            )}
                            
                            {ride.status === 'awaiting_payment' && (
                              <Button size="sm" onClick={() => handlePayNow(ride)} className="mt-2">Pay Now</Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="profile"><ProfileSettings /></TabsContent>
      </Tabs>

      {rideForPayment && (
        <PaymentModal
          ride={rideForPayment}
          isOpen={showPaymentModal}
          onClose={() => {setShowPaymentModal(false); setRideForPayment(null);}}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}