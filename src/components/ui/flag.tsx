'use client';

import Image from 'next/image';

// Map language codes to country codes for flags
const LANGUAGE_TO_COUNTRY: Record<string, string> = {
  en: 'gb',
  ko: 'kr',
  fr: 'fr',
  zh: 'cn',
  vi: 'vn',
};

interface FlagProps {
  language: string;
  size?: number;
  className?: string;
}

export function Flag({ language, size = 20, className }: FlagProps) {
  const countryCode = LANGUAGE_TO_COUNTRY[language] || language;

  return (
    <Image
      src={`https://flagcdn.com/w40/${countryCode}.png`}
      alt={`${language} flag`}
      width={size}
      height={Math.round(size * 0.75)}
      className={`inline-block rounded-sm ${className || ''}`}
    />
  );
}
