import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { findDuplicateCafes } from '@/lib/supabase/submissions';
import type { TranslatedText } from '@/types/cafe';

/**
 * POST /api/submissions/check-duplicates
 * Check for potential duplicate cafes before submission
 * No authentication required - can be checked before login
 *
 * Request body: { name: TranslatedText, address: TranslatedText }
 * Response: { duplicates: CafeSummary[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, address } = body as { name: TranslatedText; address: TranslatedText };

    // Validation: name and address are required
    if (!name || !address) {
      return NextResponse.json(
        { error: 'Name and address are required' },
        { status: 400 }
      );
    }

    // Must have at least one name translation (en or ko)
    const hasName =
      (name.en && name.en.trim().length >= 2) ||
      (name.ko && name.ko.trim().length >= 2);

    if (!hasName) {
      return NextResponse.json(
        { error: 'At least one name translation (English or Korean) is required' },
        { status: 400 }
      );
    }

    // Must have at least one address translation (en or ko)
    const hasAddress =
      (address.en && address.en.trim().length > 0) ||
      (address.ko && address.ko.trim().length > 0);

    if (!hasAddress) {
      return NextResponse.json(
        { error: 'At least one address translation (English or Korean) is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const duplicates = await findDuplicateCafes(supabase, name, address);

    return NextResponse.json({ duplicates });
  } catch (error) {
    console.error('Error checking duplicates:', error);
    return NextResponse.json(
      { error: 'Failed to check for duplicates' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/submissions/check-duplicates
 * Not supported - use POST with name/address in body
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST with name and address in request body.' },
    { status: 405 }
  );
}
