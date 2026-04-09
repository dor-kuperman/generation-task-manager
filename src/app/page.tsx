import { redirect } from 'next/navigation';
import { getSessionFromCookies } from '@/lib/auth/session';

export default async function Home() {
  const session = await getSessionFromCookies();

  if (session) {
    redirect('/tasks');
  } else {
    redirect('/login');
  }
}
