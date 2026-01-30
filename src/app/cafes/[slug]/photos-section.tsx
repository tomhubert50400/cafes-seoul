'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, LogIn } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { PhotoGallery } from '@/components/photos/photo-gallery';
import { PhotoUpload } from '@/components/photos/photo-upload';
import type { PhotoWithVoteStatus } from '@/types/photos';
import type { User } from '@/types/user';

// ============================================
// PHOTOS SECTION PROPS
// ============================================

interface PhotosSectionProps {
  /** Cafe ID for fetching/uploading photos */
  cafeId: string;
  /** Initial photos from server (SSR) */
  initialPhotos: PhotoWithVoteStatus[];
  /** Current user (null if not authenticated) */
  currentUser: User | null;
}

// ============================================
// PHOTOS SECTION COMPONENT
// ============================================

export function PhotosSection({
  cafeId,
  initialPhotos,
  currentUser,
}: PhotosSectionProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [hasNewUpload, setHasNewUpload] = useState(false);

  // Handle upload success - refresh the page to show new photo
  const handleUploadSuccess = useCallback(() => {
    setHasNewUpload(true);
    // Use router.refresh() to re-fetch server data
    router.refresh();
  }, [router]);

  // Count visible photos (approved + user's pending)
  const visiblePhotoCount = initialPhotos.length;

  return (
    <section id="photos" className="border-t border-border pt-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {t('photos.title') || 'Photos'}
          </h2>
          {visiblePhotoCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {visiblePhotoCount}{' '}
              {visiblePhotoCount === 1
                ? t('photos.photo') || 'photo'
                : t('photos.photos') || 'photos'}
            </p>
          )}
        </div>
      </div>

      {/* Upload Area - Only for authenticated users */}
      <div className="mb-8">
        {currentUser ? (
          <PhotoUpload
            cafeId={cafeId}
            onUploadSuccess={handleUploadSuccess}
          />
        ) : (
          <GuestUploadPrompt />
        )}
      </div>

      {/* Photo Gallery */}
      <PhotoGallery
        cafeId={cafeId}
        initialPhotos={initialPhotos}
        currentUserId={currentUser?.id}
      />
    </section>
  );
}

// ============================================
// GUEST UPLOAD PROMPT
// ============================================

function GuestUploadPrompt() {
  const { t } = useI18n();
  const router = useRouter();

  const handleSignIn = () => {
    // Navigate to login with return URL
    const returnUrl = encodeURIComponent(window.location.pathname);
    router.push(`/login?redirect=${returnUrl}`);
  };

  return (
    <div
      className={cn(
        'relative rounded-lg border-2 border-dashed border-muted-foreground/25',
        'p-8 text-center',
        'hover:border-muted-foreground/40 transition-colors'
      )}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <LogIn className="h-6 w-6 text-muted-foreground" />
        </div>

        <div>
          <p className="font-medium text-foreground">
            {t('photos.guestPrompt.title') || 'Sign in to upload photos'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {t('photos.guestPrompt.description') ||
              'Share your favorite moments from this cafe'}
          </p>
        </div>

        <button
          onClick={handleSignIn}
          className={cn(
            'mt-2 inline-flex items-center gap-2',
            'px-4 py-2 rounded-lg',
            'bg-primary text-primary-foreground',
            'hover:bg-primary/90',
            'transition-colors',
            'text-sm font-medium'
          )}
        >
          <LogIn className="h-4 w-4" />
          {t('photos.guestPrompt.button') || 'Sign In'}
        </button>
      </div>
    </div>
  );
}
