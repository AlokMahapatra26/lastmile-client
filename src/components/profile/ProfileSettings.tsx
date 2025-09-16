'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Phone, Mail, Calendar, Star } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

// Add RatingDisplay component inline if not available as separate file
const RatingDisplay = ({ 
  rating, 
  totalRatings, 
  size = 'md', 
  showCount = true 
}: {
  rating: number;
  totalRatings: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4', 
    lg: 'w-5 h-5'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className="flex items-center gap-1">
      <Star className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`} />
      <span className={`font-medium ${textSizeClasses[size]}`}>
        {rating > 0 ? rating.toFixed(1) : 'No ratings'}
      </span>
      {showCount && totalRatings > 0 && (
        <span className={`text-gray-500 ${textSizeClasses[size]}`}>
          ({totalRatings})
        </span>
      )}
    </div>
  );
};

interface RatingStats {
  totalRatings: number;
  averageRating: number;
  ratingBreakdown: {
    [key: number]: number;
  };
  recentReviews: Array<{
    rating: number;
    review: string;
    created_at: string;
    ride_id: string;
    rated_by: {
      first_name: string;
      last_name: string;
    };
  }>;
}

export default function ProfileSettings() {
  const { user, updateProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [loadingRatings, setLoadingRatings] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        phoneNumber: user.phone_number || '',
        email: user.email || ''
      });
      
      // Fetch user ratings
      fetchUserRatings();
    }
  }, [user]);

  // Fetch user's rating statistics
  const fetchUserRatings = async () => {
    if (!user) return;
    
    setLoadingRatings(true);
    try {
      // First get all ratings for this user
      const response = await api.get(`/api/users/ratings/${user.id}`);
      const ratings = response.data.ratings || [];
      
      // Calculate statistics
      const totalRatings = ratings.length;
      const averageRating = totalRatings > 0 
        ? ratings.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / totalRatings 
        : 0;

      // Rating breakdown
      const ratingBreakdown: { [key: number]: number } = {
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0
      };

      ratings.forEach((rating: any) => {
        if (rating.rating >= 1 && rating.rating <= 5) {
          ratingBreakdown[rating.rating]++;
        }
      });

      // Recent reviews with text
      const recentReviews = ratings
        .filter((r: any) => r.review && r.review.trim() !== '')
        .slice(0, 3)
        .map((r: any) => ({
          rating: r.rating,
          review: r.review,
          created_at: r.created_at,
          ride_id: r.ride_id,
          rated_by: r.rated_by
        }));

      setRatingStats({
        totalRatings,
        averageRating: parseFloat(averageRating.toFixed(1)),
        ratingBreakdown,
        recentReviews
      });

    } catch (error) {
      console.error('Failed to fetch ratings:', error);
    } finally {
      setLoadingRatings(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.phoneNumber) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    
    try {
      await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber
      } as any);
      
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    if (user) {
      setFormData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        phoneNumber: user.phone_number || '',
        email: user.email || ''
      });
    }
    toast.success('Form reset to original values');
  };

  const getRatingPercentage = (rating: number) => {
    if (!ratingStats || ratingStats.totalRatings === 0) return 0;
    return ((ratingStats.ratingBreakdown[rating] || 0) / ratingStats.totalRatings) * 100;
  };

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Profile Settings</h1>
        <p className="text-gray-600">Manage your account information</p>
      </div>

      <div className="space-y-6">
        {/* Profile Overview with Rating */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">User Type:</span>
                <span className="font-medium capitalize">{user.user_type}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Member Since:</span>
                <span className="font-medium">
                  {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Phone:</span>
                <span className="font-medium">{user.phone_number}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rating Display Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              My Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRatings ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : ratingStats ? (
              <div className="space-y-6">
                {/* Main Rating Display */}
                <div className="text-center">
                  <RatingDisplay
                    rating={ratingStats.averageRating}
                    totalRatings={ratingStats.totalRatings}
                    size="lg"
                    showCount={true}
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    Based on {ratingStats.totalRatings} rating{ratingStats.totalRatings !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Rating Breakdown */}
                {ratingStats.totalRatings > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Rating Distribution</h4>
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center gap-3">
                        <div className="flex items-center gap-1 w-16">
                          <span className="text-sm">{rating}</span>
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-400 h-2 rounded-full transition-all"
                            style={{ width: `${getRatingPercentage(rating)}%` }}
                          />
                        </div>
                        <div className="text-sm text-gray-600 w-12 text-right">
                          {ratingStats.ratingBreakdown[rating] || 0}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recent Reviews */}
                {ratingStats.recentReviews.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Recent Reviews</h4>
                    <div className="space-y-3">
                      {ratingStats.recentReviews.map((review, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">"{review.review}"</p>
                          <p className="text-xs text-gray-500 mt-1">
                            - {review.rated_by?.first_name} {review.rated_by?.last_name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No ratings yet</p>
                <p className="text-sm text-gray-400">Complete more rides to receive ratings</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Enter your first name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Enter your last name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="Enter your phone number"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'Updating...' : 'Update Profile'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={resetForm}
                  disabled={isLoading}
                >
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Account Status</p>
                  <p className="text-sm text-gray-600">Your account is active</p>
                </div>
                <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  Active
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Account Type</p>
                  <p className="text-sm text-gray-600">
                    You are registered as a {user.user_type}
                  </p>
                </div>
                <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium capitalize">
                  {user.user_type}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
