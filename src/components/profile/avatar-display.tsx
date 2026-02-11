'use client';

import { getInitials, getAvatarColor } from '@/lib/utils/avatar';
import { cn } from '@/lib/utils';

interface AvatarDisplayProps {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
};

const sizePx = {
  sm: 32,
  md: 40,
  lg: 64,
  xl: 96,
};

export function AvatarDisplay({
  userId,
  displayName,
  avatarUrl,
  size = 'md',
  className,
}: AvatarDisplayProps) {
  const initials = getInitials(displayName || 'U');
  const bgColor = getAvatarColor(userId);

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={displayName || 'User avatar'}
        width={sizePx[size]}
        height={sizePx[size]}
        loading="lazy"
        className={cn(
          'rounded-full object-cover',
          sizeClasses[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-semibold text-white',
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: bgColor }}
      role="img"
      aria-label={`${displayName || 'User'} avatar`}
    >
      {initials}
    </div>
  );
}
