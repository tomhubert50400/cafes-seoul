'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Camera, Plus } from 'lucide-react';
import { Footer } from '@/components/footer';
import { RatingStars } from '@/components/rating-stars';
import { CafeStaticMap } from '@/components/map/cafe-static-map';
import { MapProvider } from '@/components/map/map-provider';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DirectionsChooser } from '@/components/directions-chooser';
import { ShareChooser } from '@/components/share-chooser';
import { useI18n } from '@/lib/i18n';
import { getDistrictById } from '@/lib/constants/districts';
import { EXTERNAL_URLS } from '@/lib/constants/routes';
import type { Cafe } from '@/types/cafe';
import { getLocalizedText } from '@/types/cafe';
import type { Review } from '@/types/review';
import { RatingsSection } from '@/components/ratings/ratings-section';
import type { UserRating } from '@/types/ratings';
import { PhotosSection } from '@/app/(main)/cafes/[slug]/photos-section';
import type { PhotoWithVoteStatus } from '@/types/photos';
import type { User } from '@/types/user';
import type { ReviewWithAuthor } from '@/types/reviews';
import { FavoriteButton } from '@/components/favorites/favorite-button';
import { CafeReviewsList } from '@/components/reviews/cafe-reviews-list';

interface CafeDetailContentProps {
  cafe: Cafe;
  reviews: Review[];
  textReviews?: ReviewWithAuthor[];
  userRating?: UserRating | null;
  photos?: PhotoWithVoteStatus[];
  currentUser?: User | null;
  isFavorited?: boolean;
}

export function CafeDetailContent({ cafe, reviews, textReviews = [], userRating, photos = [], currentUser = null, isFavorited = false }: CafeDetailContentProps) {
  const { t, language } = useI18n();
  const district = getDistrictById(cafe.districtId);

  const cafeName = getLocalizedText(cafe.name, language);
  const cafeDescription = getLocalizedText(cafe.description, language);
  const cafeAddress = getLocalizedText(cafe.address, language);

  const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

  // Note: We don't have access to currentUser directly in this client component
  // The server component passes photos with isOwnPhoto flags, so we can infer auth state
  const isAuthenticated = photos.some(p => p.isOwnPhoto);

  // All photos sorted by popularity, take top 4
  const galleryImages = useMemo(() => {
    return photos
      .filter((p) => p.status === 'approved')
      .sort((a, b) => b.upvoteCount - a.upvoteCount)
      .slice(0, 5)
      .map((p) => ({
        id: `photo-${p.id}`,
        url: p.url,
        alt: cafeName,
      }));
  }, [photos, cafeName]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <main className="mx-auto max-w-6xl px-4 py-8 overflow-x-hidden">
        {/* Breadcrumb */}
        <nav className="mb-4 text-sm text-muted-foreground">
          <Link href="/cafes" className="hover:text-foreground">
            {t('cafe.breadcrumb')}
          </Link>
          {district && (
            <>
              <span className="mx-2">/</span>
              <Link href={`/cafes?district=${district.slug}`} className="hover:text-foreground">
                {getLocalizedText(district.name, language)}
              </Link>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="text-foreground">{cafeName}</span>
        </nav>

        {/* Image gallery */}
        <div className="mb-8 overflow-hidden rounded-xl">
          {galleryImages.length > 0 ? (
            <div className="grid gap-2 md:grid-cols-4 md:grid-rows-2">
              {/* Main large image */}
              <div className="relative aspect-square md:col-span-2 md:row-span-2">
                <Image
                  src={galleryImages[0].url}
                  alt={galleryImages[0].alt}
                  fill
                  className="rounded-lg object-cover"
                  priority
                />
              </div>
              {/* Up to 3 more images */}
              {galleryImages.slice(1, 4).map((img) => (
                <div key={img.id} className="relative hidden aspect-square md:block">
                  <Image
                    src={img.url}
                    alt={img.alt}
                    fill
                    className="rounded-lg object-cover"
                  />
                </div>
              ))}
              {/* CTA slot — add photo */}
              <Link
                href={`/cafes/${cafe.slug}?upload=true#photos-section`}
                className="relative hidden aspect-square md:flex flex-col items-center justify-center gap-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700"
              >
                <div className="relative">
                  <Camera className="h-8 w-8 text-zinc-400 dark:text-zinc-500" />
                  <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                    <Plus className="h-3 w-3 text-primary-foreground" />
                  </div>
                </div>
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {t('cafe.addPhoto')}
                </span>
              </Link>
            </div>
          ) : (
            <div className="flex aspect-[21/9] flex-col items-center justify-center gap-3 rounded-lg bg-zinc-100 dark:bg-zinc-800">
              <CoffeeIcon className="h-16 w-16 text-zinc-300 dark:text-zinc-600" />
              <div className="text-center">
                <p className="text-muted-foreground">{t('cafe.noImage')}</p>
                <button
                  onClick={() => {
                    const url = new URL(window.location.href);
                    url.searchParams.set('upload', 'true');
                    window.history.replaceState({}, '', url.toString());
                    window.location.href = url.toString() + '#photos-section';
                  }}
                  className="mt-1 text-sm text-primary hover:underline"
                >
                  {t('cafe.addFirstPhoto')}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 order-1">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{cafeName}</h1>
                {currentUser && (
                  <FavoriteButton
                    cafeId={cafe.id}
                    initialIsFavorited={isFavorited}
                    size="sm"
                  />
                )}
              </div>

              {/* Rating */}
              <div className="mt-4 flex items-center gap-4">
                <RatingStars rating={cafe.overallRating} size="lg" />
                <span className="text-muted-foreground">({cafe.totalRatings} {t('cafe.reviews')})</span>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="info" className="mt-8">
              <TabsList>
                <TabsTrigger value="info">{t('cafe.tabs.info')}</TabsTrigger>
                <TabsTrigger value="reviews">{t('cafe.tabs.comments')}</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="mt-6 space-y-8">
                {/* Description */}
                {cafeDescription && (
                  <div>
                    <h2 className="mb-3 text-lg font-semibold">{t('cafe.intro')}</h2>
                    <p className="text-muted-foreground">{cafeDescription}</p>
                  </div>
                )}

                {/* Rating breakdown */}
                <RatingsSection
                  cafe={cafe}
                  userRating={userRating}
                  onRatingSubmitted={() => {
                    // Refresh page to show updated ratings
                    window.location.reload();
                  }}
                />

                {/* Operating hours */}
                {Object.keys(cafe.operatingHours).length > 0 && (
                  <div>
                    <h2 className="mb-3 text-lg font-semibold">{t('cafe.hours')}</h2>
                    <div className="space-y-2 text-sm">
                      {DAY_KEYS.map((day) => {
                        const hours = cafe.operatingHours[day];
                        return (
                          <div key={day} className="flex justify-between">
                            <span className="text-muted-foreground">{t(`day.${day}`)}</span>
                            <span>{hours ? `${hours.open} - ${hours.close}` : t('cafe.closed')}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                {/* Text Reviews Section */}
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-lg font-semibold">{t('reviews.cafe.title')}</h2>
                    {textReviews.length > 0 && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                        {textReviews.length}
                      </span>
                    )}
                  </div>
                  <CafeReviewsList
                    reviews={textReviews}
                    userId={currentUser?.id || null}
                  />
                </div>

                {/* Legacy Reviews (from reviews table) */}
                {reviews.length > 0 && (
                  <div className="border-t pt-8">
                    <h3 className="text-lg font-semibold mb-4">{t('cafe.tabs.comments')}</h3>
                    <div className="space-y-6">
                      {reviews.map((review) => (
                        <ReviewCard key={review.id} review={review} language={language} />
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 order-2 lg:row-span-2">
            {/* Contact card */}
            <div className="rounded-xl border bg-card p-6">
              <h2 className="mb-4 font-semibold">{t('cafe.location')}</h2>

              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <MapPinIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div className="break-words">
                    <p>{cafeAddress}</p>
                  </div>
                </div>

                {cafe.phone && (
                  <div className="flex gap-3">
                    <PhoneIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <a href={`tel:${cafe.phone}`} className="break-words hover:underline">
                      {cafe.phone}
                    </a>
                  </div>
                )}

                {cafe.website && (
                  <div className="flex gap-3">
                    <GlobeIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <a
                      href={cafe.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-words hover:underline"
                    >
                      {cafe.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}

                {cafe.instagramHandle && (
                  <div className="flex gap-3">
                    <InstagramIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <a
                      href={EXTERNAL_URLS.INSTAGRAM(cafe.instagramHandle)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-words hover:underline"
                    >
                      @{cafe.instagramHandle}
                    </a>
                  </div>
                )}
              </div>

              {/* Map links */}
              <div className="mt-6 flex gap-2">
                {cafe.naverPlaceId && (
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <a
                      href={`${EXTERNAL_URLS.NAVER_MAP}/place/${cafe.naverPlaceId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('cafe.naverMap')}
                    </a>
                  </Button>
                )}
              </div>

              {/* Get me there button */}
              {cafe.latitude && cafe.longitude && (
                <DirectionsChooser
                  address={cafe.address.ko || cafe.address.en || cafeAddress}
                  latitude={cafe.latitude}
                  longitude={cafe.longitude}
                  trigger={
                    <Button className="mt-3 w-full">
                      <NavigationIcon className="mr-2 h-4 w-4" />
                      {t('map.getDirections')}
                    </Button>
                  }
                />
              )}

              {/* Share button */}
              <ShareChooser
                cafeName={cafeName}
                cafeSlug={cafe.slug}
                trigger={
                  <Button variant="outline" className="mt-2 w-full">
                    <ShareIcon className="mr-2 h-4 w-4" />
                    {t('share.title')}
                  </Button>
                }
              />

              {/* Static map */}
              <div className="mt-6 overflow-hidden rounded-lg border border-border">
                <MapProvider>
                  <CafeStaticMap cafe={cafe} height="200px" />
                </MapProvider>
              </div>
            </div>

            {/* Price info */}
            {cafe.averageDrinkPrice && (
              <div className="rounded-xl border bg-card p-6">
                <h2 className="mb-2 font-semibold">{t('cafe.priceInfo')}</h2>
                <p className="text-sm text-muted-foreground">
                  {t('cafe.avgDrink')} <span className="font-medium text-foreground">{cafe.averageDrinkPrice.toLocaleString()}&#8361;</span>
                </p>
              </div>
            )}
          </div>

          {/* Photos Section - after sidebar on mobile, below main on desktop */}
          <div className="order-3 lg:col-span-2" id="photos-section">
            <PhotosSection
              cafeId={cafe.id}
              initialPhotos={photos}
              currentUser={currentUser}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function FeatureItem({
  icon,
  label,
  available,
}: {
  icon: React.ReactNode;
  label: string;
  available: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border p-3 ${available ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950' : 'opacity-50'
        }`}
    >
      <span className={available ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
        {icon}
      </span>
      <span className="text-sm">{label}</span>
      {available && <CheckIcon className="ml-auto h-4 w-4 text-green-600 dark:text-green-400" />}
    </div>
  );
}

function RatingBar({ label, rating }: { label: string; rating: number | null }) {
  const value = rating || 0;
  const percentage = (value / 5) * 100;

  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-sm text-muted-foreground">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
        <div
          className="h-full rounded-full bg-amber-400"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-8 text-right text-sm font-medium">{value > 0 ? value.toFixed(1) : '-'}</span>
    </div>
  );
}

function ReviewCard({ review, language }: { review: Review; language: string }) {
  const { t } = useI18n();

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
            {review.user?.avatarUrl ? (
              <Image
                src={review.user.avatarUrl}
                alt={review.user.displayName || review.user.username}
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              <span className="text-sm font-medium">
                {(review.user?.displayName || review.user?.username || 'U')[0].toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="font-medium">{review.user?.displayName || review.user?.username}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(review.createdAt).toLocaleDateString(language === 'ko' ? 'ko-KR' : language === 'fr' ? 'fr-FR' : language === 'zh' ? 'zh-CN' : language === 'vi' ? 'vi-VN' : 'en-US')}
            </p>
          </div>
        </div>
        <RatingStars rating={review.ratingOverall} size="sm" />
      </div>

      {review.title && <h3 className="mb-2 break-words font-medium">{review.title}</h3>}
      {review.content && <p className="break-words text-sm text-muted-foreground">{review.content}</p>}

      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span>{t('cafe.helpful')} {review.helpfulCount}</span>
      </div>
    </div>
  );
}

// Icons
function CoffeeIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
    </svg>
  );
}

function WifiIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 20h.01" /><path d="M2 8.82a15 15 0 0 1 20 0" /><path d="M5 12.859a10 10 0 0 1 14 0" /><path d="M8.5 16.429a5 5 0 0 1 7 0" /></svg>;
}

function PlugIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 22v-5" /><path d="M9 8V2" /><path d="M15 8V2" /><path d="M18 8v5a6 6 0 0 1-12 0V8Z" /></svg>;
}

function LaptopIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16" /></svg>;
}

function PetIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="4" r="2" /><circle cx="18" cy="8" r="2" /><circle cx="20" cy="16" r="2" /><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" /></svg>;
}

function ParkingIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M9 17V7h4a3 3 0 0 1 0 6H9" /></svg>;
}

function OutdoorIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>;
}

function ReservationIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></svg>;
}

function MeetingIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
}

function CheckIcon({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}><path d="M20 6 9 17l-5-5" /></svg>;
}

function MapPinIcon({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>;
}

function PhoneIcon({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>;
}

function GlobeIcon({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>;
}

function InstagramIcon({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>;
}

function NavigationIcon({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>;
}

function ShareIcon({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" /></svg>;
}
