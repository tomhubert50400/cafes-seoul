import type { TranslatedText } from './cafe';

export interface MetroLine {
  id: number;
  lineNumber: string;
  name: TranslatedText;
  color: string;
}

export interface MetroStation {
  id: number;
  name: TranslatedText;
  lineId: number;
  line?: MetroLine;
  latitude: number;
  longitude: number;
}

export const WALKING_MINUTES_OPTIONS = [5, 10, 15] as const;
export type WalkingMinutes = (typeof WALKING_MINUTES_OPTIONS)[number];

export function walkingMinutesToMeters(minutes: WalkingMinutes): number {
  switch (minutes) {
    case 5: return 400;
    case 10: return 800;
    case 15: return 1200;
  }
}
