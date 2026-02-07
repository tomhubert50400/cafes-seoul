import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getMySubmissions } from '@/lib/actions/submissions';
import { MySubmissionsList } from '@/components/submissions/my-submissions-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getTranslation } from '@/lib/i18n/translations';
import { LanguageCode, DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME } from '@/lib/i18n/languages';

async function getLanguageFromCookies(): Promise<LanguageCode> {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get(LANGUAGE_COOKIE_NAME);

  if (langCookie?.value && ['en', 'ko', 'fr', 'zh', 'vi'].includes(langCookie.value)) {
    return langCookie.value as LanguageCode;
  }

  return DEFAULT_LANGUAGE;
}

export const metadata: Metadata = {
  title: 'My Submissions | Cafes Seoul',
  description: 'View and manage your cafe submissions',
};

export default async function MySubmissionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/profile/submissions');
  }

  const lang = await getLanguageFromCookies();

  // Fetch all submissions
  const result = await getMySubmissions();

  if (!result.success || !result.submissions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{getTranslation(lang, 'mySubmissions.title')}</CardTitle>
          <CardDescription>{getTranslation(lang, 'mySubmissions.loadError')}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const allSubmissions = result.submissions;
  const pending = allSubmissions.filter(s => s.status === 'pending');
  const approved = allSubmissions.filter(s => s.status === 'approved');
  const declined = allSubmissions.filter(s => s.status === 'declined');

  return (
    <>
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0">
          <CardTitle className="text-3xl font-bold">{getTranslation(lang, 'mySubmissions.title')}</CardTitle>
          <CardDescription className="text-lg">
            {getTranslation(lang, 'mySubmissions.subtitle')}
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="pending" className="mt-4">
        <TabsList className="grid w-full grid-cols-3 max-w-md min-h-[44px]">
          <TabsTrigger value="pending" className="min-h-[44px]">
            {getTranslation(lang, 'mySubmissions.pending')} ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="min-h-[44px]">
            {getTranslation(lang, 'mySubmissions.approved')} ({approved.length})
          </TabsTrigger>
          <TabsTrigger value="declined" className="min-h-[44px]">
            {getTranslation(lang, 'mySubmissions.declined')} ({declined.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <MySubmissionsList
            submissions={pending}
            emptyMessage={getTranslation(lang, 'mySubmissions.emptyPending')}
            showActions={true}
          />
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <MySubmissionsList
            submissions={approved}
            emptyMessage={getTranslation(lang, 'mySubmissions.emptyApproved')}
            showActions={false}
          />
        </TabsContent>

        <TabsContent value="declined" className="mt-6">
          <MySubmissionsList
            submissions={declined}
            emptyMessage={getTranslation(lang, 'mySubmissions.emptyDeclined')}
            showActions={false}
            showRejectionReason={true}
          />
        </TabsContent>
      </Tabs>

      {/* Submit new button */}
      <div className="mt-8 flex justify-center">
        <Button asChild>
          <Link href="/submit">
            <Plus className="mr-2 h-4 w-4" />
            {getTranslation(lang, 'mySubmissions.submitNew')}
          </Link>
        </Button>
      </div>
    </>
  );
}
