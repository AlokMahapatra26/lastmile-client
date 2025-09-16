'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { formatRupees } from '@/utils/currency';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number | null, review: string) => void;
  ride: any;
  userType: 'rider' | 'driver';
}

export function RatingModal({ isOpen, onClose, onSubmit, ride, userType }: RatingModalProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [review, setReview] = useState('');
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  const handleSubmit = () => {
    onSubmit(rating, review);
    handleClose();
  };

  const handleSkip = () => {
    onSubmit(null, '');
    handleClose();
  };

  const handleClose = () => {
    setRating(null);
    setReview('');
    setHoveredRating(null);
    onClose();
  };

  const ratingLabels = {
    1: 'Poor',
    2: 'Fair', 
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
  };

  const getRatedPersonName = () => {
    if (userType === 'rider') {
      return `${ride.driver?.first_name} ${ride.driver?.last_name}`;
    } else {
      return `${ride.rider?.first_name} ${ride.rider?.last_name}`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {userType === 'rider' ? 'Rate Your Driver' : 'Rate Your Rider'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 p-2">
          {/* Trip Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Trip Summary</h4>
            <p className="text-xs text-gray-600 mb-1">
              <span className="font-medium">From:</span> {ride.pickup_address}
            </p>
            <p className="text-xs text-gray-600 mb-1">
              <span className="font-medium">To:</span> {ride.destination_address}
            </p>
            <p className="text-xs text-gray-600">
              <span className="font-medium">Fare:</span> {formatRupees(ride.final_fare || ride.estimated_fare)}
            </p>
          </div>

          {/* Rating Section */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-3">
              How was your experience with{' '}
              <span className="font-medium">{getRatedPersonName()}</span>?
            </p>
            
            {/* Star Rating */}
            <div className="flex justify-center space-x-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="focus:outline-none"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(null)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`w-8 h-8 ${
                      (hoveredRating || rating) && star <= (hoveredRating || rating || 0)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>

            {/* Rating Label */}
            {(rating || hoveredRating) && (
              <p className="text-sm font-medium text-yellow-600">
                {ratingLabels[(hoveredRating || rating) as keyof typeof ratingLabels]}
              </p>
            )}
          </div>

          {/* Review Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share your feedback (optional)
            </label>
            <Textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder={`Tell us about your experience with ${getRatedPersonName()}...`}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {review.length}/500 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
            >
              Skip
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={rating === null}
              className="flex-1"
            >
              Submit Rating
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Your rating helps improve the experience for everyone
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
