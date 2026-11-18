'use client';

import Link from 'next/link';
import { startSiteTour } from '@/components/SiteTour';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef, type ComponentType } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Plane, Menu, X, User, LogOut, LogIn, UserPlus, Home, Compass, PlusCircle, Sparkles, Info, ChevronDown, Package, HelpCircle, PlayCircle, MessageCircle, BarChart3,
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
      { href: '/feedback', label: 'Help me plan', hint: 'Give and get advice on trips being planned', icon: MessageCircle },
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
      { href: '/feedback', label: 'Help me plan', hint: 'Give and get advice on trips being planned', icon: MessageCircle },
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
  const [isAdmin, setIsAdmin] = useState(false); // site owner: sees "Site dashboard" 
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

  // The server's sign-in session is the real one: if it has ended (or predates the security update),
  // sign out here too and ask to sign in again; if it exists but this browser lost the user, restore it
  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/session', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setIsAdmin(!!d.isAdmin);
        const stored = localStorage.getItem('user');
        if (d.user) {
          if (!stored) {
            localStorage.setItem('user', JSON.stringify(d.user));
            window.dispatchEvent(new Event('storage'));
          }
        } else if (stored) {
          localStorage.removeItem('user');
          window.dispatchEvent(new Event('storage'));
          const here = window.location.pathname + window.location.search;
          const needsSignIn = /^\/(account|sandbox|trips\/new|trips\/import)/.test(window.location.pathname);
          if (needsSignIn) window.location.href = `/login?reason=session&next=${encodeURIComponent(here)}`;
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

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
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    window.dispatchEvent(new Event('storage'));
    window.location.href = '/';
  };

  const isCurrent = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || (href !== '/trips' && !!pathname?.startsWith(href + '/'));
  const sections = isAuthenticated
    ? isAdmin
      ? [{ title: 'Site owner', items: [{ href: '/admin', label: 'Site dashboard', hint: 'Members, trips and activity (only you can see this)', icon: BarChart3 }] }, ...SIGNED_IN]
      : SIGNED_IN
    : SIGNED_OUT;
  const firstName = user?.name?.split(' ')[0];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#F8F6F1] border-b border-[#E2DDD5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-baseline gap-3">
            <span className="font-serif font-semibold text-[22px] sm:text-[27px] tracking-[-0.01em] text-[#13212B] whitespace-nowrap">Share and Plan</span>
            <span className="hidden md:inline font-mono text-[11px] tracking-[0.12em] text-[#5B6A73]">TRIPSHARE.ORG</span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-5">
            {/* Quick links stay on the bar (hidden on small phones; they're in the menu) */}
            {isAuthenticated ? (
              <Link
                href="/account"
                className="hidden sm:flex items-center text-[15px] text-[#13212B] hover:text-[#1F6F78] transition-colors"
              >
                <User className="w-4 h-4 mr-1" />
                {user?.name || 'My account'}
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block text-[15px] text-[#13212B] hover:text-[#1F6F78] transition-colors">
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="hidden sm:flex items-center border border-[#13212B] text-[#13212B] px-4 py-2 font-mono text-xs tracking-[0.1em] uppercase hover:bg-[#13212B] hover:text-[#F8F6F1] transition-colors"
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
                className="relative flex items-center justify-center w-11 h-11 border border-[#E2DDD5] text-[#13212B] hover:border-[#13212B]"
              >
                <Package className="w-5 h-5" />
                {!!sandboxCount && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[1.25rem] h-5 px-1 rounded-full bg-[#1F6F78] text-white text-[11px] font-mono flex items-center justify-center">
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
                className={`flex items-center gap-1.5 px-3.5 min-h-[44px] border font-mono text-xs tracking-[0.1em] uppercase transition-colors ${
                  isOpen ? 'border-[#13212B] bg-[#13212B] text-[#F8F6F1]' : 'border-[#13212B] text-[#13212B] hover:bg-[#13212B] hover:text-[#F8F6F1]'
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
                    className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain bg-[#FFFFFF] border border-[#13212B]"
                  >
                    {isAuthenticated && (
                      <div className="px-4 py-3 bg-[#F8F6F1] border-b border-[#E2DDD5]">
                        <p className="font-mono text-[11px] tracking-[0.12em] text-[#5B6A73]">SIGNED IN AS</p>
                        <p className="font-serif text-lg text-[#13212B] truncate">{user?.name || user?.email}</p>
                      </div>
                    )}

                    {sections.map((section) => (
                      <div key={section.title} className="py-2 border-b border-[#E2DDD5] last:border-b-0">
                        <p className="px-4 pt-1 pb-1 font-mono text-[11px] uppercase tracking-[0.12em] text-[#5B6A73]">{section.title}</p>
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
                                current ? 'bg-[#EEF5F4] text-[#13212B]' : 'text-[#13212B] hover:bg-[#F8F6F1]'
                              }`}
                            >
                              <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${current ? 'text-[#1F6F78]' : 'text-[#5B6A73]'}`} />
                              <span className="min-w-0">
                                <span className="block font-serif text-[18px] leading-snug">{label}</span>
                                {hint && <span className="block text-xs text-[#5B6A73]">{hint}</span>}
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
                    <div className="px-4 py-2.5 flex gap-4 text-xs text-gray-500">
                      <Link href="/privacy" onClick={() => setIsOpen(false)} className="hover:text-gray-800">Privacy</Link>
                      <Link href="/terms" onClick={() => setIsOpen(false)} className="hover:text-gray-800">Terms</Link>
                    </div>
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
