'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/widgets/ThemeToggle';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, LogOut, LayoutDashboard } from 'lucide-react';
import { logoutAction } from '@/features/auth/model/actions';
import { useTransition, useState, useEffect, useRef } from 'react';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/projects', label: 'Projects' },
];

interface HeaderClientProps {
  user?: {
    email: string;
    role: string;
  } | null;
}

export function HeaderClient({ user }: HeaderClientProps) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');
  const [isPending, startTransition] = useTransition();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
      window.location.href = '/';
    });
  };

  // Get initials from email
  const getInitials = (email: string) => {
    return 'IW'; // Always use IW as requested
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        {/* Left side - Logo/Brand */}
        <Link href={isAdminPage ? '/admin' : '/'} className="flex items-center gap-2">
          {isAdminPage && user ? (
            <>
              <div className="rounded-lg bg-primary/10 p-1.5">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div className="hidden sm:block">
                <span className="text-sm font-bold">Admin Panel</span>
              </div>
            </>
          ) : (
            <span className="text-xl font-bold bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              IW
            </span>
          )}
        </Link>

        {/* Center - Navigation (always show when logged in or on non-admin pages) */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  pathname === item.href ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        {/* Right side - Auth controls */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          
          {user ? (
            <div className="relative" ref={dropdownRef}>
              {/* Avatar Button */}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary transition-all hover:bg-primary/20 hover:scale-105"
                aria-label="User menu"
              >
                {getInitials(user.email)}
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border/40 bg-background/95 backdrop-blur shadow-lg">
                  <div className="p-3 border-b border-border/40">
                    <p className="text-sm font-medium text-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">Role: {user.role}</p>
                  </div>
                  
                  <div className="p-2">
                    {!isAdminPage && (
                      <Link
                        href="/admin"
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted/50"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}
                    
                    <button
                      onClick={handleLogout}
                      disabled={isPending}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>{isPending ? 'Logging out...' : 'Logout'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Button asChild size="sm" variant="outline" className="hidden md:inline-flex">
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}