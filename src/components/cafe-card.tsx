'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Wifi, Plug, Laptop, PawPrint, Car, Camera, Plus } from 'lucide-react';
import { RatingDisplay } from '@/components/ratings/rating-display';
import { RatingButton } from '@/components/ratings/rating-button';
import { FavoriteButton } from '@/components/favorites/favorite-button';
import { useI18n } from '@/lib/i18n';
import type { CafeSummary } from '@/types/cafe';
import { getLocalizedText } from '@/types/cafe';
import { getDistrictById } from '@/lib/constants/districts';
import { ROUTES } from '@/lib/constants/routes';

interface CafeCardProps {
  cafe: CafeSummary;
  className?: string;
  isFavorited?: boolean;
  userId?: string;
}

export function CafeCard({ cafe, className, isFavorited, userId }: CafeCardProps) {
  const { t, language } = useI18n();
  const district = getDistrictById(cafe.districtId);

  const cafeName = getLocalizedText(cafe.name, language);
  const cafeAddress = getLocalizedText(cafe.address, language);

  return (
    <Link
      href={ROUTES.CAFE_DETAIL(cafe.slug)}
      className={cn(
        'group flex flex-col overflow-hidden rounded-xl border bg-card transition-all hover:shadow-md',
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {cafe.primaryImageUrl ? (
          <Image
            src={cafe.primaryImageUrl}
            alt={cafeName}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `${ROUTES.CAFE_DETAIL(cafe.slug)}?upload=true#photos-section`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = `${ROUTES.CAFE_DETAIL(cafe.slug)}?upload=true#photos-section`;
                }
              }}
              className="relative cursor-pointer rounded-full p-3 transition-colors hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80"
            >
              <Camera className="h-10 w-10 text-zinc-400 dark:text-zinc-500" />
              <div className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-400 dark:bg-zinc-500">
                <Plus className="h-3 w-3 text-white" />
              </div>
            </div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('cafe.noImage')}</p>
            <p className="text-xs text-zinc-500/90 dark:text-zinc-400/90">{t('cafe.addFirstPhoto')}</p>
          </div>
        )}

        {/* Heart icon overlay - only for logged-in users */}
        {userId && (
          <div className="absolute top-2 right-2 z-10">
            <FavoriteButton
              cafeId={cafe.id}
              initialIsFavorited={isFavorited ?? false}
              size="sm"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Name and district */}
        <div>
          <h3 className="font-semibold text-foreground line-clamp-1">{cafeName}</h3>
        </div>

        {/* Location */}
        <p className="text-sm text-muted-foreground line-clamp-1">
          {district ? getLocalizedText(district.name, language) : ''}
        </p>

        {/* Rating */}
        <div className="flex items-center justify-between">
          <RatingDisplay
            overallRating={cafe.overallRating}
            totalRatings={cafe.totalRatings}
            showStars={true}
            size="sm"
          />
          <RatingButton
            cafeId={cafe.id}
            cafeName={cafeName}
            cafeSlug={cafe.slug}
            size="sm"
            className="bg-foreground text-background hover:bg-foreground/90"
            redirectToPage
          />
        </div>

        {/* Features - only show when confirmed by user reviews */}
        {cafe.totalRatings > 0 && (
          <div className="mt-auto flex gap-1.5">
            {cafe.hasWifi && (
              <div className="p-1.5 rounded-full border border-muted-foreground/30">
                <Wifi className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            )}
            {cafe.hasPowerOutlets && (
              <div className="p-1.5 rounded-full border border-muted-foreground/30">
                <Plug className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            )}
            {cafe.isLaptopFriendly && (
              <div className="p-1.5 rounded-full border border-muted-foreground/30">
                <Laptop className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            )}
            {cafe.isPetFriendly && (
              <div className="p-1.5 rounded-full border border-muted-foreground/30">
                <PawPrint className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            )}
            {cafe.hasParking && (
              <div className="p-1.5 rounded-full border border-muted-foreground/30">
                <Car className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            )}
          </div>
        )}

        {/* Distance (if searching by location) */}
        {cafe.distance !== undefined && (
          <p className="text-xs text-muted-foreground">
            {cafe.distance < 1000
              ? `${Math.round(cafe.distance)}m`
              : `${(cafe.distance / 1000).toFixed(1)}km`}
          </p>
        )}
      </div>
    </Link>
  );
}

export function CafeCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col overflow-hidden rounded-xl border bg-card', className)}>
      <div className="aspect-[4/3] animate-pulse bg-zinc-200 dark:bg-zinc-800" />
      <div className="flex flex-col gap-2 p-4">
        <div className="h-5 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="mt-2 flex gap-1">
          <div className="h-5 w-16 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-5 w-12 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
        </div>
      </div>
    </div>
  );
}

function CoffeeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611l-.772.129A9.065 9.065 0 0 1 12 21a9.065 9.065 0 0 1-7.363-.558l-.772-.129c-1.717-.293-2.3-2.379-1.067-3.611L5 14.5"
      />
    </svg>
  );
}
