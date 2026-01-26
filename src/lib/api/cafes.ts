import type { CafeSummary } from '@/types/cafe';
import type { CafeListParams, PaginatedResponse } from '@/types/api';

export async function fetchCafes(
  params: CafeListParams = {},
  baseUrl: string = ''
): Promise<PaginatedResponse<CafeSummary>> {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const response = await fetch(`${baseUrl}/api/cafes?${searchParams}`, {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch cafes: ${response.statusText}`);
  }

  return response.json();
}
