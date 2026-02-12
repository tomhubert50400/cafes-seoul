import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const q = request.nextUrl.searchParams.get('q') || undefined;

  let query = supabase
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

  if (q) {
    // Search by Korean or English name
    query = query.or(`name->ko.ilike.%${q}%,name->en.ilike.%${q}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const stations = (data || []).map((row) => {
    const line = row.metro_lines as {
      id: number;
      line_number: string;
      name: Record<string, string>;
      color: string;
    } | null;

    return {
      id: row.id,
      name: row.name,
      lineId: row.line_id,
      latitude: row.latitude,
      longitude: row.longitude,
      line: line ? {
        id: line.id,
        lineNumber: line.line_number,
        name: line.name,
        color: line.color,
      } : undefined,
    };
  });

  return NextResponse.json(stations, {
    headers: {
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
