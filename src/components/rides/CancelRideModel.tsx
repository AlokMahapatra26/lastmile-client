// src/components/rides/CancelRideModal.tsx
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface CancelRideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  userType: 'rider' | 'driver';
}

const CANCEL_REASONS = {
  rider: [
    'Changed my mind',
    'Found alternative transport',
    'Emergency came up',
    'Driver taking too long',
    'Other'
  ],
  driver: [
    'Vehicle breakdown',
    'Personal emergency',
    'Traffic/road issues',
    'Cannot reach pickup location',
    'Other'
  ]
};

export function CancelRideModal({ isOpen, onClose, onConfirm, userType }: CancelRideModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const handleConfirm = () => {
    const reason = selectedReason === 'Other' ? customReason : selectedReason;
    if (!reason) return;
    
    onConfirm(reason);
    onClose();
  };

  const reasons = CANCEL_REASONS[userType];

  return (
    <div className='z-100000000'>
         <Dialog open={isOpen} onOpenChange={onClose} >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {userType === 'rider' ? 'Cancel Ride' : 'Decline Ride'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Please select a reason for {userType === 'rider' ? 'cancelling' : 'declining'} this ride:
          </p>
          
          <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
            {reasons.map((reason) => (
              <div key={reason} className="flex items-center space-x-2">
                <RadioGroupItem value={reason} id={reason} />
                <Label htmlFor={reason} className="text-sm">{reason}</Label>
              </div>
            ))}
          </RadioGroup>
          
          {selectedReason === 'Other' && (
            <Textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Please specify your reason..."
              className="mt-2"
            />
          )}
          
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Keep Ride
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirm}
              disabled={!selectedReason || (selectedReason === 'Other' && !customReason.trim())}
              className="flex-1"
            >
              {userType === 'rider' ? 'Cancel Ride' : 'Decline Ride'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </div>
   
  );
}
