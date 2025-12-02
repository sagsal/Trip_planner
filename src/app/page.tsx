'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { MapPin, Plane, Heart } from 'lucide-react';
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
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/pexels-bella-white-201200-635279.jpg)',
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/30"></div>
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
