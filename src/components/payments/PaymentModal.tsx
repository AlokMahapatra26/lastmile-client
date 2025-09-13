'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import PaymentForm from './PaymentForm';
import { Ride } from '@/types';

interface PaymentModalProps {
  ride: Ride;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

export default function PaymentModal({ ride, isOpen, onClose, onPaymentSuccess }: PaymentModalProps) {
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const handlePaymentSuccess = () => {
    onPaymentSuccess();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" style={{zIndex:2999}}>
        <DialogHeader>
          <DialogTitle>Payment Required</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Ride Completed!</h3>
            <p className="text-gray-600 mb-4">
              Your ride from {ride.pickup_address} to {ride.destination_address} has been completed.
            </p>
            <div className="text-2xl font-bold text-green-600">
              ${(ride.estimated_fare / 100).toFixed(2)}
            </div>
            <p className="text-sm text-gray-500">Total Fare</p>
          </div>

          {!showPaymentForm ? (
            <div className="space-y-3">
              <Button 
                onClick={() => setShowPaymentForm(true)}
                className="w-full"
                size="lg"
              >
                Pay with Card
              </Button>
              <Button 
                variant="outline"
                onClick={onClose}
                className="w-full"
              >
                Pay Later
              </Button>
            </div>
          ) : (
            <PaymentForm 
              rideId={ride.id}
              amount={ride.estimated_fare}
              onSuccess={handlePaymentSuccess}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
