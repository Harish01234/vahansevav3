'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { useSocket } from '@/components/socket-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, MapPin, Clock, DollarSign, LogOut, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/theme-toggle';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

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
  assignedRiderId?: {
    name: string;
    vehicleInfo: {
      type: string;
      model: string;
      number: string;
    };
  };
  createdAt: string;
  notes?: string;
}

const AnimateOnScroll = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const [ref, inView] = useInView({ threshold: 0.15, triggerOnce: false });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  );
};

export default function Rides() {
  const { user, logout, token } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();
  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'user') {
      router.push('/login');
      return;
    }
    fetchRides();
  }, [user, router, token]);

  useEffect(() => {
    if (socket) {
      socket.on('ride-assigned', () => {
        toast.success('Rider assigned to your ride!');
        fetchRides();
      });

      socket.on('ride-status-updated', (data) => {
        toast.info(`Ride status updated: ${data.status}`);
        fetchRides();
      });

      return () => {
        socket.off('ride-assigned');
        socket.off('ride-status-updated');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-200 text-yellow-800';
      case 'assigned': return 'bg-blue-200 text-blue-800';
      case 'en_route': return 'bg-purple-500 text-white';
      case 'completed': return 'bg-green-200 text-green-800';
      case 'cancelled': return 'bg-red-200 text-red-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Finding Rider';
      case 'assigned': return 'Rider Assigned';
      case 'en_route': return 'On the Way';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center animate-pulse">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4" />
          <p className="text-[var(--color-muted)]">Loading your rides...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-bg)] backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/book-ride">
              <Button variant="ghost" size="icon" className="text-[var(--color-text)] hover:bg-[var(--color-hover)]">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Car className="w-8 h-8 text-[var(--color-accent)] animate-pulse" />
              <span className="text-2xl font-bold text-[var(--color-text)]">VahanSeva</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-[var(--color-muted)]">Welcome, {user?.name}</span>
            <Link href="/book-ride">
              <Button variant="ghost" className="text-[var(--color-text)] hover:bg-[var(--color-hover)]">Book New Ride</Button>
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
          <AnimateOnScroll>
            <div className="text-center mb-12">
              <motion.h1
                className="text-4xl font-bold mb-2 text-[var(--color-text)]"
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                My Rides
              </motion.h1>
              <motion.p
                className="text-[var(--color-muted)]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Track your ride history and current bookings
              </motion.p>
            </div>
          </AnimateOnScroll>

          {rides.length === 0 ? (
            <Card className="text-center py-12 bg-[var(--color-bg)] border-[var(--color-border)]">
              <CardContent>
                <Car className="w-16 h-16 mx-auto mb-4 text-[var(--color-muted)] animate-bounce" />
                <h3 className="text-xl font-semibold mb-2 text-[var(--color-text)]">No rides yet</h3>
                <p className="text-[var(--color-muted)] mb-4">
                  Book your first ride to get started!
                </p>
                <Link href="/book-ride">
                  <Button className="bg-[var(--color-accent)] text-white hover:opacity-90">Book a Ride</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {rides.map((ride, index) => (
                <AnimateOnScroll key={ride._id} delay={index * 0.1}>
                  <Card className="hover:shadow-lg transition-shadow bg-[var(--color-bg)] border-[var(--color-border)]">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center text-[var(--color-text)]">
                            <Car className="w-5 h-5 mr-2" />
                            Ride #{ride._id.slice(-6)}
                          </CardTitle>
                          <CardDescription className="text-[var(--color-muted)]">
                            {new Date(ride.createdAt).toLocaleDateString()} at{' '}
                            {new Date(ride.createdAt).toLocaleTimeString()}
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(ride.status)}>
                          {getStatusText(ride.status)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-start space-x-2">
                            <MapPin className="w-4 h-4 mt-1 text-[var(--color-success)]" />
                            <div>
                              <p className="font-medium text-sm text-[var(--color-text)]">Pickup</p>
                              <p className="text-sm text-[var(--color-muted)]">
                                {ride.pickup.address}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-2">
                            <MapPin className="w-4 h-4 mt-1 text-[var(--color-error)]" />
                            <div>
                              <p className="font-medium text-sm text-[var(--color-text)]">Drop</p>
                              <p className="text-sm text-[var(--color-muted)]">
                                {ride.drop.address}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-[var(--color-accent)]" />
                            <span className="font-medium text-[var(--color-text)]">₹{ride.fare}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-[var(--color-accent)]" />
                            <span className="text-sm text-[var(--color-text)]">
                              {ride.distance} km • {ride.estimatedTime} min
                            </span>
                          </div>
                        </div>
                      </div>

                      {ride.assignedRiderId && (
                        <div className="border-t border-[var(--color-border)] pt-4">
                          <h4 className="font-medium mb-2 text-[var(--color-text)]">Rider Details</h4>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-[var(--color-text)]">{ride.assignedRiderId.name}</p>
                              <p className="text-sm text-[var(--color-muted)]">
                                {ride.assignedRiderId.vehicleInfo.model} • {ride.assignedRiderId.vehicleInfo.number}
                              </p>
                            </div>
                            <Badge variant="outline" className="border-[var(--color-border)] text-[var(--color-text)]">
                              {ride.assignedRiderId.vehicleInfo.type}
                            </Badge>
                          </div>
                        </div>
                      )}

                      {ride.notes && (
                        <div className="border-t border-[var(--color-border)] pt-4">
                          <h4 className="font-medium mb-2 text-[var(--color-text)]">Notes</h4>
                          <p className="text-sm text-[var(--color-muted)]">{ride.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </AnimateOnScroll>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}