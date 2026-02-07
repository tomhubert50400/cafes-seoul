import type { MapFilters } from './map';

export interface UserVibe {
  id: string;
  userId: string;
  name: string;
  icon: string;
  filters: Partial<MapFilters>;
  position: number;
  defaultPresetId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVibeInput {
  name: string;
  icon: string;
  filters: Partial<MapFilters>;
}

export interface UpdateVibeInput {
  name?: string;
  icon?: string;
  filters?: Partial<MapFilters>;
}

export interface VibeActionResult {
  success: boolean;
  vibe?: UserVibe;
  error?: string;
}
