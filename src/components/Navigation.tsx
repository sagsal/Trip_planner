'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plane, Menu, X, User, MapPin, LogOut } from 'lucide-react';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  // Check authentication status on component mount and when localStorage changes
  useEffect(() => {
    const checkAuth = () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        setUser(null);
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
    
    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        checkAuth();
      }
    };
    
    // Listen for custom login events
    const handleLoginEvent = () => {
      checkAuth();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('storage', handleLoginEvent); // Listen for the custom event from login
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('storage', handleLoginEvent);
    };
  }, []);


  const handleLogout = () => {
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    // Redirect to home page
    window.location.href = '/';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-sm border-b border-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
                  <Link href="/" className="flex items-center space-x-2">
                    <Plane className="w-8 h-8 text-[#0160D6]" />
                            <span className="text-2xl font-bold text-black">Share and Plan</span>
                  </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/trips" className="text-lg font-bold text-black hover:text-[#0160D6] transition-colors flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              All Trips
            </Link>
            <Link href="/about" className="text-lg font-bold text-black hover:text-[#0160D6] transition-colors">
              About
            </Link>
            
            {isAuthenticated ? (
              // Authenticated user - click name to go to dashboard
              <Link
                href="/account"
                className="text-lg font-bold text-black hover:text-[#0160D6] transition-colors flex items-center"
              >
                <User className="w-4 h-4 mr-1" />
                {user?.name || 'Profile'}
              </Link>
            ) : (
              // Non-authenticated user menu
              <>
                <Link href="/login" className="text-lg font-bold text-black hover:text-[#0160D6] transition-colors">
                  Sign In
                </Link>
                <Link href="/register" className="bg-[#F13B13] text-white px-4 py-2 rounded-full hover:bg-[#F13B13]/90 transition-colors flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-transparent"
          >
            <div className="py-4 space-y-4">
              <Link
                href="/trips"
                className="block text-lg font-bold text-black hover:text-[#0160D6] transition-colors flex items-center"
                onClick={() => setIsOpen(false)}
              >
                <MapPin className="w-4 h-4 mr-2" />
                All Trips
              </Link>
              <Link
                href="/about"
                className="block text-lg font-bold text-black hover:text-[#0160D6] transition-colors"
                onClick={() => setIsOpen(false)}
              >
                About
              </Link>
              
              {isAuthenticated ? (
                // Authenticated user mobile menu
                <>
                  <Link
                    href="/account"
                    className="block text-lg font-bold text-black hover:text-[#0160D6] transition-colors flex items-center"
                    onClick={() => setIsOpen(false)}
                  >
                    <User className="w-4 h-4 mr-2" />
                    {user?.name || 'Profile'}
                  </Link>
                  <Link
                    href="/trips/build"
                    className="block text-lg font-bold text-black hover:text-[#0160D6] transition-colors flex items-center"
                    onClick={() => setIsOpen(false)}
                  >
                    Build a Trip
                  </Link>
                  <Link
                    href="/trips/new"
                    className="block text-lg font-bold text-black hover:text-[#0160D6] transition-colors flex items-center"
                    onClick={() => setIsOpen(false)}
                  >
                    Share Your Trip
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="block text-lg font-bold text-black hover:text-[#0160D6] transition-colors flex items-center"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </button>
                </>
              ) : (
                // Non-authenticated user mobile menu
                <>
                  <Link
                    href="/login"
                    className="block text-lg font-bold text-black hover:text-[#0160D6] transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="block bg-[#F13B13] text-white px-4 py-2 rounded-full hover:bg-[#F13B13]/90 transition-colors w-fit flex items-center"
                    onClick={() => setIsOpen(false)}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Register
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
}
