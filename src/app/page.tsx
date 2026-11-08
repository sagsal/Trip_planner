'use client';

import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { Plane } from 'lucide-react';
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
          backgroundImage: 'url(/sea-warm.jpg)',
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/10"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 lg:px-8 text-center pt-16 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto w-full"
        >
          {/* Headline */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col items-center px-4 sm:px-0"
          >
            <Plane className="w-12 h-12 sm:w-16 sm:h-16 text-[#143C5A] mb-6" />
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-[#143C5A] leading-tight max-w-4xl">
              Build your next trip with help from fellow travelers
            </h1>
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
