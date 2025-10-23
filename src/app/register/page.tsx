'use client';

import { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, Eye, EyeOff, Plane } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

function RegisterContent() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Attempting registration with:', { 
        name: formData.name, 
        email: formData.email, 
        password: '***' 
      });
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      console.log('Registration response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Registration successful:', data);
                // Registration successful - redirect to home page
                router.push('/?message=Registration successful! Please sign in to continue.');
      } else {
        const data = await response.json();
        console.log('Registration failed:', data);
        setError(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden pt-16">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-pulse"
        style={{
          backgroundImage: 'url(/sea-side-beach-0e.jpg)',
          animation: 'kenBurns 20s ease-in-out infinite alternate',
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/30"></div>
      </div>

      {/* Floating elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-20 left-10 w-4 h-4 bg-white rounded-full opacity-30"
          style={{
            animation: 'float 6s ease-in-out infinite',
            animationDelay: '0s'
          }}
        />
        <div
          className="absolute top-40 right-20 w-3 h-3 bg-white rounded-full opacity-20"
          style={{
            animation: 'float 8s ease-in-out infinite',
            animationDelay: '1s'
          }}
        />
        <div
          className="absolute top-60 left-1/4 w-2 h-2 bg-white rounded-full opacity-25"
          style={{
            animation: 'float 7s ease-in-out infinite',
            animationDelay: '2s'
          }}
        />
        <div
          className="absolute top-80 right-1/3 w-5 h-5 bg-white rounded-full opacity-20"
          style={{
            animation: 'float 9s ease-in-out infinite',
            animationDelay: '3s'
          }}
        />
        <div
          className="absolute top-32 right-1/4 w-3 h-3 bg-white rounded-full opacity-15"
          style={{
            animation: 'sway 10s ease-in-out infinite',
            animationDelay: '4s'
          }}
        />
        <div
          className="absolute top-72 left-1/3 w-2 h-2 bg-white rounded-full opacity-20"
          style={{
            animation: 'sway 12s ease-in-out infinite',
            animationDelay: '5s'
          }}
        />

        {/* Animated sparkles */}
        <div
          className="absolute top-16 right-16 w-1 h-1 bg-white rounded-full opacity-40"
          style={{
            animation: 'float 4s ease-in-out infinite',
            animationDelay: '0.5s'
          }}
        />
        <div
          className="absolute top-48 left-16 w-1 h-1 bg-white rounded-full opacity-30"
          style={{
            animation: 'float 5s ease-in-out infinite',
            animationDelay: '1.5s'
          }}
        />
        <div
          className="absolute top-64 right-8 w-1 h-1 bg-white rounded-full opacity-35"
          style={{
            animation: 'float 6s ease-in-out infinite',
            animationDelay: '2.5s'
          }}
        />

        {/* Gentle moving clouds effect */}
        <div
          className="absolute top-10 left-0 w-32 h-16 bg-white/5 rounded-full blur-sm"
          style={{
            animation: 'sway 15s ease-in-out infinite',
            animationDelay: '0s'
          }}
        />
        <div
          className="absolute top-24 right-0 w-24 h-12 bg-white/5 rounded-full blur-sm"
          style={{
            animation: 'sway 18s ease-in-out infinite',
            animationDelay: '3s'
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
                  {/* Header */}
                  <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h1>
                    <p className="text-gray-600">Start documenting your amazing journeys</p>
                  </div>

          {/* Registration Form */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50"
                  >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black w-5 h-5" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black bg-white/80"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black w-5 h-5" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black bg-white/80"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black bg-white/80"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black w-5 h-5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black bg-white/80"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#F13B13] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#F13B13]/90 focus:ring-2 focus:ring-[#F13B13] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-black">
                Already have an account?{' '}
                <Link href="/login" className="text-[#0160D6] hover:text-[#0160D6]/80 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <RegisterContent />
    </Suspense>
  );
}
