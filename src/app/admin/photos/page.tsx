import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getTranslation } from '@/lib/i18n/translations';
import { LanguageCode, DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME } from '@/lib/i18n/languages';
import { PhotosTable } from '@/components/admin/photos-table';
import type { PendingPhoto } from '@/lib/actions/admin';

async function getLanguageFromCookies(): Promise<LanguageCode> {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get(LANGUAGE_COOKIE_NAME);

  if (langCookie?.value && ['en', 'ko', 'fr', 'zh', 'vi'].includes(langCookie.value)) {
    return langCookie.value as LanguageCode;
  }

  return DEFAULT_LANGUAGE;
}

export default async function AdminPhotosPage() {
  const supabase = await createClient();
  const lang = await getLanguageFromCookies();

  // Fetch pending photos with cafe info
  const { data: photos, error } = await supabase
    .from('photos')
    .select(`
      id,
      storage_path,
      cafe_id,
      user_id,
      created_at,
      file_size,
      mime_type,
      cafe:cafes(name, slug)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true }); // FIFO - oldest first

  if (error) {
    console.error('Error fetching pending photos:', error);
  }

  // Transform to PendingPhoto type
  const pendingPhotos: PendingPhoto[] = (photos || []).map((photo) => {
    // Supabase returns the joined data - handle both array and object cases
    const cafeData = photo.cafe as unknown;
    const cafe = Array.isArray(cafeData) ? cafeData[0] : cafeData;
    const typedCafe = cafe as { name: string; slug: string } | null;
    return {
      id: photo.id,
      storage_path: photo.storage_path,
      cafe_id: photo.cafe_id,
      cafe_name: typedCafe?.name || null,
      cafe_slug: typedCafe?.slug || null,
      user_id: photo.user_id,
      created_at: photo.created_at,
      file_size: photo.file_size,
      mime_type: photo.mime_type,
    };
  });

  // Get Supabase Storage URL
  const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

  const translations = {
    preview: getTranslation(lang, 'admin.photos.preview'),
    approve: getTranslation(lang, 'admin.photos.approve'),
    reject: getTranslation(lang, 'admin.photos.reject'),
    empty: getTranslation(lang, 'admin.photos.empty'),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {getTranslation(lang, 'admin.photos.title')}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {pendingPhotos.length} {pendingPhotos.length === 1 ? 'photo' : 'photos'} pending review
        </p>
      </div>

      <PhotosTable
        photos={pendingPhotos}
        storageUrl={storageUrl}
        translations={translations}
      />
    </div>
  );
}
