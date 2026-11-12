'use client';

import Link from 'next/link';
import { startSiteTour } from '@/components/SiteTour';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef, type ComponentType } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Plane, Menu, X, User, LogOut, LogIn, UserPlus, Home, Compass, PlusCircle, Sparkles, Info, ChevronDown, Package, HelpCircle, PlayCircle,
} from 'lucide-react';
import { SANDBOX_EVENT } from '@/lib/sandbox';

type Item = { href: string; label: string; hint?: string; icon: ComponentType<{ className?: string }> };

// Everything on the site, in one menu
const SIGNED_IN: { title: string; items: Item[] }[] = [
  {
    title: 'My trips',
    items: [
      { href: '/sandbox', label: 'My Travel Sandbox', hint: 'Places you’ve saved for trips you’re planning', icon: Package },
      { href: '/account', label: 'My account & trips', hint: 'Drafts, private and shared trips', icon: User },
      { href: '/trips/new', label: 'Add a trip', hint: 'Day by day, with hotels, food and activities', icon: PlusCircle },
      { href: '/trips/import', label: 'Import your notes', hint: 'From a spreadsheet, Word doc or pasted text', icon: Sparkles },
    ],
  },
  {
    title: 'Explore',
    items: [
      { href: '/trips', label: 'Browse trips', hint: 'Ideas from fellow travelers', icon: Compass },
      { href: '/', label: 'Home', icon: Home },
      { href: '/how-to', label: 'How to use', hint: 'A quick guide to everything on the site', icon: HelpCircle },
      { href: '/?tour=1', label: 'Take the tour', hint: 'A guided walk-through with voiceover', icon: PlayCircle },
      { href: '/about', label: 'About', icon: Info },
    ],
  },
];

const SIGNED_OUT: { title: string; items: Item[] }[] = [
  {
    title: 'Explore',
    items: [
      { href: '/trips', label: 'Browse trips', hint: 'Ideas from fellow travelers', icon: Compass },
      { href: '/', label: 'Home', icon: Home },
      { href: '/how-to', label: 'How to use', hint: 'A quick guide to everything on the site', icon: HelpCircle },
      { href: '/?tour=1', label: 'Take the tour', hint: 'A guided walk-through with voiceover', icon: PlayCircle },
      { href: '/about', label: 'About', icon: Info },
    ],
  },
  {
    title: 'Your account',
    items: [
      { href: '/login', label: 'Sign in', icon: LogIn },
      { href: '/register', label: 'Create an account', hint: 'Free — share and plan your trips', icon: UserPlus },
    ],
  },
];

export default function Navigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ id?: string; name: string; email: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [sandboxCount, setSandboxCount] = useState<number | null>(null);

  // Sandbox counter: load once signed in, and update whenever something is saved or removed
  useEffect(() => {
    if (!user) { setSandboxCount(null); return; }
    const id = (user as any).id;
    if (!id) return;
    let cancelled = false;
    fetch(`/api/sandbox?userId=${encodeURIComponent(id)}&countOnly=1`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (!cancelled && typeof d.count === 'number') setSandboxCount(d.count); })
      .catch(() => {});
    const onChange = (e: Event) => {
      const c = (e as CustomEvent).detail?.count;
      if (typeof c === 'number') setSandboxCount(c);
    };
    window.addEventListener(SANDBOX_EVENT, onChange);
    return () => { cancelled = true; window.removeEventListener(SANDBOX_EVENT, onChange); };
  }, [user]);

  // Check authentication status on mount and when it changes (login/logout, other tabs)
  useEffect(() => {
    const checkAuth = () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch {
        setUser(null);
        setIsAuthenticated(false);
      }
    };
    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  // Close the menu on page change, click outside, or Escape
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    window.dispatchEvent(new Event('storage'));
    window.location.href = '/';
  };

  const isCurrent = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || (href !== '/trips' && !!pathname?.startsWith(href + '/'));
  const sections = isAuthenticated ? SIGNED_IN : SIGNED_OUT;
  const firstName = user?.name?.split(' ')[0];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Plane className="w-8 h-8 text-[#0160D6]" />
            <span className="text-xl sm:text-2xl font-bold text-black">Share and Plan</span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-5">
            {/* Quick links stay on the bar (hidden on small phones; they're in the menu) */}
            {isAuthenticated ? (
              <Link
                href="/account"
                className="hidden sm:flex items-center text-base font-semibold text-black hover:text-[#3F5B6A] transition-colors"
              >
                <User className="w-4 h-4 mr-1" />
                {user?.name || 'My account'}
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block text-base font-semibold text-black hover:text-[#3F5B6A] transition-colors">
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="hidden sm:flex items-center bg-[#F13B13] text-white px-4 py-2 rounded-full hover:bg-[#F13B13]/90 transition-colors"
                >
                  <User className="w-4 h-4 mr-1" />
                  Register
                </Link>
              </>
            )}

            {/* My Travel Sandbox (saved places), with a counter */}
            {isAuthenticated && (
              <Link
                href="/sandbox"
                id="sandbox-nav-icon"
                title="My Travel Sandbox"
                aria-label={`My Travel Sandbox${sandboxCount ? `, ${sandboxCount} saved` : ''}`}
                className="relative flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 text-black hover:bg-gray-50"
              >
                <Package className="w-5 h-5" />
                {!!sandboxCount && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[1.25rem] h-5 px-1 rounded-full bg-[#F13B13] text-white text-xs font-semibold flex items-center justify-center">
                    {sandboxCount > 99 ? '99+' : sandboxCount}
                  </span>
                )}
              </Link>
            )}

            {/* The menu */}
            <div ref={menuRef} className="relative">
              <button
                type="button"
                data-tour="menu"
                onClick={() => setIsOpen((o) => !o)}
                aria-expanded={isOpen}
                aria-haspopup="menu"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-base font-semibold transition-colors ${
                  isOpen ? 'border-[#4A6878] bg-[#F3F7F8] text-[#2F4A5C]' : 'border-gray-300 text-black hover:bg-gray-50'
                }`}
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                <span>Menu</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    role="menu"
                    className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden"
                  >
                    {isAuthenticated && (
                      <div className="px-4 py-3 bg-[#F6F2EC] border-b border-[#EEE8DF]">
                        <p className="text-xs text-[#6B7A83]">Signed in as</p>
                        <p className="font-semibold text-[#2F4A5C] truncate">{user?.name || user?.email}</p>
                      </div>
                    )}

                    {sections.map((section) => (
                      <div key={section.title} className="py-2 border-b border-gray-100 last:border-b-0">
                        <p className="px-4 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{section.title}</p>
                        {section.items.map(({ href, label, hint, icon: Icon }) => {
                          const current = isCurrent(href);
                          return (
                            <Link
                              key={href}
                              href={href}
                              role="menuitem"
                              aria-current={current ? 'page' : undefined}
                              onClick={() => {
                                setIsOpen(false);
                                if (href.includes('tour=1')) startSiteTour();
                              }}
                              className={`flex items-start gap-3 px-4 py-2.5 transition-colors ${
                                current ? 'bg-[#E3ECEF] text-[#2F4A5C]' : 'text-gray-800 hover:bg-gray-50'
                              }`}
                            >
                              <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${current ? 'text-[#3F5B6A]' : 'text-gray-500'}`} />
                              <span className="min-w-0">
                                <span className="block font-medium">{label}</span>
                                {hint && <span className="block text-xs text-gray-500">{hint}</span>}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    ))}

                    {isAuthenticated && (
                      <div className="py-2">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-5 h-5" />
                          <span className="font-medium">Sign out{firstName ? ` (${firstName})` : ''}</span>
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
