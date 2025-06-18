'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, MapPin, Clock, Shield, Star } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const AnimateOnView = ({ children, delay = 0, y = 30 }: { children: React.ReactNode; delay?: number; y?: number }) => {
  const controls = useAnimation();
  const [ref, inView] = useInView({ triggerOnce: false, threshold: 0.1 });

  useEffect(() => {
    if (inView) {
      controls.start({ opacity: 1, y: 0 });
    } else {
      controls.start({ opacity: 0, y });
    }
  }, [controls, inView, y]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={controls}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  );
};

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push(user.role === 'rider' ? '/rider-dashboard' : '/book-ride');
    }
  }, [user, router]);

  const features = [
    { icon: <MapPin className="w-8 h-8 text-[var(--color-accent)]" />, title: "Real-time Tracking", description: "Track your ride in real-time with live location updates" },
    { icon: <Clock className="w-8 h-8 text-[var(--color-accent)]" />, title: "Quick Booking", description: "Book a ride in under 30 seconds with our easy interface" },
    { icon: <Shield className="w-8 h-8 text-[var(--color-accent)]" />, title: "Safe & Secure", description: "All riders are verified and trips are insured for your safety" },
    { icon: <Star className="w-8 h-8 text-[var(--color-accent)]" />, title: "Top Rated", description: "Highly rated drivers ensuring quality service every time" }
  ];

  const stats = [
    { label: "Happy Customers", value: "10K+" },
    { label: "Cities", value: "50+" },
    { label: "Rides Completed", value: "100K+" },
    { label: "Active Drivers", value: "5K+" }
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-sm sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Car className="w-8 h-8 text-[var(--color-accent)]" />
            <span className="text-2xl font-bold text-[var(--color-text)]">VahanSeva</span>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" className="text-[var(--color-accent)] hover:bg-[var(--color-hover)]">Login</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-[var(--color-accent)] text-white hover:opacity-90">Get Started</Button>
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <AnimateOnView>
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-[var(--color-accent)]">
              Your Ride, Your Way
            </h1>
            <p className="text-xl md:text-2xl text-[var(--color-muted)] mb-8 max-w-2xl mx-auto">
              Experience seamless ride booking with VahanSeva. Safe, reliable, and affordable rides at your fingertips.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="text-lg px-8 py-6 bg-[var(--color-accent)] text-white hover:opacity-90">
                  Book Your Ride
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-hover)]">
                  Drive & Earn
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </AnimateOnView>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <AnimateOnView key={index} delay={index * 0.1}>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-[var(--color-accent)] mb-2">
                  {stat.value}
                </div>
                <div className="text-[var(--color-muted)]">{stat.label}</div>
              </div>
            </AnimateOnView>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-[var(--color-text)]">Why Choose VahanSeva?</h2>
          <p className="text-xl text-[var(--color-muted)] max-w-2xl mx-auto">
            We're committed to providing the best ride booking experience with cutting-edge technology and exceptional service.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <AnimateOnView key={index} delay={index * 0.1}>
              <Card className="text-center p-6 hover:shadow-lg transition-shadow bg-[var(--color-muted)]/10 border-[var(--color-border)]">
                <CardHeader>
                  <div className="mx-auto mb-4 p-3 bg-[var(--color-accent)]/10 rounded-full w-fit">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl text-[var(--color-text)]">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-[var(--color-muted)]">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </AnimateOnView>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <AnimateOnView>
        <section className="bg-[var(--color-accent)]/10 border-t border-[var(--color-border)]">
          <div className="container mx-auto px-4 py-20 text-center">
            <h2 className="text-4xl font-bold mb-4 text-[var(--color-accent)]">Ready to Get Started?</h2>
            <p className="text-xl text-[var(--color-muted)] mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied customers who trust VahanSeva for their daily commute and travel needs.
            </p>
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 py-6 bg-[var(--color-accent)] text-white hover:opacity-90">
                Start Your Journey
              </Button>
            </Link>
          </div>
        </section>
      </AnimateOnView>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg)]/80">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Car className="w-6 h-6 text-[var(--color-accent)]" />
              <span className="text-lg font-semibold text-[var(--color-text)]">VahanSeva</span>
            </div>
            <div className="text-sm text-[var(--color-muted)]">
              © 2024 VahanSeva. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
