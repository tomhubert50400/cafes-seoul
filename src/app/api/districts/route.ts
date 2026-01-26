import { NextResponse } from 'next/server';
import { SEOUL_DISTRICTS, POPULAR_NEIGHBORHOODS } from '@/lib/constants/districts';

export async function GET() {
  return NextResponse.json({
    data: {
      districts: SEOUL_DISTRICTS,
      popularNeighborhoods: POPULAR_NEIGHBORHOODS,
    },
  });
}
