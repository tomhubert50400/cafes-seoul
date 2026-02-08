'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Camera, LogIn } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { PhotoGallery } from '@/components/photos/photo-gallery';
import { PhotoUploadModal } from '@/components/photos/photo-upload-modal';
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
  const searchParams = useSearchParams();
  const shouldOpenUpload = searchParams.get('upload') === 'true';

  // Handle upload success - refresh the page to show new photo
  const handleUploadSuccess = useCallback(() => {
    router.refresh();
  }, [router]);

  // Count visible photos (approved + user's pending)
  const visiblePhotoCount = initialPhotos.length;

  return (
    <section id="photos" className="border-t border-border pt-8">
      {/* Section Header with Upload Button */}
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

        {/* Upload Button - Only for authenticated users */}
        {currentUser ? (
          <PhotoUploadModal
            cafeId={cafeId}
            onUploadSuccess={handleUploadSuccess}
            defaultOpen={shouldOpenUpload}
          />
        ) : (
          <SignInButton />
        )}
      </div>

      {/* Photo Gallery */}
      <PhotoGallery
        cafeId={cafeId}
        initialPhotos={initialPhotos}
        currentUserId={currentUser?.id}
        isAdmin={currentUser?.role === 'admin'}
      />
    </section>
  );
}

// ============================================
// SIGN IN BUTTON FOR GUESTS
// ============================================

function SignInButton() {
  const { t } = useI18n();
  const router = useRouter();

  const handleSignIn = () => {
    // Navigate to login with return URL
    const returnUrl = encodeURIComponent(window.location.pathname);
    router.push(`/login?redirect=${returnUrl}`);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSignIn}
      className="gap-1.5"
    >
      <LogIn className="h-4 w-4" />
      {t('photos.signInToUpload') || 'Sign in to add'}
    </Button>
  );
}
