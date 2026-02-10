import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getTranslation } from '@/lib/i18n/translations';
import { LanguageCode, DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME } from '@/lib/i18n/languages';
import { AdminStats, SubmissionCounts, PhotoCounts } from '@/components/admin/admin-stats';
import { RecentActivity, ActivityItem } from '@/components/admin/recent-activity';

async function getLanguageFromCookies(): Promise<LanguageCode> {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get(LANGUAGE_COOKIE_NAME);

  if (langCookie?.value && ['en', 'ko', 'fr', 'zh', 'vi'].includes(langCookie.value)) {
    return langCookie.value as LanguageCode;
  }

  return DEFAULT_LANGUAGE;
}

export default async function AdminDashboard() {
  const supabase = await createClient();
  const lang = await getLanguageFromCookies();

  // Fetch submission counts by status
  const [
    { count: pendingSubmissions },
    { count: approvedSubmissions },
    { count: declinedSubmissions },
  ] = await Promise.all([
    supabase
      .from('cafe_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('cafe_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved'),
    supabase
      .from('cafe_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'declined'),
  ]);

  // Fetch photo counts by status
  const [
    { count: pendingPhotos },
    { count: approvedPhotos },
    { count: rejectedPhotos },
  ] = await Promise.all([
    supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved'),
    supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected'),
  ]);

  // Fetch recent moderation activity (last 7 days only)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: recentSubmissions }, { data: recentPhotos }] = await Promise.all([
    supabase
      .from('cafe_submissions')
      .select('id, name, status, updated_at')
      .in('status', ['approved', 'declined'])
      .gte('updated_at', sevenDaysAgo)
      .order('updated_at', { ascending: false })
      .limit(10),
    supabase
      .from('photos')
      .select('id, cafe_id, status, updated_at, cafe:cafes(name)')
      .in('status', ['approved', 'rejected'])
      .gte('updated_at', sevenDaysAgo)
      .order('updated_at', { ascending: false })
      .limit(10),
  ]);

  // Transform and combine activities
  const submissionActivities: ActivityItem[] = (recentSubmissions || []).map((s) => ({
    id: s.id,
    type: 'submission' as const,
    action: s.status as 'approved' | 'declined',
    name: s.name?.en || s.name?.ko || 'Unknown',
    timestamp: s.updated_at,
  }));

  const photoActivities: ActivityItem[] = (recentPhotos || []).map((p) => {
    const cafeData = p.cafe as unknown;
    const cafe = Array.isArray(cafeData) ? cafeData[0] : cafeData;
    const typedCafe = cafe as { name: { en?: string; ko?: string } | null } | null;
    const cafeName = typedCafe?.name?.en || typedCafe?.name?.ko || 'Unknown Cafe';
    return {
      id: p.id,
      type: 'photo' as const,
      action: p.status === 'approved' ? ('approved' as const) : ('rejected' as const),
      name: `Photo at ${cafeName}`,
      timestamp: p.updated_at,
    };
  });

  // Combine and sort by timestamp (most recent first)
  const allActivities = [...submissionActivities, ...photoActivities]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  // Build stats objects
  const submissionCounts: SubmissionCounts = {
    pending: pendingSubmissions ?? 0,
    approved: approvedSubmissions ?? 0,
    declined: declinedSubmissions ?? 0,
  };

  const photoCounts: PhotoCounts = {
    pending: pendingPhotos ?? 0,
    approved: approvedPhotos ?? 0,
    rejected: rejectedPhotos ?? 0,
  };

  // Build translations
  const statsTranslations = {
    submissions: getTranslation(lang, 'admin.stats.submissions'),
    photos: getTranslation(lang, 'admin.stats.photos'),
    pending: getTranslation(lang, 'admin.stats.pending'),
    approved: getTranslation(lang, 'admin.stats.approved'),
    declined: getTranslation(lang, 'admin.stats.declined'),
    rejected: getTranslation(lang, 'admin.stats.rejected'),
  };

  const activityTranslations = {
    title: getTranslation(lang, 'admin.activity.title'),
    empty: getTranslation(lang, 'admin.activity.empty'),
    approved: getTranslation(lang, 'admin.activity.approved'),
    rejected: getTranslation(lang, 'admin.activity.rejected'),
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{getTranslation(lang, 'admin.title')}</h1>
        <p className="mt-1 text-muted-foreground">
          {getTranslation(lang, 'admin.dashboard.subtitle')}
        </p>
      </div>

      {/* Stats Section */}
      <AdminStats
        submissions={submissionCounts}
        photos={photoCounts}
        translations={statsTranslations}
      />

      {/* Recent Activity Section */}
      <RecentActivity activities={allActivities} translations={activityTranslations} />
    </div>
  );
}
