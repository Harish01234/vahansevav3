'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Car } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.user, data.token);
        toast.success('Login successful!');
        
        if (data.user.role === 'rider') {
          router.push('/rider-dashboard');
        } else {
          router.push('/book-ride');
        }
      } else {
        toast.error(data.message || 'Login failed');
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
            <CardTitle className="text-2xl text-[var(--color-text)]">Welcome Back</CardTitle>
            <CardDescription className="text-[var(--color-muted)]">
              Sign in to your VahanSeva account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <Button 
                type="submit" 
                className="w-full bg-[var(--color-accent)] text-white hover:opacity-90" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner mr-2" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-[var(--color-muted)]">
              Don't have an account?{' '}
              <Link href="/register" className="text-[var(--color-accent)] hover:underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}