'use client';

import { motion } from 'framer-motion';
import { Plane } from 'lucide-react';

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#0160D6] to-[#00AAF8]">
      {/* Animated Airplane */}
      <motion.div
        animate={{
          x: [0, 100, -50, 80, -30, 0],
          y: [0, -20, 10, -15, 5, 0],
          rotate: [0, 10, -5, 15, -8, 0],
          scale: [1, 1.1, 0.9, 1.05, 0.95, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative mb-8"
      >
        {/* Vapor trail effect */}
        <div className="absolute -left-8 top-1/2 transform -translate-y-1/2 w-8 h-0.5 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full"></div>
        
        {/* Glow effect */}
        <div className="absolute inset-0 bg-white/20 rounded-full blur-lg animate-pulse"></div>
        
        {/* Airplane */}
        <Plane className="w-16 h-16 text-white drop-shadow-lg relative z-10" />
      </motion.div>

      {/* Loading Text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="text-white text-xl font-semibold"
      >
        Loading your journey...
      </motion.div>

      {/* Animated Dots */}
      <div className="flex space-x-2 mt-4">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: index * 0.2,
              ease: "easeInOut",
            }}
            className="w-3 h-3 bg-white rounded-full"
          />
        ))}
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}
