import { getSession } from '@/features/auth/model/session';
import { logoutAction } from '@/features/auth/model/actions';
import { HeaderClient } from './HeaderClient';

export async function Header() {
  let user = null;
  
  try {
    const session = await getSession();
    user = session.user || null;
  } catch (error) {
    // Not logged in, that's fine
    user = null;
  }

  return <HeaderClient user={user} />;
}