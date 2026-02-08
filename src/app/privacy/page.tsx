import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { PrivacyContent } from '@/components/privacy/privacy-content';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Privacy Policy | Seoul Cafe Guide',
  description: 'Privacy policy for Seoul Cafe Guide.',
};

export default async function PrivacyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={user} />
      <main className="flex-1">
        <PrivacyContent />
      </main>
      <Footer />
    </div>
  );
}
