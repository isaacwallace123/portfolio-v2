import { requireAdmin } from '@/features/auth/model/session';
import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/features/auth/ui/AdminSidebar';
import { Header } from '@/widgets/Header';
import { NextIntlClientProvider } from 'next-intl';
import enMessages from '../../../messages/en.json';

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
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <Header />
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
        <AdminSidebar />
        <main className="flex-1 min-w-0 overflow-auto">
          {children}
        </main>
      </div>
    </NextIntlClientProvider>
  );
}
