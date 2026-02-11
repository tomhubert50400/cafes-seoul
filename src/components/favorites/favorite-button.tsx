'use client';

import { useState, useOptimistic, useTransition, useRef, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { toggleFavoriteAction } from '@/lib/actions/favorites';

interface FavoriteButtonProps {
  cafeId: string;
  initialIsFavorited: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

const buttonSizeMap = {
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-2.5',
};

export function FavoriteButton({
  cafeId,
  initialIsFavorited,
  size = 'md',
  className,
}: FavoriteButtonProps) {
  // Track actual favorited state (synced with server)
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);

  // Track optimistic state for immediate UI feedback
  const [optimisticIsFavorited, setOptimisticIsFavorited] = useOptimistic(isFavorited);

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

    startTransition(async () => {
      // Set animation flag before optimistic update
      setJustToggled(true);

      // Optimistic update - UI changes immediately
      setOptimisticIsFavorited(!optimisticIsFavorited);

      try {
        const result = await toggleFavoriteAction(cafeId);

        if (result.success && result.isFavorited !== undefined) {
          // Sync actual state with server response
          setIsFavorited(result.isFavorited);
        } else {
          throw new Error(result.error || 'Failed to update favorite');
        }
      } catch (error) {
        // Auto-rollback already happened via useOptimistic
        toast.error('Failed to update favorite');
      }
    });
  };

  return (
    <motion.button
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        'flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-colors hover:bg-black/50 disabled:opacity-50',
        buttonSizeMap[size],
        className
      )}
      whileTap={{ scale: 0.9 }}
      animate={{
        scale: justToggled && !isFirstRender.current ? [1, 1.2, 1] : 1,
      }}
      transition={{
        scale: { type: 'tween', duration: 0.25, ease: 'easeInOut' },
      }}
      aria-label={optimisticIsFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        className={cn(
          'transition-colors',
          sizeMap[size],
          optimisticIsFavorited
            ? 'fill-red-500 text-red-500'
            : 'text-white'
        )}
      />
    </motion.button>
  );
}
