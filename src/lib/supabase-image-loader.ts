export default function supabaseImageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  // Append width/quality as query params so Next.js knows the loader handles them,
  // even though the Supabase public URL serves the original image regardless.
  const url = new URL(src, 'https://placeholder.local');
  url.searchParams.set('width', String(width));
  if (quality) url.searchParams.set('quality', String(quality));
  // Return full URL if src was absolute, otherwise just path+query
  return src.startsWith('http') ? `${src.split('?')[0]}?${url.searchParams}` : src;
}
