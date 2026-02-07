'use client';

import { motion } from 'framer-motion';
import { Dice5 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

interface RouletteIdleProps {
  cafeCount: number;
  onSpin: () => void;
  onClearFilters: () => void;
}

export function RouletteIdle({ cafeCount, onSpin, onClearFilters }: RouletteIdleProps) {
  const { t } = useI18n();

  if (cafeCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Dice5 className="h-16 w-16 text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-medium mb-2">{t('roulette.noResults')}</h3>
        <p className="text-sm text-muted-foreground mb-6">{t('roulette.noResultsHint')}</p>
        <Button variant="outline" onClick={onClearFilters}>
          {t('roulette.clearFilters')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Button
          size="lg"
          onClick={onSpin}
          className="min-h-[48px] h-16 px-10 text-lg gap-3 rounded-full"
        >
          <Dice5 className="h-6 w-6" />
          {t('roulette.spin')}
        </Button>
      </motion.div>
    </div>
  );
}
