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
import ProfileSettings from '@/components/profile/ProfileSettings';
import { AddressDisplay } from '@/components/ui/AddressDisplay';
import { formatRupees } from '@/utils/currency';
import { declineRide, submitRating } from '@/lib/rideActions';
import { RatingModal } from '@/components/rides/RatingModal';

// Helper functions for online status persistence
const getInitialOnlineStatus = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('driver-online-status') === 'true';
  }
  return false;
};

const persistOnlineStatus = (status: boolean) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('driver-online-status', status.toString());
  }
};

// Helper to track already rated rides in localStorage
const getRatedRides = (): string[] => {
  if (typeof window !== 'undefined') {
    const rated = localStorage.getItem('driver-rated-rides');
    return rated ? JSON.parse(rated) : [];
  }
  return [];
};

const markRideAsRated = (rideId: string) => {
  if (typeof window !== 'undefined') {
    const ratedRides = getRatedRides();
    if (!ratedRides.includes(rideId)) {
      ratedRides.push(rideId);
      localStorage.setItem('driver-rated-rides', JSON.stringify(ratedRides));
    }
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
    getAvailableRides,
    isLoading 
  } = useRideStore();
  
  const [isOnline, setIsOnline] = useState(getInitialOnlineStatus);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rideToRate, setRideToRate] = useState<any>(null);
  const [completedRides, setCompletedRides] = useState<any[]>([]);
  const [ratedRides, setRatedRides] = useState<string[]>([]);

  const updateOnlineStatus = (status: boolean) => {
    setIsOnline(status);
    persistOnlineStatus(status);
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeDriverRides();
        const state = useRideStore.getState();
        if (state.currentRide && ['accepted', 'picked_up', 'in_progress'].includes(state.currentRide.status)) {
          updateOnlineStatus(true);
        }
        
        // Load rated rides from localStorage
        setRatedRides(getRatedRides());
        
        // Fetch completed rides for rating check
        await fetchCompletedRides();
      } catch (error: any) {
        toast.error('Failed to load initial ride data');
      } finally {
        setIsInitialized(true);
      }
    };
    initialize();
  }, [initializeDriverRides]);

  // Fetch completed rides that may need rating
  const fetchCompletedRides = async () => {
    try {
      const response = await api.get('/api/rides/my-rides?status=completed');
      const completedRidesData = response.data.rides || [];
      setCompletedRides(completedRidesData);
    } catch (error) {
      console.error('Failed to fetch completed rides:', error);
    }
  };

  // Check for unrated completed rides - FIXED VERSION
  useEffect(() => {
    if (completedRides.length > 0 && !showRatingModal && isInitialized) {
      const unratedRide = completedRides.find(ride => {
        // Check if ride is completed and not already rated
        const isCompleted = ride.status === 'completed';
        const notRatedInLocalStorage = !ratedRides.includes(ride.id);
        const notRatedInDatabase = !ride.rated_by_driver;
        
        return isCompleted && notRatedInLocalStorage && notRatedInDatabase;
      });
      
      if (unratedRide) {
        console.log('Found unrated ride:', unratedRide.id);
        setRideToRate(unratedRide);
        setShowRatingModal(true);
      }
    }
  }, [completedRides, showRatingModal, isInitialized, ratedRides]);

  // Handle rating submission - FIXED VERSION
  const handleRatingSubmit = async (rating: number | null, review: string) => {
    if (!rideToRate) return;

    setIsProcessing(true);
    try {
      // Submit rating to backend
      await submitRating(rideToRate.id, rating || 0, review);
      
      // Mark ride as rated locally to prevent re-showing
      markRideAsRated(rideToRate.id);
      setRatedRides(prev => [...prev, rideToRate.id]);
      
      // Close modal and clear state
      setShowRatingModal(false);
      setRideToRate(null);
      
      toast.success('Thank you for your feedback!');
      
      // Refresh completed rides to update rating status
      await fetchCompletedRides();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit rating');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle modal close - FIXED VERSION
  const handleCloseRatingModal = () => {
    if (rideToRate) {
      // Mark as rated even if closed without rating to prevent re-showing
      markRideAsRated(rideToRate.id);
      setRatedRides(prev => [...prev, rideToRate.id]);
    }
    
    setShowRatingModal(false);
    setRideToRate(null);
  };

  useEffect(() => {
    if (isOnline && isInitialized) {
      const interval = setInterval(() => {
        const state = useRideStore.getState();
        if (!state.currentRide || ['completed', 'cancelled'].includes(state.currentRide.status)) {
          state.getAvailableRides();
        }
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isOnline, isInitialized]);
  
  useEffect(() => {
    if (isOnline && navigator.geolocation) {
      const updateLocation = () => navigator.geolocation.getCurrentPosition(
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
        (error) => console.error('Error getting location:', error)
      );
      updateLocation();
      const interval = setInterval(updateLocation, 60000);
      return () => clearInterval(interval);
    }
  }, [isOnline]);

  const handleGoOnline = () => {
    updateOnlineStatus(true);
    getAvailableRides();
    toast.success('You are now online');
  };

  const handleGoOffline = () => {
    updateOnlineStatus(false);
    toast.info('You are now offline');
  };

  const handleAcceptRide = async (rideId: string) => {
    setIsProcessing(true);
    try {
      await acceptRide(rideId);
      toast.success('Ride accepted!');
      updateOnlineStatus(true);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDeclineRide = async (rideId: string, reason: string = '') => {
    if (!confirm('Are you sure you want to decline this ride?')) {
      return;
    }
    setIsProcessing(true);
    try {
      await declineRide(rideId, reason);
      toast.success('Ride declined successfully');
      await getAvailableRides();
      await initializeDriverRides();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!currentRide) return;
    setIsProcessing(true);
    try {
      await updateRideStatus(currentRide.id, status);
      toast.success(`Ride status updated to ${status.replace('_', ' ')}`);
      
      // If ride is completed, fetch completed rides for potential rating
      if (status === 'completed') {
        setTimeout(() => {
          fetchCompletedRides();
        }, 2000); // Increased delay to ensure backend processing
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
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
          <Button 
            onClick={() => handleUpdateStatus('picked_up')} 
            disabled={isLoading || isProcessing}
          >
            Mark as Picked Up
          </Button>
        );
      case 'picked_up': 
        return (
          <Button 
            onClick={() => handleUpdateStatus('in_progress')} 
            disabled={isLoading || isProcessing}
          >
            Start Trip
          </Button>
        );
      case 'in_progress': 
        return (
          <Button 
            onClick={() => handleUpdateStatus('completed')} 
            disabled={isLoading || isProcessing}
          >
            Complete Trip
          </Button>
        );
      default: 
        return null;
    }
  };

  if (!isInitialized) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading driver dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
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
          <Button variant="outline" onClick={logout}>Logout</Button>
        </div>
      </div>

      <Tabs defaultValue="rides" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rides">Rides</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>
        
        <TabsContent value="rides">
          {currentRide && ['accepted', 'picked_up', 'in_progress'].includes(currentRide.status) && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 font-medium">
                You have an active ride in status: 
                <Badge className={getStatusColor(currentRide.status)}>
                  {currentRide.status.replace('_', ' ')}
                </Badge>
              </p>
            </div>
          )}
          
          {!isOnline ? (
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-medium mb-2">You're offline</h3>
                <p className="text-gray-600 mb-4">Go online to start receiving ride requests</p>
                <Button onClick={handleGoOnline}>Go Online</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {currentRide && ['accepted', 'picked_up', 'in_progress'].includes(currentRide.status) && (
                <Card>
                  <CardHeader><CardTitle>Current Ride</CardTitle></CardHeader>
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
                        <p className="text-sm text-gray-600">{currentRide.rider?.phone_number}</p>
                      </div>
                      <div>
                        <span className="font-medium">Pickup: </span>
                        <AddressDisplay 
                          lat={currentRide.pickup_latitude} 
                          lng={currentRide.pickup_longitude} 
                          fallback={currentRide.pickup_address} 
                        />
                      </div>
                      <div>
                        <span className="font-medium">Destination: </span>
                        <AddressDisplay 
                          lat={currentRide.destination_latitude} 
                          lng={currentRide.destination_longitude} 
                          fallback={currentRide.destination_address} 
                        />
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Gross Fare:</span>
                        <span>{formatRupees(currentRide.estimated_fare)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Your Earnings (80%):</span>
                        <span className="text-green-600 font-semibold">
                          {formatRupees(Math.round(currentRide.estimated_fare * 0.8))}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      {getRideStatusActions()}
                      {currentRide.status === 'accepted' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeclineRide(currentRide.id, 'Cannot complete ride')}
                          disabled={isLoading || isProcessing}
                        >
                          {isProcessing ? '...' : 'Decline'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {(!currentRide || ['completed', 'cancelled'].includes(currentRide.status)) && (
                <Card className={currentRide && ['accepted', 'picked_up', 'in_progress'].includes(currentRide.status) ? "lg:col-span-1" : "lg:col-span-2"}>
                  <CardHeader><CardTitle>Available Rides</CardTitle></CardHeader>
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
                                  Gross: {formatRupees(ride.estimated_fare)}
                                </p>
                                <p className="text-sm text-green-600 font-medium">
                                  You earn: {formatRupees(Math.round(ride.estimated_fare * 0.8))}
                                </p>
                              </div>
                              
                              <div className="flex gap-2 flex-shrink-0">
                                <Button 
                                  size="sm" 
                                  onClick={() => handleAcceptRide(ride.id)} 
                                  disabled={isLoading || isProcessing}
                                >
                                  Accept
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleDeclineRide(ride.id, 'Not interested')} 
                                  disabled={isLoading || isProcessing}
                                >
                                  Decline
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div>
                                <span className="font-medium">From: </span>
                                <AddressDisplay 
                                  lat={ride.pickup_latitude} 
                                  lng={ride.pickup_longitude} 
                                  fallback={ride.pickup_address} 
                                />
                              </div>
                              <div>
                                <span className="font-medium">To: </span>
                                <AddressDisplay 
                                  lat={ride.destination_latitude} 
                                  lng={ride.destination_longitude} 
                                  fallback={ride.destination_address} 
                                />
                              </div>
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
        
        <TabsContent value="earnings"><DriverEarnings /></TabsContent>
        <TabsContent value="profile"><ProfileSettings /></TabsContent>
      </Tabs>

      {/* FIXED: Rating Modal - No skip option, proper state management */}
      {showRatingModal && rideToRate && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={handleCloseRatingModal}
          onSubmit={handleRatingSubmit}
          ride={rideToRate}
          userType="driver"
        />
      )}
    </div>
  );
}
