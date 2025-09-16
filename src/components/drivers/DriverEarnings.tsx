'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, DollarSign, Car } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface DriverStats {
  totalStats: {
    totalRides: number;
    totalGrossEarnings: number;
    platformFee: number;
    totalNetEarnings: number;
    availableToWithdraw: number;
  };
  periodStats: {
    today: { rides: number; earnings: number };
    week: { rides: number; earnings: number };
    month: { rides: number; earnings: number };
  };
  recentRides: any[];
}

export default function DriverEarnings() {
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchStats = async (start?: string, end?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (start) params.append('startDate', start);
      if (end) params.append('endDate', end);

      const response = await api.get(`/api/drivers/stats?${params.toString()}`);
      setStats(response.data);
    } catch (error: any) {
      toast.error('Failed to fetch earnings data');
      console.error('Stats fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleDateFilter = () => {
    if (startDate && endDate) {
      fetchStats(startDate, endDate);
    } else {
      toast.error('Please select both start and end dates');
    }
  };

  const clearFilter = () => {
    setStartDate('');
    setEndDate('');
    fetchStats();
  };

  const formatCurrency = (cents: number) => {
    return `${(cents / 100).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Failed to load earnings data</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-2">Driver Earnings</h1>
        <p className="text-gray-600">Track your rides and earnings</p>
      </div>

      {/* Date Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filter by Date Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleDateFilter}>Apply Filter</Button>
              <Button variant="outline" onClick={clearFilter}>Clear</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Rides</p>
                <p className="text-2xl font-bold">{stats.totalStats.totalRides}</p>
              </div>
              <Car className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Gross Earnings</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.totalStats.totalGrossEarnings)}
                </p>
                <p className="text-xs text-gray-500">What riders paid</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Platform Fee (20%)</p>
                <p className="text-2xl font-bold text-red-600">
                  -{formatCurrency(stats.totalStats.platformFee)}
                </p>
                <p className="text-xs text-gray-500">Our commission</p>
              </div>
              <DollarSign className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Your Earnings</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(stats.totalStats.totalNetEarnings)}
                </p>
                <p className="text-xs text-gray-500">Available to withdraw</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Rides:</span>
                <span className="font-semibold">{stats.periodStats.today.rides}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Earnings:</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(stats.periodStats.today.earnings)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Rides:</span>
                <span className="font-semibold">{stats.periodStats.week.rides}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Earnings:</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(stats.periodStats.week.earnings)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Rides:</span>
                <span className="font-semibold">{stats.periodStats.month.rides}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Earnings:</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(stats.periodStats.month.earnings)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ready to Withdraw</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Available Balance</p>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(stats.totalStats.availableToWithdraw)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                From {stats.totalStats.totalRides} completed rides
              </p>
            </div>
            <Button size="lg" className="bg-green-600 hover:bg-green-700">
              Request Withdrawal
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Rides */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Rides</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentRides.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No rides found</p>
          ) : (
            <div className="space-y-3">
              {stats.recentRides.map((ride) => (
                <div key={ride.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {ride.pickup_address} → {ride.destination_address}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(ride.created_at).toLocaleDateString()} at{' '}
                      {new Date(ride.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      Gross: {formatCurrency(ride.final_fare || ride.estimated_fare)}
                    </p>
                    <p className="font-semibold text-green-600">
                      You earned: {formatCurrency(Math.round((ride.final_fare || ride.estimated_fare) * 0.8))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
