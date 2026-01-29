import { requireAdmin } from '@/features/auth/model/session';
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
      {children}
    </div>
  );
}