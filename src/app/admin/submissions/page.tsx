import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { SubmissionsTable } from '@/components/admin/submissions-table';
import { getTranslation } from '@/lib/i18n/translations';
import { LanguageCode, DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME } from '@/lib/i18n/languages';
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

  // Fetch pending submissions with user info
  const { data: submissions, error } = await supabase
    .from('cafe_submissions')
    .select(
      `
      *,
      user:profiles!user_id(id, email, display_name, avatar_url, role)
    `
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching submissions:', error);
  }

  // Transform to SubmissionWithUser type
  const transformedSubmissions: SubmissionWithUser[] = (submissions || []).map((s) => ({
    id: s.id,
    userId: s.user_id,
    name: s.name,
    address: s.address,
    phone: s.phone,
    latitude: s.latitude,
    longitude: s.longitude,
    districtId: s.district_id,
    neighborhoodId: s.neighborhood_id,
    status: s.status,
    rejectionReason: s.rejection_reason,
    adminNotes: s.admin_notes,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
    approvedAt: s.approved_at,
    approvedBy: s.approved_by,
    cafeId: s.cafe_id,
    user: {
      id: s.user?.id || '',
      email: s.user?.email || '',
      displayName: s.user?.display_name || null,
      avatarUrl: s.user?.avatar_url || null,
      role: s.user?.role,
    },
  }));

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
