'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Plane, Heart, Users, Globe, Star, Award, Target, Lightbulb } from 'lucide-react';

export default function AboutPage() {
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

        {/* Flying airplane elements */}
        <div
          className="absolute top-20 left-1/4 w-6 h-6 text-white/20"
          style={{
            animation: 'flyLoop 12s ease-in-out infinite',
            animationDelay: '0s'
          }}
        >
          <Plane className="w-full h-full" />
        </div>
        <div
          className="absolute top-40 right-1/3 w-4 h-4 text-white/15"
          style={{
            animation: 'glide 8s ease-in-out infinite',
            animationDelay: '2s'
          }}
        >
          <Plane className="w-full h-full" />
        </div>
        <div
          className="absolute top-60 left-1/2 w-5 h-5 text-white/10"
          style={{
            animation: 'flyLoop 15s ease-in-out infinite',
            animationDelay: '6s'
          }}
        >
          <Plane className="w-full h-full" />
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center mb-6">
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
              className="mr-4 relative"
            >
              <div className="absolute -left-8 top-1/2 transform -translate-y-1/2 w-6 h-0.5 bg-gradient-to-r from-transparent via-blue-200/30 to-transparent rounded-full"></div>
              <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-sm animate-pulse"></div>
              <Plane className="w-16 h-16 text-black drop-shadow-lg relative z-10" />
            </motion.div>
            <h1 className="text-6xl font-bold text-black drop-shadow-lg">
              About Share and Plan
            </h1>
          </div>
          <p className="text-2xl text-black font-light max-w-3xl mx-auto">
            Your Journey, Your Story, Your Memories
          </p>
        </motion.div>

        {/* Mission Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white/20 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-12 border border-white/30"
        >
          <div className="text-center">
            <Target className="w-16 h-16 text-[#0160D6] mx-auto mb-6" />
            <h2 className="text-4xl font-bold text-black mb-6">Our Mission</h2>
            <p className="text-xl text-black leading-relaxed max-w-4xl mx-auto">
              To create a global community where travelers can share their experiences, discover new destinations, 
              and inspire others to explore the world. We believe every journey tells a story worth sharing, 
              and every story can inspire someone else&apos;s next adventure.
            </p>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
        >
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
            <Globe className="w-12 h-12 text-[#0160D6] mb-4" />
            <h3 className="text-2xl font-bold text-black mb-4">Global Community</h3>
            <p className="text-black leading-relaxed">
              Connect with travelers from around the world and discover destinations you never knew existed.
            </p>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
            <Star className="w-12 h-12 text-[#F13B13] mb-4" />
            <h3 className="text-2xl font-bold text-black mb-4">Detailed Reviews</h3>
            <p className="text-black leading-relaxed">
              Share comprehensive reviews of hotels, restaurants, and activities to help fellow travelers make informed decisions.
            </p>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
            <Heart className="w-12 h-12 text-[#AAB624] mb-4" />
            <h3 className="text-2xl font-bold text-black mb-4">Personal Stories</h3>
            <p className="text-black leading-relaxed">
              Document your journey with photos, stories, and memories that will last a lifetime.
            </p>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
            <Users className="w-12 h-12 text-[#00AAF8] mb-4" />
            <h3 className="text-2xl font-bold text-black mb-4">Community Driven</h3>
            <p className="text-black leading-relaxed">
              Built by travelers, for travelers. Our platform grows with the community's needs and feedback.
            </p>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
            <Lightbulb className="w-12 h-12 text-[#F0ECE9] mb-4" />
            <h3 className="text-2xl font-bold text-black mb-4">Smart Discovery</h3>
            <p className="text-black leading-relaxed">
              Find hidden gems and popular spots based on real traveler experiences and recommendations.
            </p>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
            <Award className="w-12 h-12 text-[#F13B13] mb-4" />
            <h3 className="text-2xl font-bold text-black mb-4">Quality Content</h3>
            <p className="text-black leading-relaxed">
              Every review and story is carefully curated to ensure high-quality, helpful content for our community.
            </p>
          </div>
        </motion.div>

        {/* Story Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="bg-white/20 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-12 border border-white/30"
        >
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-black text-center mb-8">Our Story</h2>
            <div className="space-y-6 text-lg text-black leading-relaxed">
              <p>
                Share and Plan was born from a simple idea: what if we could create a platform where every traveler&apos;s 
                experience could help another traveler discover their next great adventure? Founded by a group of 
                passionate travelers who were tired of generic travel guides and wanted something more personal, 
                more real.
              </p>
              <p>
                We started with a small community of friends sharing their travel stories, but quickly realized 
                that the world needed a place where authentic travel experiences could be shared and discovered. 
                Today, Share and Plan has grown into a global community of travelers who believe that the best travel 
                advice comes from those who have been there, done that.
              </p>
              <p>
                Our platform is more than just reviews and ratings – it&apos;s about building connections, sharing 
                memories, and inspiring others to explore the beautiful world we live in. Every trip shared, 
                every review written, and every story told helps someone else plan their perfect adventure.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Values Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center"
        >
          <h2 className="text-4xl font-bold text-black mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
              <h3 className="text-xl font-bold text-black mb-3">Authenticity</h3>
              <p className="text-black">Real experiences from real travelers</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
              <h3 className="text-xl font-bold text-black mb-3">Community</h3>
              <p className="text-black">Building connections through shared experiences</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
              <h3 className="text-xl font-bold text-black mb-3">Inspiration</h3>
              <p className="text-black">Inspiring others to explore and discover</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
              <h3 className="text-xl font-bold text-black mb-3">Quality</h3>
              <p className="text-black">Curated content that truly helps travelers</p>
            </div>
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="text-center mt-16"
        >
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/30">
            <h2 className="text-3xl font-bold text-black mb-4">Ready to Start Your Journey?</h2>
            <p className="text-xl text-black mb-8">
              Join thousands of travelers sharing their experiences and discovering new destinations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="bg-[#F13B13] text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#F13B13]/90 transition-colors flex items-center justify-center"
              >
                <Heart className="w-5 h-5 mr-2" />
                Register
              </Link>
              <Link
                href="/trips"
                className="bg-[#0160D6] text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#0160D6]/90 transition-colors flex items-center justify-center"
              >
                <Globe className="w-5 h-5 mr-2" />
                Explore Trips
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
