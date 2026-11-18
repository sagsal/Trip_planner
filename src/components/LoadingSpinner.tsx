'use client';

/* A quiet loading page in the travel-journal style */
export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-[#F8F6F1] flex flex-col items-center justify-center gap-5 px-6" role="status" aria-live="polite">
      <span className="font-serif italic text-3xl text-[#13212B]">Share and Plan</span>
      <div className="w-48 h-px bg-[#E2DDD5] overflow-hidden relative" aria-hidden>
        <span className="absolute inset-y-0 left-0 w-1/3 bg-[#1F6F78] animate-[journal-load_1.4s_ease-in-out_infinite]" />
      </div>
      <span className="font-mono text-[11px] tracking-[0.14em] text-[#5B6A73]">LOADING…</span>
    </div>
  );
}
