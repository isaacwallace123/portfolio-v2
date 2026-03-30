'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  MessageSquare,
  Mail,
  HardDrive,
  Home,
  User,
  Briefcase,
  Network,
  Heart,
  Phone,
  Server,
} from 'lucide-react';

const adminItems = [
  { href: '/admin',              icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/projects',     icon: FolderOpen,      label: 'Projects' },
  { href: '/admin/skills',       icon: FileText,        label: 'Skills' },
  { href: '/admin/experience',   icon: Briefcase,       label: 'Experience' },
  { href: '/admin/hobbies',      icon: Heart,           label: 'Hobbies' },
  { href: '/admin/testimonials', icon: MessageSquare,   label: 'Testimonials' },
  { href: '/admin/contacts',     icon: Mail,            label: 'Contacts' },
  { href: '/admin/uploads',      icon: HardDrive,       label: 'Uploads' },
  { href: '/admin/homelab',      icon: Network,         label: 'Homelab' },
];

const siteItems = [
  { href: '/',         icon: Home,      label: 'Home' },
  { href: '/about',    icon: User,      label: 'About' },
  { href: '/projects', icon: FolderOpen, label: 'Projects' },
  { href: '/contact',  icon: Phone,     label: 'Contact' },
  { href: '/homelab',  icon: Server,    label: 'Homelab' },
];

function NavItem({
  href,
  icon: Icon,
  label,
  active,
  onClick,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
        active
          ? 'text-foreground bg-primary/10 dark:bg-primary/[0.08]'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
      )}
    >
      {active && (
        <span className="absolute left-0 inset-y-2 w-0.5 rounded-full bg-primary" />
      )}
      <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : '')} />
      {label}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pt-4 pb-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
        {children}
      </p>
    </div>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const toggle = () => setOpen((prev) => !prev);
    window.addEventListener('toggle-admin-sidebar', toggle);
    return () => window.removeEventListener('toggle-admin-sidebar', toggle);
  }, []);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname?.startsWith(href);
  };

  const close = () => {
    setOpen(false);
    window.dispatchEvent(new Event('admin-sidebar-closed'));
  };

  const nav = (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <SectionLabel>Admin</SectionLabel>
      <nav className="flex flex-col gap-0.5 px-2 pb-2">
        {adminItems.map(({ href, icon, label }) => (
          <NavItem key={href} href={href} icon={icon} label={label} active={isActive(href)} onClick={close} />
        ))}
      </nav>

      <div className="mx-3 my-1 h-px bg-border/40" />

      <SectionLabel>Site</SectionLabel>
      <nav className="flex flex-col gap-0.5 px-2 pb-4">
        {siteItems.map(({ href, icon, label }) => (
          <NavItem key={href} href={href} icon={icon} label={label} active={false} onClick={close} />
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border/30 bg-background/50 backdrop-blur-md">
        {nav}
      </aside>

      {/* Mobile overlay */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden" onClick={close} />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r border-border/30 bg-background md:hidden overflow-y-auto">
            {nav}
          </aside>
        </>
      )}
    </>
  );
}
