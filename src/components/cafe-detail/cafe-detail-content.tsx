'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { RatingStars } from '@/components/rating-stars';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useI18n } from '@/lib/i18n';
import { getDistrictById } from '@/lib/constants/districts';
import { EXTERNAL_URLS } from '@/lib/constants/routes';
import type { Cafe, CafeImage } from '@/types/cafe';
import { CAFE_TYPE_LABELS, PRICE_RANGE_LABELS, getLocalizedText } from '@/types/cafe';
import type { Review } from '@/types/review';

interface CafeDetailContentProps {
  cafe: Cafe;
  images: CafeImage[];
  reviews: Review[];
}

export function CafeDetailContent({ cafe, images, reviews }: CafeDetailContentProps) {
  const { t, language } = useI18n();
  const district = getDistrictById(cafe.districtId);
  const typeLabel = CAFE_TYPE_LABELS[cafe.cafeType];
  const priceLabel = PRICE_RANGE_LABELS[cafe.priceRange];

  const cafeName = getLocalizedText(cafe.name, language);
  const cafeDescription = getLocalizedText(cafe.description, language);
  const cafeAddress = getLocalizedText(cafe.address, language);

  const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8">
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
          {images.length > 0 ? (
            <div className="grid gap-2 md:grid-cols-4 md:grid-rows-2">
              <div className="relative aspect-[4/3] md:col-span-2 md:row-span-2">
                <Image
                  src={images[0].storagePath}
                  alt={getLocalizedText(images[0].altText, language) || cafeName}
                  fill
                  className="rounded-lg object-cover"
                  priority
                />
              </div>
              {images.slice(1, 5).map((image, i) => (
                <div key={image.id} className="relative hidden aspect-[4/3] md:block">
                  <Image
                    src={image.storagePath}
                    alt={getLocalizedText(image.altText, language) || `${cafeName} ${i + 2}`}
                    fill
                    className="rounded-lg object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex aspect-[21/9] items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
              <CoffeeIcon className="h-24 w-24 text-zinc-300 dark:text-zinc-600" />
            </div>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Header */}
            <div className="mb-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold">{cafeName}</h1>
                </div>
                <div className="flex gap-2">
                  {typeLabel && <Badge variant="outline">{typeLabel[language as keyof typeof typeLabel] || typeLabel.en}</Badge>}
                  {priceLabel && <Badge variant="outline">{priceLabel.symbol}</Badge>}
                </div>
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
                <TabsTrigger value="reviews">{t('cafe.tabs.reviews')} ({cafe.totalRatings})</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="mt-6 space-y-8">
                {/* Description */}
                {cafeDescription && (
                  <div>
                    <h2 className="mb-3 text-lg font-semibold">{t('cafe.intro')}</h2>
                    <p className="text-muted-foreground">{cafeDescription}</p>
                  </div>
                )}

                {/* Features */}
                <div>
                  <h2 className="mb-3 text-lg font-semibold">{t('cafe.facilities')}</h2>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <FeatureItem icon={<WifiIcon />} label={t('feature.wifi')} available={cafe.hasWifi} />
                    <FeatureItem icon={<PlugIcon />} label={t('feature.outlets')} available={cafe.hasPowerOutlets} />
                    <FeatureItem icon={<LaptopIcon />} label={t('feature.laptop')} available={cafe.isLaptopFriendly} />
                    <FeatureItem icon={<PetIcon />} label={t('feature.pet')} available={cafe.isPetFriendly} />
                    <FeatureItem icon={<ParkingIcon />} label={t('feature.parking')} available={cafe.hasParking} />
                    <FeatureItem icon={<OutdoorIcon />} label={t('feature.outdoor')} available={cafe.hasOutdoorSeating} />
                    <FeatureItem icon={<ReservationIcon />} label={t('feature.reservation')} available={cafe.hasReservations} />
                    <FeatureItem icon={<MeetingIcon />} label={t('feature.meeting')} available={cafe.hasMeetingRooms} />
                  </div>
                </div>

                {/* Rating breakdown */}
                <div>
                  <h2 className="mb-3 text-lg font-semibold">{t('cafe.detailedRatings')}</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <RatingBar label={t('rating.drinks')} rating={cafe.ratings.drinks} />
                    <RatingBar label={t('rating.food')} rating={cafe.ratings.food} />
                    <RatingBar label={t('rating.ambiance')} rating={cafe.ratings.ambiance} />
                    <RatingBar label={t('rating.seating')} rating={cafe.ratings.seating} />
                    <RatingBar label={t('rating.wifi')} rating={cafe.ratings.wifi} />
                    <RatingBar label={t('rating.outlets')} rating={cafe.ratings.outlets} />
                    <RatingBar label={t('rating.noise')} rating={cafe.ratings.noise} />
                    <RatingBar label={t('rating.value')} rating={cafe.ratings.value} />
                    <RatingBar label={t('rating.temperature')} rating={cafe.ratings.temperature} />
                  </div>
                </div>

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
                {reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <ReviewCard key={review.id} review={review} language={language} />
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground">{t('cafe.noReviews')}</p>
                    <Button className="mt-4">{t('cafe.writeFirst')}</Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact card */}
            <div className="rounded-xl border bg-card p-6">
              <h2 className="mb-4 font-semibold">{t('cafe.location')}</h2>

              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <MapPinIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div>
                    <p>{cafeAddress}</p>
                  </div>
                </div>

                {cafe.phone && (
                  <div className="flex gap-3">
                    <PhoneIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <a href={`tel:${cafe.phone}`} className="hover:underline">
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
                      className="truncate hover:underline"
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
                      className="hover:underline"
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
                {cafe.kakaoPlaceId && (
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <a
                      href={`${EXTERNAL_URLS.KAKAO_MAP}/link/map/${cafe.kakaoPlaceId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('cafe.kakaoMap')}
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {/* Static map placeholder */}
            <div className="aspect-[4/3] overflow-hidden rounded-xl border bg-zinc-100 dark:bg-zinc-800">
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">{t('cafe.map')}</p>
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
      className={`flex items-center gap-2 rounded-lg border p-3 ${
        available ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950' : 'opacity-50'
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

      {review.title && <h3 className="mb-2 font-medium">{review.title}</h3>}
      {review.content && <p className="text-sm text-muted-foreground">{review.content}</p>}

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
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/></svg>;
}

function PlugIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a6 6 0 0 1-12 0V8Z"/></svg>;
}

function LaptopIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/></svg>;
}

function PetIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/></svg>;
}

function ParkingIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg>;
}

function OutdoorIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>;
}

function ReservationIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>;
}

function MeetingIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}

function CheckIcon({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}><path d="M20 6 9 17l-5-5"/></svg>;
}

function MapPinIcon({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
}

function PhoneIcon({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
}

function GlobeIcon({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>;
}

function InstagramIcon({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>;
}
