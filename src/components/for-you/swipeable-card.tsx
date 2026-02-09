'use client';

import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { PhotoCarousel } from './photo-carousel';
import { CafeCardInfo } from './cafe-card-info';
import { useI18n } from '@/lib/i18n';
import { getLocalizedText } from '@/types/cafe';
import type { ForYouCafe } from '@/types/for-you';

interface SwipeableCardProps {
  cafe: ForYouCafe;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isBehind?: boolean;
}

const SWIPE_THRESHOLD = 100;
const VELOCITY_THRESHOLD = 500;

export function SwipeableCard({
  cafe,
  onSwipeLeft,
  onSwipeRight,
  isBehind = false,
}: SwipeableCardProps) {
  const { t, language } = useI18n();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const cafeName = getLocalizedText(cafe.name, language);

  function handleDragEnd(_: unknown, info: PanInfo) {
    const { offset, velocity } = info;
    if (offset.x > SWIPE_THRESHOLD || velocity.x > VELOCITY_THRESHOLD) {
      onSwipeRight();
    } else if (offset.x < -SWIPE_THRESHOLD || velocity.x < -VELOCITY_THRESHOLD) {
      onSwipeLeft();
    }
  }

  if (isBehind) {
    return (
      <div className="absolute inset-0 rounded-2xl overflow-hidden bg-card border shadow-lg scale-[0.95] opacity-70">
        <PhotoCarousel photoUrls={cafe.photoUrls} cafeName={cafeName} />
      </div>
    );
  }

  return (
    <motion.div
      className="absolute inset-0 rounded-2xl overflow-hidden bg-card border shadow-lg flex flex-col cursor-grab active:cursor-grabbing"
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Photo area */}
      <div className="relative shrink-0">
        <PhotoCarousel photoUrls={cafe.photoUrls} cafeName={cafeName} />

        {/* LIKE overlay */}
        <motion.div
          className="absolute inset-0 bg-green-500/20 pointer-events-none flex items-center justify-center"
          style={{ opacity: likeOpacity }}
        >
          <div className="absolute top-12 left-6 rotate-[-20deg] border-4 border-green-500 rounded-lg px-4 py-2">
            <span className="text-3xl font-black text-green-500">
              {t('forYou.like')}
            </span>
          </div>
        </motion.div>

        {/* NOPE overlay */}
        <motion.div
          className="absolute inset-0 bg-red-500/20 pointer-events-none flex items-center justify-center"
          style={{ opacity: nopeOpacity }}
        >
          <div className="absolute top-12 right-6 rotate-[20deg] border-4 border-red-500 rounded-lg px-4 py-2">
            <span className="text-3xl font-black text-red-500">
              {t('forYou.nope')}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Info area */}
      <CafeCardInfo cafe={cafe} />
    </motion.div>
  );
}
