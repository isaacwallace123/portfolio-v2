'use client';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/widgets/ThemeToggle';
import { Link, usePathname } from '@/i18n/navigation';
import NextLink from 'next/link';
import {
  Shield, LogOut, LayoutDashboard, Menu, X,
  Home, User, FolderOpen, Mail, LogIn, Network,
  Briefcase, Code, Heart, MessageSquare, Github,
  ChevronDown, type LucideIcon,
} from 'lucide-react';
import { logoutAction } from '@/features/auth/model/actions';
import { useTransition, useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/shared/ui/LanguageSwitcher';

interface HeaderClientProps {
  user?: { email: string; role: string } | null;
}

// Sections tracked for IntersectionObserver active-state
const ANCHOR_SECTIONS = ['hero', 'about', 'experience', 'skills', 'projects', 'hobbies', 'testimonials', 'github', 'contact'];

// All sections inside the "About" dropdown (in page order)
const ABOUT_SECTION_IDS = ['about', 'experience', 'skills', 'projects', 'hobbies', 'github', 'testimonials'];

type DropdownItem = { id: string; label: string; icon: LucideIcon };

const aboutItems: DropdownItem[] = [
  { id: 'about',        label: 'About Me',     icon: User },
  { id: 'experience',   label: 'Experience',   icon: Briefcase },
  { id: 'skills',       label: 'Skills',       icon: Code },
  { id: 'projects',     label: 'Projects',     icon: FolderOpen },
  { id: 'hobbies',      label: 'Hobbies',      icon: Heart },
  { id: 'github',       label: 'GitHub',       icon: Github },
  { id: 'testimonials', label: 'Testimonials', icon: MessageSquare },
];

export function HeaderClient({ user }: HeaderClientProps) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');
  const isHomePage = pathname === '/' || pathname === '';

  const [isPending, startTransition] = useTransition();
  const [activeSection, setActiveSection] = useState('hero');
  const [aboutOpen, setAboutOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false);

  const aboutRef = useRef<HTMLDivElement>(null);
  const userRef  = useRef<HTMLDivElement>(null);
  const t = useTranslations('nav');

  // ── IntersectionObserver active section (home page only) ─────────────────
  useEffect(() => {
    if (!isHomePage) return;
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const rect = entry.boundingClientRect;
          const dist = Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2);
          if (entry.isIntersecting) visible.set(entry.target.id, dist);
          else visible.delete(entry.target.id);
        });
        if (visible.size > 0) {
          let closest = '', minDist = Infinity;
          visible.forEach((d, id) => { if (d < minDist) { minDist = d; closest = id; } });
          if (closest) setActiveSection(closest);
        }
      },
      { threshold: [0, 0.1, 0.25, 0.5], rootMargin: '-64px 0px 0px 0px' }
    );
    ANCHOR_SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [isHomePage]);

  // ── Close dropdowns on outside click ─────────────────────────────────────
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (aboutRef.current && !aboutRef.current.contains(e.target as Node)) setAboutOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserDropdownOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const handleLogout = () => {
    startTransition(async () => { await logoutAction(); window.location.href = '/'; });
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAnchorClick = (id: string) => {
    setAboutOpen(false);
    setMobileOpen(false);
    setMobileAboutOpen(false);
    if (isHomePage) scrollTo(id);
  };

  const anchorHref = (id: string) => isHomePage ? `#${id}` : `/#${id}`;

  const isAboutActive = ABOUT_SECTION_IDS.includes(activeSection) && isHomePage;

  // Simple top-level nav items (flat, no dropdown)
  const topItems = [
    { id: 'hero',     label: t('home'),    },
    { id: 'projects', label: t('projects') },
    { id: 'contact',  label: t('contact')  },
  ] as const;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">

        {/* ── Logo ── */}
        <div className="flex items-center gap-2">
          {!isAdminPage && (
            <Button variant="ghost" size="icon" className="md:hidden -ml-2" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}
          {isAdminPage && user ? (
            <NextLink href="/admin" className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-1.5">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <span className="hidden sm:block text-sm font-bold">{t('adminPanel')}</span>
            </NextLink>
          ) : (
            <button
              className="text-xl font-bold bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent"
              onClick={() => isHomePage ? scrollTo('hero') : (window.location.href = '/')}
            >
              IW
            </button>
          )}
        </div>

        {/* ── Desktop nav ── */}
        <nav className={cn('hidden items-center gap-0.5 md:flex', isAdminPage && 'md:hidden')}>
          {/* Home */}
          {isHomePage ? (
            <button
              onClick={() => handleAnchorClick('hero')}
              className={cn('px-3 py-1.5 rounded-md text-sm font-medium transition-colors hover:text-foreground',
                activeSection === 'hero' ? 'text-foreground' : 'text-muted-foreground')}
            >
              {t('home')}
            </button>
          ) : (
            <Link href="/#hero" className="px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t('home')}
            </Link>
          )}

          {/* About dropdown */}
          <div className="relative" ref={aboutRef}>
            <button
              onClick={() => setAboutOpen(!aboutOpen)}
              className={cn('flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors hover:text-foreground',
                isAboutActive ? 'text-foreground' : 'text-muted-foreground')}
            >
              {t('about')}
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', aboutOpen && 'rotate-180')} />
            </button>
            {aboutOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-52 rounded-xl border border-border/40 bg-background/98 backdrop-blur shadow-xl py-1.5 z-50">
                {aboutItems.map(({ id, label, icon: Icon }) => (
                  isHomePage ? (
                    <button key={id} onClick={() => handleAnchorClick(id)}
                      className={cn('flex w-full items-center gap-2.5 px-3.5 py-2 text-sm transition-colors hover:bg-muted/60 hover:text-foreground',
                        activeSection === id ? 'text-foreground' : 'text-muted-foreground')}>
                      <Icon className="h-3.5 w-3.5 shrink-0" />{label}
                    </button>
                  ) : (
                    <Link key={id} href={`/#${id}` as any} onClick={() => setAboutOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground">
                      <Icon className="h-3.5 w-3.5 shrink-0" />{label}
                    </Link>
                  )
                ))}
              </div>
            )}
          </div>

          {/* Contact */}
          {isHomePage ? (
            <button
              onClick={() => handleAnchorClick('contact')}
              className={cn('px-3 py-1.5 rounded-md text-sm font-medium transition-colors hover:text-foreground',
                activeSection === 'contact' ? 'text-foreground' : 'text-muted-foreground')}
            >
              {t('contact')}
            </button>
          ) : (
            <Link href="/#contact" className="px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t('contact')}
            </Link>
          )}

          {/* Homelab */}
          <Link
            href="/homelab"
            className={cn('px-3 py-1.5 rounded-md text-sm font-medium transition-colors hover:text-foreground',
              pathname === '/homelab' ? 'text-foreground' : 'text-muted-foreground')}
          >
            {t('homelab')}
          </Link>
        </nav>

        {/* ── Right controls ── */}
        <div className="flex items-center gap-2">
          {!isAdminPage && <LanguageSwitcher />}
          <ThemeToggle />

          {user ? (
            <div className="relative" ref={userRef}>
              <Avatar
                className="cursor-pointer h-8 w-8 bg-primary/10 text-primary hover:bg-primary/20 transition-all hover:scale-105"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              >
                <AvatarFallback className="bg-transparent text-xs font-semibold">IW</AvatarFallback>
              </Avatar>
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border/40 bg-background/95 backdrop-blur shadow-lg">
                  <div className="p-3 border-b border-border/40">
                    <p className="text-sm font-medium">{user.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">Role: {user.role}</p>
                  </div>
                  <div className="p-2 space-y-1">
                    {!isAdminPage && (
                      <Button asChild variant="ghost" className="w-full justify-start" onClick={() => setUserDropdownOpen(false)}>
                        <NextLink href="/admin" className="flex items-center gap-3">
                          <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                          {t('adminDashboard')}
                        </NextLink>
                      </Button>
                    )}
                    <Button onClick={handleLogout} disabled={isPending} variant="ghost"
                      className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive">
                      <LogOut className="mr-3 h-4 w-4" />
                      {isPending ? '...' : t('logout')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Button asChild size="sm" variant="outline" className="hidden md:inline-flex h-8 text-xs">
              <Link href="/login">{t('login')}</Link>
            </Button>
          )}
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {mobileOpen && !isAdminPage && (
        <div className="border-t border-border/40 bg-background/95 backdrop-blur md:hidden">
          <nav className="flex flex-col px-3 py-2 space-y-0.5">
            {/* Home */}
            {isHomePage ? (
              <button onClick={() => handleAnchorClick('hero')}
                className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  activeSection === 'hero' ? 'text-foreground bg-muted/50' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30')}>
                <Home className="h-4 w-4" />{t('home')}
              </button>
            ) : (
              <Link href="/#hero" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
                <Home className="h-4 w-4" />{t('home')}
              </Link>
            )}

            {/* About (collapsible) */}
            <button
              onClick={() => setMobileAboutOpen(!mobileAboutOpen)}
              className={cn('flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isAboutActive ? 'text-foreground bg-muted/50' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30')}>
              <span className="flex items-center gap-3"><User className="h-4 w-4" />{t('about')}</span>
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', mobileAboutOpen && 'rotate-180')} />
            </button>
            {mobileAboutOpen && (
              <div className="ml-4 space-y-0.5 border-l border-border/30 pl-3">
                {aboutItems.map(({ id, label, icon: Icon }) => (
                  isHomePage ? (
                    <button key={id} onClick={() => handleAnchorClick(id)}
                      className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                        activeSection === id ? 'text-foreground bg-muted/50' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30')}>
                      <Icon className="h-3.5 w-3.5" />{label}
                    </button>
                  ) : (
                    <Link key={id} href={`/#${id}` as any} onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
                      <Icon className="h-3.5 w-3.5" />{label}
                    </Link>
                  )
                ))}
              </div>
            )}

            {/* Contact */}
            {isHomePage ? (
              <button onClick={() => handleAnchorClick('contact')}
                className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  activeSection === 'contact' ? 'text-foreground bg-muted/50' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30')}>
                <Mail className="h-4 w-4" />{t('contact')}
              </button>
            ) : (
              <Link href="/#contact" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
                <Mail className="h-4 w-4" />{t('contact')}
              </Link>
            )}

            {/* Homelab */}
            <Link href="/homelab" onClick={() => setMobileOpen(false)}
              className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                pathname === '/homelab' ? 'text-foreground bg-muted/50' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30')}>
              <Network className="h-4 w-4" />{t('homelab')}
            </Link>

            {!user && (
              <Link href="/login" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
                <LogIn className="h-4 w-4" />{t('login')}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
