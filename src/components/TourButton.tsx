'use client';

import { PlayCircle } from 'lucide-react';
import { startSiteTour } from '@/components/SiteTour';

export default function TourButton({ className = '' }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={startSiteTour}
      className={`inline-flex items-center px-5 py-3 rounded-xl bg-[#2F4A5C] text-white font-medium hover:bg-[#24394A] shadow-sm ${className}`}
    >
      <PlayCircle className="w-5 h-5 mr-2" /> Take the guided tour
      <span className="ml-2 text-xs font-normal text-white/75">with voiceover · 2 min</span>
    </button>
  );
}
