'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Plus, MapPin, Calendar, Star } from 'lucide-react';

export default function BuildTripPage() {
  return (
    <div className="relative min-h-screen overflow-hidden pt-16">
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

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-[#0160D6] hover:text-[#0160D6]/80 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-black mb-4">
            Build Your Trip
          </h1>
          <p className="text-lg text-black">
            Use other traveler itineraries to plan your next adventure
          </p>
        </div>

        {/* Coming Soon Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/20 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/30 text-center"
        >
          <div className="mb-6">
            <Plus className="w-16 h-16 text-[#AAB624] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-black mb-4">
              Coming Soon!
            </h2>
            <p className="text-lg text-black mb-6">
              We're working on an amazing trip builder that will let you create custom itineraries 
              using real traveler experiences. Stay tuned!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <MapPin className="w-8 h-8 text-white mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Browse Destinations</h3>
              <p className="text-[#F0ECE9] text-sm">
                Explore trips by country and city to find your perfect destination
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <Calendar className="w-8 h-8 text-white mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Plan Your Itinerary</h3>
              <p className="text-[#F0ECE9] text-sm">
                Mix and match activities, hotels, and restaurants from real trips
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <Star className="w-8 h-8 text-white mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Save & Share</h3>
              <p className="text-[#F0ECE9] text-sm">
                Save your custom trip and share it with the community
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/trips"
              className="bg-[#0160D6] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#0160D6]/90 transition-colors flex items-center justify-center"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Explore Existing Trips
            </Link>
            <Link
              href="/trips/new"
              className="bg-[#F13B13] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#F13B13]/90 transition-colors flex items-center justify-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Share Your Trip
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
