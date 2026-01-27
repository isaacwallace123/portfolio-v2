import { requireAdmin } from '@/features/auth/model/session';
import { LogoutButton } from '@/features/auth/ui/LogoutButton';
import { ThemeToggle } from '@/widgets/ThemeToggle';
import { redirect } from 'next/navigation';

async function getAdminUser() {
  try {
    return await requireAdmin();
  } catch (error) {
    redirect('/login');
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="bg-background min-h-screen">
      <header className="border-border/40 bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
          <h1 className="text-xl font-bold">Admin Panel</h1>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground text-sm">{user.email}</span>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="container max-w-screen-2xl px-4 py-8">{children}</main>
    </div>
  );
}
