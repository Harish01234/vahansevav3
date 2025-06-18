'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Car, User } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '' as 'user' | 'rider' | '',
    vehicleType: '',
    vehicleModel: '',
    vehicleNumber: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!formData.role) {
      toast.error('Please select your role');
      return;
    }

    setIsLoading(true);

    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role
      };

      if (formData.role === 'rider') {
        payload.vehicleInfo = {
          type: formData.vehicleType,
          model: formData.vehicleModel,
          number: formData.vehicleNumber
        };
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.user, data.token);
        toast.success('Registration successful!');
        
        if (data.user.role === 'rider') {
          router.push('/rider-dashboard');
        } else {
          router.push('/book-ride');
        }
      } else {
        toast.error(data.message || 'Registration failed');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="flex items-center space-x-2">
            <Car className="w-8 h-8 text-[var(--color-accent)]" />
            <span className="text-2xl font-bold text-[var(--color-text)]">VahanSeva</span>
          </Link>
          <ThemeToggle />
        </div>

        <Card className="w-full bg-[var(--color-bg)] border-[var(--color-border)]">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-[var(--color-text)]">Create Account</CardTitle>
            <CardDescription className="text-[var(--color-muted)]">
              Join VahanSeva and start your journey today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[var(--color-text)]">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] focus:ring-[var(--color-focus)]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[var(--color-text)]">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] focus:ring-[var(--color-focus)]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[var(--color-text)]">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] focus:ring-[var(--color-focus)]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[var(--color-text)]">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  className="bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] focus:ring-[var(--color-focus)]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[var(--color-text)]">I want to</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant={formData.role === 'user' ? 'default' : 'outline'}
                    className={`justify-start ${
                      formData.role === 'user' 
                        ? 'bg-[var(--color-accent)] text-white hover:opacity-90' 
                        : 'border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-hover)]'
                    }`}
                    onClick={() => setFormData({ ...formData, role: 'user' })}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Book Rides
                  </Button>
                  <Button
                    type="button"
                    variant={formData.role === 'rider' ? 'default' : 'outline'}
                    className={`justify-start ${
                      formData.role === 'rider' 
                        ? 'bg-[var(--color-accent)] text-white hover:opacity-90' 
                        : 'border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-hover)]'
                    }`}
                    onClick={() => setFormData({ ...formData, role: 'rider' })}
                  >
                    <Car className="w-4 h-4 mr-2" />
                    Drive & Earn
                  </Button>
                </div>
              </div>

              {formData.role === 'rider' && (
                <div className="space-y-4 pt-4 border-t border-[var(--color-border)]">
                  <h3 className="font-semibold text-[var(--color-text)]">Vehicle Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="vehicleType" className="text-[var(--color-text)]">Vehicle Type</Label>
                    <Select value={formData.vehicleType} onValueChange={(value) => setFormData({ ...formData, vehicleType: value })}>
                      <SelectTrigger className="bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)]">
                        <SelectValue placeholder="Select vehicle type" />
                      </SelectTrigger>
                      <SelectContent className="bg-[var(--color-bg)] border-[var(--color-border)]">
                        <SelectItem value="car" className="text-[var(--color-text)]">Car</SelectItem>
                        <SelectItem value="bike" className="text-[var(--color-text)]">Bike</SelectItem>
                        <SelectItem value="auto" className="text-[var(--color-text)]">Auto Rickshaw</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vehicleModel" className="text-[var(--color-text)]">Vehicle Model</Label>
                    <Input
                      id="vehicleModel"
                      type="text"
                      value={formData.vehicleModel}
                      onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                      required
                      className="bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] focus:ring-[var(--color-focus)]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vehicleNumber" className="text-[var(--color-text)]">Vehicle Number</Label>
                    <Input
                      id="vehicleNumber"
                      type="text"
                      value={formData.vehicleNumber}
                      onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                      required
                      className="bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] focus:ring-[var(--color-focus)]"
                    />
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-[var(--color-accent)] text-white hover:opacity-90" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner mr-2" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-[var(--color-muted)]">
              Already have an account?{' '}
              <Link href="/login" className="text-[var(--color-accent)] hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}