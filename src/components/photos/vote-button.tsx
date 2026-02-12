'use client';

import { useState, useCallback, useRef } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toggleVote } from '@/lib/photos/voting';

// ============================================
// VOTE BUTTON PROPS
// ============================================

interface VoteButtonProps {
  /** Photo ID being voted on */
  photoId: string;
  /** Initial vote count */
  initialCount: number;
  /** Whether user has already voted */
  initialHasVoted: boolean;
  /** Callback when vote changes (count, hasVoted) */
  onVoteChange?: (count: number, hasVoted: boolean) => void;
  /** Optional className for styling */
  className?: string;
}

// ============================================
// VOTE BUTTON COMPONENT
// ============================================

export function VoteButton({
  photoId,
  initialCount,
  initialHasVoted,
  onVoteChange,
  className,
}: VoteButtonProps) {
  // Local state for optimistic UI
  const [count, setCount] = useState(initialCount);
  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [isPending, setIsPending] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showCountFlash, setShowCountFlash] = useState(false);

  // Store original values for rollback on error
  const [originalValues] = useState({
    count: initialCount,
    hasVoted: initialHasVoted,
  });

  // Debounce ref to prevent rapid clicks before state updates
  const lastClickRef = useRef(0);

  const handleClick = useCallback(async () => {
    // Prevent multiple clicks while pending or within 500ms debounce
    if (isPending) return;
    const now = Date.now();
    if (now - lastClickRef.current < 500) return;
    lastClickRef.current = now;

    // Calculate optimistic values
    const newHasVoted = !hasVoted;
    const newCount = newHasVoted ? count + 1 : count - 1;

    // Apply optimistic update immediately
    setHasVoted(newHasVoted);
    setCount(newCount);
    setIsPending(true);
    setIsAnimating(true);
    setShowCountFlash(true);

    // Notify parent of optimistic change
    onVoteChange?.(newCount, newHasVoted);

    // Trigger animations
    setTimeout(() => setIsAnimating(false), 200);
    setTimeout(() => setShowCountFlash(false), 300);

    try {
      // Call server action
      const result = await toggleVote(photoId);

      if (!result.success) {
        // Error - revert to original values
        setCount(originalValues.count);
        setHasVoted(originalValues.hasVoted);
        onVoteChange?.(originalValues.count, originalValues.hasVoted);
        console.error('Vote toggle failed:', result.error);
      } else {
        // Success - sync with server response
        setCount(result.upvoteCount);
        setHasVoted(result.hasVoted);
        onVoteChange?.(result.upvoteCount, result.hasVoted);
      }
    } catch (err) {
      // Unexpected error - revert
      setCount(originalValues.count);
      setHasVoted(originalValues.hasVoted);
      onVoteChange?.(originalValues.count, originalValues.hasVoted);
      console.error('Unexpected error toggling vote:', err);
    } finally {
      setIsPending(false);
    }
  }, [photoId, count, hasVoted, isPending, originalValues, onVoteChange]);

  // Determine aria-label and title based on state
  const ariaLabel = `${count} upvotes`;
  const title = hasVoted
    ? 'Click to remove upvote'
    : 'Click to upvote';

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-label={ariaLabel}
      aria-pressed={hasVoted}
      title={title}
      className={cn(
        // Layout
        'absolute top-2 right-2',
        'flex items-center gap-1.5',
        // Background - semi-transparent for readability on photos
        'bg-black/40 backdrop-blur-sm',
        'hover:bg-black/50',
        // Border and shape
        'rounded-full px-2.5 py-1.5',
        'border border-white/20',
        // Transitions
        'transition-all duration-200 ease-out',
        // Cursor
        'cursor-pointer disabled:cursor-not-allowed',
        // Text
        'text-white',
        className
      )}
    >
      {/* Heart icon with animation */}
      <Heart
        className={cn(
          'h-4 w-4 transition-all duration-200 ease-out',
          // Scale animation when voting
          isAnimating && 'scale-125',
          // Fill state
          hasVoted ? 'fill-rose-500 text-rose-500' : 'fill-transparent text-white',
          // Hover effect
          'group-hover:scale-110'
        )}
      />

      {/* Vote count with flash animation */}
      <span
        className={cn(
          'text-sm font-semibold tabular-nums',
          'transition-all duration-200',
          // Flash effect on count change
          showCountFlash && 'text-rose-300 scale-110',
          // Reset after animation
          !showCountFlash && 'text-white'
        )}
      >
        {count}
      </span>
    </button>
  );
}

// ============================================
// SKELETON VARIANT
// ============================================

export function VoteButtonSkeleton() {
  return (
    <div
      className={cn(
        'absolute top-2 right-2',
        'flex items-center gap-1.5',
        'bg-black/40 backdrop-blur-sm',
        'rounded-full px-2.5 py-1.5',
        'animate-pulse'
      )}
    >
      <div className="h-4 w-4 rounded-full bg-white/30" />
      <div className="h-4 w-6 rounded bg-white/30" />
    </div>
  );
}
