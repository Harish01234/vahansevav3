'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { useSocket } from '@/components/socket-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Car, MapPin, Navigation, DollarSign, Clock, LogOut } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/theme-toggle';
import { LocationSearch } from '@/components/location-search';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/components/map-component'), {
  ssr: false,
  loading: () => <div className="h-96 w-full bg-[var(--color-muted)] rounded-lg animate-pulse" />
});

interface LocationData {
  address: string;
  lat: number;
  lng: number;
}

export default function BookRide() {
  const { user, logout, token } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();
  
  const [pickup, setPickup] = useState<LocationData>({ address: '', lat: 0, lng: 0 });
  const [drop, setDrop] = useState<LocationData>({ address: '', lat: 0, lng: 0 });
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([28.6139, 77.2090]); // Delhi center

  useEffect(() => {
    if (!user || user.role !== 'user') {
      router.push('/login');
      return;
    }
  }, [user, router]);

  const handleMapClick = async (lat: number, lng: number) => {
    try {
      // Reverse geocoding to get address
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      const address = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

      const locationData = { address, lat, lng };

      if (!pickup.lat) {
        setPickup(locationData);
        toast.success('Pickup location set!');
      } else if (!drop.lat) {
        setDrop(locationData);
        toast.success('Drop location set!');
      }
    } catch (error) {
      toast.error('Error getting location details');
    }
  };

  const handleLocationUpdate = (location: LocationData, type: 'pickup' | 'drop') => {
    if (type === 'pickup') {
      setPickup(location);
      setMapCenter([location.lat, location.lng]);
    } else {
      setDrop(location);
    }
  };

  const handleBookRide = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pickup.lat || !pickup.lng || !drop.lat || !drop.lng) {
      toast.error('Please set both pickup and drop locations');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL}/api/rides/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          pickup,
          drop,
          notes
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Ride booked successfully! Finding nearest rider...');
        router.push('/rides');
      } else {
        toast.error(data.message || 'Failed to book ride');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const mapMarkers = [];
  if (pickup.lat && pickup.lng) {
    mapMarkers.push({
      position: [pickup.lat, pickup.lng] as [number, number],
      popup: `Pickup: ${pickup.address}`
    });
  }
  if (drop.lat && drop.lng) {
    mapMarkers.push({
      position: [drop.lat, drop.lng] as [number, number],
      popup: `Drop: ${drop.address}`
    });
  }

  if (user.role === 'user') {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        {/* Header */}
        <header className="border-b border-[var(--color-border)] bg-[var(--color-bg)] backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Car className="w-8 h-8 text-[var(--color-accent)]" />
              <span className="text-2xl font-bold text-[var(--color-text)]">VahanSeva</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-[var(--color-muted)]">Welcome, {user?.name}</span>
              <Link href="/rides">
                <Button variant="ghost" className="text-[var(--color-text)] hover:bg-[var(--color-hover)]">My Rides</Button>
              </Link>
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={logout} className="text-[var(--color-text)] hover:bg-[var(--color-hover)]">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-2 text-[var(--color-text)]">Book Your Ride</h1>
              <p className="text-[var(--color-muted)]">
                Select your pickup and drop locations to book a ride
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Booking Form */}
              <Card className="bg-[var(--color-bg)] border-[var(--color-border)]">
                <CardHeader>
                  <CardTitle className="flex items-center text-[var(--color-text)]">
                    <Navigation className="w-5 h-5 mr-2" />
                    Ride Details
                  </CardTitle>
                  <CardDescription className="text-[var(--color-muted)]">
                    Enter your pickup and drop locations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleBookRide} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="pickup" className="text-[var(--color-text)]">Pickup Location</Label>
                      <LocationSearch
                        value={pickup.address}
                        onChange={(location) => handleLocationUpdate(location, 'pickup')}
                        placeholder="Enter pickup address"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="drop" className="text-[var(--color-text)]">Drop Location</Label>
                      <LocationSearch
                        value={drop.address}
                        onChange={(location) => handleLocationUpdate(location, 'drop')}
                        placeholder="Enter drop address"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes" className="text-[var(--color-text)]">Additional Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any special instructions for the rider..."
                        rows={3}
                        className="bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] focus:ring-[var(--color-focus)]"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-[var(--color-accent)] text-white hover:opacity-90" 
                      disabled={isLoading || !pickup.lat || !drop.lat}
                    >
                      {isLoading ? 'Booking...' : 'Book Ride'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Map */}
              <div className="h-[600px] rounded-lg overflow-hidden border border-[var(--color-border)]">
                <MapComponent
                  center={mapCenter}
                  markers={mapMarkers}
                  onMapClick={handleMapClick}
                  className="h-full w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
      <div className="text-[var(--color-text)]">Loading...</div>
    </div>
  );
}