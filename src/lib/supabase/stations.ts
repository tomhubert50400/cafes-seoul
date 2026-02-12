import { createClient } from './client';
import type { MetroStation } from '@/types/metro';

let cachedStations: MetroStation[] | null = null;

export async function fetchStations(): Promise<MetroStation[]> {
  if (cachedStations) return cachedStations;

  const supabase = createClient();

  const { data, error } = await supabase
    .from('metro_stations')
    .select(`
      id,
      name,
      line_id,
      latitude,
      longitude,
      metro_lines (
        id,
        line_number,
        name,
        color
      )
    `)
    .order('name->ko', { ascending: true });

  if (error) {
    console.error('Failed to fetch metro stations:', error);
    return [];
  }

  const stations: MetroStation[] = (data || []).map((row) => {
    const lineData = row.metro_lines as unknown as {
      id: number;
      line_number: string;
      name: Record<string, string>;
      color: string;
    } | null;

    return {
      id: row.id,
      name: row.name as Record<string, string>,
      lineId: row.line_id,
      latitude: row.latitude,
      longitude: row.longitude,
      line: lineData
        ? {
            id: lineData.id,
            lineNumber: lineData.line_number,
            name: lineData.name,
            color: lineData.color,
          }
        : undefined,
    };
  });

  cachedStations = stations;
  return stations;
}
