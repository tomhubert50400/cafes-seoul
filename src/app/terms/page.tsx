import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { TermsContent } from '@/components/terms/terms-content';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Terms of Service | Seoul Cafe Guide',
  description: 'Terms of service for Seoul Cafe Guide.',
};

export default async function TermsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={user} />
      <main className="flex-1">
        <TermsContent />
      </main>
      <Footer />
    </div>
  );
}
