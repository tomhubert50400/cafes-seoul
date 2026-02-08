import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
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
        <div className="mx-auto max-w-3xl px-4 py-12">
          <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mb-8">Last updated: February 2025</p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold mt-8 mb-3">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing and using Seoul Cafe Guide, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-3">2. Description of Service</h2>
              <p className="text-muted-foreground">
                Seoul Cafe Guide is a community-driven platform that allows users to discover, review, and rate cafes in Seoul. The service includes cafe listings, an interactive map, user reviews, photo sharing, and a cafe submission system.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-3">3. User Accounts</h2>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground mt-2">
                <li>You must provide accurate information when creating an account.</li>
                <li>You are responsible for maintaining the security of your account credentials.</li>
                <li>You must be at least 13 years old to create an account.</li>
                <li>One person may not maintain more than one account.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-3">4. User Content</h2>
              <p className="text-muted-foreground">When you submit content (reviews, photos, cafe information), you agree that:</p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground mt-2">
                <li>You own or have the right to share the content you post.</li>
                <li>Your content does not violate any third-party rights.</li>
                <li>You grant Seoul Cafe Guide a non-exclusive, worldwide license to display and distribute your content on the platform.</li>
                <li>You retain ownership of your original content and may delete it at any time.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-3">5. Prohibited Conduct</h2>
              <p className="text-muted-foreground">You may not:</p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground mt-2">
                <li>Post false, misleading, or fraudulent reviews.</li>
                <li>Harass, threaten, or defame other users or cafe owners.</li>
                <li>Upload content that is illegal, offensive, or infringes on intellectual property rights.</li>
                <li>Attempt to manipulate ratings or reviews through fake accounts.</li>
                <li>Use automated tools to scrape or collect data from the platform.</li>
                <li>Interfere with the operation of the service or bypass security measures.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-3">6. Cafe Information</h2>
              <p className="text-muted-foreground">
                Cafe details such as opening hours, addresses, and menus are provided by the community and may not always be accurate or up to date. Seoul Cafe Guide does not guarantee the accuracy of this information. We recommend contacting the cafe directly to confirm details before visiting.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-3">7. Content Moderation</h2>
              <p className="text-muted-foreground">
                We reserve the right to remove any content that violates these terms or is otherwise deemed inappropriate. Cafe submissions go through a review process before being published. Users who repeatedly violate these terms may have their accounts suspended or terminated.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-3">8. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                Seoul Cafe Guide is provided &quot;as is&quot; without warranties of any kind. We are not responsible for the accuracy of user-generated content, the quality of cafes listed on the platform, or any damages arising from the use of the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-3">9. Termination</h2>
              <p className="text-muted-foreground">
                You may delete your account at any time through your profile settings. We may suspend or terminate accounts that violate these terms. Upon termination, your reviews and public contributions may remain on the platform in anonymized form.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-3">10. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We may update these terms from time to time. Significant changes will be communicated to registered users via email. Continued use of the service after changes constitutes acceptance of the updated terms.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
