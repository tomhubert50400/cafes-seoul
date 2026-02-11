import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  // getSession() reads JWT from cookie — no network round-trip (fast)
  // getUser() verifies with Supabase servers — only needed for mutations
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  return (
    <>
      <Header user={user} />
      {children}
    </>
  );
}
