import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CafeSubmissionForm } from '@/components/submissions';
import { getRateLimitStatus, checkDuplicateSubmissions, submitCafe } from '@/lib/actions/submissions';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Submit a Cafe | Cafes Seoul',
  description: 'Submit a new cafe to our directory',
};

export default async function SubmitCafePage() {
  // Verify authentication
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login?redirect=/submit');
  }
  
  // Get rate limit status
  const rateLimitResult = await getRateLimitStatus();
  const rateLimit = rateLimitResult.success ? rateLimitResult.rateLimit : null;
  
  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Card className="border-none shadow-none bg-transparent">
          <CardHeader className="px-0">
            <CardTitle className="text-3xl font-bold">Submit a New Cafe</CardTitle>
            <CardDescription className="text-lg">
              Share a great cafe with the community. Submissions are reviewed before appearing on the site.
            </CardDescription>
          </CardHeader>
        </Card>
        
        <div className="mt-4">
          <CafeSubmissionForm
            mode="create"
            rateLimit={rateLimit}
            onSubmit={async (data) => {
              'use server';
              const result = await submitCafe(data);
              if (!result.success) {
                throw new Error(result.error || 'Failed to submit cafe');
              }
            }}
            onCheckDuplicates={async (name, address) => {
              'use server';
              const result = await checkDuplicateSubmissions(name, address);
              if (result.success && result.duplicates) {
                return result.duplicates;
              }
              return [];
            }}
          />
        </div>
        
        {/* Help text */}
        <div className="mt-8 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
          <p className="font-medium">Submission Guidelines:</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Please verify the cafe does not already exist in our directory</li>
            <li>Include accurate address information</li>
            <li>Submissions are reviewed within 1-3 days</li>
            <li>You can edit or delete your submission while it is pending</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
