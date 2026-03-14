const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

export default function supabaseImageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  // Only transform Supabase storage URLs
  if (supabaseUrl && src.startsWith(supabaseUrl) && src.includes('/storage/v1/object/public/')) {
    const url = src.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
    // Strip any existing query params and add transform params
    const [base] = url.split('?');
    return `${base}?width=${width}&quality=${quality || 75}`;
  }

  // For non-Supabase URLs (flagcdn, google avatars, blob:, etc.), return as-is
  return src;
}
