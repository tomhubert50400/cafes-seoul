'use client';

import { useState, useCallback, useMemo } from 'react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { PhotoCard, PhotoCardSkeleton } from './photo-card';
import { Loader2 } from 'lucide-react';
import type { PhotoWithVoteStatus } from '@/types/photos';

// ============================================
// PHOTO GALLERY PROPS
// ============================================

interface PhotoGalleryProps {
  /** Cafe ID for fetching more photos */
  cafeId: string;
  /** Initial photos from server (SSR) */
  initialPhotos: PhotoWithVoteStatus[];
  /** Current user ID for filtering own photos */
  currentUserId?: string;
  /** Whether the current user is an admin */
  isAdmin?: boolean;
  /** Optional className for styling */
  className?: string;
}

// ============================================
// PHOTO GALLERY COMPONENT
// ============================================

export function PhotoGallery({
  cafeId,
  initialPhotos,
  currentUserId,
  isAdmin = false,
  className,
}: PhotoGalleryProps) {
  const { t } = useI18n();

  // State
  const [photos, setPhotos] = useState<PhotoWithVoteStatus[]>(initialPhotos);
  const [displayCount, setDisplayCount] = useState(6);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate if there are more photos to show
  const hasMore = photos.length > displayCount;

  // Get currently displayed photos, sorted by most liked first
  const displayedPhotos = useMemo(() => {
    return [...photos]
      .sort((a, b) => b.upvoteCount - a.upvoteCount)
      .slice(0, displayCount);
  }, [photos, displayCount]);

  // Handle "Show more" click
  const handleShowMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    // Simulate loading delay for smooth UX
    // In a real implementation, this would fetch more photos from API
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Increment display count by 6
    setDisplayCount((prev) => prev + 6);
    setIsLoading(false);
  }, [isLoading, hasMore]);

  // Handle vote change from a photo card
  const handleVoteChange = useCallback(
    (photoId: string, newCount: number) => {
      setPhotos((prevPhotos) =>
        prevPhotos.map((photo) =>
          photo.id === photoId
            ? { ...photo, upvoteCount: newCount, hasVoted: !photo.hasVoted }
            : photo
        )
      );
    },
    []
  );

  // Handle photo deletion
  const handlePhotoDelete = useCallback(
    (photoId: string) => {
      setPhotos((prevPhotos) => prevPhotos.filter((photo) => photo.id !== photoId));
    },
    []
  );

  // Empty state
  if (photos.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center',
          'py-16 px-4',
          'text-center',
          className
        )}
      >
        {/* Empty state icon */}
        <div className="h-16 w-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1}
            stroke="currentColor"
            className="h-8 w-8 text-zinc-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
            />
          </svg>
        </div>

        {/* Empty state message */}
        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
          {t('photos.empty.title') || 'No photos yet'}
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          {t('photos.empty.description') || 'Be the first to upload!'}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Masonry grid using CSS columns */}
      <div
        className={cn(
          // CSS columns for masonry layout
          'columns-2 md:columns-3 lg:columns-4',
          // Gap between columns
          'gap-4',
          // Prevent column break inside items
          '[&>*]:break-inside-avoid',
          '[&>*]:mb-4'
        )}
      >
        {displayedPhotos.map((photo, index) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            onVoteChange={handleVoteChange}
            onDelete={handlePhotoDelete}
            isAdmin={isAdmin}
            // Prioritize loading first 6 images
            priority={index < 6}
          />
        ))}
      </div>

      {/* Show more button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleShowMore}
            disabled={isLoading}
            className={cn(
              // Layout
              'inline-flex items-center gap-2',
              // Padding
              'px-6 py-3',
              // Shape
              'rounded-full',
              // Colors
              'bg-zinc-100 dark:bg-zinc-800',
              'text-zinc-900 dark:text-zinc-100',
              'hover:bg-zinc-200 dark:hover:bg-zinc-700',
              // Transitions
              'transition-colors duration-200',
              // Typography
              'text-sm font-medium',
              // States
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t('photos.loading') || 'Loading...'}</span>
              </>
            ) : (
              <>
                <span>{t('photos.showMore') || 'Show more'}</span>
                <span className="text-zinc-500">
                  ({photos.length - displayCount} remaining)
                </span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Photo count footer */}
      <div className="text-center text-sm text-zinc-500 pt-2">
        {photos.length} {photos.length === 1 ? t('photos.photo') || 'photo' : t('photos.photos') || 'photos'}
      </div>
    </div>
  );
}

// ============================================
// LOADING SKELETON
// ============================================

interface PhotoGallerySkeletonProps {
  /** Number of skeleton cards to show */
  count?: number;
  /** Optional className for styling */
  className?: string;
}

export function PhotoGallerySkeleton({
  count = 6,
  className,
}: PhotoGallerySkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Masonry grid skeleton */}
      <div
        className={cn(
          // CSS columns for masonry layout
          'columns-2 md:columns-3 lg:columns-4',
          // Gap between columns
          'gap-4',
          // Prevent column break inside items
          '[&>*]:break-inside-avoid',
          '[&>*]:mb-4'
        )}
      >
        {Array.from({ length: count }).map((_, index) => (
          <PhotoCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

// ============================================
// ERROR STATE
// ============================================

interface PhotoGalleryErrorProps {
  /** Error message */
  message?: string;
  /** Retry callback */
  onRetry?: () => void;
  /** Optional className for styling */
  className?: string;
}

export function PhotoGalleryError({
  message = 'Failed to load photos',
  onRetry,
  className,
}: PhotoGalleryErrorProps) {
  const { t } = useI18n();

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        'py-16 px-4',
        'text-center',
        className
      )}
    >
      {/* Error icon */}
      <div className="h-16 w-16 rounded-full bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-8 w-8 text-rose-500"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
          />
        </svg>
      </div>

      {/* Error message */}
      <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
        {message}
      </p>

      {/* Retry button */}
      {onRetry && (
        <button
          onClick={onRetry}
          className={cn(
            'mt-4',
            'inline-flex items-center gap-2',
            'px-4 py-2',
            'rounded-lg',
            'bg-zinc-900 dark:bg-zinc-100',
            'text-white dark:text-zinc-900',
            'hover:bg-zinc-800 dark:hover:bg-zinc-200',
            'transition-colors duration-200',
            'text-sm font-medium'
          )}
        >
          {t('common.retry') || 'Try again'}
        </button>
      )}
    </div>
  );
}
