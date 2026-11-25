'use client';

import { useState, Suspense } from 'react';
import { REGIONS, countriesIn, regionOf } from '@/lib/regions';
import { AGE_BRACKETS, ALL_COUNTRIES } from '@/lib/profile';
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
    confirmPassword: '',
    homeRegion: '',
    homeCountry: '',
    ageBracket: '',
    acceptTerms: false
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

    if (!formData.acceptTerms) {
      setError('Please tick the box to confirm you’re 18 or older and agree to the Terms and Privacy Policy. The questions about you are optional.');
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
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      let response;
      try {
        response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim(),
            password: formData.password,
            homeRegion: formData.homeRegion,
            homeCountry: formData.homeCountry,
            ageBracket: formData.ageBracket,
            acceptTerms: formData.acceptTerms,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timeout. Please try again.');
        }
        throw fetchError;
      }

      console.log('Registration response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Registration successful:', data);
        // Signed in already (the server set the session): go where they were heading, or the dashboard
        if (data?.user) {
          try { localStorage.setItem('user', JSON.stringify(data.user)); window.dispatchEvent(new Event('storage')); } catch {}
          const next = new URLSearchParams(window.location.search).get('next') || '';
          router.push(next.startsWith('/') && !next.startsWith('//') ? next : '/account');
        } else {
          router.push('/login?message=Registration successful! Please sign in.');
        }
      } else {
        const data = await response.json();
        console.log('Registration failed:', data);
        setError(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('An error occurred during registration. Please try again.');
      }
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
    <div className="relative min-h-screen bg-[#F8F6F1] pt-16">
      <div className="relative z-10 flex min-h-[calc(100vh-4rem)] items-start sm:items-center justify-center px-4 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
                  {/* Header */}
                  <div className="text-center mb-8">
                    <h1 className="text-3xl font-normal text-gray-900 mb-2">Create Your Account</h1>
                    <p className="text-gray-600">Start documenting your amazing journeys</p>
                  </div>

          {/* Registration Form */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="bg-white rounded-[4px] p-6 sm:p-8 border border-[#E2DDD5]"
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
                            className="w-full pl-10 pr-4 py-3 border border-[#E2DDD5] rounded-xl focus:ring-2 focus:ring-[#1F6F78] focus:border-transparent transition-colors text-black bg-white/80"
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
                            className="w-full pl-10 pr-4 py-3 border border-[#E2DDD5] rounded-xl focus:ring-2 focus:ring-[#1F6F78] focus:border-transparent transition-colors text-black bg-white/80"
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
                            className="w-full pl-10 pr-12 py-3 border border-[#E2DDD5] rounded-xl focus:ring-2 focus:ring-[#1F6F78] focus:border-transparent transition-colors text-black bg-white/80"
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
                            className="w-full pl-10 pr-12 py-3 border border-[#E2DDD5] rounded-xl focus:ring-2 focus:ring-[#1F6F78] focus:border-transparent transition-colors text-black bg-white/80"
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

              {/* About you (optional) */}
              <fieldset className="rounded-xl border border-[#E2DDD5] p-4">
                <legend className="px-1 text-sm font-medium text-gray-700">About you <span className="font-normal text-gray-500">(optional)</span></legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="homeRegion" className="block text-sm text-gray-600 mb-1">Region you’re from</label>
                    <select
                      id="homeRegion"
                      value={formData.homeRegion}
                      onChange={(e) => setFormData((f) => ({ ...f, homeRegion: e.target.value, homeCountry: e.target.value && f.homeCountry && regionOf(f.homeCountry) !== e.target.value ? '' : f.homeCountry }))}
                      className="w-full px-3 py-3 border border-[#E2DDD5] rounded-xl text-black bg-white"
                    >
                      <option value="">Choose…</option>
                      {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="homeCountry" className="block text-sm text-gray-600 mb-1">Country</label>
                    <select
                      id="homeCountry"
                      value={formData.homeCountry}
                      onChange={(e) => setFormData((f) => ({ ...f, homeCountry: e.target.value, homeRegion: f.homeRegion || regionOf(e.target.value) || '' }))}
                      className="w-full px-3 py-3 border border-[#E2DDD5] rounded-xl text-black bg-white"
                    >
                      <option value="">Choose…</option>
                      {(formData.homeRegion ? countriesIn(formData.homeRegion) : ALL_COUNTRIES).map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="ageBracket" className="block text-sm text-gray-600 mb-1">Age</label>
                    <select
                      id="ageBracket"
                      value={formData.ageBracket}
                      onChange={(e) => setFormData((f) => ({ ...f, ageBracket: e.target.value }))}
                      className="w-full sm:w-1/2 px-3 py-3 border border-[#E2DDD5] rounded-xl text-black bg-white"
                    >
                      <option value="">Prefer not to say</option>
                      {AGE_BRACKETS.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">Helps us suggest trips from travelers like you. Never shown to other members.</p>
              </fieldset>

              {/* Terms and privacy */}
              <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={(e) => setFormData((f) => ({ ...f, acceptTerms: e.target.checked }))}
                  className="mt-0.5 h-5 w-5 shrink-0 rounded border-gray-300 accent-[#1F6F78]"
                  required
                />
                <span>
                  I’m 18 or older and I agree to the{' '}
                  <Link href="/terms" target="_blank" className="text-[#1F6F78] underline font-medium">Terms of Use</Link>{' '}and{' '}
                  <Link href="/privacy" target="_blank" className="text-[#1F6F78] underline font-medium">Privacy Policy</Link>.
                </span>
              </label>

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
                className="w-full bg-[#1F6F78] text-white py-3 px-4 rounded-xl min-h-[48px] font-semibold hover:bg-[#16535A] focus:ring-2 focus:ring-[#1F6F78] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-black">
                Already have an account?{' '}
                <Link href="/login" className="text-[#1F6F78] hover:text-[#16535A] font-medium">
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
