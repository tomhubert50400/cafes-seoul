'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { VoteButton, VoteButtonSkeleton } from './vote-button';
import type { PhotoWithVoteStatus } from '@/types/photos';

// ============================================
// PHOTO CARD PROPS
// ============================================

interface PhotoCardProps {
  /** Photo data with vote status */
  photo: PhotoWithVoteStatus;
  /** Callback when vote changes */
  onVoteChange?: (photoId: string, newCount: number) => void;
  /** Optional className for styling */
  className?: string;
  /** Priority loading for above-fold images */
  priority?: boolean;
}

// ============================================
// PHOTO CARD COMPONENT
// ============================================

export function PhotoCard({
  photo,
  onVoteChange,
  className,
  priority = false,
}: PhotoCardProps) {
  // Handle vote change from VoteButton
  const handleVoteChange = (count: number, _hasVoted: boolean) => {
    onVoteChange?.(photo.id, count);
  };

  // Determine aspect ratio class based on photo dimensions (if available)
  // For masonry effect, we use varying heights
  const getAspectRatioClass = () => {
    if (!photo.width || !photo.height) {
      // Default to portrait if no dimensions
      return 'aspect-[3/4]';
    }
    
    const ratio = photo.width / photo.height;
    
    if (ratio > 1.3) {
      // Landscape
      return 'aspect-[4/3]';
    } else if (ratio < 0.8) {
      // Portrait
      return 'aspect-[3/4]';
    } else {
      // Square-ish
      return 'aspect-square';
    }
  };

  return (
    <div
      className={cn(
        // Layout
        'relative overflow-hidden',
        // Shape
        'rounded-lg',
        getAspectRatioClass(),
        // Shadows and transitions
        'shadow-sm hover:shadow-md',
        'transition-shadow duration-200',
        className
      )}
    >
      {/* Photo image */}
      <Image
        src={photo.url}
        alt=""
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className="object-cover"
        priority={priority}
      />

      {/* Status badge - only for user's own photos */}
      {photo.isOwnPhoto && photo.status !== 'approved' && (
        <div
          className={cn(
            // Position
            'absolute top-2 left-2',
            // Layout
            'flex items-center gap-1.5',
            // Styling based on status
            photo.status === 'pending'
              ? 'bg-amber-500/80 text-white'
              : 'bg-rose-500/80 text-white',
            // Common styling
            'backdrop-blur-sm',
            'rounded-full px-2.5 py-1',
            'text-xs font-medium',
            'border border-white/20'
          )}
        >
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              photo.status === 'pending' ? 'bg-white' : 'bg-white'
            )}
          />
          {photo.status === 'pending' ? 'Pending' : 'Rejected'}
        </div>
      )}

      {/* Vote button in top-right corner */}
      <VoteButton
        photoId={photo.id}
        initialCount={photo.upvoteCount}
        initialHasVoted={photo.hasVoted}
        onVoteChange={handleVoteChange}
      />

      {/* Bottom gradient for better contrast */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
    </div>
  );
}

// ============================================
// SKELETON VARIANT
// ============================================

export function PhotoCardSkeleton() {
  return (
    <div
      className={cn(
        // Layout
        'relative overflow-hidden',
        // Shape - use portrait as default skeleton
        'rounded-lg aspect-[3/4]',
        // Background
        'bg-zinc-200 dark:bg-zinc-800',
        // Animation
        'animate-pulse'
      )}
    >
      {/* Vote button skeleton */}
      <VoteButtonSkeleton />
    </div>
  );
}

// ============================================
// ERROR VARIANT
// ============================================

interface PhotoCardErrorProps {
  /** Error message to display */
  message?: string;
  /** Retry callback */
  onRetry?: () => void;
}

export function PhotoCardError({
  message = 'Failed to load photo',
  onRetry,
}: PhotoCardErrorProps) {
  return (
    <div
      className={cn(
        // Layout
        'relative overflow-hidden',
        'flex flex-col items-center justify-center',
        // Shape
        'rounded-lg aspect-[3/4]',
        // Background
        'bg-zinc-100 dark:bg-zinc-800',
        // Border
        'border-2 border-dashed border-zinc-300 dark:border-zinc-700'
      )}
    >
      {/* Error icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-8 w-8 text-zinc-400"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
        />
      </svg>

      {/* Error message */}
      <p className="mt-2 text-sm text-zinc-500 text-center px-4">{message}</p>

      {/* Retry button */}
      {onRetry && (
        <button
          onClick={onRetry}
          className={cn(
            'mt-3',
            'text-sm font-medium text-zinc-600 dark:text-zinc-400',
            'hover:text-zinc-900 dark:hover:text-zinc-200',
            'underline underline-offset-2'
          )}
        >
          Try again
        </button>
      )}
    </div>
  );
}
