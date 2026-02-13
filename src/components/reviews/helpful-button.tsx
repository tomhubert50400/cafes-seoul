'use client';

import { useState, useOptimistic, useTransition, useRef, useEffect } from 'react';
import { ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { toggleHelpfulAction } from '@/lib/actions/reviews';
import { useI18n } from '@/lib/i18n';
import { useRequireAuth } from '@/hooks/use-require-auth';

interface HelpfulButtonProps {
  ratingId: string;
  initialVoted: boolean;
  initialCount: number;
  disabled?: boolean;
  isOwnReview?: boolean;
  isLoggedIn?: boolean;
}

export function HelpfulButton({
  ratingId,
  initialVoted,
  initialCount,
  disabled = false,
  isOwnReview = false,
  isLoggedIn = true,
}: HelpfulButtonProps) {
  const { t } = useI18n();
  const { requireAuth } = useRequireAuth();

  // Track actual voted state (synced with server)
  const [isVoted, setIsVoted] = useState(initialVoted);
  const [count, setCount] = useState(initialCount);

  // Track optimistic state for immediate UI feedback
  const [optimisticIsVoted, setOptimisticIsVoted] = useOptimistic(isVoted);
  const [optimisticCount, setOptimisticCount] = useOptimistic(count);

  // Transition for async operation
  const [isPending, startTransition] = useTransition();

  // Track if user just toggled (for animation - prevents bounce on initial render)
  const [justToggled, setJustToggled] = useState(false);

  // Track initial mount to prevent animation on first render
  const isFirstRender = useRef(true);

  // Reset justToggled after animation completes
  useEffect(() => {
    if (justToggled) {
      const timer = setTimeout(() => setJustToggled(false), 300);
      return () => clearTimeout(timer);
    }
  }, [justToggled]);

  // Mark first render as complete
  useEffect(() => {
    isFirstRender.current = false;
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    // Prevent navigation when button is inside Link
    e.preventDefault();
    e.stopPropagation();

    // Handle disabled states
    if (isOwnReview) {
      toast.error(t('reviews.cafe.cannotVoteOwn'));
      return;
    }

    if (disabled) {
      return;
    }

    requireAuth(() => startTransition(async () => {
      // Only set animation if not already pending (prevents stacking)
      if (!isPending) setJustToggled(true);

      // Optimistic update - UI changes immediately
      setOptimisticIsVoted(!optimisticIsVoted);
      setOptimisticCount(optimisticIsVoted ? optimisticCount - 1 : optimisticCount + 1);

      try {
        const result = await toggleHelpfulAction(ratingId);

        if (result.success && result.isVoted !== undefined) {
          // Sync actual state with server response
          setIsVoted(result.isVoted);
          setCount(result.isVoted ? count + 1 : count - 1);
        } else {
          throw new Error(result.error || 'Failed to update vote');
        }
      } catch (error) {
        // Auto-rollback already happened via useOptimistic
        toast.error(t('reviews.cafe.voteError'));
      }
    }));
  };

  const isDisabled = disabled || isOwnReview;

  return (
    <button
      onClick={handleToggle}
      disabled={isPending || isDisabled}
      className={cn(
        'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm transition-all',
        optimisticIsVoted
          ? 'bg-primary/10 text-primary'
          : 'bg-muted/50 text-muted-foreground hover:bg-muted',
        !isDisabled && 'active:scale-95',
        justToggled && !isFirstRender.current && 'animate-[pop-sm_0.2s_ease-out]',
        isDisabled && 'cursor-not-allowed opacity-50',
        isPending && 'opacity-70'
      )}
      title={
        isOwnReview
          ? t('reviews.cafe.cannotVoteOwn')
          : !isLoggedIn
            ? t('reviews.cafe.loginToVote')
            : undefined
      }
      aria-label={
        optimisticIsVoted
          ? t('reviews.cafe.removeHelpful')
          : t('reviews.cafe.markHelpful')
      }
    >
      <ThumbsUp
        className={cn(
          'h-4 w-4',
          optimisticIsVoted && 'fill-primary'
        )}
      />
      {optimisticCount > 0 && (
        <span className="font-medium">{optimisticCount}</span>
      )}
    </button>
  );
}
