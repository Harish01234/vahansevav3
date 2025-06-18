'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { useSocket } from '@/components/socket-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Car, MapPin, DollarSign, Clock, LogOut, Navigation, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/theme-toggle';

interface Ride {
  _id: string;
  pickup: {
    address: string;
    lat: number;
    lng: number;
  };
  drop: {
    address: string;
    lat: number;
    lng: number;
  };
  status: 'pending' | 'assigned' | 'en_route' | 'completed' | 'cancelled';
  fare: number;
  distance: number;
  estimatedTime: number;
  passengerId: {
    name: string;
    email: string;
  };
  createdAt: string;
  notes?: string;
}

export default function RiderDashboard() {
  const { user, logout, token, updateUser } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();
  const [rides, setRides] = useState<Ride[]>([]);
  const [pendingRides, setPendingRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(user?.available || false);

  useEffect(() => {
    if (!user || user.role !== 'rider') {
      router.push('/login');
      return;
    }

    fetchRides();
    fetchPendingRides();
    setIsAvailable(user.available || false);
  }, [user, router, token]);

  useEffect(() => {
    if (socket) {
      socket.on('new-ride-request', (data) => {
        toast.info('New ride request received!');
        fetchPendingRides();
      });

      return () => {
        socket.off('new-ride-request');
      };
    }
  }, [socket]);

  const fetchRides = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL}/api/rides/my-rides`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setRides(data.rides);
      } else {
        toast.error('Failed to fetch rides');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingRides = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL}/api/rides/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setPendingRides(data.rides);
      }
    } catch (error) {
      console.error('Error fetching pending rides:', error);
    }
  };

  const handleAvailabilityToggle = async (available: boolean) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL}/api/users/availability`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ available }),
      });

      if (response.ok) {
        setIsAvailable(available);
        updateUser({ available });
        
        if (socket) {
          socket.emit(available ? 'rider-available' : 'rider-unavailable', user?.id);
        }
        
        toast.success(`You are now ${available ? 'available' : 'unavailable'} for rides`);
      } else {
        toast.error('Failed to update availability');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    }
  };

  const handleAcceptRide = async (rideId: string) => {
    try {
      if (socket) {
        socket.emit('accept-ride', { rideId, riderId: user?.id });
         // Remove the accepted ride from pending list immediately
      
        toast.success('Ride accepted!');
        fetchRides();
        await fetchPendingRides()
       setPendingRides((prev) => prev.filter((ride) => ride._id !== rideId));
      }
    } catch (error) {
      toast.error('Failed to accept ride');
    }
  };

  const handleUpdateRideStatus = async (rideId: string, status: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL}/api/rides/${rideId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        if (socket) {
          socket.emit('update-ride-status', { rideId, status });
        }
        toast.success(`Ride status updated to ${status}`);
        fetchRides();
      } else {
        toast.error('Failed to update ride status');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-[var(--color-warning)] text-[var(--color-warning-text)]';
      case 'assigned': return 'bg-[var(--color-info)] text-[var(--color-info-text)]';
      case 'en_route': return 'bg-[var(--color-accent)] text-white';
      case 'completed': return 'bg-[var(--color-success)] text-[var(--color-success-text)]';
      case 'cancelled': return 'bg-[var(--color-error)] text-[var(--color-error-text)]';
      default: return 'bg-[var(--color-muted)] text-[var(--color-muted-text)]';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4" />
          <p className="text-[var(--color-muted)]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Header */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-bg)] backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Car className="w-8 h-8 text-[var(--color-accent)]" />
            <span className="text-2xl font-bold text-[var(--color-text)]">VahanSeva</span>
            <Badge variant="outline" className="border-[var(--color-border)] text-[var(--color-text)]">Rider</Badge>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-[var(--color-muted)]">Welcome, {user?.name}</span>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={logout} className="text-[var(--color-text)] hover:bg-[var(--color-hover)]">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Availability Toggle */}
          <Card className="mb-8 bg-[var(--color-bg)] border-[var(--color-border)]">
            <CardHeader>
              <CardTitle className="flex items-center text-[var(--color-text)]">
                <Navigation className="w-5 h-5 mr-2" />
                Availability Status
              </CardTitle>
              <CardDescription className="text-[var(--color-muted)]">
                Toggle your availability to receive ride requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Switch
                  id="availability"
                  checked={isAvailable}
                  onCheckedChange={handleAvailabilityToggle}
                  className="data-[state=checked]:bg-[var(--color-accent)]"
                />
                <Label htmlFor="availability" className="font-medium text-[var(--color-text)]">
                  {isAvailable ? 'Available for rides' : 'Unavailable'}
                </Label>
                <Badge 
                  variant={isAvailable ? 'default' : 'secondary'}
                  className={isAvailable 
                    ? 'bg-[var(--color-accent)] text-white' 
                    : 'bg-[var(--color-muted)] text-[var(--color-muted-text)]'
                  }
                >
                  {isAvailable ? 'Online' : 'Offline'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Pending Ride Requests */}
            <Card className="bg-[var(--color-bg)] border-[var(--color-border)]">
              <CardHeader>
                <CardTitle className="text-[var(--color-text)]">Pending Requests</CardTitle>
                <CardDescription className="text-[var(--color-muted)]">
                  New ride requests waiting for your response
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingRides.length === 0 ? (
                  <p className="text-center text-[var(--color-muted)] py-4">No pending requests</p>
                ) : (
                  <div className="space-y-4">
                    {pendingRides.map((ride) => (
                      <div 
                        key={ride._id} 
                        className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-medium text-[var(--color-text)]">
                              {ride.passengerId.name}
                            </h3>
                            <p className="text-sm text-[var(--color-muted)]">
                              {ride.passengerId.email}
                            </p>
                          </div>
                          <Badge className={getStatusColor(ride.status)}>
                            {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-[var(--color-text)]">
                            <MapPin className="w-4 h-4 mr-2 text-[var(--color-muted)]" />
                            {ride.pickup.address}
                          </div>
                          <div className="flex items-center text-[var(--color-text)]">
                            <MapPin className="w-4 h-4 mr-2 text-[var(--color-muted)]" />
                            {ride.drop.address}
                          </div>
                          <div className="flex items-center justify-between text-[var(--color-text)]">
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 mr-2 text-[var(--color-muted)]" />
                              ₹{ride.fare}
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2 text-[var(--color-muted)]" />
                              {ride.estimatedTime} mins
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex space-x-2">
                          <Button
                            onClick={() => handleAcceptRide(ride._id)}
                            className="flex-1 bg-[var(--color-accent)] text-white hover:opacity-90"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Accept
                          </Button>
                          <Button
                            onClick={() => handleUpdateRideStatus(ride._id, 'cancelled')}
                            variant="outline"
                            className="flex-1 border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-hover)]"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Rides */}
            <Card className="bg-[var(--color-bg)] border-[var(--color-border)]">
              <CardHeader>
                <CardTitle className="text-[var(--color-text)]">Active Rides</CardTitle>
                <CardDescription className="text-[var(--color-muted)]">
                  Your current and upcoming rides
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rides.filter(ride => ['assigned', 'en_route'].includes(ride.status)).length === 0 ? (
                  <p className="text-center text-[var(--color-muted)] py-4">No active rides</p>
                ) : (
                  <div className="space-y-4">
                    {rides
                      .filter(ride => ['assigned', 'en_route'].includes(ride.status))
                      .map((ride) => (
                        <div 
                          key={ride._id} 
                          className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-medium text-[var(--color-text)]">
                                {ride.passengerId.name}
                              </h3>
                              <p className="text-sm text-[var(--color-muted)]">
                                {ride.passengerId.email}
                              </p>
                            </div>
                            <Badge className={getStatusColor(ride.status)}>
                              {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center text-[var(--color-text)]">
                              <MapPin className="w-4 h-4 mr-2 text-[var(--color-muted)]" />
                              {ride.pickup.address}
                            </div>
                            <div className="flex items-center text-[var(--color-text)]">
                              <MapPin className="w-4 h-4 mr-2 text-[var(--color-muted)]" />
                              {ride.drop.address}
                            </div>
                            <div className="flex items-center justify-between text-[var(--color-text)]">
                              <div className="flex items-center">
                                <DollarSign className="w-4 h-4 mr-2 text-[var(--color-muted)]" />
                                ₹{ride.fare}
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-2 text-[var(--color-muted)]" />
                                {ride.estimatedTime} mins
                              </div>
                            </div>
                          </div>
                          <div className="mt-4">
                            <Button
                              onClick={() => handleUpdateRideStatus(ride._id, 'completed')}
                              className="w-full bg-[var(--color-accent)] text-white hover:opacity-90"
                            >
                              Complete Ride
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}