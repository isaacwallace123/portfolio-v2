'use client';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/widgets/ThemeToggle';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, LogOut, LayoutDashboard, Menu, X, Home, User, FolderOpen, LogIn, type LucideIcon } from 'lucide-react';
import { logoutAction } from '@/features/auth/model/actions';
import { useTransition, useState, useEffect, useRef } from 'react';

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/about', label: 'About', icon: User },
  { href: '/projects', label: 'Projects', icon: FolderOpen },
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

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
        {/* Left side - Hamburger + Logo */}
        <div className="flex items-center gap-2">
          {isAdminPage ? (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden -ml-2"
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-admin-sidebar'))}
            >
              <Menu className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden -ml-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}
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
        </div>

        {/* Center - Navigation (desktop only, hidden on admin pages) */}
        <nav className={cn('hidden items-center gap-1 md:flex', isAdminPage && 'md:hidden')}>
          {navItems.map((item) => (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                pathname === item.href ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>

        {/* Right side - Theme toggle + Auth */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {user ? (
            <div className="relative" ref={dropdownRef}>
              <Avatar
                className="cursor-pointer bg-primary/10 text-primary hover:bg-primary/20 transition-all hover:scale-105"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <AvatarFallback className="bg-transparent text-sm font-semibold">
                  {getInitials(user.email)}
                </AvatarFallback>
              </Avatar>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border/40 bg-background/95 backdrop-blur shadow-lg">
                  <div className="p-3 border-b border-border/40">
                    <p className="text-sm font-medium text-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">Role: {user.role}</p>
                  </div>

                  <div className="p-2 space-y-1">
                    {!isAdminPage && (
                      <Button
                        asChild
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <Link href="/admin" className="flex items-center gap-3">
                          <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                          <span>Admin Dashboard</span>
                        </Link>
                      </Button>
                    )}

                    <Button
                      onClick={handleLogout}
                      disabled={isPending}
                      variant="ghost"
                      className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      <span>{isPending ? 'Logging out...' : 'Logout'}</span>
                    </Button>
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

      {/* Mobile nav menu */}
      {isMobileMenuOpen && !isAdminPage && (
        <div className="border-t border-border/40 bg-background/95 backdrop-blur md:hidden">
          <nav className="flex flex-col px-4 py-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'text-foreground bg-muted/50'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
            {!user && (
              <Link
                href="/login"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Login
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
