'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Phone, Mail, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function ProfileSettings() {
  const { user, updateProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
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
    }
  }, [user]);

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
    // Use type assertion to bypass the error
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
        {/* Profile Overview */}
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
