/**
 * Rating utility functions
 * Shared helpers for rating-related components
 */

import type { OptionalRatingDimension } from '@/types/ratings';

// ============================================
// DIMENSION LABEL HELPERS
// ============================================

/**
 * Dimension labels for all supported languages
 */
const DIMENSION_LABELS: Record<OptionalRatingDimension, Record<string, string>> = {
  drinks: { ko: '음료', en: 'Drinks', fr: 'Boissons', zh: '饮品', vi: 'Do uong' },
  service: { ko: '서비스', en: 'Service', fr: 'Service', zh: '服务', vi: 'Dich vu' },
  priceValue: { ko: '가성비', en: 'Value', fr: 'Rapport qualite-prix', zh: '性价比', vi: 'Gia tri' },
  quietness: { ko: '조용함', en: 'Quietness', fr: 'Calme', zh: '安静', vi: 'Yen tinh' },
  seating: { ko: '좌석', en: 'Seating', fr: 'Places', zh: '座位', vi: 'Cho ngoi' },
  comfort: { ko: '편안함', en: 'Comfort', fr: 'Confort', zh: '舒适', vi: 'Thoai mai' },
  food: { ko: '음식', en: 'Food', fr: 'Nourriture', zh: '食物', vi: 'Do an' },
  lighting: { ko: '조명', en: 'Lighting', fr: 'Eclairage', zh: '灯光', vi: 'Anh sang' },
  outlets: { ko: '콘센트', en: 'Outlets', fr: 'Prises', zh: '插座', vi: 'O cam' },
};

/**
 * Get localized label for a rating dimension
 * @param dim - The rating dimension
 * @param language - The language code (en, ko, fr, zh, vi)
 * @returns Localized dimension label, falls back to English if language not found
 */
export function getDimensionLabel(dim: OptionalRatingDimension, language: string): string {
  const labels = DIMENSION_LABELS[dim];
  return labels[language] || labels.en;
}

/**
 * Get all dimension labels for a language
 * @param language - The language code
 * @returns Object mapping dimensions to their labels
 */
export function getAllDimensionLabels(language: string): Record<OptionalRatingDimension, string> {
  const result = {} as Record<OptionalRatingDimension, string>;
  for (const dim of Object.keys(DIMENSION_LABELS) as OptionalRatingDimension[]) {
    result[dim] = getDimensionLabel(dim, language);
  }
  return result;
}
