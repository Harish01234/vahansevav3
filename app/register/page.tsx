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
import { motion, AnimatePresence } from 'framer-motion';

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.user, data.token);
        toast.success('Registration successful!');
        router.push(data.user.role === 'rider' ? '/rider-dashboard' : '/book-ride');
      } else {
        toast.error(data.message || 'Registration failed');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="flex items-center space-x-2">
            <Car className="w-8 h-8 text-[var(--color-accent)]" />
            <span className="text-2xl font-bold text-[var(--color-text)]">VahanSeva</span>
          </Link>
          <ThemeToggle />
        </div>

        <Card className="w-full bg-[var(--color-bg)] border-[var(--color-border)] shadow-xl">
          <CardHeader className="text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <CardTitle className="text-2xl text-[var(--color-text)]">Create Account</CardTitle>
              <CardDescription className="text-[var(--color-muted)]">
                Join VahanSeva and start your journey today
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent>
            <motion.form onSubmit={handleSubmit} className="space-y-4">
              {[
                { id: 'name', label: 'Full Name', type: 'text' },
                { id: 'email', label: 'Email', type: 'email' },
                { id: 'password', label: 'Password', type: 'password' },
                { id: 'confirmPassword', label: 'Confirm Password', type: 'password' },
              ].map(({ id, label, type }, index) => (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="space-y-2"
                >
                  <Label htmlFor={id} className="text-[var(--color-text)]">{label}</Label>
                  <Input
                    id={id}
                    type={type}
                    value={formData[id as keyof typeof formData] as string}
                    onChange={(e) => setFormData({ ...formData, [id]: e.target.value })}
                    required
                    className="bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] focus:ring-[var(--color-focus)]"
                  />
                </motion.div>
              ))}

              {/* Role Selector */}
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-2"
              >
                <Label className="text-[var(--color-text)]">I want to</Label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: 'user', label: 'Book Rides', icon: User },
                    { value: 'rider', label: 'Drive & Earn', icon: Car },
                  ].map(({ value, label, icon: Icon }) => (
                    <Button
                      key={value}
                      type="button"
                      variant={formData.role === value ? 'default' : 'outline'}
                      onClick={() => setFormData({ ...formData, role: value as 'user' | 'rider' })}
                      className={`justify-start ${
                        formData.role === value
                          ? 'bg-[var(--color-accent)] text-white hover:opacity-90'
                          : 'border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-hover)]'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {label}
                    </Button>
                  ))}
                </div>
              </motion.div>

              {/* Rider Vehicle Info */}
              <AnimatePresence>
                {formData.role === 'rider' && (
                  <motion.div
                    key="vehicle-info"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4 pt-4 border-t border-[var(--color-border)]"
                  >
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

                    {['vehicleModel', 'vehicleNumber'].map((field) => (
                      <div className="space-y-2" key={field}>
                        <Label htmlFor={field} className="text-[var(--color-text)]">
                          {field === 'vehicleModel' ? 'Vehicle Model' : 'Vehicle Number'}
                        </Label>
                        <Input
                          id={field}
                          type="text"
                          value={formData[field as keyof typeof formData]}
                          onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                          required
                          className="bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text)] focus:ring-[var(--color-focus)]"
                        />
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                <Button
                  type="submit"
                  className="w-full bg-[var(--color-accent)] text-white hover:opacity-90"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </motion.div>
            </motion.form>

            <motion.div
              className="mt-4 text-center text-sm text-[var(--color-muted)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              Already have an account?{' '}
              <Link href="/login" className="text-[var(--color-accent)] hover:underline">
                Sign in
              </Link>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
