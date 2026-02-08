import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
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
        <div className="mx-auto max-w-3xl px-4 py-12">
          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">Last updated: February 2025</p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold mt-8 mb-3">1. Information We Collect</h2>
              <p className="text-muted-foreground">When you use Seoul Cafe Guide, we may collect the following information:</p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground mt-2">
                <li><strong>Account information:</strong> email address, display name, and profile photo when you create an account.</li>
                <li><strong>User-generated content:</strong> reviews, ratings, photos, and cafe submissions you post on the platform.</li>
                <li><strong>Usage data:</strong> pages visited, search queries, filters used, and interactions with the site.</li>
                <li><strong>Device information:</strong> browser type, operating system, and screen resolution.</li>
                <li><strong>Location data:</strong> approximate location when you use the map feature, only with your consent.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-3">2. How We Use Your Information</h2>
              <p className="text-muted-foreground">We use the collected information to:</p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground mt-2">
                <li>Provide and improve the Seoul Cafe Guide service.</li>
                <li>Display your reviews and contributions to other users.</li>
                <li>Send notifications about activity related to your account (if enabled).</li>
                <li>Show cafes near your location on the map.</li>
                <li>Analyze usage patterns to improve the user experience.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-3">3. Information Sharing</h2>
              <p className="text-muted-foreground">
                We do not sell your personal information. Your public profile, reviews, and ratings are visible to other users. We may share anonymized, aggregated data for analytics purposes. We will disclose information if required by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-3">4. Data Storage & Security</h2>
              <p className="text-muted-foreground">
                Your data is stored securely using Supabase infrastructure with encryption at rest and in transit. We implement industry-standard security measures to protect your information, including Row Level Security (RLS) policies on our database.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-3">5. Cookies</h2>
              <p className="text-muted-foreground">
                We use essential cookies to maintain your session, remember your language preference, and keep you logged in. We do not use third-party advertising cookies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-3">6. Your Rights</h2>
              <p className="text-muted-foreground">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground mt-2">
                <li>Access and download your personal data.</li>
                <li>Correct inaccurate information in your profile.</li>
                <li>Delete your account and associated data.</li>
                <li>Opt out of email notifications at any time.</li>
                <li>Withdraw consent for location access through your browser settings.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mt-8 mb-3">7. Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this privacy policy from time to time. We will notify registered users of significant changes via email. Continued use of the service after changes constitutes acceptance of the updated policy.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
