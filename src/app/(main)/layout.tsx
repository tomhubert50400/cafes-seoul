import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <Header user={user} />
      {children}
    </>
  );
}
