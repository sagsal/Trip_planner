'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { MapPin, Plane, Heart, Star, Plus, Share2 } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

function HomeContent() {
  const [successMessage, setSuccessMessage] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const message = searchParams.get('message');
    if (message) {
      setSuccessMessage(message);
    }
  }, [searchParams]);
  
  return (
    <div className="relative min-h-screen overflow-hidden">
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-pulse"
                style={{
                  backgroundImage: 'url(/pexels-bella-white-201200-635279.jpg)',
                  animation: 'kenBurns 20s ease-in-out infinite alternate',
                }}
              >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/30"></div>
      </div>

      {/* Floating elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute top-20 left-4 sm:left-10 w-3 sm:w-4 h-3 sm:h-4 bg-white rounded-full opacity-30" 
          style={{ 
            animation: 'float 6s ease-in-out infinite',
            animationDelay: '0s' 
          }} 
        />
        <div 
          className="absolute top-40 right-4 sm:right-20 w-2 sm:w-3 h-2 sm:h-3 bg-white rounded-full opacity-20" 
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
          className="absolute top-80 right-1/3 w-4 sm:w-5 h-4 sm:h-5 bg-white rounded-full opacity-20" 
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

        {/* Flying airplane elements */}
        <div 
          className="absolute top-20 left-1/4 w-4 sm:w-6 h-4 sm:h-6 text-white/20"
          style={{ 
            animation: 'flyLoop 12s ease-in-out infinite',
            animationDelay: '0s' 
          }} 
        >
          <Plane className="w-full h-full" />
        </div>
        <div 
          className="absolute top-40 right-1/3 w-3 sm:w-4 h-3 sm:h-4 text-white/15"
          style={{ 
            animation: 'glide 8s ease-in-out infinite',
            animationDelay: '2s' 
          }} 
        >
          <Plane className="w-full h-full" />
        </div>
        <div 
          className="absolute top-60 left-1/2 w-4 sm:w-5 h-4 sm:h-5 text-white/10"
          style={{ 
            animation: 'flyLoop 15s ease-in-out infinite',
            animationDelay: '6s' 
          }} 
        >
          <Plane className="w-full h-full" />
        </div>
        
        {/* Flying airplane across screen */}
        <div 
          className="absolute top-32 w-6 sm:w-8 h-6 sm:h-8 text-white/25"
          style={{ 
            animation: 'fly 20s linear infinite',
            animationDelay: '0s' 
          }} 
        >
          <Plane className="w-full h-full" />
        </div>
        <div 
          className="absolute top-48 w-4 sm:w-6 h-4 sm:h-6 text-white/20"
          style={{ 
            animation: 'fly 25s linear infinite',
            animationDelay: '10s' 
          }} 
        >
          <Plane className="w-full h-full" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 lg:px-8 text-center pt-16 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto w-full"
        >
          {/* Logo/Title */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
                    <div className="flex flex-col sm:flex-row items-center justify-center mb-4 sm:mb-6">
                      <motion.div
                        animate={{
                          x: [0, 30, -15, 25, -5, 0],
                          y: [0, -15, 8, -12, 3, 0],
                          rotate: [0, 8, -5, 12, -3, 0],
                          scale: [1, 1.1, 0.95, 1.05, 1],
                        }}
                        transition={{
                          duration: 10,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="mb-4 sm:mb-0 sm:mr-4 relative"
                      >
                        {/* Vapor trail effect */}
                        <div className="absolute -left-4 sm:-left-8 top-1/2 transform -translate-y-1/2 w-3 sm:w-6 h-0.5 bg-gradient-to-r from-transparent via-blue-200/30 to-transparent rounded-full"></div>
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-sm animate-pulse"></div>
                        <Plane className="w-12 h-12 sm:w-16 sm:h-16 text-black drop-shadow-lg relative z-10" />
                      </motion.div>
                      <h1 className="text-4xl sm:text-6xl lg:text-8xl font-bold text-black drop-shadow-lg text-center sm:text-left">
                        Share and Plan
                      </h1>
                    </div>
                    <p className="text-lg sm:text-xl lg:text-2xl text-black font-light px-4 sm:px-0">
                      the Ultimate Trip Planning Tool
                    </p>
          </motion.div>

          {/* Main CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-12"
          >
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-semibold text-black mb-4 sm:mb-6 drop-shadow-md px-4 sm:px-0">
              Plan, Share & Build Amazing Trips
            </h2>
                    <p className="text-base sm:text-lg lg:text-xl text-black mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
                      Create detailed trip journals, share your experiences, and discover new destinations
                      through the eyes of fellow travelers. From hotels to restaurants, activities to reviews -
                      capture every moment of your journey.
                    </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 sm:mb-16 px-4 sm:px-0"
          >
                    <Link
                      href="/register"
                      className="w-full sm:w-auto bg-[#F13B13] text-black px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center"
                    >
                      <Heart className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Register
                    </Link>
                    <Link
                      href="/trips"
                      className="w-full sm:w-auto bg-[#F13B13] text-black px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg hover:bg-[#F13B13]/90 transition-all duration-300 flex items-center justify-center"
                    >
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Explore Trips
                    </Link>
          </motion.div>

          {/* Features Preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto px-4 sm:px-0"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20">
              <Star className="w-6 h-6 sm:w-8 sm:h-8 text-white mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 text-center">Share Experiences</h3>
              <p className="text-[#F0ECE9] text-sm text-center">
                Rate hotels, restaurants, and activities. Share what you loved and what to avoid.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20">
              <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-white mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 text-center">Build your next trip</h3>
              <p className="text-[#F0ECE9] text-sm text-center">
                Use other traveler itineraries to plan your next trip
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20">
              <Share2 className="w-6 h-6 sm:w-8 sm:h-8 text-white mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 text-center">Share Your Trip</h3>
              <p className="text-[#F0ECE9] text-sm text-center">
                Create and share your own detailed trip itineraries with the community.
              </p>
            </div>
          </motion.div>

          {/* Additional Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8 px-4 sm:px-0"
          >
            <Link
              href="/trips/build"
              className="w-full sm:w-auto bg-[#AAB624] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Build your trip
            </Link>
            <Link
              href="/trips/new"
              className="w-full sm:w-auto bg-[#0160D6] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center"
            >
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Share your trip
            </Link>
          </motion.div>

          {/* Success Message */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="mt-8 px-4 sm:px-0"
            >
              <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg text-center max-w-md mx-auto">
                {successMessage}
              </div>
            </motion.div>
          )}
        </motion.div>
        </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HomeContent />
    </Suspense>
  );
}
