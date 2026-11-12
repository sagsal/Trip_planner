'use client';

/**
 * Guided tour of the site with a spoken voiceover.
 * Start it from anywhere with startSiteTour(). It walks across pages, highlights
 * each feature and reads the caption aloud (the browser's built-in voice: free).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { X, ChevronLeft, ChevronRight, Volume2, VolumeX, Play, Pause } from 'lucide-react';

type Step = {
  path: string;
  target?: string; // a [data-tour] name or a CSS selector starting with #
  title: string;
  text: string;
  needsLogin?: boolean;
};

const STEPS: Step[] = [
  {
    path: '/',
    title: 'Welcome to Share and Plan',
    text: 'Welcome! This short tour shows you around. Share the details of your trips, and build your next one from other travellers’ real itineraries.',
  },
  {
    path: '/',
    target: 'menu',
    title: 'The Menu',
    text: 'Everything on the site is in this Menu: browse trips, add your own, your sandbox, and the how to use guide.',
  },
  {
    path: '/trips',
    target: 'finder',
    title: 'Find a trip',
    text: 'This is Browse trips. Type what you’re looking for in plain words, like a family week in Mexico. Typing filters the trips. Press Enter, and the AI finds the best matches and tells you why.',
  },
  {
    path: '/trips',
    target: 'finder',
    title: 'Ask it to build for you',
    text: 'You can also ask it to set things up for you. For example: create a Colombia trip in my sandbox with just Cartagena and Medellín, or add hotels in Polanco. It makes a planned trip with exactly those places.',
  },
  {
    path: '/trips',
    target: 'filters',
    title: 'Filters',
    text: 'Or narrow things down by country, region and type of trip.',
  },
  {
    path: '/trips',
    target: '#sandbox-nav-icon',
    title: 'Save what you like',
    text: 'Open any trip to see it day by day, with photos, reviews and links. Tap the plus button on a hotel, restaurant or activity to save it. Everything you save goes to your Travel Sandbox, here.',
  },
  {
    path: '/sandbox',
    target: 'sandbox-head',
    needsLogin: true,
    title: 'My Travel Sandbox',
    text: 'Your Sandbox holds every trip you’re planning, as many as you like. Start a new planned trip, add the places you saved, and press Fill with AI to get a day by day plan built from real trips.',
  },
  {
    path: '/trips/new',
    target: 'trip-info',
    needsLogin: true,
    title: 'Add your trip',
    text: 'To share a trip, choose Add your trip. Start with the basics: region, type of trip, dates and flights. The number of days and the title fill in for you.',
  },
  {
    path: '/trips/new',
    target: 'countries',
    needsLogin: true,
    title: 'Countries and cities',
    text: 'Then add your countries and cities. For each city, add where you stayed, where you ate and what you did. Can’t remember a name? Use Describe it. Say something like, the famous restaurant near the park, and the AI finds it, with photos.',
  },
  {
    path: '/trips/new',
    target: 'save-buttons',
    needsLogin: true,
    title: 'Draft or publish',
    text: 'Save it as a draft and come back any time, or publish it to share with other travellers.',
  },
  {
    path: '/account',
    target: 'account-actions',
    needsLogin: true,
    title: 'Your account',
    text: 'Already have your trip in a spreadsheet, a Word document or notes? Choose Import your notes, and the AI fills in the trip for you. All your trips are listed below, under My Trips.',
  },
  {
    path: '/how-to',
    title: 'That’s the tour!',
    text: 'That’s the tour! This how to use page has more detail on everything. Happy travels!',
  },
];

const STEP_KEY = 'siteTourStep';
const MUTE_KEY = 'siteTourMuted';
const START_EVENT = 'site-tour-start';

export function startSiteTour() {
  try { sessionStorage.setItem(STEP_KEY, '0'); } catch {}
  // Phones only allow speech that starts from a tap: say nothing now to unlock the voice
  try {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
    }
  } catch {}
  window.dispatchEvent(new Event(START_EVENT));
}

const findTarget = (t?: string): HTMLElement | null => {
  if (!t) return null;
  const el = t.startsWith('#') ? document.querySelector(t) : document.querySelector(`[data-tour="${t}"]`);
  return el instanceof HTMLElement ? el : null;
};

// A pleasant English voice if the device has one
const pickVoice = (): SpeechSynthesisVoice | null => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang?.toLowerCase().startsWith('en'));
  const prefer = ['natural', 'samantha', 'google us english', 'google uk english female', 'aria', 'jenny', 'karen', 'daniel'];
  for (const p of prefer) {
    const v = voices.find((x) => x.name.toLowerCase().includes(p));
    if (v) return v;
  }
  return voices[0] || null;
};

export default function SiteTour() {
  const router = useRouter();
  const pathname = usePathname();
  const [step, setStep] = useState<number | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [muted, setMuted] = useState(false);
  const [auto, setAuto] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const autoRef = useRef(false);
  autoRef.current = auto;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pick up a tour in progress (it survives page changes)
  useEffect(() => {
    const read = () => {
      try {
        const v = sessionStorage.getItem(STEP_KEY);
        setStep(v === null ? null : Math.max(0, Math.min(STEPS.length - 1, Number(v) || 0)));
        setMuted(localStorage.getItem(MUTE_KEY) === '1');
        setLoggedIn(!!localStorage.getItem('user'));
      } catch {}
    };
    read();
    window.addEventListener(START_EVENT, read);
    return () => window.removeEventListener(START_EVENT, read);
  }, []);

  // ?tour=1 on any page (e.g. from the Menu) starts the tour
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get('tour') === '1') {
        sp.delete('tour');
        const q = sp.toString();
        window.history.replaceState(null, '', window.location.pathname + (q ? `?${q}` : ''));
        startSiteTour();
      }
    } catch {}
  }, [pathname]);

  const current = step === null ? null : STEPS[step];
  // Pages that need an account are explained without leaving the page when signed out
  const showHere = !!current?.needsLogin && !loggedIn;

  const stopSpeaking = () => {
    try { window.speechSynthesis?.cancel(); } catch {}
  };

  const go = useCallback((n: number | null) => {
    stopSpeaking();
    if (timer.current) clearTimeout(timer.current);
    try {
      if (n === null) sessionStorage.removeItem(STEP_KEY);
      else sessionStorage.setItem(STEP_KEY, String(n));
    } catch {}
    if (n === null) setAuto(false);
    setStep(n);
    setRect(null);
  }, []);

  // Go to the step's page
  useEffect(() => {
    if (!current || showHere) return;
    if (pathname !== current.path) router.push(current.path);
  }, [current, showHere, pathname, router]);

  // Find and highlight the target, and keep the highlight in place
  useEffect(() => {
    if (!current) return;
    if (showHere || !current.target || pathname !== current.path) { setRect(null); return; }
    let tries = 0;
    let el: HTMLElement | null = null;
    let cancelled = false;
    const place = () => { if (el) setRect(el.getBoundingClientRect()); };
    const look = () => {
      if (cancelled) return;
      el = findTarget(current.target);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(place, 450);
        place();
      } else if (tries++ < 30) {
        setTimeout(look, 150);
      }
    };
    look();
    window.addEventListener('scroll', place, { passive: true });
    window.addEventListener('resize', place);
    return () => {
      cancelled = true;
      window.removeEventListener('scroll', place);
      window.removeEventListener('resize', place);
    };
  }, [current, showHere, pathname]);

  // Read the caption aloud
  useEffect(() => {
    if (!current || step === null) return;
    if (!showHere && pathname !== current.path) return; // wait for the page
    stopSpeaking();
    const next = () => {
      if (!autoRef.current) return;
      timer.current = setTimeout(() => {
        if (step < STEPS.length - 1) go(step + 1);
        else setAuto(false);
      }, 900);
    };
    if (muted || typeof window === 'undefined' || !window.speechSynthesis) {
      if (autoRef.current) timer.current = setTimeout(next, Math.max(3500, current.text.length * 55));
      return;
    }
    const speak = () => {
      const u = new SpeechSynthesisUtterance(current.text);
      const v = pickVoice();
      if (v) u.voice = v;
      u.rate = 1;
      u.onend = next;
      window.speechSynthesis.speak(u);
    };
    const t = setTimeout(speak, 350); // let the page settle first
    return () => clearTimeout(t);
  }, [step, current, muted, showHere, pathname, go]);

  // Stop talking if the tour is closed or the page is left
  useEffect(() => () => stopSpeaking(), []);

  // Esc closes, arrow keys move
  useEffect(() => {
    if (step === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') go(null);
      else if (e.key === 'ArrowRight' && step < STEPS.length - 1) go(step + 1);
      else if (e.key === 'ArrowLeft' && step > 0) go(step - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, go]);

  if (step === null || !current) return null;
  const last = step === STEPS.length - 1;
  const pad = 8;

  return (
    <>
      {/* Dim everything except the highlighted feature */}
      {rect ? (
        <div
          aria-hidden
          className="fixed z-[90] rounded-xl pointer-events-none transition-all duration-300"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: '0 0 0 9999px rgba(20, 35, 45, 0.45)',
            border: '3px solid #F3D9A4',
          }}
        />
      ) : (
        <div aria-hidden className="fixed inset-0 z-[90] bg-[rgba(20,35,45,0.35)] pointer-events-none" />
      )}

      {/* The caption card */}
      <div
        role="dialog"
        aria-label="Site tour"
        className="fixed z-[100] bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E4DED4] p-5"
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[#6B7A83]">Tour · {step + 1} of {STEPS.length}</p>
            <h3 className="text-lg font-semibold text-[#2F4A5C]">{current.title}</h3>
          </div>
          <button type="button" onClick={() => go(null)} className="p-1 text-[#6B7A83] hover:text-[#2F4A5C]" aria-label="Close tour">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-[#4A5A63] leading-relaxed">{current.text}</p>
        {showHere && <p className="text-xs text-[#8A6D3B] mt-2">You’ll see this page once you’re signed in.</p>}
        {last && !loggedIn && (
          <Link href="/register" onClick={() => go(null)} className="inline-block mt-3 text-sm font-medium text-[#2F4A5C] underline">
            Sign up free to get started →
          </Link>
        )}

        <div className="flex items-center justify-between gap-2 mt-4">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                const m = !muted;
                setMuted(m);
                try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch {}
                if (m) stopSpeaking();
              }}
              className="p-2 rounded-lg text-[#4A6878] hover:bg-[#F3F7F8]"
              aria-label={muted ? 'Turn voice on' : 'Turn voice off'}
              title={muted ? 'Turn voice on' : 'Turn voice off'}
            >
              {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={() => {
                const on = !auto;
                setAuto(on);
                autoRef.current = on;
                // Nothing being read right now: move on straight away
                const speaking = typeof window !== 'undefined' && window.speechSynthesis?.speaking;
                if (on && !speaking && step < STEPS.length - 1) setTimeout(() => go(step + 1), 600);
              }}
              className="inline-flex items-center px-2 py-2 rounded-lg text-sm text-[#4A6878] hover:bg-[#F3F7F8]"
              title={auto ? 'Pause' : 'Play the tour by itself'}
            >
              {auto ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
              {auto ? 'Pause' : 'Auto-play'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button type="button" onClick={() => go(step - 1)} className="inline-flex items-center px-3 py-2 rounded-lg border border-[#C9D9DF] text-sm text-[#2F4A5C] hover:bg-[#F3F7F8]">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            <button
              type="button"
              onClick={() => (last ? go(null) : go(step + 1))}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-[#2F4A5C] text-white text-sm font-medium hover:bg-[#24394A]"
            >
              {last ? 'Finish' : <>Next <ChevronRight className="w-4 h-4" /></>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
