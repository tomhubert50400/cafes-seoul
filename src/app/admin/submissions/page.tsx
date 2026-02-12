import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { SubmissionsTable } from '@/components/admin/submissions-table';
import { getTranslation } from '@/lib/i18n/translations';
import { LanguageCode, DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME } from '@/lib/i18n/languages';
import { resolveAvatarUrl } from '@/lib/supabase/transforms';
import type { SubmissionWithUser } from '@/types/submission';

async function getLanguageFromCookies(): Promise<LanguageCode> {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get(LANGUAGE_COOKIE_NAME);

  if (langCookie?.value && ['en', 'ko', 'fr', 'zh', 'vi'].includes(langCookie.value)) {
    return langCookie.value as LanguageCode;
  }

  return DEFAULT_LANGUAGE;
}

export default async function AdminSubmissionsPage() {
  const supabase = await createClient();
  const lang = await getLanguageFromCookies();

  // Fetch pending submissions
  const { data: submissions, error } = await supabase
    .from('cafe_submissions')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching submissions:', error);
  }

  // Fetch profiles for all submitters
  const userIds = [...new Set((submissions || []).map((s) => s.user_id))];
  const { data: profiles } = userIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, role')
        .in('id', userIds)
    : { data: [] };

  // Create a map for quick profile lookup
  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  // Transform to SubmissionWithUser type
  const transformedSubmissions: SubmissionWithUser[] = (submissions || []).map((s) => {
    const profile = profileMap.get(s.user_id);
    return {
      id: s.id,
      userId: s.user_id,
      name: s.name,
      address: s.address,
      phone: s.phone,
      latitude: s.latitude,
      longitude: s.longitude,
      districtId: s.district_id,
      neighborhoodId: s.neighborhood_id,
      kakaoPlaceId: s.kakao_place_id,
      status: s.status,
      rejectionReason: s.rejection_reason,
      adminNotes: s.admin_notes,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
      approvedAt: s.approved_at,
      approvedBy: s.approved_by,
      cafeId: s.cafe_id,
      photoUrls: s.photo_urls || [],
      user: {
        id: profile?.id || s.user_id,
        email: profile?.username || '',
        displayName: profile?.display_name || null,
        avatarUrl: resolveAvatarUrl(profile?.avatar_url || null),
        role: profile?.role,
      },
    };
  });

  // Build translations object for client components
  const translationKeys = [
    'admin.submissions.title',
    'admin.submissions.empty',
    'admin.table.name',
    'admin.table.address',
    'admin.table.submitter',
    'admin.table.date',
    'admin.table.actions',
    'admin.approve.title',
    'admin.approve.confirm',
    'admin.approve.notes',
    'admin.approve.button',
    'admin.reject.title',
    'admin.reject.reason',
    'admin.reject.reasonPlaceholder',
    'admin.reject.reasonRequired',
    'admin.reject.notes',
    'admin.reject.button',
    'admin.edit.title',
    'admin.edit.name',
    'admin.edit.address',
    'admin.edit.phone',
    'admin.edit.save',
    'admin.success.approved',
    'admin.success.rejected',
    'admin.success.edited',
    'admin.error.generic',
  ];

  const translations: Record<string, string> = {};
  for (const key of translationKeys) {
    translations[key] = getTranslation(lang, key);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{translations['admin.submissions.title']}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {transformedSubmissions.length} pending submission
          {transformedSubmissions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {transformedSubmissions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">{translations['admin.submissions.empty']}</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <SubmissionsTable submissions={transformedSubmissions} translations={translations} />
        </div>
      )}
    </div>
  );
}
